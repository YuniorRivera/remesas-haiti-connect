import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Legal() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Legal y Privacidad</h1>
        
        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="privacy">Política de Privacidad</TabsTrigger>
            <TabsTrigger value="terms">Términos y Condiciones</TabsTrigger>
          </TabsList>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Política de Privacidad</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h2>1. Información que Recopilamos</h2>
                <p>
                  Recopilamos información personal necesaria para procesar remesas internacionales,
                  incluyendo nombres, identificaciones, direcciones y datos de contacto.
                </p>

                <h2>2. Uso de la Información</h2>
                <p>
                  Utilizamos su información exclusivamente para procesar transacciones, cumplir con
                  regulaciones de AML/KYC y mejorar nuestros servicios.
                </p>

                <h2>3. Protección de Datos</h2>
                <p>
                  Implementamos medidas de seguridad avanzadas para proteger su información personal
                  contra acceso no autorizado, alteración o divulgación.
                </p>

                <h2>4. Compartir Información</h2>
                <p>
                  Solo compartimos información con terceros cuando es necesario para completar
                  transacciones o cuando lo requiere la ley.
                </p>

                <h2>5. Sus Derechos</h2>
                <p>
                  Tiene derecho a acceder, corregir o eliminar su información personal. Contáctenos
                  para ejercer estos derechos.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Términos y Condiciones</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h2>1. Aceptación de Términos</h2>
                <p>
                  Al usar este servicio, acepta estos términos y condiciones en su totalidad.
                </p>

                <h2>2. Servicios de Remesas</h2>
                <p>
                  Facilitamos el envío de dinero desde República Dominicana a Haití. Las tarifas
                  y tipos de cambio se muestran antes de confirmar cada transacción.
                </p>

                <h2>3. Requisitos de Identificación</h2>
                <p>
                  Cumplimos con regulaciones de AML/KYC. Se requiere identificación válida para
                  todas las transacciones.
                </p>

                <h2>4. Límites de Transacción</h2>
                <p>
                  Existen límites diarios y mensuales según regulaciones del Banco Central.
                </p>

                <h2>5. Cancelaciones y Reembolsos</h2>
                <p>
                  Las cancelaciones deben solicitarse antes de que la transacción sea procesada.
                  Los reembolsos están sujetos a políticas específicas.
                </p>

                <h2>6. Responsabilidad</h2>
                <p>
                  No somos responsables por demoras causadas por terceros, información incorrecta
                  proporcionada por el usuario, o circunstancias fuera de nuestro control.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
