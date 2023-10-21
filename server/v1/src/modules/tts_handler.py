import os
import re
import queue
import threading

from dotenv import load_dotenv
from elevenlabs import generate, stream, set_api_key
from typing import Callable, AsyncGenerator, List

load_dotenv()
set_api_key(os.getenv("ELEVENLABS_API_KEY"))

WORDS_PER_CHUNK = 3

class TTSHandler:

    @staticmethod
    def _sync_stream(speak_queue: queue.Queue) -> str:
        while True:
            item = speak_queue.get()
            if item is None:
                break
            print(item)
            yield item

    @classmethod
    async def generate_audio_async(cls, text_stream_fn: Callable[[str], AsyncGenerator], query: str) -> None:
        speak_queue: queue.Queue = queue.Queue()

        def tts_thread_fn():
            audio_stream = generate(
                text=cls._sync_stream(speak_queue),
                voice="Nicole",
                model="eleven_monolingual_v1",
                stream=True
            )
            stream(audio_stream)
        
        threading.Thread(target=tts_thread_fn).start()

        sentence_buffer = ""
        async for text in text_stream_fn(query):
            sentence_buffer += text

            while re.search(r'[.!?]', sentence_buffer):
                sentence, _, remainder = re.split(r'([.!?])', sentence_buffer, 1)
                sentence += _

                speak_queue.put(sentence.strip())
                sentence_buffer = remainder

        if sentence_buffer.strip():
            speak_queue.put(sentence_buffer.strip())

        # words_buffer: List[str] = []
        # async for text in text_stream_fn(query):
        #     words_buffer.extend(text.split())

        #     while len(words_buffer) >= WORDS_PER_CHUNK:
        #         speak_queue.put(' '.join(words_buffer[:WORDS_PER_CHUNK]))
        #         words_buffer = words_buffer[WORDS_PER_CHUNK:]

        # if words_buffer:
        #     speak_queue.put(' '.join(words_buffer))
            
        speak_queue.put(None) # End here
