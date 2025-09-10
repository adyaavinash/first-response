import os
import requests


def get_graphhopper_route(api_key: str, start_point: list, end_point: list, vehicle: str = "car"):
    """
    Get a route from the GraphHopper API between two points.
    
    :param api_key: Your GraphHopper API key
    :param start_point: [lat, lon] of the starting location
    :param end_point: [lat, lon] of the destination
    :param vehicle: Mode of transport ('car', 'bike', 'foot', etc.)
    :return: Dictionary with route information, or None if failed
    """
    url = "https://graphhopper.com/api/1/route"

    params = {
        "point": [f"{start_point[0]},{start_point[1]}", f"{end_point[0]},{end_point[1]}"],
        "vehicle": vehicle,
        "key": api_key,
        "points_encoded": "false",   
        "instructions": "true"       
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "paths" not in data or not data["paths"]:
            print("⚠️ No route found!")
            return None

        print("✅ Route calculated successfully!")
        return data["paths"][0]

    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None


if __name__ == "__main__":
    MY_API_KEY = os.environ.get("GRAPHHOPPER_API_KEY", "243a6d5e-4ffc-4d00-9cfb-12c9bb89caeb")

    # Example: Bangalore city route
    start_coords = [12.9716, 77.5946]   # MG Road
    end_coords = [12.9345, 77.6265]     # Koramangala

    if MY_API_KEY != "243a6d5e-4ffc-4d00-9cfb-12c9bb89caeb":
        print("Please set your GraphHopper API key in the code or environment variable.")
    else:
        route_info = get_graphhopper_route(MY_API_KEY, start_coords, end_coords, vehicle="car")

        if route_info:
            distance_km = route_info["distance"] / 1000
            duration_min = route_info["time"] / 1000 / 60

            print(f"Distance: {distance_km:.2f} km")
            print(f"Estimated Time: {duration_min:.1f} minutes")

            print("\nTurn-by-turn directions:")
            for step in route_info.get("instructions", []):
                print(f"- {step['text']} ({step['distance']:.0f} m)")












