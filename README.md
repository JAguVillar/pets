# pets

Plataforma de adopción y mascotas perdidas. Monorepo con dos apps:

- `web/` — Landing pública (Astro 5 + Tailwind 4)
- `admin/` — Panel de gestión (Nuxt 4 + Nuxt UI 4)

Ambas comparten un proyecto de Supabase.

## Setup

```bash
pnpm install
cp web/.env.example web/.env
cp admin/.env.example admin/.env
# completar con las credenciales del proyecto Supabase
```

## Desarrollo

```bash
pnpm dev:web      # http://localhost:4321
pnpm dev:admin    # http://localhost:3000
```
