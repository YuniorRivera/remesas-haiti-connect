# Referencia Rápida: Variables de Entorno Supabase

## 🔐 Para Configurar en Supabase Dashboard

**Ubicación:** Project Settings > Edge Functions > Secrets

### Variable: `ALLOWED_ORIGINS`

```
https://kobcash.net,https://www.kobcash.net
```

**Explicación:**
- Separa los orígenes con comas (sin espacios después de la coma)
- Solo usa HTTPS en producción
- Incluye tanto la versión con `www` como sin `www`

**Para ambiente de staging (opcional):**
```
https://kobcash.net,https://www.kobcash.net,https://staging.kobcash.net
```

---

## ✅ Checklist Post-Configuración

Una vez configurado `ALLOWED_ORIGINS`:

- [ ] Verificar que `https://kobcash.net` carga correctamente
- [ ] Verificar que `https://www.kobcash.net` carga correctamente (si aplica)
- [ ] Probar login desde el dominio
- [ ] Verificar que no hay errores CORS en la consola del navegador
- [ ] Verificar que las cookies `csrf-token` se establecen correctamente

---

**Ver guía completa:** [DEPLOY.md](./DEPLOY.md)

