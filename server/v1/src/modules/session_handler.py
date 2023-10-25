import asyncio
import json
import base64
from typing import AsyncGenerator, Any, Dict

from v1.src.modules.persistence import Persistence
from v1.src.modules.chatbot import Chatbot
from v1.src.modules.tts_handler import TTSHandler

class SessionHandler:
    chatbot_sessions: Dict[str, Chatbot] = {}
    question_count = 0

    @classmethod
    async def get_chatbot_response(cls, user_id: str, query: str, done_event: asyncio.Event=asyncio.Event()) -> AsyncGenerator[Any, Any]:
        if user_id not in cls.chatbot_sessions:
            yield "User not found"
            return
        chatbot = cls.chatbot_sessions[user_id]
        if cls.question_count > 3:
            return
        
        if cls.question_count == 3:
            done_event.clear()
            async for result in TTSHandler.generate_audio_async(chatbot.chat_completion(f"{query}. That's my last question. Say thank for my time and you'll be in touch, and don't mention you're an AI. Pretend like you're a professional and give me decisive answers. Say I may have alzheimers and say why, and that you're telling my doctor. Then say questions did I get wrong on the cognative portion but say my optical test was normal."), done_event=done_event):
                if 'text' in result:
                    print(result)
                    yield json.dumps({"type": "text", "text": result['text']})
                if 'partial-text' in result:
                    yield json.dumps({"type": "partial-text", "text": result['partial-text']})
                elif 'chunk' in result:
                    yield json.dumps({
                        'type': 'chunk', 
                        'chunk': base64.b64encode(result['chunk']).decode('utf-8')
                    })
            yield json.dumps({'type': 'status', "status": "success"})
            yield json.dumps({'type': 'ending', "status": "success"})
            cls.question_count += 1
            await done_event.wait()
            return
        

        done_event.clear()
        async for result in TTSHandler.generate_audio_async(chatbot.chat_completion(query), done_event=done_event):
            if 'text' in result:
                print(result)
                yield json.dumps({"type": "text", "text": result['text']})
            elif 'chunk' in result:
                yield json.dumps({
                    'type': 'chunk', 
                    'chunk': base64.b64encode(result['chunk']).decode('utf-8')
                })
        cls.question_count += 1
        yield json.dumps({'type': 'status', "status": "success"})
        await done_event.wait()


    @classmethod
    async def send_message(cls, message: str) -> None:
        done_event = asyncio.Event()
        async for result in cls.get_chatbot_response(message, done_event):
            yield result
        await done_event.wait()

    @classmethod
    async def get_speech_from_text(cls, text: str) -> AsyncGenerator[Any, Any]:
        done_event = asyncio.Event()
        async for result in TTSHandler.generate_audio_async(text, done_event=done_event):
            yield json.dumps({
                'chunk': base64.b64encode(result['chunk']).decode('utf-8')
            })
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
            Begin the Alzheimer's test now. Let's start the session. Start asking me questions, one at a time so I can respond. Ask me if I'm ready. 
            """, done_event):
            yield result
        
        print("Fulfilled creating session")


if __name__ == "__main__":
    async def main():
        await SessionHandler.create_session({"name": "Raghav"})
    
    asyncio.run(main())

