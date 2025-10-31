import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { loginSchema, signupSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { checkPasswordLeak, getPasswordLeakMessage } from "@/lib/passwordLeakCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function AuthForm() {
  const navigate = useNavigate();
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
        // Check password leak for signup
        const leakCheck = await checkPasswordLeak(password);
        if (leakCheck.isCompromised) {
          const message = getPasswordLeakMessage(leakCheck.count);
          setErrors({ password: message });
          toast.error(message);
          setLoading(false);
          return;
        }

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
        
        // Wait for profile creation and check roles
        setTimeout(async () => {
          try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser) {
              const { data: roles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', currentUser.id);
              
              if (!roles || roles.length === 0) {
                navigate('/onboarding');
              } else {
                navigate('/dashboard');
              }
            }
          } catch (err) {
            console.error("Error checking roles:", err);
            navigate('/onboarding');
          }
        }, 1500);
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
