import os
import uuid
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from chunking import extract_text_from_pdf, chunk_document_text
from ai_client import generate_embeddings_batch, generate_chat_response, generate_personalized_lesson, generate_assessment_questions, generate_tutor_response
from chroma_client import add_documents_to_chroma, query_chroma, delete_documents_by_resource_id

app = FastAPI(title="Mentora RAG Service")

# Configure CORS so the NestJS backend or frontend can call it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    course_id: Optional[int] = None
    topic_id: Optional[int] = None

class GenerateLessonRequest(BaseModel):
    course_id: int
    topic_id: int
    topic_title: str
    proficiency_level: str
    teaching_preference: str
    targeted_concepts: Optional[List[str]] = None
    valid_resource_ids: Optional[List[int]] = None

class GenerateAssessmentRequest(BaseModel):
    course_id: int
    topic_id: Optional[int] = None
    topic_title: str
    num_questions: int
    assessment_type: str
    difficulty: Optional[str] = "MEDIUM"
    difficulties: Optional[List[str]] = None
    valid_resource_ids: Optional[List[int]] = None

class TutorRequest(BaseModel):
    query: str
    course_id: int
    topic_id: Optional[int] = None
    proficiency: str
    teaching_preference: str
    weak_concepts: List[str] = []

class IngestTextRequest(BaseModel):
    text: str
    course_id: int
    topic_id: int
    resource_id: int
    resource_name: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

def process_pdf_in_background(content: bytes, course_id: int, topic_id: int, resource_id: int, resource_name: str):
    try:
        pages_data = extract_text_from_pdf(content)
        if not pages_data:
            print(f"No text found in PDF for resource {resource_id}")
            return

        chunks = chunk_document_text(pages_data)
        texts = []
        metadatas = []
        ids = []

        for chunk in chunks:
            texts.append(chunk["text"])
            metadatas.append({
                "courseId": course_id,
                "topicId": topic_id,
                "resourceId": resource_id,
                "resourceName": resource_name,
                "pageNumber": chunk["page_number"],
                "chunkIndex": chunk["chunk_index"]
            })
            ids.append(f"{resource_id}_{chunk['chunk_index']}")

        embeddings = generate_embeddings_batch(texts)
        add_documents_to_chroma(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=texts)
        print(f"Successfully processed and stored PDF resource {resource_id} in background.")
    except Exception as e:
        print(f"Background processing failed for resource {resource_id}: {str(e)}")

