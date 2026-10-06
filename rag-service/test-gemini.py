import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

model_name = os.getenv("GEMINI_GENERATION_MODEL", "gemini-1.5-flash")
print(f"Using model: {model_name}")
try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Say hi")
    print(response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
