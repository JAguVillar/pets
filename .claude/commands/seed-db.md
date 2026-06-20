---
description: Sembrar la DB de Pets con organizaciones, mascotas en adopción y reportes de perdidas (idempotente)
argument-hint: [--reset]
---

Corré el seed de la DB ejecutando:

```bash
node .claude/skills/seed-db/seed.mjs $ARGUMENTS
```

Mostrale al usuario la salida completa del script. Si falla por falta de `SUPABASE_SERVICE_ROLE_KEY`, recordale que tiene que sacarlo de **Supabase Dashboard → Settings → API → "service_role secret"** y pegarlo en `admin/.env`.

Si quiere modificar o agregar datos, los JSON viven en `.claude/skills/seed-db/data/`. La skill `seed-db` tiene la doc completa de los slugs de catálogo disponibles.
