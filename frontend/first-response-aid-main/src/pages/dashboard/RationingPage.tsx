import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Droplets, Users, Calendar, Package, Pill, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ResourceStatus {
  resource: string;
  status: "Adequate" | "Critical" | "Surplus";
  details: string;
}

interface RationingResponse {
  explanation: string[];
  resource_status: ResourceStatus[];
}

const RationingPage = () => {
  const [waterLiters, setWaterLiters] = useState("");
  const [foodItems, setFoodItems] = useState("");
  const [medicinesUnits, setMedicinesUnits] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [daysCount, setDaysCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RationingResponse | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!waterLiters || !foodItems || !medicinesUnits || !peopleCount || !daysCount) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    setResponse(null);

    try {
      const authToken = localStorage.getItem("auth_token");
      const requestBody = {
        water_liters: parseFloat(waterLiters),
        food_items: foodItems,
        medicines_units: parseFloat(medicinesUnits),
        people_count: parseInt(peopleCount),
        days_count: parseInt(daysCount),
      };

      const apiResponse = await fetch(`${API_BASE_URL}/ration_all_explained`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (apiResponse.ok) {
        const data: RationingResponse = await apiResponse.json();
        setResponse(data);
        toast({
          title: "Rationing analysis complete",
          description: "Resource distribution plan generated",
        });
      } else {
        setError("Failed to analyze resources. Please try again.");
      }
    } catch (error) {
      // Demo response for development
      const demoResponse: RationingResponse = {
        explanation: [
          `Distributing resources for ${peopleCount} people over ${daysCount} days`,
          `Water allocation: ${(parseFloat(waterLiters) / parseInt(peopleCount) / parseInt(daysCount)).toFixed(1)}L per person per day`,
          "Food should be distributed in equal portions with priority to children and elderly",
          "Medicine units should be reserved for critical health situations",
          "Monitor consumption daily and adjust if necessary"
        ],
        resource_status: [
          {
            resource: "Water",
            status: parseFloat(waterLiters) / parseInt(peopleCount) / parseInt(daysCount) >= 2 ? "Adequate" : "Critical",
            details: `${(parseFloat(waterLiters) / parseInt(peopleCount) / parseInt(daysCount)).toFixed(1)}L per person per day (minimum 2L recommended)`
          },
          {
            resource: "Food",
            status: "Critical",
            details: "Needs careful rationing - prioritize high-calorie items"
          },
          {
            resource: "Medicine",
            status: parseFloat(medicinesUnits) / parseInt(peopleCount) >= 10 ? "Adequate" : "Critical",
            details: `${(parseFloat(medicinesUnits) / parseInt(peopleCount)).toFixed(1)} units per person`
          }
        ]
      };
      
      setResponse(demoResponse);
      toast({
        title: "Demo mode active",
        description: "Showing sample rationing analysis",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Adequate":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "Critical":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "Surplus":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Adequate":
        return "bg-success text-success-foreground";
      case "Critical":
        return "bg-destructive text-destructive-foreground";
      case "Surplus":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Droplets className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resource Rationing</h1>
          <p className="text-muted-foreground">Calculate and manage resource distribution efficiently</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Resource Inventory
          </CardTitle>
          <CardDescription>
            Enter available resources and population details for distribution analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resources Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Available Resources
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="water">Water (Liters)</Label>
                  <Input
                    id="water"
                    type="number"
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(e.target.value)}
                    placeholder="e.g., 100"
                    className="bg-input border-border"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="food">Food Items</Label>
                  <Textarea
                    id="food"
                    value={foodItems}
                    onChange={(e) => setFoodItems(e.target.value)}
                    placeholder="e.g., Rice, beans, canned soup, bread"
                    className="bg-input border-border"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicines">Medicine Units</Label>
                  <Input
                    id="medicines"
                    type="number"
                    value={medicinesUnits}
                    onChange={(e) => setMedicinesUnits(e.target.value)}
                    placeholder="e.g., 50"
                    className="bg-input border-border"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Distribution Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Distribution Details
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="people">Number of People</Label>
                  <Input
                    id="people"
                    type="number"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    placeholder="e.g., 25"
                    className="bg-input border-border"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Duration (Days)</Label>
                  <Input
                    id="days"
                    type="number"
                    value={daysCount}
                    onChange={(e) => setDaysCount(e.target.value)}
                    placeholder="e.g., 7"
                    className="bg-input border-border"
                    min="1"
                    required
                  />
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Quick Calculate</h4>
                  {waterLiters && peopleCount && daysCount && (
                    <div className="text-sm text-muted-foreground">
                      <p>Water per person/day: {(parseFloat(waterLiters) / parseInt(peopleCount) / parseInt(daysCount)).toFixed(1)}L</p>
                      <p className="text-xs mt-1">Minimum recommended: 2L per person per day</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="emergency"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing resources...
                </>
              ) : (
                <>
                  <Droplets className="mr-2 h-4 w-4" />
                  Calculate Distribution
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Plan */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Distribution Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {response.explanation.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-card-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Resource Status */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Resource Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {response.resource_status.map((resource, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {resource.resource === "Water" && <Droplets className="h-4 w-4 text-primary flex-shrink-0" />}
                      {resource.resource === "Food" && <Package className="h-4 w-4 text-warning flex-shrink-0" />}
                      {resource.resource === "Medicine" && <Pill className="h-4 w-4 text-destructive flex-shrink-0" />}
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{resource.resource}</span>
                          <Badge className={getStatusColor(resource.status)}>
                            {getStatusIcon(resource.status)}
                            <span className="ml-1">{resource.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{resource.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RationingPage;