@app.post("/api/ingest/pdf")
async def ingest_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    course_id: int = Form(...),
    topic_id: int = Form(...),
    resource_id: int = Form(...),
    resource_name: str = Form(...)
):
    """
    Endpoint to upload a PDF, extract text, chunk it, embed it, and store in ChromaDB.
    Runs completely in the background to prevent UI blocking.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    
    # Add to background tasks queue
    background_tasks.add_task(
        process_pdf_in_background, 
        content, course_id, topic_id, resource_id, resource_name
    )

    return {
        "message": "PDF ingestion started in background",
        "status": "processing"
    }

@app.post("/api/ingest/text")
async def ingest_text(request: IngestTextRequest):
    """
    Endpoint to ingest plain text directly.
    """
    # Wrap text in pages_data format for chunking
    pages_data = [{"page_number": 1, "text": request.text}]
    chunks = chunk_document_text(pages_data)

    texts = []
    metadatas = []
    ids = []

    for chunk in chunks:
        texts.append(chunk["text"])
        metadatas.append({
            "courseId": request.course_id,
            "topicId": request.topic_id,
            "resourceId": request.resource_id,
            "resourceName": request.resource_name,
            "pageNumber": chunk["page_number"],
            "chunkIndex": chunk["chunk_index"]
        })
        ids.append(f"{request.resource_id}_{chunk['chunk_index']}")

    try:
        embeddings = generate_embeddings_batch(texts)
        add_documents_to_chroma(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "message": "Text successfully ingested and stored",
        "chunks_processed": len(chunks)
    }

@app.delete("/api/documents/{resource_id}")
async def delete_document(resource_id: int):
    """
    Endpoint to delete a document and all its chunks from the RAG knowledge base.
    """
    success = delete_documents_by_resource_id(str(resource_id))
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document from ChromaDB")
    
    return {"message": f"Resource {resource_id} successfully deleted from knowledge base"}

@app.post("/api/query")
async def query_rag(request: QueryRequest):
    """
    Endpoint to query the knowledge base and get an AI-generated answer.
    """
    # 1. Embed the query
    from ai_client import generate_embeddings
    try:
        query_embedding = generate_embeddings(request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed query: {str(e)}")

    # 2. Build filter if course/topic provided
    where_filter = {}
    if request.course_id:
        where_filter["courseId"] = request.course_id
    if request.topic_id:
        where_filter["topicId"] = request.topic_id

    # If no filters, where_filter should be None for Chroma
    if not where_filter:
        where_filter = None

    # 3. Retrieve from ChromaDB
    try:
        results = query_chroma(
            query_embeddings=[query_embedding],
            n_results=5,
            where_filter=where_filter
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve from ChromaDB: {str(e)}")

    # 4. Construct context
    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    
    if not documents:
        return {
            "answer": "I couldn't find any relevant course material to answer your question.",
            "sources": []
        }

    context_parts = []
    sources = []
    
    for i, doc in enumerate(documents):
        meta = metadatas[i]
        context_parts.append(f"[Source: {meta.get('resourceName', 'Unknown')}, Page: {meta.get('pageNumber', '?')}]\n{doc}")
        sources.append({
            "resourceName": meta.get('resourceName'),
            "pageNumber": meta.get('pageNumber'),
            "topicId": meta.get('topicId'),
            "resourceId": meta.get('resourceId')
        })

    context_string = "\n\n".join(context_parts)

    # 5. Generate AI Response
    answer = generate_chat_response(request.query, context_string)

    return {
        "answer": answer,
        "sources": sources
    }

@app.post("/api/tutor")
async def query_tutor(request: TutorRequest):
    """
    Context-Aware AI Tutor endpoint.
    """
    # 1. Embed the query
    from ai_client import generate_embeddings
    try:
        query_embedding = generate_embeddings(request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed query: {str(e)}")

    # 2. Build filter
    if request.topic_id:
        where_filter = {
            "$and": [
                {"courseId": request.course_id},
                {"topicId": request.topic_id}
            ]
        }
    else:
        where_filter = {"courseId": request.course_id}

    # 3. Retrieve from ChromaDB
    try:
        results = query_chroma(
            query_embeddings=[query_embedding],
            n_results=5,
            where_filter=where_filter
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve from ChromaDB: {str(e)}")

    # 4. Construct context
    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    
    if not documents:
        return {
            "answer": "The available course material does not contain enough information to answer this question.",
            "sources": []
        }

    context_parts = []
    sources = []
    
    for i, doc in enumerate(documents):
        meta = metadatas[i]
        context_parts.append(f"[Source: {meta.get('resourceName', 'Unknown')}, Page: {meta.get('pageNumber', '?')}]\n{doc}")
        sources.append({
            "resourceName": meta.get('resourceName'),
            "pageNumber": meta.get('pageNumber'),
            "topicId": meta.get('topicId'),
            "resourceId": meta.get('resourceId')
        })

    context_string = "\n\n".join(context_parts)

    # 5. Generate AI Response
    import json
    raw_answer = generate_tutor_response(
        query=request.query, 
        context=context_string,
        proficiency=request.proficiency,
        teaching_pref=request.teaching_preference,
        weak_concepts=request.weak_concepts
    )

    try:
        structured = json.loads(raw_answer)
    except:
        structured = {"answer": raw_answer}

    structured["sources"] = sources
    return structured

@app.post("/api/generate_lesson")
async def generate_lesson(request: GenerateLessonRequest):
    """
    Endpoint to generate a personalized AI lesson from course context.
    """
    from ai_client import generate_embeddings
    
    # 1. Build semantic search query based on topic and weak/developing concepts
    search_query = request.topic_title
    if request.targeted_concepts and len(request.targeted_concepts) > 0:
        print(f"[Targeted Retrieval] Enhancing RAG query with targeted concepts: {request.targeted_concepts}")
        search_query = f"{request.topic_title} focusing on concepts: {', '.join(request.targeted_concepts)}"
        
    try:
        query_embedding = generate_embeddings(search_query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed search query: {str(e)}")

    # 2. Filter by course and topic and AI sources
    where_filter = {
        "$and": [
            {"courseId": request.course_id},
            {"topicId": request.topic_id}
        ]
    }
    
    if request.valid_resource_ids and len(request.valid_resource_ids) > 0:
        where_filter["$and"].append({
            "resourceId": {"$in": request.valid_resource_ids}
        })

    # 3. Retrieve initial broad context for outline generation
    try:
        results = query_chroma(
            query_embeddings=[query_embedding],
            n_results=20, # Get more chunks for a better outline
            where_filter=where_filter
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve from ChromaDB: {str(e)}")

    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []

    if not documents:
        return {
            "lesson": "No course material is available to generate a lesson for this topic. Please ask your Course Admin to upload AI Knowledge Sources.",
            "sources": []
        }

    context_parts = []
    sources = []
    seen_sources = set()

    for i, doc in enumerate(documents):
        meta = metadatas[i]
        resource_name = meta.get('resourceName', 'Unknown')
        page_num = meta.get('pageNumber', '?')
        
        context_parts.append(f"[Source: {resource_name}, Page: {page_num}]\n{doc}")
        
        source_key = f"{meta.get('resourceId')}_{page_num}"
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append({
                "resourceName": resource_name,
                "pageNumber": page_num,
                "topicId": meta.get('topicId'),
                "resourceId": meta.get('resourceId')
            })

    context_string = "\n\n".join(context_parts)

    # 4. Generate Hierarchical Outline
    from ai_client import generate_lesson_outline, generate_personalized_lesson
    import json
    
    outline = generate_lesson_outline(request.topic_title, context_string)
    print(f"[Hierarchical Generation] Generated outline for '{request.topic_title}': {outline}")
    
    # 5. Generate lesson segments iteratively
    all_blocks = []
    sub_topics_data = []
    
    # Limit to 5 subtopics maximum to prevent excessive latency/API quotas
    subtopics = outline[:5] 
    
    for sub_topic in subtopics:
        # Re-query ChromaDB specifically for this sub-topic
        print(f"[Hierarchical Generation] Fetching chunks for sub-topic: {sub_topic}")
        try:
            sub_query_embedding = generate_embeddings(f"{request.topic_title}: {sub_topic}")
            sub_results = query_chroma(
                query_embeddings=[sub_query_embedding],
                n_results=10, 
                where_filter=where_filter
            )
            sub_docs = sub_results["documents"][0] if sub_results["documents"] else []
            sub_metas = sub_results["metadatas"][0] if sub_results["metadatas"] else []
            
            sub_context_parts = []
            for j, doc in enumerate(sub_docs):
                meta = sub_metas[j]
                resource_name = meta.get('resourceName', 'Unknown')
                page_num = meta.get('pageNumber', '?')
                sub_context_parts.append(f"[Source: {resource_name}, Page: {page_num}]\n{doc}")
                
                # Add to sources if not already present
                source_key = f"{meta.get('resourceId')}_{page_num}"
                if source_key not in seen_sources:
                    seen_sources.add(source_key)
                    sources.append({
                        "resourceName": resource_name,
                        "pageNumber": page_num,
                        "topicId": meta.get('topicId'),
                        "resourceId": meta.get('resourceId')
                    })

            sub_context_string = "\n\n".join(sub_context_parts)
            
            # Generate the segment
            segment_json_str = generate_personalized_lesson(
                topic_title=f"{request.topic_title} - {sub_topic}",
                context=sub_context_string,
                proficiency_level=request.proficiency_level,
                teaching_preference=request.teaching_preference,
                priority_concepts=request.targeted_concepts
            )
            
            # Parse and append blocks
            segment_data = json.loads(segment_json_str)
            if "blocks" in segment_data:
                for b in segment_data["blocks"]:
                    b["subTopicTitle"] = sub_topic
                all_blocks.extend(segment_data["blocks"])
                sub_topics_data.append({
                    "title": sub_topic,
                    "blocks": segment_data["blocks"]
                })
                
        except Exception as e:
            print(f"[Hierarchical Generation] Error generating segment '{sub_topic}': {e}")
            continue

    # Fallback if no blocks were generated
    if not all_blocks:
        all_blocks = [
            {
                "type": "CONCEPT",
                "title": "Error",
                "content": "Failed to dynamically generate lesson content. Please try again."
            }
        ]

    final_lesson = json.dumps({
        "title": request.topic_title,
        "subTopics": sub_topics_data,
        "blocks": all_blocks
    })

    return {
        "lesson": final_lesson,
        "sources": sources
    }

@app.post("/api/generate_assessment")
async def generate_assessment(request: GenerateAssessmentRequest):
    """
    Endpoint to generate RAG-powered assessment questions.
    """
    from ai_client import generate_embeddings
    
    # 1. Build semantic search query based on topic
    search_query = request.topic_title
    if request.assessment_type == "INITIAL":
        search_query += " core concepts fundamentals"
        
    try:
        query_embedding = generate_embeddings(search_query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed search query: {str(e)}")

    # 2. Filter by course and (optionally) topic and AI sources
    and_conditions = [{"courseId": request.course_id}]
    if request.topic_id:
        and_conditions.append({"topicId": request.topic_id})
        
    where_filter = {"$and": and_conditions}
    
    if request.valid_resource_ids and len(request.valid_resource_ids) > 0:
        if len(request.valid_resource_ids) == 1:
            where_filter["$and"].append({"resourceId": request.valid_resource_ids[0]})
        else:
            where_filter["$and"].append({"resourceId": {"$in": request.valid_resource_ids}})
            
    # 3. Retrieve from ChromaDB
    try:
        results = query_chroma(
            query_embeddings=[query_embedding],
            n_results=15,
            where_filter=where_filter
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve from ChromaDB: {str(e)}")

    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []

    if not documents:
        import json
        return json.loads(json.dumps({
            "error": "INSUFFICIENT_CONTEXT",
            "message": f"No AI knowledge sources found for course {request.course_id} to generate questions."
        }))

    # 4. Construct Context String with Metadata
    context_parts = []
    for i, doc in enumerate(documents):
        meta = metadatas[i]
        context_parts.append(
            f"[resourceId: {meta.get('resourceId')}, resourceName: {meta.get('resourceName', 'Unknown')}, "
            f"pageNumber: {meta.get('pageNumber', '?')}, chunkIndex: {meta.get('chunkIndex', '?')}]\n{doc}"
        )

    context_string = "\n\n".join(context_parts)

    # 5. Generate Assessment using Gemini
    lesson_json_str = generate_assessment_questions(
        topic_title=request.topic_title,
        context=context_string,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
        difficulties=request.difficulties
    )

    import json
    try:
        parsed_json = json.loads(lesson_json_str)
        return parsed_json
    except json.JSONDecodeError:
        return {
            "error": "JSON_PARSE_ERROR",
            "message": "Failed to parse the generated assessment as JSON.",
            "raw_output": lesson_json_str
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
