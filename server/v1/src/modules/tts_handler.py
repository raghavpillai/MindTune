import os

from dotenv import load_dotenv
from elevenlabs import generate, stream, set_api_key
from typing import Dict, Any, Optional, List 
load_dotenv()
set_api_key(os.getenv("ELEVENLABS_API_KEY"))


class TTSHandler:

    @classmethod
    def text_stream(cls):
        text_to_stream: str = "This is an example of text that I'd like to stream. We will stream each individual word of the text."
        words: List[str] = text_to_stream.split()
        len_word_context: int = 3
        split_words: List[List[str]] = [words[i:i+len_word_context] for i in range(0, len(words), len_word_context)]
        for sentence in split_words:
            yield ' '.join(sentence)
        
        # for sentence in text_to_stream.split('.'):
        #     yield sentence

    @classmethod
    def generate_audio(cls) -> None:
        audio_stream: stream.Stream = generate(
            text=cls.text_stream(),
            voice="Nicole",
            model="eleven_monolingual_v1",
            stream=True
        )
        stream(audio_stream)

if __name__ == "__main__":
    TTSHandler.generate_audio()