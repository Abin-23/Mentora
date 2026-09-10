import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
    print("WARNING: GEMINI_API_KEY is not set correctly in .env")
else:
    genai.configure(api_key=GEMINI_API_KEY)

def generate_embeddings(text: str) -> list[float]:
    """
    Generates embeddings for a given text using Gemini's embedding model.
    """
    try:
        # Use embedding-001 or text-embedding-004
        result = genai.embed_content(
            model="models/gemini-embedding-2",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        # Return a zero vector for graceful fallback if needed, or raise
        raise e

def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings for a list of texts.
    """
    embeddings = []
    for text in texts:
        emb = generate_embeddings(text)
        embeddings.append(emb)
    return embeddings

def generate_chat_response(query: str, context: str) -> str:
    """
    Generates a response using Gemini based on the provided context.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""You are Mentora's AI Tutor, a helpful and knowledgeable learning assistant.
You have been provided with the following context from the student's course materials. 
Use this context to answer the student's question accurately. If the answer is not contained in the context, 
you can use your general knowledge, but prioritize the course material.

--- COURSE MATERIAL CONTEXT ---
{context}
--- END CONTEXT ---

Student's Question: {query}
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return "I'm sorry, I encountered an error while trying to process your request."

def generate_personalized_lesson(topic_title: str, context: str, proficiency_level: str) -> str:
    """
    Generates a personalized lesson using Gemini based on the student's proficiency level and course context.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""You are Mentora's AI Tutor. Your task is to generate a personalized lesson/study guide for a student.

Topic: {topic_title}
Student's Proficiency Level: {proficiency_level}

Instructions:
1. Adapt your tone, vocabulary, and depth of explanation to the student's proficiency level (e.g., simpler analogies for beginners, deeper technical insights for advanced).
2. ONLY use the provided course material context to generate the lesson. Do not make unsupported claims or bring in outside information that contradicts the context.
3. If you generate examples that are not strictly in the text to aid understanding, clearly distinguish them as AI-generated examples.
4. Structure the lesson beautifully using Markdown (headers, bullet points, bold text).

--- COURSE MATERIAL CONTEXT ---
{context}
--- END CONTEXT ---
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating personalized lesson: {e}")
        return "Failed to generate a personalized lesson at this time."
