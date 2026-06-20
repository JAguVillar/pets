---
name: seed-db
description: Sembrá la base de Supabase con organizaciones, mascotas en adopción y reportes de perdidas. Idempotente (upsert por UUID); reusable a medida que crece el schema.
---

# Seed DB — Pets

Carga datos de prueba en `organizations`, `animals_for_adoption` y `lost_pets` usando el `service_role` key (bypasea RLS). Las filas tienen UUIDs estables, así que correr el seed múltiples veces **upsertea** en vez de duplicar.

## Cómo invocar la skill

Cuando me digas "seedeá la db" o "/seed-db" o similar, ejecutá:

```bash
node .claude/skills/seed-db/seed.mjs
```

Si quieren empezar desde cero (borrar las filas seed antes de re-insertar):

```bash
node .claude/skills/seed-db/seed.mjs --reset
```

Después de correrlo, mostrá la salida tal cual al usuario.

## Pre-requisitos (validar antes de correr)

`admin/.env` debe tener:
- `PUBLIC_SUPABASE_URL` ← ya está si el admin funciona
- `SUPABASE_SERVICE_ROLE_KEY` ← **probablemente falte**. Si el script falla con "Falta config", decile al usuario que vaya a **Supabase Dashboard → Settings → API → service_role secret** y lo pegue en `admin/.env`. **Nunca commitees esta key** (el `.env` ya está gitignoreado).

## Estructura

```
.claude/skills/seed-db/
  SKILL.md           ← este archivo
  seed.mjs           ← script (lee env, resuelve catálogos por slug, upsertea)
  data/
    organizations.json
    adoptions.json
    lost.json
```

## Modificar los datos

Editá los JSON en `data/`. Reglas:

- **`id`** debe ser un UUID v4 estable (no lo cambies entre runs — sino se duplica). Para una fila nueva, generá con `crypto.randomUUID()` o cualquier generador online.
- Los catálogos (especie, raza, color, sexo, tamaño, status) se referencian por **slug**, no por id. Slugs válidos hoy:
  - **species**: `perro`, `gato`, `otro`
  - **breeds**: `mestizo-perro`, `mestizo-gato`, `mestizo-otro` (más razas: agregarlas via SQL Editor en Supabase)
  - **sexes**: `macho`, `hembra`, `desconocido`
  - **sizes**: `chico`, `mediano`, `grande`, `gigante`
  - **colors**: `negro`, `blanco`, `marron`, `gris`, `atigrado`, `naranja`, `dorado`, `manchado`, `tricolor`
  - **coat_types**: `corto`, `medio`, `largo`, `rizado`, `sin_pelo`
  - **adoption_status** (en `adoptions.json`): `available`, `reserved`, `adopted`, `unavailable`
  - **pet_status** (en `lost.json`): `lost`, `found`, `reunited`, `closed`
- Si referenciás un slug que no existe, el script imprime warning y deja esa columna en `null`.
- Imágenes: array de URLs absolutas (Unsplash, Picsum, o las que subas vos al bucket).

## Cuando el schema crezca

Si se agregan tablas o columnas nuevas:
1. Actualizá el JSON correspondiente con los campos nuevos.
2. Mappealos en la función `seedXxx` de `seed.mjs` (sumar la línea al objeto `records`).
3. Si la columna nueva es un FK a un catálogo nuevo, agregalo al array `tables` en `fetchCatalogs()` para que el script lo resuelva por slug.

## Cuando agregues una tabla principal nueva

Replicá el patrón: nuevo JSON en `data/`, nueva función `seedXxx(catalogs)` siguiendo el modelo de `seedAdoptions`, y llamala desde el bloque `(async () => {...})()`.
