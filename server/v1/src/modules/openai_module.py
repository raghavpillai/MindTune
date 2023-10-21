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
        You are a helpful physician assistant specializing in alzheimers designed to be used in a text to speech environment.
        Keep asking the user neurocognitive assessment questions one at a time like a test to determine if they have alzheimer's.
        The initial few questions should be formalities like "how was the day, how are you" then move onto the actual neurocognitive assessment.
        Keep the questions casual and like a conversation.
        """},
    ]

    @classmethod
    def add_message(cls, message: str) -> None:
        cls.messages.append({"role": "user", "content": message})

    @classmethod
    def add_system_message(cls, message: str) -> None:
        cls.messages.append({"role": "system", "content": message})

    @classmethod
    async def chat_completion(cls, query: str) -> AsyncGenerator[str, None]:
        cls.messages.append({"role": "user", "content": query})

        response: openai.ChatCompletion = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=cls.messages,
            temperature=0.3,
            stream=True
        )
        assistant_response = ""

        async for chunk in response:
            delta: Dict[str, Any] = chunk['choices'][0]["delta"]
            if 'content' in delta:
                assistant_response += delta["content"]
                yield delta["content"]
            else:
                break
        
        if assistant_response:
            cls.messages.append({"role": "assistant", "content": assistant_response})

    @classmethod
    async def whisper_transcription(cls, audio_file) -> Dict:
        response = openai.Audio.transcribe("whisper-1", audio_file)
        return response
    

if __name__ == "__main__":
    async def main():
        async for text in OpenAIModule.chat_completion("What's up?"):
            print(text)
    
    asyncio.run(main())
