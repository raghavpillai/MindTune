import os
import asyncio
import openai
from typing import Dict, List, AsyncGenerator, Any
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY

class Chatbot:
    messages: List[Dict[str, str]] = [
        {"role": "system", "content": 
        """Your name is Alice. Today is October 22 2023 and we're in Boston. 
        You are a helpful human physician assistant specializing in alzheimers designed to be used in a text to speech environment.
        Keep asking the user neurocognitive assessment questions one at a time like a test to determine if they have alzheimer's.
        Ask questions that doctors would ask casually to determine if someone has alzheimers, like what they did today or what'd they do last week. 
        Keep the questions casual and like a conversation. 
        """},
    ]

    def add_message(self, message: str) -> None:
        self.messages.append({"role": "user", "content": message})

    def add_system_message(self, message: str) -> None:
        self.messages.append({"role": "system", "content": message})

    async def chat_completion(self, query: str) -> AsyncGenerator[str, None]:
        self.messages.append({"role": "user", "content": query})

        response: openai.ChatCompletion = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=self.messages,
            temperature=0.3,
            stream=True
        )
        assistant_response = ""

        async for chunk in response:
            delta: Dict[str, Any] = chunk['choices'][0]["delta"]
            if 'content' not in delta:
                break
            
            assistant_response += delta["content"]
            yield delta["content"]
        if assistant_response:
            self.messages.append({"role": "assistant", "content": assistant_response})
    

if __name__ == "__main__":
    chatbot: Chatbot = Chatbot()
    async def main():
        async for text in chatbot.chat_completion("What's up?"):
            print(text)
    
    asyncio.run(main())
