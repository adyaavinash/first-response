import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Globe, User, Shield, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SettingsPage = () => {
  const [language, setLanguage] = useState("en");
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings
    const savedLanguage = localStorage.getItem("app_language") || "en";
    const savedUsername = localStorage.getItem("username") || "User";
    
    setLanguage(savedLanguage);
    setUsername(savedUsername);
  }, []);

  const languages = [
    { value: "en", label: "English", code: "en" },
    { value: "hi", label: "हिन्दी (Hindi)", code: "hi" },
    { value: "ar", label: "العربية (Arabic)", code: "ar" },
    { value: "es", label: "Español (Spanish)", code: "es" },
  ];

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem("app_language", newLanguage);
    
    toast({
      title: "Language updated",
      description: `Interface language changed to ${languages.find(l => l.value === newLanguage)?.label}`,
    });
  };

  const handleSaveSettings = () => {
    localStorage.setItem("app_language", language);
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your FirstResponse toolkit preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language & Localization */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Language & Localization
            </CardTitle>
            <CardDescription>
              Configure your preferred language for the interface and emergency guidance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Interface Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This language will be used for all emergency tools and API responses
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Regional Settings</h4>
              <p className="text-sm text-muted-foreground">
                Language preference will be automatically applied to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• First Aid guidance and instructions</li>
                <li>• Resource rationing calculations</li>
                <li>• Emergency communication analysis</li>
                <li>• System notifications and alerts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-secondary" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and session information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <span className="text-foreground font-medium">{username}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Status</Label>
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-success font-medium">Active & Secure</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Account Actions</h4>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Tools Configuration */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              Emergency Tools Configuration
            </CardTitle>
            <CardDescription>
              Customize how emergency tools behave and display information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Default Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium text-foreground">Auto-translate responses</span>
                      <p className="text-sm text-muted-foreground">Use selected language for all tool responses</p>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-success"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium text-foreground">Show detailed guidance</span>
                      <p className="text-sm text-muted-foreground">Include step-by-step instructions</p>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-success"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium text-foreground">Priority safety warnings</span>
                      <p className="text-sm text-muted-foreground">Highlight critical safety information</p>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-success"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Tool Availability</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-foreground">First Aid Assistant</span>
                    <div className="w-4 h-4 rounded-full bg-success"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-foreground">Resource Rationing</span>
                    <div className="w-4 h-4 rounded-full bg-success"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-foreground">Safe Route Planning</span>
                    <div className="w-4 h-4 rounded-full bg-warning"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-foreground">Flyer Scanner</span>
                    <div className="w-4 h-4 rounded-full bg-success"></div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings}
                variant="emergency"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;