import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    print("Testing text-embedding-004...")
    result = genai.embed_content(
        model="models/text-embedding-004",
        content="hello",
        task_type="retrieval_document"
    )
    print("Success with models/text-embedding-004!")
except Exception as e:
    print(f"Error 1: {e}")

try:
    print("Testing text-embedding-004 without models/ prefix...")
    result = genai.embed_content(
        model="text-embedding-004",
        content="hello",
        task_type="retrieval_document"
    )
    print("Success with text-embedding-004!")
except Exception as e:
    print(f"Error 2: {e}")

try:
    print("List models:")
    for m in genai.list_models():
        if "embedContent" in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error list: {e}")
