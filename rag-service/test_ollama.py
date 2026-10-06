import requests
import json

prompt = "Hello, generate a JSON object with a key 'greeting'."
payload = {
    "model": "qwen3.5:9b",
    "prompt": prompt,
    "format": "json",
    "stream": False
}

try:
    res = requests.post("http://localhost:11434/api/generate", json=payload)
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
except Exception as e:
    print("Error:", e)
