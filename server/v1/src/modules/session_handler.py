import asyncio
import threading
import json
import base64

from typing import Dict, List, Any, AsyncGenerator

from v1.src.modules.persistence import Persistence
from v1.src.modules.openai_module import OpenAIModule
from v1.src.modules.tts_handler import TTSHandler


class SessionHandler:

    @classmethod
    async def send_message(cls, message: str) -> None:
        done_event = threading.Event()
        async for result in TTSHandler.generate_audio_async(OpenAIModule.chat_completion(message), done_event=done_event):
            yield result
        done_event.wait()

    @classmethod
    async def create_session(cls, user_id: str) -> AsyncGenerator[Any, Any]:
        user_details: Dict[str, str] = Persistence.get_user(user_id=user_id)
        if not user_details:
            yield "User not found"
            return

        user_info: str = f"Name: {user_details['first_name']} {user_details['last_name']}, Age: {user_details['age']}, City: {user_details['city']}, Phone: {user_details['phone']}"
        OpenAIModule.add_system_message(f"Patient info: {user_info}")

        done_event = threading.Event()
        async for result in TTSHandler.generate_audio_async(OpenAIModule.chat_completion(
            """
            Greet me with my name,
            welcome me back and tell me something along the lines of you're looking forward to getting started with their checkup and let's begin. 
            """), done_event=done_event):
            if 'text' in result:
                yield json.dumps(result)
            elif 'chunk' in result:
                yield json.dumps({
                    'chunk': base64.b64encode(result['chunk']).decode('utf-8')
                })

        done_event.wait()

        OpenAIModule.add_system_message("Begin the alzheimer's test now.")
        done_event.clear()
        async for result in TTSHandler.generate_audio_async(OpenAIModule.chat_completion("Let's start the session. Start asking me questions, one at a time so I can respond."), done_event=done_event):
            if 'text' in result:
                yield json.dumps(result)
            elif 'chunk' in result:
                yield json.dumps({
                    'chunk': base64.b64encode(result['chunk']).decode('utf-8')
                })
        done_event.wait()

        # questions = 0
        # while questions < 5:
        #     user_response = input("Your response: ")
        #     done_event.clear()
        #     await TTSHandler.generate_audio_async(OpenAIModule.chat_completion(f"My answer: {user_response}. Give me a short but caring response to it without telling me if it's right or wrong, then ask me my next question."), done_event=done_event)
        #     done_event.wait()  # Wait until the audio is done
        #     questions += 1
        
        # done_event.clear()
        # await TTSHandler.generate_audio_async(OpenAIModule.chat_completion(f"What questions did I get wrong on the cognative portion and can you provide professional feedback for the doctor for the ones I got wrong? And then state if you think I have alzheimers or not. State this in the third person."), done_event=done_event)
        # done_event.wait()


if __name__ == "__main__":
    async def main():
        await SessionHandler.create_session({"name": "Raghav"})
    
    asyncio.run(main())

