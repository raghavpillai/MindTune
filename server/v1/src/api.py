from typing import Dict, Any, Optional, List

from fastapi import FastAPI, Query, Form, HTTPException
from fastapi_socketio import SocketManager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from v1.src.util.responsemodel import ResponseModel
from v1.src.modules.openai_module import OpenaiModule

app: FastAPI = FastAPI()

API_V1_ENDPOINT = "/api/v1"
OPENAI_V1_ENDPOINT = "/openai/v1"

# Set up CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = SocketManager(app=app)
app.mount("/ws", sio)

@app.get("/", response_model=ResponseModel)
async def default():
    return ResponseModel(success=True, message={"hi": "test"})

@app.get(f"{API_V1_ENDPOINT}/", response_model=ResponseModel)
async def main():
    return ResponseModel(success=True, message={"hi": "test2"})

@app.get(f"{OPENAI_V1_ENDPOINT}/")
async def main(messages: list[Dict]):
    return ResponseModel(
        success=True,
        message=OpenaiModule.get_completion(messages)
    )