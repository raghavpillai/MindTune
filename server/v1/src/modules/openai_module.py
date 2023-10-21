import os
import asyncio
import openai
from typing import Dict, List, AsyncGenerator, Any
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY

class OpenAIModule:
    messages: List[Dict] = [
        {"role": "system", "content": 
        """Your name is Alice.
        You are a helpful physician assistant designed to be used in a text to speech environment.
        Be articulate and make sure you're using natural language.
        When the patient greets you, greet them with a long formality and introduce yourself again.
        """},
    ]

    @classmethod
    def add_system_message(cls, message: str) -> None:
        cls.messages.append({"role": "system", "content": message})

    @classmethod
    async def chat_completion(cls, query: str) -> AsyncGenerator[str, None]:
        cls.messages.append({"role": "user", "content": query})

        response: openai.ChatCompletion = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=cls.messages,
            temperature=0.5,
            stream=True
        )

        async for chunk in response:
            delta: Dict[str, Any] = chunk['choices'][0]["delta"]
            if 'content' in delta:
                yield delta["content"]
            else:
                break
    

if __name__ == "__main__":
    async def main():
        async for text in OpenAIModule.chat_completion("What's up?"):
            print(text)
    
    asyncio.run(main())
