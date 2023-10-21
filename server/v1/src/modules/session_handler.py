import asyncio
import threading

from typing import Dict, List, AsyncGenerator
from openai_module import OpenAIModule
from tts_handler import TTSHandler


class SessionHandler:

    @classmethod
    async def create_session(cls, user_details: Dict[str, str]) -> None:
        patient_name: str = user_details.get("name")
        OpenAIModule.add_system_message(f"Patient info: Name: {patient_name}, Age: 22, Location: Boston, Phone: 123-456-7890, Day of week: Monday, Date: 10/21/23")

        done_event = threading.Event()
        await TTSHandler.generate_audio_async(OpenAIModule.chat_completion(
            """
            Greet me with my name,
            welcome me back and tell me something along the lines of you're looking forward to getting started with their checkup and let's begin. 
            """), done_event=done_event)
        done_event.wait()  # Wait until the audio is done

        OpenAIModule.add_system_message("Begin the alzheimer's test now.")
        done_event.clear()
        await TTSHandler.generate_audio_async(OpenAIModule.chat_completion(f"Let's start the session. Start asking me questions, one at a time so I can respond."), done_event=done_event)
        done_event.wait() 

        questions = 0
        while questions < 5:
            user_response = input("Your response: ")
            done_event.clear()
            await TTSHandler.generate_audio_async(OpenAIModule.chat_completion(f"My answer: {user_response}. Give me a short but caring response to it without telling me if it's right or wrong, then ask me my next question."), done_event=done_event)
            done_event.wait()  # Wait until the audio is done
            questions += 1
        
        done_event.clear()
        await TTSHandler.generate_audio_async(OpenAIModule.chat_completion(f"What questions did I get wrong on the cognative portion and can you provide professional feedback for the doctor for the ones I got wrong? And then state if you think I have alzheimers or not. State this in the third person."), done_event=done_event)
        done_event.wait()


if __name__ == "__main__":
    async def main():
        await SessionHandler.create_session({"name": "Raghav"})
    
    asyncio.run(main())

