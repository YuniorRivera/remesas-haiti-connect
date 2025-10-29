# Guía de Deployment

## Configuración de Dominio Personalizado

### 1. Conectar Dominio en Lovable

1. Ve a tu proyecto en [Lovable](https://lovable.dev/projects/8f716265-0cb6-48c6-a07c-d524bdad17fa)
2. Navega a **Project > Settings > Domains**
3. Click en **Connect Domain**
4. Ingresa tu dominio: `kobcash.net`
5. Sigue las instrucciones para configurar DNS

### 2. Variables de Entorno en Supabase Functions

Una vez que `kobcash.net` esté conectado y funcionando, configura `ALLOWED_ORIGINS`:

**En Supabase Dashboard:**
1. Ve a **Project Settings > Edge Functions > Secrets**
2. Agrega una nueva variable:
   - **Name**: `ALLOWED_ORIGINS`
   - **Value**: `https://kobcash.net,https://www.kobcash.net`
   
   **Configuración recomendada para producción:**
   ```
   https://kobcash.net,https://www.kobcash.net
   ```
   
   **Si tienes ambiente de staging:**
   ```
   https://kobcash.net,https://www.kobcash.net,https://staging.kobcash.net
   ```

### 3. Variables de Entorno del Cliente (Vite)

Las siguientes variables se configuran automáticamente en Lovable, pero puedes verificarlas:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-key-publica
```

### 4. Verificación Post-Deployment

Después de conectar `kobcash.net`, verifica:

- ✅ Acceso HTTPS funciona: `https://kobcash.net` y `https://www.kobcash.net`
- ✅ Headers de seguridad presentes (usa browser devtools > Network)
- ✅ CORS funciona correctamente (verifica requests desde tu dominio)
- ✅ Cookies `csrf-token` se establecen correctamente

### 5. Troubleshooting

**CORS errors:**
- Verifica que `ALLOWED_ORIGINS` incluya exactamente: `https://kobcash.net,https://www.kobcash.net`
- Si tu DNS redirige www a la raíz (o viceversa), incluye ambos en la lista
- No uses `http://` en producción, solo `https://`

**Cookies no se guardan:**
- Verifica que el dominio esté en HTTPS
- Revisa que SameSite=Lax sea compatible con tu flujo de navegación

