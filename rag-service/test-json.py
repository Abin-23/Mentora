import asyncio
import os
from ai_client import generate_personalized_lesson

def test():
    result = generate_personalized_lesson(
        topic_title="Python Basics",
        context="Python is a popular programming language. Variables store data. A variable is created the moment you first assign a value to it. Example: x = 5",
        proficiency_level="BEGINNER",
        teaching_preference="DIRECT"
    )
    print("RESULT:")
    print(result)

test()
