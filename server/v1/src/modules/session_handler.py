import asyncio

from typing import Dict, List, AsyncGenerator
from openai_module import OpenAIModule
from tts_handler import TTSHandler


class SessionHandler:

    @classmethod
    async def create_session(cls, user_details: Dict[str, str]) -> None:
        patient_name: str = user_details.get("name")
        OpenAIModule.add_system_message(f"Your patient's name is {patient_name}.")
        await TTSHandler.generate_audio_async(OpenAIModule.chat_completion, "Hello!")


if __name__ == "__main__":
    async def main():
        await SessionHandler.create_session({"name": "Raghav"})
    
    asyncio.run(main())

