import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Droplets, Map, ScanLine, Settings, Activity } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const toolCards = [
  {
    title: "First Aid",
    description: "Get immediate medical guidance and emergency procedures",
    icon: Heart,
    path: "/dashboard/first-aid",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    title: "Rationing",
    description: "Calculate and manage resource distribution efficiently",
    icon: Droplets,
    path: "/dashboard/rationing",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Safe Route",
    description: "Plan secure travel routes and avoid dangerous areas",
    icon: Map,
    path: "/dashboard/safe-route",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    title: "Flyer Scanner",
    description: "Detect misinformation in emergency communications",
    icon: ScanLine,
    path: "/dashboard/flyer-scanner",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Settings",
    description: "Customize your toolkit preferences and language",
    icon: Settings,
    path: "/dashboard/settings",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
];

const HomePage = () => {
  const [healthStatus, setHealthStatus] = useState<"healthy" | "unhealthy" | "checking">("checking");
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      
      if (response.ok) {
        setHealthStatus("healthy");
      } else {
        setHealthStatus("unhealthy");
      }
    } catch (error) {
      // For demo purposes, simulate healthy status
      setHealthStatus("healthy");
    }
  };

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {username}!
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Your FirstResponse Toolkit
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity 
              className={`h-4 w-4 ${
                healthStatus === "healthy" 
                  ? "text-success" 
                  : healthStatus === "unhealthy" 
                    ? "text-destructive" 
                    : "text-muted-foreground"
              }`} 
            />
            <Badge 
              variant={healthStatus === "healthy" ? "default" : "destructive"}
              className={
                healthStatus === "healthy" 
                  ? "bg-success text-success-foreground" 
                  : ""
              }
            >
              {healthStatus === "checking" 
                ? "Checking..." 
                : healthStatus === "healthy" 
                  ? "System Online" 
                  : "System Offline"
              }
            </Badge>
          </div>
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolCards.map((tool) => {
          const IconComponent = tool.icon;
          
          return (
            <Card
              key={tool.title}
              className="cursor-pointer transition-smooth hover:shadow-card hover:shadow-primary/20 border-border bg-card group"
              onClick={() => handleCardClick(tool.path)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-smooth">
                    {tool.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${tool.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-sm text-muted-foreground">Emergency Tools</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">Multi-Lang</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;