# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8f716265-0cb6-48c6-a07c-d524bdad17fa

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8f716265-0cb6-48c6-a07c-d524bdad17fa) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Development

### Linting & Type Checking

```sh
npm run lint          # Check ESLint issues
npm run lint:fix      # Auto-fix ESLint issues  
npm run type-check    # TypeScript strict type checking
```

### Testing

```sh
npm run test          # Run tests in watch mode
npm run test:smoke    # Run smoke tests once (CI-friendly)
npm run test:ui       # Open Vitest UI for debugging
```

Smoke tests verify critical paths without requiring a full test suite:
- App rendering
- i18n translations (HT/ES/FR)
- Utility functions (logger)

**Note:** TypeScript strict mode is enabled. Expect type errors during incremental adoption.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript (strict mode)
- React
- shadcn-ui
- Tailwind CSS
- Vitest (testing)

## Security

- Strict headers via `public/_headers` (HSTS, XFO=DENY, nosniff, XSS, Referrer-Policy, Permissions-Policy, CSP)
- CSRF: function `csrf` issues cookie `csrf-token` and clients send `X-CSRF-Token` header
- Secure cookies: `__Host-sid`, `__Host-rt` are `HttpOnly; Secure; SameSite=Lax; Path=/`
- CORS helper: functions use `buildCorsHeaders(req)` with allowlist from `ALLOWED_ORIGINS`
- Rate limiting: dev-only in `supabase/functions/_shared/rateLimiter.ts` (migrate to Upstash/Deno KV for prod)

### Recommended environment variables (Supabase Functions)

```
ALLOWED_ORIGINS=https://kobcash.net,https://www.kobcash.net
```

**Ver guía completa de deployment:** [DEPLOY.md](./DEPLOY.md)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8f716265-0cb6-48c6-a07c-d524bdad17fa) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
