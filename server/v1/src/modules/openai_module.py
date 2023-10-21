import os

import openai
from typing import Dict, List, Generator, Any
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY

class OpenAIModule:
    messages: List[Dict] = [
        {"role": "system", "content": "You are a helpful assistant."},
    ]

    @classmethod
    async def chat_completion(cls, query: str) -> Generator[str, None, None]:
        cls.messages.append({"role": "user", "content": query})

        response: openai.ChatCompletion = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=cls.messages,
            temperature=0.5,
            stream=True
        )

        async def text_iterator():
            async for chunk in response:
                delta: Dict[str, Any] = chunk['choices'][0]["delta"]
                if 'content' in delta:
                    yield delta["content"]
                else:
                    break
        
        return text_iterator
    

if __name__ == "__main__":
    pass
    # OpenAIModule.chat_completion("What's up?")