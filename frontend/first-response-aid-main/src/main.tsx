import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

createRoot(document.getElementById("root")!).render(<App />);
