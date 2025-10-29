import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { validateKycFile, KYC_ALLOWED_TYPES, KYC_MAX_SIZE_MB } from "@/lib/sanitize";
import { toast } from "sonner";

interface KycFileUploadProps {
  onFileSelect: (file: File) => void;
  label: string;
  accept?: string;
}

export function KycFileUpload({ onFileSelect, label, accept }: KycFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [preview, setPreview] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setPreview("");
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file
    const validation = validateKycFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || "Archivo inválido");
      setFile(null);
      toast.error(validation.error || "Archivo inválido");
      return;
    }

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
    toast.success("Archivo cargado correctamente");
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="kyc-file">{label}</Label>
      
      <div className="flex flex-col gap-2">
        <Input
          id="kyc-file"
          type="file"
          accept={accept || KYC_ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          className="cursor-pointer"
        />
        
        <p className="text-xs text-muted-foreground">
          Formatos permitidos: JPG, PNG, PDF. Tamaño máximo: {KYC_MAX_SIZE_MB}MB
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {file && !error && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm">
            <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </AlertDescription>
        </Alert>
      )}

      {preview && (
        <div className="mt-2 border rounded-lg p-2">
          <img 
            src={preview} 
            alt="Vista previa" 
            className="max-h-48 mx-auto rounded"
          />
        </div>
      )}
    </div>
  );
}
