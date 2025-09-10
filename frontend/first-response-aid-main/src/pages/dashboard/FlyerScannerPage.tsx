import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ScanLine, Upload, Image as ImageIcon, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ScanResponse {
  extracted_text: string;
  verdict: "Verified ✅" | "Suspicious ⚠" | "Error" | string; 
  reason: string;
}

const FlyerScannerPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ScanResponse | null>(null);
  const [error, setError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResponse(null);
      setError("");
    } else {
      setError("Please select a valid image file (PNG, JPG, JPEG, GIF)");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragActive(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const authToken = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const apiResponse = await fetch(`${API_BASE_URL}/misinformation`,{
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}` },
        body: formData,
      });

      if (apiResponse.ok) {
        const data: ScanResponse = await apiResponse.json();
        setResponse(data);
        toast({
          title: "Analysis complete",
          description: data.verdict.includes("Suspicious") ? "Potential misinformation detected" : "Content appears legitimate",
        });
      } else {
        setError("Failed to analyze image. Please try again.");
      }
    } catch (error) {
      setError("An error occurred while connecting to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setResponse(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScanLine className="h-8 w-8 text-warning" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flyer Scanner</h1>
          <p className="text-muted-foreground">Detect misinformation in emergency communications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-warning" />Upload Image</CardTitle>
            <CardDescription>Upload a flyer, poster, or document image for misinformation analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${ isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50" }`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img src={previewUrl} alt="Selected file preview" className="max-w-full max-h-48 rounded-lg object-contain" />
                      <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={clearFile}><X className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedFile?.name} ({(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium text-foreground">Drag and drop your image here</p>
                      <p className="text-sm text-muted-foreground">Or click to browse files</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <input type="file" id="file-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file-upload"><Button variant="outline" className="w-full cursor-pointer" asChild><span><Upload className="mr-2 h-4 w-4" />Choose Image File</span></Button></label>
                <p className="text-xs text-muted-foreground mt-2">Supported formats: PNG, JPG, JPEG (Max 10MB)</p>
              </div>
              {error && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>)}
              <Button onClick={handleSubmit} variant="emergency" className="w-full" disabled={isLoading || !selectedFile}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing image...</>) : (<><ScanLine className="mr-2 h-4 w-4" />Scan for Misinformation</>)}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5 text-warning" />Analysis Results</CardTitle>
            <CardDescription>Misinformation detection and content analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Extracted Text</h4>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">{response.extracted_text || "No text detected in image"}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Analysis Verdict</h4>
                  {/* FIX: Simplified rendering logic based on the verdict string */}
                  <Alert 
                    variant={response.verdict.includes("Suspicious") ? "destructive" : "default"}
                    className={!response.verdict.includes("Suspicious") ? "border-success bg-success/10" : ""}
                  >
                    {response.verdict.includes("Suspicious") ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-success" />}
                    <AlertDescription>
                      <div className="space-y-2">
                        <span className="font-medium">{response.verdict}</span>
                        <p className="text-sm">{response.reason}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <ScanLine className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Upload an image to begin analysis</p>
                <p className="text-sm">Results will appear here once processing is complete</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlyerScannerPage;