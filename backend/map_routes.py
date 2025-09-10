import os
import requests
import folium
from fastapi import APIRouter
import traceback
import base64
import io

router = APIRouter()

GRAPHOPPER_API_KEY = os.environ.get("GRAPHHOPPER_API_KEY", "243a6d5e-4ffc-4d00-9cfb-12c9bb89caeb")


def get_graphhopper_route(api_key: str, start_point: tuple, end_point: tuple, vehicle: str = "car"):
    """
    Call GraphHopper Routing API to get a route between two points.
    """
    url = "https://graphhopper.com/api/1/route"
    params = {
        "point": [f"{start_point[0]},{start_point[1]}", f"{end_point[0]},{end_point[1]}"],
        "vehicle": vehicle,
        "key": api_key,
        "points_encoded": "false",  
        "instructions": "true"
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    if "paths" not in data or not data["paths"]:
        raise ValueError("No route found from GraphHopper")

    return data["paths"][0]


@router.get("/safe_route")
def safe_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    vehicle: str = "car"
):
    try:
        if GRAPHOPPER_API_KEY != "243a6d5e-4ffc-4d00-9cfb-12c9bb89caeb":
            return {"error": "Please set GRAPHHOPPER_API_KEY in environment"}

        route = get_graphhopper_route(
            GRAPHOPPER_API_KEY,
            (start_lat, start_lon),
            (end_lat, end_lon),
            vehicle
        )

        points = route["points"]["coordinates"]

        m = folium.Map(location=[start_lat, start_lon], zoom_start=13)

        folium.PolyLine([(lat, lon) for lon, lat in points], color="blue", weight=5).add_to(m)

        folium.Marker([start_lat, start_lon], tooltip="Start", icon=folium.Icon(color="green")).add_to(m)
        folium.Marker([end_lat, end_lon], tooltip="End", icon=folium.Icon(color="red")).add_to(m)

        buf = io.BytesIO()
        m.save("temp_map.html")
        
        with open("temp_map.html", "rb") as f:
            html_base64 = base64.b64encode(f.read()).decode("utf-8")

        return {
            "distance_km": route["distance"] / 1000,
            "duration_min": route["time"] / 1000 / 60,
            "turn_by_turn": route.get("instructions", []),
            "map_html_base64": html_base64
        }

    except Exception as e:
        tb = traceback.format_exc()
        print("ERROR in /safe_route:\n", tb)
        return {"error": str(e), "traceback": tb}

