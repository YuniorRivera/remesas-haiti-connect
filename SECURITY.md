# Seguridad de la Aplicación

## Autenticación y Sesiones

### Cookies httpOnly Seguras
- Lovable Cloud (Supabase) maneja automáticamente las cookies de sesión con las siguientes características:
  - **httpOnly**: Las cookies no son accesibles desde JavaScript del cliente
  - **Secure**: Solo se transmiten sobre HTTPS en producción
  - **SameSite=Lax**: Protección contra CSRF en la mayoría de casos
  - **Path=/**: Disponibles en toda la aplicación

### Tokens de Refresh
- Los tokens de refresh se rotan automáticamente por Supabase
- No se almacenan en localStorage ni sessionStorage
- La gestión completa es server-side

### Protección CSRF
Supabase implementa protección CSRF nativa mediante:
- Cookies SameSite que previenen ataques cross-site
- Validación de origen en requests
- No es necesario implementar tokens CSRF adicionales para operaciones estándar

Para endpoints personalizados que requieran protección adicional, se puede implementar:
```typescript
// Ejemplo de validación de origen en edge function
const origin = req.headers.get('origin');
const allowedOrigins = [process.env.VITE_SUPABASE_URL];
if (!allowedOrigins.includes(origin)) {
  return new Response('Forbidden', { status: 403 });
}
```

## Control de Acceso Basado en Roles (RBAC)

### Arquitectura de Roles
- Roles separados en tabla `user_roles` (no en perfil de usuario)
- Validación server-side mediante RLS policies
- Función `has_role()` con SECURITY DEFINER para verificaciones

### Roles Disponibles
- **admin**: Acceso completo al sistema
- **agente**: Gestión de remesas en tienda asignada
- **emisor**: Envío de remesas y consulta de historial

### RLS Policies
Todas las tablas tienen Row Level Security habilitado:
- `profiles`: Usuarios ven su perfil, admins ven todos
- `tiendas`: Agentes ven su tienda, admins ven todas
- `transacciones`: Emisores/agentes ven sus transacciones, admins ven todas
- `user_roles`: Solo admins modifican roles

## Validación de Entrada

### Client-Side
- Validación de formularios con tipos TypeScript
- Límites de longitud en campos de texto
- Formato de email y teléfono

### Server-Side
- RLS policies validan permisos en cada operación
- Constraints en base de datos (CHECK, NOT NULL, UNIQUE)
- Triggers para datos automáticos

## Accesibilidad

### Estándares WCAG 2.1 AA
- Contraste de colores ≥ 4.5:1 para texto normal
- Labels descriptivos en todos los inputs
- Focus visible en elementos interactivos
- Navegación por teclado completa
- Mensajes de error descriptivos

### Componentes Accesibles
- Todos los componentes shadcn/ui cumplen WCAG
- ARIA labels donde es necesario
- Semántica HTML apropiada

## Internacionalización (i18n)

### Idiomas Soportados
- Español (es) - Primario
- Kreyòl Haitiano (ht)
- Français (fr)

### Implementación
- Sistema de traducciones centralizado en `src/lib/i18n.ts`
- Context API para cambio de idioma global
- Todas las strings UI son traducibles

## Best Practices

1. **No almacenar tokens en localStorage**: Supabase maneja esto automáticamente
2. **Validar roles server-side**: Nunca confiar solo en validación client-side
3. **Usar RLS policies**: Primera línea de defensa en base de datos
4. **HTTPS obligatorio**: En producción, todas las comunicaciones deben ser HTTPS
5. **Auditoría**: Logs de transacciones sensibles (creación, modificación de roles)
