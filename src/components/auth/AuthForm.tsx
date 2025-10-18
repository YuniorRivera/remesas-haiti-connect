import { useState } from "react";
import { z } from "zod";
import { loginSchema, signupSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    try {
      if (isLogin) {
        loginSchema.parse({ email: email.trim(), password });
      } else {
        signupSchema.parse({ 
          email: email.trim(), 
          password, 
          fullName: fullName.trim(), 
          phone: phone.trim() || undefined 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Corrige los errores en el formulario");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // NOTA: Este formulario sigue usando supabase.auth.signInWithPassword()
        // directamente. Para aprovechar el rate limiting de la Edge Function
        // auth-login, se debería migrar a usar la función signIn del hook useAuth.
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Sesión iniciada correctamente");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Redirigiendo...");
      }
    } catch (error: any) {
      toast.error(error.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Ingresa tus credenciales para acceder"
            : "Completa los datos para registrarte"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Juan Pérez"
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 809-555-0123"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          minLength={8}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        {!isLogin && !errors.password && (
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres, con mayúscula, minúscula y número
          </p>
        )}
      </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Procesando..." : isLogin ? "Entrar" : "Registrarse"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
