import os

import openai
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY

class OpenAIModule:
    @classmethod
    async def chat_completion(cls, query: str) -> Any:
        cls.messages.append({"role": "user", "content": query})

        response: openai.ChatCompletion = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=cls.messages,
            messages=[{'role': 'user', 'content': query}],
            temperature=1, stream=True
        )

        async def text_iterator():
            async for chunk in response:
                delta = chunk['choices'][0]["delta"]
                if 'content' in delta:
                    yield delta["content"]
                else:
                    break
        
        return text_iterator
    
    @classmethod
    def initialize(cls) -> None:
        cls.messages: List[Dict] = [
            {"role": "system", "content": "You are a helpful assistant."},
        ]
    

if __name__ == '__main__':
    print(OpenAIModule.get_completion([{"role": "user", "content": "whats merge sort"}]))