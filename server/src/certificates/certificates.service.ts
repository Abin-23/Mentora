import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import neo4j from 'neo4j-driver';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private neo4jService: Neo4jService
  ) {}

  async checkEligibility(studentId: number, courseId: number) {
    const topics = await this.prisma.topic.findMany({ 
      where: { course_id: courseId },
      include: { resources: true }
    });
    if (topics.length === 0) return { eligible: false, reason: 'Course has no topics' };

    const stateResult = await this.neo4jService.read(
      `
      MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic)<-[:HAS_TOPIC]-(c:Course {courseId: toInteger($courseId)})
      RETURN t.topicId AS topicId, k.proficiency AS proficiency
      `,
      { studentId: neo4j.int(studentId), courseId: neo4j.int(courseId) }
    );

    const states = new Map<number, string>();
    stateResult.records.forEach((rec) => {
      states.set(Number(rec.get('topicId')), rec.get('proficiency'));
    });

    const passingProficiencies = ['PROFICIENT', 'ADVANCED', 'MASTER'];
    const unmasteredTopics = topics.filter(t => !passingProficiencies.includes(states.get(t.topic_id) || ''));
    const hasMasteredViaNeo4j = unmasteredTopics.length === 0;

    // Also check if they simply watched all standard resources
    const resourceProgresses = await this.prisma.learningProgress.findMany({
      where: {
        student_id: studentId,
        course_id: courseId
      }
    });

    let hasCompletedAllResources = true;
    let totalResources = 0;
    for (const t of topics) {
      for (const r of t.resources) {
        totalResources++;
        const p = resourceProgresses.find((rp: any) => rp.resource_id === r.resource_id);
        if (!p || p.progress_percent < 100) {
          hasCompletedAllResources = false;
          break;
        }
      }
      if (!hasCompletedAllResources) break;
    }

    if (totalResources === 0) hasCompletedAllResources = false;

    if (!hasMasteredViaNeo4j && !hasCompletedAllResources) {
      return { eligible: false, unmasteredCount: unmasteredTopics.length, unmasteredTopics };
    }

    return { eligible: true };
  }

  async issueCertificate(studentId: number, courseId: number) {
    const existing = await this.prisma.certificate.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } }
    });
    if (existing) return existing;

    const eligibility = await this.checkEligibility(studentId, courseId);
    if (!eligibility.eligible) {
      throw new BadRequestException('Student has not mastered all topics in this course.');
    }

    return this.prisma.certificate.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        grade_percentage: 100.00
      },
      include: { course: true }
    });
  }

  async getCertificates(studentId: number) {
    return this.prisma.certificate.findMany({
      where: { student_id: studentId },
      include: { course: true }
    });
  }

  async verifyCertificate(credentialId: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { credential_id: credentialId },
      include: {
        student: { select: { full_name: true, email: true } },
        course: { select: { title: true, course_admin: { select: { full_name: true } } } }
      }
    });
    if (!cert) throw new BadRequestException('Invalid certificate credential ID');
    return cert;
  }
}
