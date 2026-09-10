import os
import uuid
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from chunking import extract_text_from_pdf, chunk_document_text
from ai_client import generate_embeddings_batch, generate_chat_response, generate_personalized_lesson
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

class IngestTextRequest(BaseModel):
    text: str
    course_id: int
    topic_id: int
    resource_id: int
    resource_name: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/ingest/pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    course_id: int = Form(...),
    topic_id: int = Form(...),
    resource_id: int = Form(...),
    resource_name: str = Form(...)
):
    """
    Endpoint to upload a PDF, extract text, chunk it, embed it, and store in ChromaDB.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    
    # Extract text per page
    try:
        pages_data = extract_text_from_pdf(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text from PDF: {str(e)}")

    if not pages_data:
        return {"message": "No text found in PDF."}

    # Chunk the text
    chunks = chunk_document_text(pages_data)

    # Prepare data for ChromaDB
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
        # Generate unique ID for the chunk
        ids.append(f"{resource_id}_{chunk['chunk_index']}")

    # Generate Embeddings
    try:
        embeddings = generate_embeddings_batch(texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")

    # Store in ChromaDB
    try:
        add_documents_to_chroma(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store in ChromaDB: {str(e)}")

    return {
        "message": "PDF successfully ingested and stored",
        "chunks_processed": len(chunks)
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

@app.post("/api/generate_lesson")
async def generate_lesson(request: GenerateLessonRequest):
    """
    Endpoint to generate a personalized AI lesson from course context.
    """
    from ai_client import generate_embeddings
    
    # 1. Use the topic title as the query to retrieve relevant chunks
    try:
        query_embedding = generate_embeddings(request.topic_title)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed topic title: {str(e)}")

    # 2. Filter by course and topic
    where_filter = {
        "$and": [
            {"courseId": request.course_id},
            {"topicId": request.topic_id}
        ]
    }

    # 3. Retrieve from ChromaDB (get a good amount of context, e.g., top 15 chunks)
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
        
        # Deduplicate sources for the metadata return
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

    # 4. Generate the personalized lesson
    lesson = generate_personalized_lesson(
        topic_title=request.topic_title,
        context=context_string,
        proficiency_level=request.proficiency_level
    )

    return {
        "lesson": lesson,
        "sources": sources
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
