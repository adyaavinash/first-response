import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Map, MapPin, Navigation, Route, AlertTriangle, Clock, Navigation2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';


let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface SafeRouteResponse {
  distance_km: number;
  duration_min: number;
  route_geometry: [number, number][]; 
  turn_by_turn: {
    text: string;
    street_name: string;
    distance: number;
    time: number;
  }[];
}

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

const MapUpdater = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.invalidateSize(); 
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, [positions, map]); 
  return null;
};

const SafeRouteMap = ({ route }: { route: [number, number][] }) => {
  const defaultCenter: [number, number] = [12.9716, 77.5946];
  const routeCenter = route && route.length > 0 ? route[0] : defaultCenter;

  return (
    <div className="h-[500px] w-full rounded-lg border border-border overflow-hidden">
      <MapContainer
        center={routeCenter}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {route && route.length > 0 && (
          <>
            <Polyline positions={route} pathOptions={{ color: "teal", weight: 5 }} />
            <Marker position={route[0]}>
              <Popup>Start</Popup>
            </Marker>
            <Marker position={route[route.length - 1]}>
              <Popup>Destination</Popup>
            </Marker>
            <MapUpdater positions={route} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

const SafeRoutePage = () => {
    const [region, setRegion] = useState("");
    const [startLocation, setStartLocation] = useState("");
    const [destination, setDestination] = useState("");
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [response, setResponse] = useState<SafeRouteResponse | null>(null);
    const [error, setError] = useState("");
    const { toast } = useToast();

    const popularRegions = [
        { value: "karnataka", label: "Karnataka, India" },
        { value: "maharashtra", label: "Maharashtra, India" },
        { value: "delhi", label: "Delhi, India" },
        { value: "kathmandu", label: "Kathmandu, Nepal" },
        { value: "dhaka", label: "Dhaka, Bangladesh" },
        { value: "colombo", label: "Colombo, Sri Lanka" },
    ];

    const geocodeLocation = async (locationName: string): Promise<GeocodeResult | null> => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                return { lat: data[0].lat, lon: data[0].lon, display_name: data[0].display_name };
            }
            return null;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!region || !startLocation || !destination) {
            setError("Please fill in all fields");
            return;
        }
        setError("");
        setResponse(null);
        setIsGeocodingLoading(true);

        try {
            toast({ title: "Geocoding locations", description: "Converting place names to coordinates..." });
            const [startResult, endResult] = await Promise.all([geocodeLocation(startLocation), geocodeLocation(destination)]);

            if (!startResult || !endResult) {
                setError(!startResult ? "Start location not found" : "Destination not found");
                setIsGeocodingLoading(false);
                return;
            }

            setIsGeocodingLoading(false);
            setIsRouteLoading(true);

            toast({ title: "Calculating route", description: "Finding the safest path..." });

            const authToken = localStorage.getItem("auth_token");
            const requestBody = {
                region,
                start_lat: parseFloat(startResult.lat),
                start_lon: parseFloat(startResult.lon),
                end_lat: parseFloat(endResult.lat),
                end_lon: parseFloat(endResult.lon),
            };

            const apiResponse = await fetch(`${API_BASE_URL}/safe_route`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                body: JSON.stringify(requestBody),
            });

            if (apiResponse.ok) {
                const data: SafeRouteResponse = await apiResponse.json();
                setResponse(data);
                toast({ title: "Route calculated", description: `Found ${data.distance_km.toFixed(1)} km route` });
            } else {
                setError("Failed to calculate safe route. Please try again.");
            }
        } catch (err) {
            setError("An error occurred while connecting to the backend.");
        } finally {
            setIsGeocodingLoading(false);
            setIsRouteLoading(false);
        }
    };

    const loadSampleRoute = () => {
        setRegion("karnataka");
        setStartLocation("MG Road, Bengaluru");
        setDestination("Koramangala, Bengaluru");
    };

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = Math.floor(minutes % 60);
        return h > 0 ? `${h}h ${m}min` : `${m} min`;
    };

    const formatDistance = (meters: number) => (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Map className="h-8 w-8 text-success" />
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Safe Route Planning</h1>
                    <p className="text-muted-foreground">Plan secure travel routes between locations</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-success" />Route Planning</CardTitle>
                        <CardDescription>Enter locations to calculate the safest route</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Region</Label><Select value={region} onValueChange={setRegion}><SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger><SelectContent>{popularRegions.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>🏁 Start Location</Label><Input value={startLocation} onChange={(e) => setStartLocation(e.target.value)} required /></div>
                            <div className="space-y-2"><Label>🎯 Destination</Label><Input value={destination} onChange={(e) => setDestination(e.target.value)} required /></div>
                            <Button type="button" variant="outline" onClick={loadSampleRoute} className="w-full mb-2"><MapPin className="mr-2 h-4 w-4" /> Load Sample Route</Button>
                            {error && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>)}
                            <Button type="submit" variant="success" className="w-full" disabled={isGeocodingLoading || isRouteLoading}>
                                {isGeocodingLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Geocoding...</> : isRouteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating...</> : <><Route className="mr-2 h-4 w-4" />Find Route</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-success" />Route Visualization</CardTitle>
                        <CardDescription>Interactive map showing your safe route</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isRouteLoading ? (
                            <div className="h-[500px] flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-border">
                                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                            </div>
                        ) : response ? (
                            <SafeRouteMap route={response.route_geometry} />
                        ) : (
                            <div className="h-[500px] flex items-center justify-center bg-muted/50 rounded-lg border border-border text-muted-foreground">
                                Enter locations and click "Find Route"
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {response?.turn_by_turn?.length > 0 && (
                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Navigation2 className="h-5 w-5 text-primary" />Turn-by-Turn Directions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3">
                            {response.turn_by_turn.map((inst, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">{i + 1}</span>
                                    <div className="flex-1">
                                        <p className="font-medium">➡️ {inst.text} onto <span className="text-primary">{inst.street_name}</span></p>
                                        <p className="text-sm text-muted-foreground mt-1">{formatDistance(inst.distance)} • {formatDuration(inst.time / 60000)}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SafeRoutePage;



