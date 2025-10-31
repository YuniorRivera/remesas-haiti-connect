import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  latency?: number;
  message?: string;
}

export default function Status() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    { name: 'Frontend', status: 'healthy' },
    { name: 'Supabase Database', status: 'checking' },
    { name: 'Supabase Auth', status: 'checking' },
    { name: 'Edge Functions', status: 'checking' },
  ]);

  useEffect(() => {
    checkServices();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkServices = async () => {
    // Check Supabase Database
    const dbStart = performance.now();
    try {
      const { error } = await supabase.from('remittances').select('id').limit(1);
      const dbLatency = Math.round(performance.now() - dbStart);
      updateHealthCheck('Supabase Database', error ? 'down' : 'healthy', dbLatency, error?.message);
    } catch (error: any) {
      updateHealthCheck('Supabase Database', 'down', undefined, error?.message);
    }

    // Check Supabase Auth
    const authStart = performance.now();
    try {
      const { error } = await supabase.auth.getSession();
      const authLatency = Math.round(performance.now() - authStart);
      updateHealthCheck('Supabase Auth', error ? 'down' : 'healthy', authLatency, error?.message);
    } catch (error: any) {
      updateHealthCheck('Supabase Auth', 'down', undefined, error?.message);
    }

    // Check Edge Functions
    const funcStart = performance.now();
    try {
      const { error } = await supabase.functions.invoke('csrf', { method: 'GET' });
      const funcLatency = Math.round(performance.now() - funcStart);
      updateHealthCheck('Edge Functions', error ? 'degraded' : 'healthy', funcLatency, error?.message);
    } catch (error: any) {
      updateHealthCheck('Edge Functions', 'degraded', undefined, error?.message);
    }
  };

  const updateHealthCheck = (name: string, status: HealthCheck['status'], latency?: number, message?: string) => {
    setHealthChecks(prev =>
      prev.map(check =>
        check.name === name ? { ...check, status, latency, message } : check
      )
    );
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-600">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="secondary">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
      case 'checking':
        return <Badge variant="outline">Checking</Badge>;
    }
  };

  const overallStatus = healthChecks.every(h => h.status === 'healthy')
    ? 'healthy'
    : healthChecks.some(h => h.status === 'down')
    ? 'down'
    : 'degraded';

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">System Status</CardTitle>
                <CardDescription>
                  Real-time health monitoring of platform services
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(overallStatus)}
                <span className="font-semibold capitalize">{overallStatus}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthChecks.map((check) => (
              <div
                key={check.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-semibold">{check.name}</h3>
                    {check.message && (
                      <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {check.latency && (
                    <span className="text-sm text-muted-foreground">
                      {check.latency}ms
                    </span>
                  )}
                  {getStatusBadge(check.status)}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

