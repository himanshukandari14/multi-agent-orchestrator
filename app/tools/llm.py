import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

print("KEY:", os.getenv("OPENAI_API_KEY"))
def get_llm():
    return ChatOpenAI(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o-mini",
    )