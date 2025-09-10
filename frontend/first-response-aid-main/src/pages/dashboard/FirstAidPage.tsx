import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Heart, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  action: string;
  how_to: string;
  avoid: string;
}

// FIX: Update interface to reflect both possible API responses
interface FirstAidResponse {
  answer?: string;          // From the real backend
  answer_steps?: string[];  // From the demo data
  checklist?: ChecklistItem[];
}

const FirstAidPage = () => {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<FirstAidResponse | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError("");
    setResponse(null);

    try {
      const authToken = localStorage.getItem("auth_token");
      const apiResponse = await fetch(`/api/first_aid?question=${encodeURIComponent(question)}&lang=${language}`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });

      if (apiResponse.ok) {
        const data: FirstAidResponse = await apiResponse.json();
        setResponse(data);
        toast({
          title: "First aid guidance ready",
          description: "Emergency procedures loaded successfully",
        });
      } else {
        setError("Failed to get first aid guidance. Please try again.");
      }
    } catch (error) {
      // Demo response for development (this part is fine)
      const demoResponse: FirstAidResponse = {
        answer_steps: ["Ensure scene is safe", "Check for responsiveness", "Call for help"],
        checklist: [{ action: "Check Breathing", how_to: "Tilt head back", avoid: "Do not move neck" }]
      };
      setResponse(demoResponse);
      toast({ title: "Demo mode active", description: "Showing sample guidance" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper to get the steps regardless of the source format
  const getAnswerSteps = (res: FirstAidResponse | null): string[] => {
    if (!res) return [];
    if (res.answer_steps) return res.answer_steps; // Use array if it exists
    if (res.answer) return res.answer.split('\n').filter(step => step.trim() !== ''); // Split string if it exists
    return []; // Return empty array otherwise
  }

  const answerSteps = getAnswerSteps(response);

  return (
    <div className="space-y-6">
      {/* ... (Your header and form JSX remains the same) ... */}
        <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-destructive" />
            <div>
                <h1 className="text-3xl font-bold text-foreground">First Aid Assistant</h1>
                <p className="text-muted-foreground">Get immediate medical guidance for emergency situations</p>
            </div>
        </div>
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-destructive" />Emergency Query</CardTitle>
                <CardDescription>Describe the medical emergency or situation requiring first aid</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3 space-y-2">
                            <Label htmlFor="question">Medical Emergency Description</Label>
                            <Input id="question" type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g., Person unconscious and not breathing" className="bg-input border-border" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi">हिन्दी</SelectItem>
                                    <SelectItem value="ar">العربية</SelectItem>
                                    <SelectItem value="es">Español</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {error && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>)}
                    <Button type="submit" variant="emergency" disabled={isLoading || !question.trim()}>
                        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Getting guidance...</>) : (<><Heart className="mr-2 h-4 w-4" />Get First Aid Guidance</>)}
                    </Button>
                </form>
            </CardContent>
        </Card>

      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" />Emergency Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {/* FIX: Use the processed `answerSteps` array */}
                {answerSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">{index + 1}</span>
                    <span className="text-card-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {response.checklist && response.checklist.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Detailed Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>How To</TableHead>
                      <TableHead>Avoid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.checklist.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.action}</TableCell>
                        <TableCell className="text-success">{item.how_to}</TableCell>
                        <TableCell className="text-destructive">{item.avoid}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default FirstAidPage;