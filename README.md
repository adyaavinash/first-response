FirstResponse - Humanitarian Survival Toolkit

FirstResponse is a full-stack web application designed to provide critical assistance in emergency and humanitarian crisis situations. It leverages AI and real-time data to offer tools for first aid guidance, resource rationing, safe route navigation, and misinformation detection.
________________________________________________________________________________________________________________
The application is built with a modern tech stack:

Frontend: React, TypeScript, Vite, and Tailwind CSS (using shadcn/ui components).

Backend: FastAPI (Python) serving AI models and routing logic.

Routing Engine: GraphHopper running in a Docker container for high-speed, offline route calculations.
________________________________________________________________________________________________________________
Features & Usage Guide
The FirstResponse dashboard provides a suite of powerful tools accessible from a simple navigation sidebar.

🩺 First Aid Assistant
Get immediate, AI-driven first aid guidance for a wide range of medical emergencies, based on established Red Cross and WHO manuals.

How to Use:

Navigate to the First Aid page from the sidebar.

In the "Medical Emergency Description" input, type your question in plain language.

Select your preferred language from the dropdown menu.

Click "Get First Aid Guidance".

The AI will provide clear, numbered steps for immediate action and a detailed checklist with "How To" and "Avoid" columns for critical tasks.

Example Query: "How to treat a second-degree burn?"
----------------------------------------------------------------------------------------------------------------

💧 Resource Rationing
Efficiently calculate and manage the distribution of essential resources for a group of people over a set number of days.

How to Use:

Navigate to the Rationing page.

Enter the total amount of available resources: Water (in Liters), Food Items (as a description), and Medicine (in units).

Input the "Number of People" and the "Number of Days" the resources need to last.

Click "Calculate Distribution".

The tool will display a step-by-step Distribution Plan and a Resource Status summary, indicating whether supplies are "Adequate" or "Critical".

Example Scenario: Calculate how to distribute 50 liters of water, "rice and canned beans", and 100 medicine units among 10 people for 5 days.
----------------------------------------------------------------------------------------------------------------

🗺️ Safe Route Planner
Find the safest and most efficient travel route between two locations using an advanced routing engine. This feature is crucial for navigating through uncertain or potentially hazardous areas.

How to Use:

Navigate to the Safe Route page.

Select the geographical Region from the dropdown menu.

In the "Start Location" and "Destination" fields, enter place names (e.g., "City Hall", "General Hospital").

Click "Find Route".

The system will display an interactive map with the calculated route drawn on it, along with detailed turn-by-turn directions, distance, and estimated duration.

Example Usage: Plan a route from "Bengaluru MG Road" to "Electronic City Bangalore".
----------------------------------------------------------------------------------------------------------------

🚨 Flyer Scanner
Analyze images of flyers, posters, or official-looking documents to detect signs of misinformation, helping you distinguish between legitimate aid and potentially harmful propaganda.

How to Use:

Navigate to the Flyer Scanner page.

Click "Choose Image File" or drag and drop an image of the flyer into the upload zone.

Click "Scan for Misinformation".

The tool will display the text it extracted from the image and a clear Verdict, indicating if the content is "Verified ✅" or "Suspicious ⚠", along with a reason for its conclusion.

Example Task: Upload a photo of a poster announcing a food distribution to verify its authenticity.
________________________________________________________________________________________________________________
Project Setup and Usage
To run this project locally, you need to start three separate services: the GraphHopper Routing Engine, the FastAPI Backend, and the React Frontend. You will need Docker, Node.js, and Python installed on your system.

1. The Routing Engine (GraphHopper)
This service handles all map calculations and must be running for the "Safe Route" feature to work.

Create Data Folder: Create a folder on your computer (e.g., C:\graphhopper_data).

Download Map Data: Download a map file in .osm.pbf format (e.g., bengaluru.osm.pbf from a provider like BBBike.org) and place it inside your C:\graphhopper_data folder.

Build Graph Data (One-Time Step): Run the following Docker command to pre-process the map. This will create a new folder ending in -gh.

docker run -v "C:\graphhopper_data:/data" graphhopper/graphhopper:latest import /data/bengaluru.osm.pbf
Start the Server: In a dedicated terminal, run this command to start the GraphHopper server. It will listen on port 8989.

docker run -p 8989:8989 -v "C:\graphhopper_data:/data" graphhopper/graphhopper:latest
Leave this terminal running.
----------------------------------------------------------------------------------------------------------------
2. The Backend (FastAPI)
This is the Python server that powers the application's core logic.

Navigate to the Backend Directory:

cd path/to/your/project/backend
Create and Activate a Virtual Environment:

python -m venv venv
.\venv\Scripts\Activate
Install Dependencies:

pip install -r requirements.txt
Start the Server: In a second terminal, run the FastAPI server on port 8000.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
Leave this terminal running.
----------------------------------------------------------------------------------------------------------------
3. The Frontend (React)
This is the user interface that you will interact with in your browser.

Navigate to the Frontend Directory:

cd path/to/your/project/frontend/first-response-aid-main
Install Dependencies (One-Time Step):

npm install
Start the App: In a third terminal, run the Vite development server.

npm run dev