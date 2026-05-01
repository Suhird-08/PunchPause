from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from utils import calculate_breaks

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TimeRequest(BaseModel):
    timestamps: List[Optional[str]]  # Allow "MISSING"


@app.get("/")
def read_root():
    return {"message": "BreakTime backend is running"}

@app.post("/calculate-breaks")
def get_break_time(data: TimeRequest):
    result = calculate_breaks(data.timestamps)
    return result
