from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from utils import calculate_breaks

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://punchpause.netlify.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"^https://([a-zA-Z0-9-]+\.)*(netlify\.app|vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TimeRequest(BaseModel):
    timestamps: List[Optional[str]]  # Allow "MISSING"


@app.get("/")
def read_root():
    return {"message": "BreakTime backend is running"}


@app.head("/")
def read_root_head():
    return Response(status_code=200)

@app.post("/calculate-breaks")
def get_break_time(data: TimeRequest):
    result = calculate_breaks(data.timestamps)
    return result
