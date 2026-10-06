import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);
  private ai: GoogleGenAI | null = null;

  constructor(private prisma: PrismaService, private neo4jService: Neo4jService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. AI Generation will fail if invoked.');
    }
  }

  async generateInitialAssessment(courseId: number) {
    if (!this.ai) {
      this.logger.error('Cannot generate initial assessment without GEMINI_API_KEY');
      return;
    }

    try {
      // 1. Fetch course and topics
      const course = await this.prisma.course.findUnique({
        where: { course_id: courseId },
        include: { topics: true },
      });

      if (!course) {
        this.logger.error(`Course #${courseId} not found`);
        return;
      }

      if (course.topics.length === 0) {
        this.logger.warn(`Course #${courseId} has no topics. Skipping initial assessment generation.`);
        return;
      }

      // Check if one already exists
      const existing = await this.prisma.assessment.findFirst({
        where: { course_id: courseId, assessment_type: 'INITIAL' },
      });

      if (existing) {
        this.logger.log(`Course #${courseId} already has an INITIAL assessment. Skipping.`);
        return;
      }

      this.logger.log(`Generating INITIAL assessment for Course #${courseId} using RAG service`);

      let questions: any[] = [];
      try {
        for (const t of course.topics) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 600000); // 10m per topic

          const aiSources = await this.prisma.resource.findMany({
            where: { topic_id: t.topic_id, is_ai_source: true },
            select: { resource_id: true }
          });
          const validResourceIds = aiSources.map(r => r.resource_id);

          const payload = {
            course_id: course.course_id,
            topic_id: t.topic_id,
            topic_title: t.topic_title,
            num_questions: 2,
            assessment_type: 'INITIAL',
            difficulty: 'EASY',
            valid_resource_ids: validResourceIds
          };

          const res = await fetch('http://localhost:8000/api/generate_assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          if (!res.ok) {
            this.logger.warn(`Failed to generate RAG questions for topic ${t.topic_title}. HTTP ${res.status}`);
            continue;
          }

          const data = await res.json();
          if (data.error) {
            this.logger.warn(`RAG Service returned error for topic ${t.topic_title}: ${data.message}`);
            continue;
          }

          if (data.questions && Array.isArray(data.questions)) {
            // Attach topic_id to each question since the schema doesn't force RAG to return it
            const qs = data.questions.map((q: any) => ({ ...q, topic_id: t.topic_id, difficulty_level: q.difficulty }));
            questions = questions.concat(qs);
          }
          clearTimeout(timeout);
          // Wait 4 seconds between requests to respect the 15 RPM free tier limit
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err) {
        this.logger.error('Error fetching from RAG service for INITIAL assessment', err);
        return;
      }

      if (questions.length === 0) {
        this.logger.error('RAG service could not generate any questions. Insufficient AI sources?');
        return;
      }

      // 3. Save everything inside a transaction
      await this.prisma.$transaction(async (tx) => {
        // Create the assessment
        const assessment = await tx.assessment.create({
          data: {
            course_id: course.course_id,
            title: `${course.title} - Initial Assessment`,
            description: 'This is a system-generated initial assessment to determine your baseline knowledge before starting the course. This assessment is not graded for a pass/fail.',
            assessment_type: 'INITIAL',
            is_system_generated: true,
            total_questions: questions.length,
            passing_percentage: null, // No passing mark
            max_attempts: 1, // Exactly one attempt
            status: 'PUBLISHED', // Immediately published
          },
        });

        // Group questions by topic to populate AssessmentTopic
        const topicCounts: Record<number, number> = {};
        
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          topicCounts[q.topic_id] = (topicCounts[q.topic_id] || 0) + 1;

          // Create the question in the question bank
          const createdQuestion = await tx.question.create({
            data: {
              topic_id: q.topic_id,
              question_text: q.question_text || q.question,
              question_type: 'MCQ',
              difficulty_level: q.difficulty_level || 'EASY',
              explanation: q.explanation,
              source_resource_id: q.sources && q.sources.length > 0 ? q.sources[0].resourceId : null,
              generation_method: 'AI',
              status: 'APPROVED',
              options: {
                create: q.options.map((option_text: string, idx: number) => ({
                  option_text: option_text,
                  is_correct: idx === q.answer,
                  sequence_number: idx + 1,
                })),
              },
            },
          });

          // Map question to assessment
          await tx.assessmentQuestionMap.create({
            data: {
              assessment_id: assessment.assessment_id,
              question_id: createdQuestion.question_id,
              sequence_number: i + 1,
              marks: 1.00,
            },
          });
        }

        // Create AssessmentTopic entries
        for (const [tId, count] of Object.entries(topicCounts)) {
          await tx.assessmentTopic.create({
            data: {
              assessment_id: assessment.assessment_id,
              topic_id: Number(tId),
              question_count: count,
            },
          });
        }

        this.logger.log(`Successfully created INITIAL assessment #${assessment.assessment_id} with ${questions.length} questions.`);
      });

    } catch (error) {
      this.logger.error('Error generating initial assessment', error);
    }
  }

  async generateTopicAssessment(courseId: number, topicId: number, studentId: number) {
    if (!this.ai) {
      this.logger.warn('AI Client not initialized. Cannot generate topic assessment.');
      return null;
    }

    try {
      // 1. Fetch course and topic
      const course = await this.prisma.course.findUnique({
        where: { course_id: courseId },
      });

      const topic = await this.prisma.topic.findUnique({
        where: { topic_id: topicId },
      });

      if (!course || !topic) {
        this.logger.error(`Course #${courseId} or Topic #${topicId} not found`);
        return null;
      }

      // 2. Fetch Knowledge State from Neo4j to determine Difficulty first
      let proficiency = 'UNASSESSED';
      try {
        if (this.neo4jService.isDatabaseConnected()) {
          const cypher = `
            MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic {topicId: toInteger($topicId)})
            RETURN k.proficiency as proficiency
          `;
          const result = await this.neo4jService.read(cypher, { studentId, topicId });
          if (result.records.length > 0) {
            proficiency = result.records[0].get('proficiency');
          }
        }
      } catch (err) {
        this.logger.warn(`Could not fetch knowledge state for student #${studentId}, defaulting to UNASSESSED`);
      }

      let targetDifficulties = ['EASY', 'MEDIUM'];
      if (proficiency === 'BEGINNER') targetDifficulties = ['EASY'];
      else if (proficiency === 'DEVELOPING') targetDifficulties = ['EASY', 'MEDIUM'];
      else if (proficiency === 'PROFICIENT') targetDifficulties = ['MEDIUM', 'HARD'];
      else if (proficiency === 'ADVANCED') targetDifficulties = ['MEDIUM', 'HARD'];

      this.logger.log(`Student proficiency is ${proficiency}. Setting target difficulties to: ${targetDifficulties.join(', ')}`);

      // Check if there are existing TOPIC assessments
      const existingAssessments = await this.prisma.assessment.findMany({
        where: {
          course_id: courseId,
          assessment_type: 'TOPIC',
          topics: {
            some: { topic_id: topicId }
          }
        },
        include: {
          attempts: {
            where: {
              student_id: studentId
            }
          },
          questions: {
            include: {
              question: true
            }
          }
        }
      });

      // Find one that the student hasn't exhausted yet AND matches the difficulty if AI generated
      const unsubmittedAssessment = existingAssessments.find(a => {
        if (a.attempts.length >= a.max_attempts) return false;
        
        // Admin-created assessments ignore difficulty checks
        if (!a.is_system_generated) return true;
        
        // AI generated assessments MUST match current proficiency difficulty
        const allQuestionsMatch = a.questions.every(aq => 
          targetDifficulties.includes(aq.question.difficulty_level)
        );
        return allQuestionsMatch;
      });

      if (unsubmittedAssessment) {
        this.logger.log(`Student #${studentId} has attempts remaining on matching TOPIC assessment #${unsubmittedAssessment.assessment_id}. Returning existing.`);
        return unsubmittedAssessment;
      }

      if (existingAssessments.length === 0) {
        this.logger.log(`No existing TOPIC assessments found for Course #${courseId}, Topic #${topicId}. Generating fresh assessment.`);
      } else {
        this.logger.log(`Student #${studentId} exhausted attempts or existing assessments don't match proficiency (${proficiency}). Generating fresh TOPIC assessment.`);
      }

      // 3. Call RAG service to generate questions
      const aiSources = await this.prisma.resource.findMany({
        where: { topic_id: topicId, is_ai_source: true },
        select: { resource_id: true }
      });
      const validResourceIds = aiSources.map(r => r.resource_id);

      const payload = {
        course_id: courseId,
        topic_id: topicId,
        topic_title: topic.topic_title,
        num_questions: 5,
        assessment_type: 'TOPIC',
        difficulties: targetDifficulties,
        valid_resource_ids: validResourceIds
      };

      this.logger.log(`Calling RAG service for TOPIC assessment: Course #${courseId}, Topic #${topicId}`);
      
      // Fetch existing topic questions for duplicate detection
      const existingDbQuestions = await this.prisma.question.findMany({
        where: { topic_id: topicId, generation_method: 'AI' },
        select: { question_text: true }
      });
      const existingTopicQuestionTexts = existingDbQuestions.map(q => q.question_text.toLowerCase().trim());

      let validQuestions: any[] = [];
      const MAX_REGENERATION_ATTEMPTS = 3;
      let fetchCount = 0;

      while (validQuestions.length < 5 && fetchCount < MAX_REGENERATION_ATTEMPTS) {
        fetchCount++;
        const needed = 5 - validQuestions.length;
        payload.num_questions = needed;

        this.logger.log(`Generating ${needed} questions from RAG (Attempt ${fetchCount}/${MAX_REGENERATION_ATTEMPTS})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10m timeout

        try {
          const res = await fetch('http://localhost:8000/api/generate_assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`RAG service HTTP ${res.status}`);
          }

          const data = await res.json();
          
          if (data.error) {
            throw new Error(`RAG Service Error: ${data.message}`);
          }

          if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid JSON format returned from RAG service');
          }

          const newlyGeneratedQuestions = data.questions;
          
          for (const q of newlyGeneratedQuestions) {
            const questionText = q.question_text || q.question;
            const qDifficulty = q.difficulty || q.difficulty_level || 'MEDIUM';

            // 1. Difficulty Level Validation
            if (!targetDifficulties.includes(qDifficulty)) {
              this.logger.warn(`Rejected question: Invalid difficulty ${qDifficulty}`);
              continue;
            }

            // 2. Question Text Validation
            if (!questionText || typeof questionText !== 'string' || questionText.trim().length < 10) {
              this.logger.warn(`Rejected question: Malformed or empty question text`);
              continue;
            }

            // 3. Options Validation
            if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
              this.logger.warn(`Rejected question: Must have exactly 4 options`);
              continue;
            }
            const uniqueOptions = new Set(q.options.map((opt: any) => String(opt).trim()));
            if (uniqueOptions.size !== 4 || uniqueOptions.has('')) {
              this.logger.warn(`Rejected question: Duplicate or empty options`);
              continue;
            }

            // 4. Answer Validation
            if (typeof q.answer !== 'number' || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
              this.logger.warn(`Rejected question: Invalid answer index`);
              continue;
            }

            // 5. Explanation Validation
            if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
              this.logger.warn(`Rejected question: Missing or empty explanation`);
              continue;
            }

            // 6 & 7. Sources and RAG Grounding Validation
            if (!q.sources || !Array.isArray(q.sources) || q.sources.length === 0) {
              this.logger.warn(`Rejected question: Missing source metadata`);
              continue;
            }
            const hasValidSource = q.sources.some((s: any) => s.resourceId && validResourceIds.includes(s.resourceId));
            if (!hasValidSource) {
              this.logger.warn(`Rejected question: No approved RAG valid_resource_ids found in sources`);
              continue;
            }

            // 8. Duplicate Detection
            const normalizedText = questionText.toLowerCase().trim();
            const isDbDuplicate = existingTopicQuestionTexts.includes(normalizedText);
            const isBatchDuplicate = validQuestions.some(vq => (vq.question_text || vq.question).toLowerCase().trim() === normalizedText);
            
            if (isDbDuplicate || isBatchDuplicate) {
              this.logger.warn(`Rejected question: Semantic duplicate detected`);
              continue;
            }

            // Passed all validations!
            validQuestions.push(q);
            
            if (validQuestions.length >= 5) break;
          }

        } catch (err: any) {
          this.logger.error(`Failed to generate topic assessment from RAG on attempt ${fetchCount}: ${err.message}`);
          clearTimeout(timeoutId);
        }
      }

      if (validQuestions.length < 5) {
        this.logger.error(`Failed to generate 5 valid questions after ${MAX_REGENERATION_ATTEMPTS} attempts. Only got ${validQuestions.length}. Bailing out.`);
        return null;
      }

      let questions = validQuestions;

      // 3. Save everything inside a transaction
      const assessment = await this.prisma.$transaction(async (tx) => {
        // Create the assessment
        const createdAssessment = await tx.assessment.create({
          data: {
            course_id: course.course_id,
            title: `${topic.topic_title} - Topic Assessment`,
            description: 'This is a system-generated topic assessment to measure your learning after studying the recommended resources.',
            assessment_type: 'TOPIC',
            is_system_generated: true,
            total_questions: 5, // We generate 1 initially, but total is 5 for adaptive
            passing_percentage: null, // No passing mark, used for knowledge update
            max_attempts: 3,
            status: 'PUBLISHED',
          },
        });

        // Map questions to assessment
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];

          const createdQuestion = await tx.question.create({
            data: {
              topic_id: topicId,
              question_text: q.question_text || q.question,
              question_type: 'MCQ',
              difficulty_level: q.difficulty || q.difficulty_level || 'MEDIUM',
              explanation: q.explanation,
              source_resource_id: q.sources && q.sources.length > 0 ? q.sources[0].resourceId : null,
              generation_method: 'AI',
              status: 'APPROVED',
              options: {
                create: q.options.map((option_text: string, idx: number) => ({
                  option_text: option_text,
                  is_correct: idx === q.answer,
                  sequence_number: idx + 1,
                })),
              },
            },
          });

          await tx.assessmentQuestionMap.create({
            data: {
              assessment_id: createdAssessment.assessment_id,
              question_id: createdQuestion.question_id,
              sequence_number: i + 1,
              marks: 1.00,
            },
          });
        }

        // Create AssessmentTopic entry
        await tx.assessmentTopic.create({
          data: {
            assessment_id: createdAssessment.assessment_id,
            topic_id: topicId,
            question_count: 5,
          },
        });

        this.logger.log(`Successfully created TOPIC assessment #${createdAssessment.assessment_id}`);
        return createdAssessment;
      });
      return assessment;
    } catch (error) {
      this.logger.error('Error saving generated TOPIC assessment', error);
      return null;
    }
  }

  async generateSingleAdaptiveQuestion(courseId: number, topicId: number, difficulty: string, existingQuestionTexts: string[]) {
    try {
      const topic = await this.prisma.topic.findUnique({ where: { topic_id: topicId } });
      if (!topic) return null;

      const aiSources = await this.prisma.resource.findMany({
        where: { topic_id: topicId, is_ai_source: true },
        select: { resource_id: true }
      });
      const validResourceIds = aiSources.map(r => r.resource_id);

      const payload = {
        course_id: courseId,
        topic_id: topicId,
        topic_title: topic.topic_title,
        num_questions: 1,
        assessment_type: 'TOPIC',
        difficulties: [difficulty],
        valid_resource_ids: validResourceIds
      };

      let validQuestions: any[] = [];
      const MAX_REGENERATION_ATTEMPTS = 3;
      let fetchCount = 0;

      while (validQuestions.length < 1 && fetchCount < MAX_REGENERATION_ATTEMPTS) {
        fetchCount++;
        this.logger.log(`Generating adaptive question from RAG (Attempt ${fetchCount}/${MAX_REGENERATION_ATTEMPTS}) with difficulty ${difficulty}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);

        try {
          const res = await fetch('http://localhost:8000/api/generate_assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error(`RAG HTTP ${res.status}`);
          
          const data = await res.json();
          if (data.error) throw new Error(`RAG Error: ${data.message}`);
          if (!data.questions || !Array.isArray(data.questions)) throw new Error('Invalid JSON format');

          for (const q of data.questions) {
            const questionText = q.question_text || q.question;
            const qDifficulty = q.difficulty || q.difficulty_level || 'MEDIUM';

            if (qDifficulty !== difficulty) continue;
            if (!questionText || typeof questionText !== 'string' || questionText.trim().length < 10) continue;
            if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) continue;
            
            const uniqueOptions = new Set(q.options.map((opt: any) => String(opt).trim()));
            if (uniqueOptions.size !== 4 || uniqueOptions.has('')) continue;

            if (typeof q.answer !== 'number' || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) continue;
            if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) continue;
            if (!q.sources || !Array.isArray(q.sources) || q.sources.length === 0) continue;
            
            const hasValidSource = q.sources.some((s: any) => s.resourceId && validResourceIds.includes(s.resourceId));
            if (!hasValidSource) continue;

            const normalizedText = questionText.toLowerCase().trim();
            if (existingQuestionTexts.includes(normalizedText)) continue;

            validQuestions.push(q);
            break;
          }
        } catch (err: any) {
          this.logger.error(`Failed to generate adaptive question: ${err.message}`);
          clearTimeout(timeoutId);
        }
      }

      if (validQuestions.length === 0) return null;
      return validQuestions[0];
    } catch (err) {
      this.logger.error('Error in generateSingleAdaptiveQuestion', err);
      return null;
    }
  }

  async generateNextAdaptiveQuestion(attemptId: number, studentId: number) {
    // We use a transaction with a higher timeout to safely hold the advisory lock across the RAG generation if necessary,
    // though ideally we lock, check, and generate. But wait, if we generate outside the lock, we need a 2-phase approach.
    // Given the prompt: "Prefer an existing database transaction/locking/state mechanism", we will wrap the entire sequence
    // in a transaction with an advisory lock to ensure perfect serialization of concurrent requests.
    return this.prisma.$transaction(async (tx) => {
      // 1. Acquire transaction-level advisory lock based on attemptId to serialize concurrent requests for this attempt.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${attemptId})`;

      // 2. Load authoritative state UNDER THE LOCK
      const attempt = await tx.assessmentAttempt.findUnique({
        where: { attempt_id: attemptId },
        include: {
          assessment: {
            include: {
              topics: true,
              questions: {
                include: { question: { include: { options: true } } },
                orderBy: { sequence_number: 'asc' }
              }
            }
          },
          answers: {
            include: {
              question: {
                include: { options: true }
              }
            },
            orderBy: { answered_at: 'asc' }
          }
        }
      });

      if (!attempt || attempt.student_id !== studentId) {
        throw new Error('Access denied');
      }

      if (attempt.status !== 'IN_PROGRESS') {
        throw new Error('Attempt is not in progress');
      }

      const assessment = attempt.assessment;
      
      // If the state already advanced (i.e. another concurrent request generated the question and we just woke up from the lock)
      // we safely detect this and return the newly generated question!
      if (attempt.answers.length !== assessment.questions.length) {
        this.logger.log(`Assessment state already advanced for attempt ${attemptId}. Returning existing next question.`);
        return assessment.questions[assessment.questions.length - 1].question;
      }

      if (assessment.questions.length >= assessment.total_questions) {
        throw new Error('Assessment has reached its maximum questions');
      }

      const topicId = assessment.topics[0]?.topic_id;
      if (!topicId || !assessment.is_system_generated || assessment.assessment_type !== 'TOPIC') {
        throw new Error('Adaptive generation is only supported for AI-generated TOPIC assessments');
      }

      let nextDifficulty = 'MEDIUM'; 
      const previousDifficulties = ['EASY', 'MEDIUM', 'HARD'];

      if (assessment.questions.length === 0) {
         nextDifficulty = 'MEDIUM';
      } else {
         const lastAnswer = attempt.answers[attempt.answers.length - 1];
         const secondLastAnswer = attempt.answers.length > 1 ? attempt.answers[attempt.answers.length - 2] : null;

         const currentDifficulty = assessment.questions[assessment.questions.length - 1].question.difficulty_level;
         nextDifficulty = currentDifficulty;

         if (lastAnswer && secondLastAnswer) {
            const lastIsCorrect = lastAnswer.question.options.find((o: any) => o.option_id === lastAnswer.selected_option_id)?.is_correct;
            const secondLastIsCorrect = secondLastAnswer.question.options.find((o: any) => o.option_id === secondLastAnswer.selected_option_id)?.is_correct;

            const currentIndex = previousDifficulties.indexOf(currentDifficulty);

            if (lastIsCorrect && secondLastIsCorrect) {
               if (currentIndex < 2) nextDifficulty = previousDifficulties[currentIndex + 1];
            } else if (lastIsCorrect === false && secondLastIsCorrect === false) {
               if (currentIndex > 0) nextDifficulty = previousDifficulties[currentIndex - 1];
            }
         }
      }

      const existingQuestionTexts = assessment.questions.map((q: any) => q.question.question_text.toLowerCase().trim());
      
      // 3. Generate question (happens under lock to prevent any duplicate execution)
      const newQ = await this.generateSingleAdaptiveQuestion(
         assessment.course_id,
         topicId,
         nextDifficulty,
         existingQuestionTexts
      );

      if (!newQ) {
         throw new Error('Failed to generate the next question. Please try again.');
      }

      // 4. Save to DB under the same transaction
      const createdQuestion = await tx.question.create({
        data: {
          topic_id: topicId,
          question_text: newQ.question_text || newQ.question,
          question_type: 'MCQ',
          difficulty_level: newQ.difficulty || newQ.difficulty_level || nextDifficulty,
          explanation: newQ.explanation,
          source_resource_id: newQ.sources && newQ.sources.length > 0 ? newQ.sources[0].resourceId : null,
          generation_method: 'AI',
          status: 'APPROVED',
          options: {
            create: newQ.options.map((option_text: string, idx: number) => ({
              option_text: option_text,
              is_correct: idx === newQ.answer,
              sequence_number: idx + 1,
            })),
          },
        },
        include: {
          options: {
            select: { option_id: true, option_text: true, sequence_number: true }
          }
        }
      });

      await tx.assessmentQuestionMap.create({
        data: {
          assessment_id: assessment.assessment_id,
          question_id: createdQuestion.question_id,
          sequence_number: assessment.questions.length + 1,
          marks: 1.00,
        },
      });

      return createdQuestion;
    }, { timeout: 20000 }); // 20s timeout to allow RAG generation to complete
  }
}
