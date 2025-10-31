import { Shield, Lock, Server, Globe, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Security() {
  const { t, locale } = useLocale();

  const isSecureConnection = window.location.protocol === 'https:';

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="flex justify-center mb-4">
              {isSecureConnection ? (
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
                  <Shield className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-6">
                  <AlertTriangle className="h-16 w-16 text-amber-600 dark:text-amber-400" />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {isSecureConnection ? "Conexión Segura" : "Conexión No Segura"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isSecureConnection 
                ? "Tu conexión está protegida con encriptación TLS/SSL."
                : "⚠️ Esta conexión no es segura. Por favor, usa HTTPS."}
            </p>
          </div>
        </header>

        <main className="container mx-auto p-6 space-y-6 max-w-4xl">
          {/* Security Status */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Estado de Seguridad
              </CardTitle>
              <CardDescription>Información sobre la seguridad de tu conexión actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">Protocolo de Conexión:</span>
                <Badge className={isSecureConnection ? "bg-green-500" : "bg-red-500"}>
                  {window.location.protocol.toUpperCase()}
                </Badge>
              </div>
              {isSecureConnection && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Conexión cifrada con TLS/SSL (HTTPS)</span>
                  </div>
                  <div className="flex items-start gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Todos tus datos están encriptados en tránsito</span>
                  </div>
                  <div className="flex items-start gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Protegido contra interceptación de datos</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Protecciones Implementadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">HTTPS/TLS</div>
                    <div className="text-sm text-muted-foreground">
                      Todo el tráfico encriptado punto a punto
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">HSTS</div>
                    <div className="text-sm text-muted-foreground">
                      HTTP Strict Transport Security activado
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">CSRF Protection</div>
                    <div className="text-sm text-muted-foreground">
                      Tokens anti-forgery en todas las peticiones
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Rate Limiting</div>
                    <div className="text-sm text-muted-foreground">
                      Protección contra ataques de fuerza bruta
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Secure Cookies</div>
                    <div className="text-sm text-muted-foreground">
                      HttpOnly, Secure, SameSite=Strict
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">CORS Restringido</div>
                    <div className="text-sm text-muted-foreground">
                      Control de acceso cross-origin configurado
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Headers de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">X-Frame-Options</div>
                    <div className="text-sm text-muted-foreground">
                      Protección contra clickjacking
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">X-Content-Type-Options</div>
                    <div className="text-sm text-muted-foreground">
                      Previene MIME type sniffing
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">X-XSS-Protection</div>
                    <div className="text-sm text-muted-foreground">
                      Protección contra XSS
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Content-Security-Policy</div>
                    <div className="text-sm text-muted-foreground">
                      Política de seguridad de contenido
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Referrer-Policy</div>
                    <div className="text-sm text-muted-foreground">
                      Control de información de referrer
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Permissions-Policy</div>
                    <div className="text-sm text-muted-foreground">
                      Restricción de features del navegador
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How HTTPS Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                ¿Cómo Funciona HTTPS?
              </CardTitle>
              <CardDescription>
                Entendiendo la encriptación de tu conexión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm">
                  <strong>HTTPS (HyperText Transfer Protocol Secure)</strong> es la versión segura de HTTP. 
                  Utiliza <strong>TLS/SSL</strong> para encriptar toda la comunicación entre tu navegador y nuestros servidores.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-base mb-2">Cómo te Protege:</h4>
                  <ul className="space-y-2 text-sm list-disc list-inside">
                    <li><strong>Encriptación:</strong> Tus datos se convierten en código que solo tú y kobcash pueden leer</li>
                    <li><strong>Autenticación:</strong> Verificamos que estés realmente conectado a kobcash, no a un sitio falso</li>
                    <li><strong>Integridad:</strong> Detectamos si alguien modifica tus datos durante la transmisión</li>
                    <li><strong>Privacidad:</strong> Terceros no pueden ver qué páginas visitas ni qué datos envías</li>
                  </ul>
                </div>
                <p className="text-sm">
                  🔒 <strong>Tu información está segura:</strong> Contraseñas, datos bancarios, documentos personales 
                  y todas las transacciones viajan completamente encriptadas usando estándares de nivel bancario.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <CheckCircle2 className="h-5 w-5" />
                Mejores Prácticas de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2 text-green-900 dark:text-green-100">
                <p>✅ Siempre verifica el candado 🔒 en la barra de direcciones</p>
                <p>✅ Nunca compartas tus credenciales de acceso</p>
                <p>✅ Cierra sesión cuando uses dispositivos compartidos</p>
                <p>✅ Mantén tu navegador actualizado</p>
                <p>✅ Usa contraseñas fuertes y únicas</p>
                <p>✅ Activa verificación en dos pasos si está disponible</p>
                <p>✅ Reporta inmediatamente cualquier actividad sospechosa</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppLayout>
  );
}

