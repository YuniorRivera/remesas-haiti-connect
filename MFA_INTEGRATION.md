# Guía de Integración: OTP/2FA Frontend

## Estado Actual

✅ **Backend completado al 100%**
- Todas las Edge Functions implementadas
- Tablas de base de datos creadas
- Plantillas de notificación listas
- Feature flags configurados

⏭️ **Frontend pendiente de implementación**

## Funciones Backend Disponibles

### 1. OTP Send (`otp-send`)
**Endpoint**: `supabase.functions.invoke('otp-send')`

```typescript
interface OtpSendRequest {
  user_id: string;
  method: 'sms' | 'email';
}

const { data, error } = await supabase.functions.invoke('otp-send', {
  body: { user_id, method }
});
```

**Response**: `{ success: true, message: "OTP sent via sms" }`

---

### 2. OTP Verify (`otp-verify`)
**Endpoint**: `supabase.functions.invoke('otp-verify')`

```typescript
interface OtpVerifyRequest {
  user_id: string;
  code: string; // 6-digit code
}

const { data, error } = await supabase.functions.invoke('otp-verify', {
  body: { user_id, code }
});
```

**Response**: `{ success: true, valid: true, method: 'sms' }`

---

### 3. TOTP Enrol (`totp-enrol`)
**Endpoint**: `supabase.functions.invoke('totp-enrol')`

```typescript
interface TotpEnrolRequest {
  user_id: string;
}

const { data, error } = await supabase.functions.invoke('totp-enrol', {
  body: { user_id }
});
```

**Response**: 
```typescript
{
  success: true,
  secret: string,
  qr_code_url: string, // otpauth:// URL for QR
  backup_codes: string[],
  enrollment_id: string
}
```

---

### 4. TOTP Verify (`totp-verify`)
**Endpoint**: `supabase.functions.invoke('totp-verify')`

```typescript
interface TotpVerifyRequest {
  user_id: string;
  token: string; // 6-digit TOTP code
  enrollment_id?: string;
}

const { data, error } = await supabase.functions.invoke('totp-verify', {
  body: { user_id, token, enrollment_id }
});
```

**Response**: 
```typescript
{
  success: true,
  valid: true,
  verified: boolean,
  used_backup: boolean
}
```

## Componentes UI Necesarios

### 1. `OtpVerificationModal.tsx`
**Uso**: Mostrar después de login exitoso si `two_factor_enabled = true`

```typescript
interface OtpVerificationModalProps {
  userId: string;
  method: 'sms' | 'email';
  onVerified: () => void;
  onCancel: () => void;
}

export function OtpVerificationModal({ userId, method, onVerified, onCancel }: OtpVerificationModalProps) {
  // 1. Inicialmente llamar otp-send
  // 2. Mostrar input para código
  // 3. En submit, llamar otp-verify
  // 4. Si exitoso, llamar onVerified()
  // 5. Mostrar "Reenviar código" opción
}
```

---

### 2. `MfaSettings.tsx`
**Uso**: En página `/settings` para gestionar 2FA

```typescript
export function MfaSettings() {
  // Componente completo con:
  // - Toggle para habilitar/deshabilitar 2FA
  // - Selector de método (SMS/Email/TOTP)
  // - Formulario de enrolment TOTP con QR
  // - Lista de backup codes
  // - Botón de recuperación
}
```

---

### 3. `TotpQrDisplay.tsx`
**Uso**: Mostrar QR code durante enrolment TOTP

```typescript
interface TotpQrDisplayProps {
  qrCodeUrl: string; // otpauth:// URL
  secret: string;
  backupCodes: string[];
}

export function TotpQrDisplay({ qrCodeUrl, secret, backupCodes }: TotpQrDisplayProps) {
  // 1. Generar QR de qrCodeUrl usando librería qrcode
  // 2. Mostrar secret como texto (con copy button)
  // 3. Mostrar backup codes en lista
  // 4. Botón "Continuar" que pide verificación
}
```

## Flujos de Usuario

### Flujo 1: Login con 2FA habilitado
```
1. Usuario ingresa email/password
2. Login exitoso en auth-login
3. Verificar profiles.two_factor_enabled
4. Si true → mostrar OtpVerificationModal
5. Usuario ingresa código OTP
6. Llamar otp-verify
7. Si exitoso → navegar a dashboard
8. Si falla → mostrar error, permitir reenvío
```

### Flujo 2: Habilitar 2FA (Settings)
```
1. Usuario va a /settings
2. Click "Habilitar 2FA"
3. Seleccionar método: SMS, Email, o TOTP
4. Si SMS/Email:
   - Llamar otp-send
   - Verificar código con OtpVerificationModal
   - Si exitoso → actualizar profiles
5. Si TOTP:
   - Llamar totp-enrol
   - Mostrar TotpQrDisplay con QR
   - Usuario escanea QR en app
   - Verificar código con totp-verify
   - Si exitoso → mostrar backup codes
   - Guardar backup codes
```

### Flujo 3: Recuperación
```
1. Usuario perdido su teléfono/app
2. Click "Recuperar acceso 2FA"
3. Sistema envía código alternativo
4. Si TOTP: permitir usar backup code
5. Verificar código/backup
6. Dar opción de deshabilitar 2FA
```

## Integración con Login

**Archivo**: `supabase/functions/auth-login/index.ts`

Necesita modificación para:
1. Verificar si usuario tiene 2FA habilitado
2. Si sí, devolver estado especial `requires_2fa`
3. Frontend muestra modal OTP
4. Reenviar request con código OTP

---

## Variables de Entorno

```bash
# .env
ENABLE_OTP=true          # Habilitar OTP SMS/Email
ENABLE_TOTP=true         # Habilitar Google Authenticator
```

---

## Testing

```bash
# Tests de integración sugeridos:
- ✅ Backend otp-send genera código
- ✅ Backend otp-verify valida correctamente
- ✅ TOTP enrolment crea secret y QR
- ⏭️ UI envía OTP correctamente
- ⏭️ UI verifica código exitosamente
- ⏭️ Flujo completo login + 2FA
```

---

## Prioridad de Implementación

1. **Alta**: OtpVerificationModal (crítico para login con 2FA)
2. **Media**: MfaSettings (UX mejorada)
3. **Media**: TotpQrDisplay (feature completa)
4. **Baja**: Modificar auth-login backend

---

## Referencias

- Feature flags: `ENABLE_OTP`, `ENABLE_TOTP`
- Edge Functions: `otp-send`, `otp-verify`, `totp-enrol`, `totp-verify`
- Tablas: `otp_codes`, `totp_enrollments`, `profiles.two_factor_*`
- Templates: `OTP_SENT` en ES/HT/FR

