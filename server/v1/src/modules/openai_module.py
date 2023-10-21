import openai
from dotenv import load_dotenv
import os, sys

load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY

class OpenaiModule:
    @staticmethod
    def get_completion(messages: list[dict]):
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        return completion.choices[0].message.content

if __name__ == '__main__':
    print(OPENAI_API_KEY)
    print(OpenaiModule.get_completion([{"role": "user", "content": "whats merge sort"}]))