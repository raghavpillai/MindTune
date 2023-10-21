from typing import Dict, Any, Optional, List

from fastapi import FastAPI, Query, Form, HTTPException
from fastapi_socketio import SocketManager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from v1.src.util.responsemodel import ResponseModel
from v1.src.modules.openai_module import OpenAIModule
from v1.src.modules.persistence import Persistence

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
async def test():
    return ResponseModel(success=True, message={"test": "passed"})

@app.get(f"{API_V1_ENDPOINT}/users/get_all_data")
async def get_all():
    return ResponseModel(
        success=True,
        message={"user_data": Persistence.get_all_users()}
    )

@app.get(f"{API_V1_ENDPOINT}/users/get_user")
async def get_user(user_id: str = Query()):
    return ResponseModel(
        success=True,
        message={"user_data": Persistence.get_user(user_id=user_id)}
    )