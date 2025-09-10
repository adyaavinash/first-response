from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from rag_pipeline import ask_first_aid, explain_rationing 
from ration_service import ration_all
from misinformation import check_flyer
from map_routes import router as map_router
from safety_filter import safety_check
from concurrent.futures import ThreadPoolExecutor
import subprocess
import httpx
import asyncio
import os
import time
import osmnx as ox
import networkx as nx

executor = ThreadPoolExecutor(max_workers=4)
GRAPH_HOPPER_KEY = os.getenv("GRAPHHOPPER_API_KEY","243a6d5e-4ffc-4d00-9cfb-12c9bb89caeb")

async def run_in_thread(fn, *args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, lambda: fn(*args, **kwargs))

class LoginData(BaseModel):
    username: str
    password: str

class OtpData(BaseModel):
    otp: str
    preliminary_token: str

class RationingRequest(BaseModel):
    water_liters: float
    food_items: str
    medicines_units: int
    people_count: int
    days_count: int
    lang: str = "English"

class SafeRouteRequest(BaseModel):
    region: str
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float

MODEL_NAME = os.getenv("OLLAMA_MODEL", "gpt-oss:20b")
app = FastAPI(title="FirstResponse AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map_router)

def warmup_model():
    try:
        start = time.time()
        print(f"🔥 Warming up Ollama model: {MODEL_NAME} ...")
        result = subprocess.run(
            ["ollama", "run", MODEL_NAME],
            input="Hello",
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            timeout=120
        )
        duration = time.time() - start
        if result.returncode == 0:
            print("✅ Model warmed up successfully.")
        else:
            print(f"⚠️ Model warmup failed: {result.stderr}")
    except Exception as e:
        print(f"⚠️ Warmup error: {e}")

@app.get("/")
def root():
    return {"message": "FirstResponse Backend is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_in_thread(warmup_model))

#-------------------------------------------------#

@app.post("/token")
def login(login_data: LoginData):
    # --- YOUR AUTHENTICATION LOGIC GOES HERE ---
    # For now, we'll simulate a successful login
    print(f"Login attempt for user: {login_data.username}")
    if login_data.username and login_data.password:
        return {"token": "demo-preliminary-token"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/verify_otp")
def verify_otp(otp_data: OtpData):
    # --- YOUR OTP VERIFICATION LOGIC GOES HERE ---
    # For now, we'll simulate a successful OTP verification
    print(f"OTP verification attempt with: {otp_data.otp}")
    if otp_data.otp == "123456": # Matching the frontend's demo OTP
        return {"token": "demo-final-auth-token", "username": "Demo User"}
    else:
        raise HTTPException(status_code=401, detail="Invalid OTP")

#-------------------------------------------------#

@app.get("/first_aid")
async def first_aid(question: str, lang: str = "English"):
    safe_result = safety_check(question)
    if not safe_result["safe"]:
        return {
            "question": question,
            "answer": safe_result["message"],
            "checklist": [],
            "language": lang
        }

    lang_map = {"English": "en", "हिन्दी": "hi", "العربية": "ar", "Español": "es"}
    target_lang = lang_map.get(lang, "en")

    result = await run_in_thread(ask_first_aid, question, target_lang)
    
    return {
        "question": question,
        "answer": result["text"],
        "checklist": result["table"],
        "language": lang
    }

@app.get("/ration_all")
def ration_allocation(
    water_l: float = 0,
    food_kcal: float = 0,
    medicine_units: int = 0,
    people: int = 1,
    days: int = 1
):
    if people <= 0 or days <= 0:
        return {"error": "People and days must be greater than 0"}

    resources = {}
    if water_l > 0: resources["water_l"] = water_l
    if food_kcal > 0: resources["food_kcal"] = food_kcal
    if medicine_units > 0: resources["medicine_units"] = medicine_units

    if not resources:
        return {"error": "At least one resource must be provided"}

    result = ration_all(resources, people, days)
    return {"people": people, "days": days, "allocation": result}

@app.post("/ration_all_explained")
def ration_allocation_explained(req: RationingRequest):
    resources = {
        "water_l": req.water_liters,
        "food_items": req.food_items,
        "medicine_units": req.medicines_units,
    }
    
    explanation_text = explain_rationing(
        resources, req.people_count, req.days_count, req.lang
    )
    
    status_data = ration_all(
        {"water_l": req.water_liters, "medicine_units": req.medicines_units}, 
        req.people_count, 
        req.days_count
    )

    resource_status = []
    if "water_l" in status_data:
        resource_status.append({
            "resource": "Water",
            "status": "Adequate" if status_data["water_l"]["status"] == "Sufficient" else "Critical",
            "details": f"{status_data['water_l']['per_person_per_day']:.1f}L per person per day"
        })
        
    if req.food_items:
         resource_status.append({
            "resource": "Food",
            "status": "Critical", # Or your own logic to determine this
            "details": f"Based on available items: {req.food_items}"
        })

    if "medicine_units" in status_data:
        resource_status.append({
            "resource": "Medicine",
            "status": "Adequate" if status_data["medicine_units"]["status"] == "Sufficient" else "Critical",
            "details": f"{status_data['medicine_units']['per_person_per_day']:.1f} units per person"
        })

    return {
        "explanation": explanation_text.split('\n'), 
        "resource_status": resource_status
    }

@app.post("/misinformation")
async def misinformation(file: UploadFile):
    """Scan flyer for misinformation"""
    try:
        text, verdict_data = check_flyer(file)

        return {
            "extracted_text": text,
            "verdict": verdict_data["verdict"],
            "reason": verdict_data["reason"]
        }
    except Exception as e:
        return {
            "extracted_text": "",
            "verdict": "Error",
            "reason": str(e)
        }

@app.post("/safe_route")
async def safe_route(req: SafeRouteRequest):
    url = "https://graphhopper.com/api/1/route"
    
    params = [
        ("point", f"{req.start_lat},{req.start_lon}"),
        ("point", f"{req.end_lat},{req.end_lon}"),
        ("vehicle", "foot"),
        ("locale", "en"),
        ("points_encoded", "false"),
        ("key", GRAPH_HOPPER_KEY)
    ]

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            raw_coords = data["paths"][0]["points"]["coordinates"]
            
            route_geometry = [[float(lat), float(lon)] for lon, lat in raw_coords]
            
            print("Route Geometry Sample (first 5 points):", route_geometry[:5])
            print("Total Points:", len(route_geometry))
            print("Distance (km):", data["paths"][0]["distance"]/1000)
            print("Duration (min):", data["paths"][0]["time"]/60000)

            return {
                "distance_km": data["paths"][0]["distance"] / 1000,
                "duration_min": data["paths"][0]["time"] / 60000,
                "route_geometry": route_geometry,
                "turn_by_turn": data["paths"][0].get("instructions", [])
            }

        except httpx.HTTPStatusError as e:
            print("HTTP error:", e.response.text)
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            print("Other error:", str(e))
            raise HTTPException(status_code=500, detail=str(e))




