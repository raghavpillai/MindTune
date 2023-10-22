import asyncio
import json
import base64
from typing import AsyncGenerator, Any, Dict

from v1.src.modules.persistence import Persistence
from v1.src.modules.chatbot import Chatbot
from v1.src.modules.tts_handler import TTSHandler

class SessionHandler:
    chatbot_sessions: Dict[str, Chatbot] = {}

    @classmethod
    async def get_chatbot_response(cls, user_id: str, query: str, done_event: asyncio.Event=asyncio.Event()) -> AsyncGenerator[Any, Any]:
        if user_id not in cls.chatbot_sessions:
            yield "User not found"
            return
        chatbot = cls.chatbot_sessions[user_id]

        done_event.clear()
        async for result in TTSHandler.generate_audio_async(chatbot.chat_completion(query), done_event=done_event):
            if 'text' in result:
                print(result)
                yield json.dumps(result)
            elif 'chunk' in result:
                yield json.dumps({
                    'chunk': base64.b64encode(result['chunk']).decode('utf-8')
                })
        await done_event.wait()


    @classmethod
    async def send_message(cls, message: str) -> None:
        done_event = asyncio.Event()
        async for result in cls.get_chatbot_response(message, done_event):
            yield result
        await done_event.wait()

    @classmethod
    async def create_session(cls, user_id: str) -> AsyncGenerator[Any, Any]:
        user_details = Persistence.get_user(user_id=user_id)
        if not user_details:
            yield "User not found"
            return
        chatbot: Chatbot = Chatbot()
        cls.chatbot_sessions[user_id] = chatbot

        done_event = asyncio.Event()

        user_info = f"Name: {user_details['first_name']} {user_details['last_name']}, Age: {user_details['age']}, City: {user_details['city']}, Phone: {user_details['phone']}"
        chatbot.add_system_message(f"Patient info: {user_info}")

        async for result in cls.get_chatbot_response(
            user_id, 
            """
            Greet me with my name,
            welcome me back and tell me something along the lines of you're looking forward to getting started with their checkup and let's begin. 
            """, done_event):
            yield result

        chatbot.add_system_message("Begin the Alzheimer's test now.")
        async for result in cls.get_chatbot_response(user_id, "Let's start the session. Start asking me questions, one at a time so I can respond.", done_event):
            yield result
        
        yield json.dumps({"status": "success"})
        print("Fulfilled creating session")

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

