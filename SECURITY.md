# Medidas de Seguridad - Remesas RD-Haití

## Infraestructura y Comunicaciones

### HTTPS y HSTS
- ✅ **Todas las comunicaciones usan HTTPS** (gestionado por Lovable Cloud / Supabase)
- ✅ **HSTS (HTTP Strict Transport Security)** habilitado automáticamente en producción
- ✅ **Cookies con flag Secure** para prevenir transmisión en HTTP
- ✅ **SameSite=Strict** en cookies de sesión para prevenir CSRF

### Rate Limiting
- ✅ **Rate limiting en autenticación** configurado en Supabase Auth
  - Límite: 60 intentos de login por hora por IP
  - Límite: 30 intentos de signup por hora por IP
- ✅ **Protección contra brute force** en endpoints de autenticación
- ⚠️ **Próximamente**: Rate limiting granular por endpoint en edge functions

## Autenticación y Autorización

### Gestión de Contraseñas
- ✅ **Hashing automático con bcrypt** (gestionado por Supabase Auth)
- ✅ **Política de contraseñas fuertes**:
  - Mínimo 8 caracteres
  - Al menos 1 mayúscula
  - Al menos 1 minúscula
  - Al menos 1 número
- ✅ **Refresh tokens seguros** con rotación automática
- ✅ **Auto-confirm email habilitado** (solo para desarrollo; deshabilitar en producción)

### RBAC (Role-Based Access Control)
- ✅ **Sistema de roles implementado**:
  - `admin`: Acceso completo, incluyendo márgenes de plataforma
  - `compliance_officer`: Acceso a KYC/KYB y auditoría
  - `agent_owner`: Propietario de tienda
  - `agent_clerk`: Empleado de tienda
  - `sender`: Usuario cliente
- ✅ **Función `has_role(user_id, role)` con SECURITY DEFINER**
- ✅ **RLS (Row Level Security) en todas las tablas**:
  - Usuarios solo ven sus propios datos
  - Agentes solo ven transacciones de su tienda
  - Admins y compliance tienen acceso completo
  - Campos sensibles (márgenes) ocultos a usuarios no autorizados

## Validación y Sanitización de Inputs

### Validación Client-Side
- ✅ **Esquemas Zod** para todas las entradas de usuario:
  - Auth: email, password, fullName, phone
  - Remesas: datos de emisor, beneficiario, montos
- ✅ **Límites de longitud** en todos los campos de texto
- ✅ **Regex patterns** para formatos específicos (teléfonos, documentos)
- ✅ **Sanitización automática** con `.trim()` en strings

### Validación Server-Side
- ✅ **Validación duplicada en edge functions**
- ✅ **Límites de monto**:
  - Mínimo: 100 DOP
  - Máximo: 1,000,000 DOP
- ✅ **Encoding seguro** para parámetros en URLs externas
- ⚠️ **Nunca usar `dangerouslySetInnerHTML`** con contenido de usuario

## Detección de Fraude

### Límites Implementados
- ✅ **Transacciones por día por emisor**: Máximo 10
- ✅ **Monto diario por emisor**: Máximo 500,000 DOP
- ✅ **Monto mensual por emisor**: Máximo 2,000,000 DOP
- ✅ **Transacciones al mismo beneficiario**: Máximo 3 por día
- ✅ **Tiempo mínimo entre transacciones**: 2 minutos
- ✅ **Velocidad de transacciones**: Máximo 5 por hora
- ✅ **Detección de montos redondos sospechosos**: >= 50,000 DOP múltiplo de 10,000

### Sistema de Riesgo
- ✅ **Edge function `fraud-detection`** con 3 niveles de riesgo:
  - `low`: Sin banderas, permitir
  - `medium`: 1-2 banderas, advertir
  - `high`: >= 3 banderas o límites críticos, bloquear
- ✅ **Auditoría automática** en `audit_log` para actividad sospechosa
- ✅ **Flags detallados** para revisión manual

