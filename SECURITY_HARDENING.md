# Security Hardening Implementation

Este documento detalla las medidas de seguridad implementadas en el sistema.

## 🔒 Seguridad de Transporte

### HTTPS/TLS
- **Configuración**: HTTPS habilitado automáticamente por Lovable en producción
- **Certificados**: SSL/TLS gestionado automáticamente con renovación automática
- **Redirección**: Todo el tráfico HTTP redirige a HTTPS

### HSTS (HTTP Strict Transport Security)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- **Duración**: 1 año (31536000 segundos)
- **Subdominios**: Incluidos
- **Preload**: Habilitado para inclusión en listas de navegadores

## 🛡️ Headers de Seguridad

### Implementados en Edge Functions y Aplicación

| Header | Valor | Protección |
|--------|-------|------------|
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Filtro XSS del navegador |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control de referrer |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Restringe APIs del navegador |

### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://unpkg.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-ancestors 'none';
```

**Nota**: `unsafe-inline` y `unsafe-eval` están permitidos temporalmente para Vite. En producción deberían eliminarse.

## 🚦 Rate Limiting

### Login Rate Limiting
```typescript
// 5 intentos por 15 minutos por IP
windowMs: 15 * 60 * 1000  // 15 minutos
maxRequests: 5
```

**Implementación**: `supabase/functions/_shared/rateLimiter.ts`

**Respuesta cuando se excede**:
```json
{
  "error": "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos."
}
```

Headers de respuesta:
- `X-RateLimit-Limit`: Límite máximo
- `X-RateLimit-Remaining`: Intentos restantes
- `X-RateLimit-Reset`: Timestamp de reset

### Mejoras Recomendadas
Para producción, reemplazar el rate limiter en memoria con:
- **Redis**: Para múltiples instancias
- **Upstash**: Redis serverless compatible con edge functions
- **Cloudflare Rate Limiting**: A nivel de CDN

## 🧹 Sanitización de Inputs

### Funciones de Sanitización (`src/lib/sanitize.ts`)

| Función | Uso | Descripción |
|---------|-----|-------------|
| `sanitizeName()` | Nombres de personas | Solo letras, espacios, acentos |
| `sanitizePhone()` | Números telefónicos | Solo dígitos, +, -, (), espacios |
| `sanitizeDocumentNumber()` | Cédulas, pasaportes | Solo alfanuméricos y guiones |
| `sanitizeText()` | Texto general | Remueve todos los tags HTML |
| `sanitizeHtml()` | Contenido con HTML | Remueve scripts y event handlers |
| `sanitizeFilename()` | Nombres de archivo | Previene directory traversal |
| `sanitizeAmount()` | Montos | Solo números y punto decimal |
| `sanitizeUrl()` | URLs | Valida protocolo http/https |

### Integración con Validación

Todas las funciones de sanitización están integradas con Zod schemas:

```typescript
emisor_nombre: z.string()
  .trim()
  .transform(sanitizeName)  // ← Sanitización automática
  .pipe(z.string()
    .min(3)
    .max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
  )
```

## 📎 Validación de Archivos KYC

### Tipos Permitidos
```typescript
const KYC_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];
```

### Tamaño Máximo
```typescript
const KYC_MAX_SIZE_MB = 5;  // 5 MB
```

### Validaciones Implementadas
1. **Tipo de archivo**: Verificación de MIME type
2. **Tamaño**: Límite de 5MB
3. **Nombre de archivo**: Sanitización para prevenir path traversal
4. **Vista previa**: Solo para imágenes (no para PDFs)

### Componente
```typescript
import { KycFileUpload } from "@/components/KycFileUpload";

<KycFileUpload
  onFileSelect={handleFileSelect}
  label="Documento de Identidad"
/>
```

## 👥 Control de Acceso Basado en Roles

### Campos Solo Admin (`src/lib/roleUtils.ts`)

Campos ocultos para usuarios con rol de tienda:
```typescript
const AGENT_HIDDEN_FIELDS = [
  'platform_gross_margin_dop',
  'platform_commission_dop',
  'fx_spread_rev_dop',
  'partner_cost_dop_equiv',
  'acquiring_cost_dop',
  'margen_plataforma',
];
```

### Componente AdminOnlyField

```typescript
import { AdminOnlyField } from "@/components/AdminOnlyField";

<AdminOnlyField isAdmin={isAdmin}>
  <div>Contenido solo para administradores</div>
</AdminOnlyField>
```

### Datos Sensibles Enmascarados

```typescript
import { SensitiveData } from "@/components/AdminOnlyField";

<SensitiveData 
  value={user.documento} 
  canView={canViewSensitiveData}
/>
// Output para no-admin: ****4567
```

## 🔐 Mejores Prácticas de Seguridad

### ✅ Implementadas
- [x] HTTPS/TLS en producción
- [x] HSTS con preload
- [x] Security headers completos
- [x] Rate limiting en login
- [x] Sanitización de todos los inputs
- [x] Validación de archivos KYC
- [x] Control de acceso basado en roles
- [x] Enmascaramiento de datos sensibles
- [x] CSP configurado
- [x] Protección contra clickjacking
- [x] Protección XSS
- [x] Validación client-side y server-side

### 📋 Pendientes para Producción
- [ ] Rate limiting con Redis/Upstash
- [ ] Logging centralizado de eventos de seguridad
- [ ] Alertas automáticas de intentos de login fallidos
- [ ] 2FA para usuarios admin
- [ ] Rotación automática de tokens
- [ ] Auditoría de acceso a datos sensibles
- [ ] Honeypot fields en formularios
- [ ] CAPTCHA en login después de X intentos
- [ ] Gestión de sesiones con timeout
- [ ] Backup encriptado de datos sensibles

## 🧪 Testing de Seguridad

### Headers
```bash
# Verificar headers de seguridad
curl -I https://tu-dominio.lovable.app

# Buscar:
# - Strict-Transport-Security
# - X-Content-Type-Options
# - X-Frame-Options
```

### Rate Limiting
```bash
# Intentar 6 logins rápidos con la misma IP
for i in {1..6}; do
  curl -X POST https://tu-dominio.lovable.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# El 6to debe retornar 429
```

### Input Sanitization
```javascript
// Intentar XSS
const maliciousInput = "<script>alert('XSS')</script>";
// Debe ser sanitizado a: ""
```

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Supabase Security Guide](https://supabase.com/docs/guides/security)

## 🚨 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, repórtala de inmediato a:
- Email: security@remesasrd.com
- **NO** la publiques públicamente

---

**Última actualización**: 2025-01-18  
**Versión**: 1.0
