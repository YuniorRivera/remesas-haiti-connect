# Arquitectura del Sistema - Remesas RD-Haití

## Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** como build tool
- **Tailwind CSS** para estilos
- **shadcn/ui** componentes UI
- **React Router** para navegación
- **TanStack Query** para gestión de estado servidor

### Backend (Lovable Cloud - Supabase)
- **PostgreSQL** base de datos
- **Row Level Security (RLS)** para autorización
- **Triggers** para automatización
- **Edge Functions** para lógica serverless (próximamente)

## Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Componentes de autenticación
│   ├── transactions/    # Componentes de transacciones
│   └── ui/              # Componentes shadcn/ui
├── contexts/            # React contexts (i18n, etc.)
├── hooks/               # Custom hooks
│   ├── useAuth.tsx      # Hook de autenticación
│   └── useUserRole.tsx  # Hook de roles
├── lib/                 # Utilidades y configuración
│   ├── i18n.ts          # Sistema de traducción
│   └── utils.ts         # Funciones helper
├── pages/               # Páginas principales
│   ├── Index.tsx        # Landing page
│   ├── Auth.tsx         # Login/Signup
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Transactions.tsx # Historial transacciones
│   └── Stores.tsx       # Gestión de tiendas (admin)
└── integrations/        # Integración Supabase (auto-generado)
```

## Base de Datos

### Tablas Principales

#### `profiles`
- Perfil extendido de usuarios
- Campos: full_name, phone, documento_identidad
- Trigger automático al crear usuario

#### `user_roles`
- Roles de usuario (admin, agente, emisor)
- Separada de profiles por seguridad
- Solo admins pueden modificar

#### `tiendas`
- Tiendas/colmados que operan como agentes
- Campos: nombre, dirección, float_disponible, agente_id
- CHECK constraint para float ≥ 0

#### `transacciones`
- Remesas enviadas
- Campos: emisor, beneficiario, montos, estado, comisión
- Estados: pendiente, completada, cancelada, en_proceso

### Funciones de Base de Datos

#### `has_role(user_id, role)`
- SECURITY DEFINER para bypass de RLS
- Previene recursión infinita en policies
- Usada en todas las RLS policies

#### `update_updated_at_column()`
- Trigger para timestamp automático
- Aplicado a profiles y tiendas

#### `handle_new_user()`
- Crea perfil automáticamente en signup
- Extrae metadata del usuario

## Flujo de Autenticación

1. Usuario ingresa credenciales en `/auth`
2. Supabase valida y crea sesión con cookies httpOnly
3. `useAuth` hook detecta cambio de estado
4. `useUserRole` obtiene roles del usuario
5. Redirección a `/dashboard` según rol
6. RLS policies filtran datos según permisos

## Internacionalización

### Sistema i18n
- Archivo centralizado de traducciones (`lib/i18n.ts`)
- Context API para idioma global
- Hook `useTranslation(lang)` para acceder a strings
- Selector de idioma en header

### Idiomas
- **Español (es)**: Idioma primario
- **Kreyòl (ht)**: Para comunidad haitiana
- **Français (fr)**: Idioma oficial de Haití

## Componentes Clave

### `TransactionsTable`
- Tabla con filtros y búsqueda
- Exportación a CSV
- Badges de estado con colores
- Responsive y accesible

### `LanguageSelector`
- Dropdown para cambio de idioma
- Flags de países
- Persiste selección en context

### `AuthForm`
- Login/Signup en un solo componente
- Validación client-side
- Manejo de errores descriptivo
- Redirección automática

## Seguridad

### Niveles de Protección
1. **Client-side**: Validación de formularios, ocultación de UI
2. **Network**: HTTPS, cookies Secure
3. **Application**: Validación de roles antes de operaciones
4. **Database**: RLS policies, constraints, triggers

### RLS Policies
- **Principio de menor privilegio**: Usuarios solo ven datos propios
- **Validación server-side**: No se confía en client
- **Funciones SECURITY DEFINER**: Para operaciones privilegiadas

## Próximas Implementaciones

### Features Pendientes
- [ ] Formulario de creación de remesas
- [ ] Panel de administración completo
- [ ] Reportes y analítica
- [ ] Notificaciones en tiempo real
- [ ] Integración de pagos
- [ ] API REST para integraciones externas
- [ ] Export a PDF de reportes
- [ ] Dashboard de métricas (float, comisiones, volumen)

### Mejoras Técnicas
- [ ] Tests unitarios e integración
- [ ] Logging centralizado
- [ ] Rate limiting en edge functions
- [ ] Caché de consultas frecuentes
- [ ] Optimización de queries
- [ ] PWA para offline-first