## Auditoría y Logging

### Tabla `audit_log`
- ✅ **Registro de todas las acciones críticas**:
  - Creación/modificación de remesas
  - Cambios de estado de transacciones
  - Eventos de fraude
  - Acciones administrativas
- ✅ **Campos capturados**:
  - `actor_user_id`: Quien ejecuta la acción
  - `entity` y `entity_id`: Qué se modifica
  - `action`: Tipo de acción
  - `details`: Metadata JSON
  - `ip`: Dirección IP de origen
  - `created_at`: Timestamp
- ✅ **Solo admins pueden leer audit_log** (RLS policy)

### Tabla `remittance_events`
- ✅ **Timeline de eventos por remesa**:
  - CREATED, QUOTED, CONFIRMED, SENT, PAID, SETTLED, FAILED, REFUNDED
- ✅ **Tracking de actor y metadata**
- ✅ **Acceso basado en roles** (RLS policy)

## Gestión de Secretos

### Entornos
- ✅ **Variables de entorno separadas** por ambiente (dev/staging/prod)
- ✅ **Secretos gestionados por Lovable Cloud**:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY` (pública)
  - `SUPABASE_SERVICE_ROLE_KEY` (secreta, solo edge functions)
- ✅ **NUNCA exponer service role key en cliente**
- ✅ **NUNCA hacer commit de secretos** (archivo `.env` en `.gitignore`)

### Best Practices
- ✅ **Rotar secretos regularmente** (especialmente service role key)
- ✅ **Usar environment-specific configs** en edge functions
- ⚠️ **Próximamente**: Integración con servicios de pago (MonCash, SPIH) usando API keys encriptadas

## Hardening Adicional

### Code Security
- ✅ **Validación de inputs exhaustiva** con Zod
- ✅ **Prepared statements implícitos** (Supabase previene SQL injection)
- ✅ **CORS configurado correctamente** en edge functions
- ✅ **CSP (Content Security Policy)** recomendado en headers HTTP
- ⚠️ **Próximamente**: SRI (Subresource Integrity) para CDN assets

### Git y Deploy
- ⚠️ **Recomendado**: Firma de commits con GPG
- ⚠️ **Recomendado**: Branch protection en producción
- ⚠️ **Recomendado**: CI/CD con tests de seguridad (SAST/DAST)

### Compliance
- ✅ **KYC/KYB verification** con estados: pending, approved, rejected
- ✅ **Documentos almacenados de forma segura** (URLs encriptadas)
- ✅ **Proceso de revisión manual** para compliance officers
- ✅ **GDPR/CCPA ready**: Datos de usuario controlados con RLS

## Checklist de Seguridad para Producción

Antes de lanzar a producción, verificar:

- [ ] **Deshabilitar auto-confirm email** en Supabase Auth
- [ ] **Configurar Site URL y Redirect URLs** correctos
- [ ] **Habilitar MFA (2FA)** para cuentas admin
- [ ] **Rotar todas las API keys y secretos**
- [ ] **Configurar alertas de monitoreo** (Sentry, LogRocket)
- [ ] **Revisar todas las RLS policies** manualmente
- [ ] **Hacer penetration testing** básico
- [ ] **Configurar backups automáticos** de base de datos
- [ ] **Documentar plan de respuesta a incidentes**
- [ ] **Configurar rate limiting estricto** en producción
- [ ] **Habilitar WAF (Web Application Firewall)** si disponible
- [ ] **Revisar permisos de CORS** en edge functions

## Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor:

1. **NO la publiques públicamente**
2. Envía un reporte privado al equipo de seguridad
3. Incluye pasos para reproducir el problema
4. Espera confirmación antes de divulgar

---

**Última actualización**: 2025-10-16  
**Versión**: 1.0  
**Responsable**: Equipo de Seguridad Remesas RD-Haití
