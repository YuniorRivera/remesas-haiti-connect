import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileJson } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Zod schema para validar datos de reconciliación
const reconciliationItemSchema = z.object({
  reference_code: z.string().optional(),
  transaction_id: z.string().optional(),
  amount: z.number().positive("El monto debe ser positivo"),
  date: z.string().datetime("Fecha debe estar en formato ISO 8601"),
}).refine(
  (data) => data.reference_code || data.transaction_id,
  { message: "Debe incluir reference_code o transaction_id" }
);

const reconciliationDataSchema = z.array(reconciliationItemSchema).min(1, "Los datos deben contener al menos un item");

interface ReconciliationUploadProps {
  onComplete: () => void;
}

export function ReconciliationUpload({ onComplete }: ReconciliationUploadProps) {
  const [source, setSource] = useState<"BANK" | "PAYOUT">("BANK");
  const [jsonData, setJsonData] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setJsonData(JSON.stringify(parsed, null, 2));
      } catch {
        toast.error("Error al leer archivo JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!jsonData.trim()) {
      toast.error("Ingresa datos JSON");
      return;
    }

    setLoading(true);
    try {
      const parsedData = JSON.parse(jsonData);
      
      // Validar con Zod schema
      const validationResult = reconciliationDataSchema.safeParse(parsedData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(e => e.message).join(", ");
        throw new Error(`Datos inválidos: ${errors}`);
      }

      const data = validationResult.data;

      const { data: result, error } = await supabase.functions.invoke('reconciliation-process', {
        body: {
          source,
          data,
          file_ref: `manual_${new Date().toISOString()}`,
        },
      });

      if (error) throw error;

      toast.success(`Reconciliación procesada: ${result.summary.matched} coincidencias, ${result.summary.unmatched} sin coincidir`);
      setJsonData("");
      onComplete();
    } catch (error) {
      console.error('Error processing reconciliation:', error);
      
      // Mensajes de error más descriptivos
      let errorMessage = "Error al procesar reconciliación";
      if (error instanceof SyntaxError) {
        errorMessage = "Formato JSON inválido. Verifica la sintaxis.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Cargar Datos de Reconciliación
        </CardTitle>
        <CardDescription>
          Sube un archivo JSON o pega los datos manualmente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Fuente de Datos</Label>
          <Select value={source} onValueChange={(v) => setSource(v as "BANK" | "PAYOUT")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BANK">Banco (Ingresos)</SelectItem>
              <SelectItem value="PAYOUT">Payout Partner (Egresos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Archivo JSON</Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar Archivo
                </span>
              </Button>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Datos JSON</Label>
          <Textarea
            placeholder='[{"reference_code": "REM-123", "amount": 5000, "date": "2025-01-15T10:00:00Z"}]'
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Formato esperado: Array de objetos con reference_code/transaction_id, amount, date
          </p>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={loading || !jsonData.trim()}
          className="w-full"
        >
          {loading ? "Procesando..." : "Procesar Reconciliación"}
        </Button>
      </CardContent>
    </Card>
  );
}
