#!/usr/bin/env node
// Seed de la DB de Pets. Idempotente (upsert por UUID). Usa service_role para
// bypasear RLS, así que SUPABASE_SERVICE_ROLE_KEY tiene que estar en admin/.env.
//
// Uso:
//   node .claude/skills/seed-db/seed.mjs           # upsert sin tocar nada existente
//   node .claude/skills/seed-db/seed.mjs --reset   # borra las filas seed primero
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv(resolve(ROOT, "admin/.env"));
loadEnv(resolve(ROOT, "web/.env"));

const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(`
❌ Falta config. En admin/.env (o web/.env) necesitás:

  PUBLIC_SUPABASE_URL=https://xxx.supabase.co   (también vale SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
                            └─ Supabase Dashboard → Settings → API → "service_role secret"

⚠️  Nunca commitees el service_role key. El .env ya está gitignoreado.
`);
  process.exit(1);
}

const reset = process.argv.includes("--reset");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function load(file) {
  return JSON.parse(readFileSync(resolve(__dirname, "data", file), "utf8"));
}

async function fetchCatalogs() {
  const tables = [
    "species",
    "breeds",
    "colors",
    "coat_types",
    "sexes",
    "sizes",
    "adoption_status",
    "pet_status",
  ];
  const out = {};
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("id, slug");
    if (error) throw new Error(`Catálogo '${t}': ${error.message}`);
    out[t] = Object.fromEntries((data || []).map((r) => [r.slug, r.id]));
  }
  return out;
}

function resolveId(map, slug, label) {
  if (slug == null || slug === "") return null;
  const id = map[slug];
  if (!id) console.warn(`  ⚠️  ${label}: slug '${slug}' no existe — null`);
  return id ?? null;
}

async function seedOrganizations() {
  const rows = load("organizations.json");
  console.log(`\n📋 organizations (${rows.length}):`);

  const { error } = await supabase
    .from("organizations")
    .upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`organizations: ${error.message}`);
  console.log(`  ✓ upsert por slug`);

  const { data: orgs, error: e2 } = await supabase
    .from("organizations")
    .select("id, slug");
  if (e2) throw new Error(`organizations lookup: ${e2.message}`);
  return Object.fromEntries((orgs || []).map((o) => [o.slug, o.id]));
}

async function seedAdoptions(catalogs, orgs) {
  const rows = load("adoptions.json");
  console.log(`\n🐶 animals_for_adoption (${rows.length}):`);

  if (reset && rows.length) {
    const ids = rows.map((r) => r.id);
    const { error } = await supabase
      .from("animals_for_adoption")
      .delete()
      .in("id", ids);
    if (error) console.warn(`  ⚠️  reset: ${error.message}`);
    else console.log(`  ✓ reset: borradas ${ids.length} previas`);
  }

  const records = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    age_years: r.age_years ?? null,
    images: r.images ?? [],
    breed_id: resolveId(catalogs.breeds, r.breed, `${r.name}.breed`),
    sex_id: resolveId(catalogs.sexes, r.sex, `${r.name}.sex`),
    size_id: resolveId(catalogs.sizes, r.size, `${r.name}.size`),
    color_id: resolveId(catalogs.colors, r.color, `${r.name}.color`),
    coat_type_id: resolveId(catalogs.coat_types, r.coat_type, `${r.name}.coat_type`),
    status_id: resolveId(
      catalogs.adoption_status,
      r.status ?? "available",
      `${r.name}.status`,
    ),
    organization_id: r.organization ? (orgs[r.organization] ?? null) : null,
    owner_user_id: null,
  }));

  const { error } = await supabase
    .from("animals_for_adoption")
    .upsert(records, { onConflict: "id" });
  if (error) throw new Error(`animals_for_adoption: ${error.message}`);
  console.log(`  ✓ upsert ${records.length}`);
}

async function seedLost(catalogs) {
  const rows = load("lost.json");
  console.log(`\n🔍 lost_pets (${rows.length}):`);

  if (reset && rows.length) {
    const ids = rows.map((r) => r.id);
    const { error } = await supabase.from("lost_pets").delete().in("id", ids);
    if (error) console.warn(`  ⚠️  reset: ${error.message}`);
    else console.log(`  ✓ reset: borradas ${ids.length} previas`);
  }

  const records = rows.map((r) => ({
    id: r.id,
    name: r.name ?? null,
    description: r.description ?? null,
    age_years: r.age_years ?? null,
    images: r.images ?? [],
    breed_id: resolveId(catalogs.breeds, r.breed, `${r.name ?? r.id}.breed`),
    sex_id: resolveId(catalogs.sexes, r.sex, `${r.name ?? r.id}.sex`),
    size_id: resolveId(catalogs.sizes, r.size, `${r.name ?? r.id}.size`),
    color_id: resolveId(catalogs.colors, r.color, `${r.name ?? r.id}.color`),
    coat_type_id: resolveId(
      catalogs.coat_types,
      r.coat_type,
      `${r.name ?? r.id}.coat_type`,
    ),
    status_id: resolveId(
      catalogs.pet_status,
      r.status ?? "lost",
      `${r.name ?? r.id}.status`,
    ),
    last_seen_date: r.last_seen_date ?? null,
    last_seen_location: r.last_seen_location ?? null,
    last_seen_lat: r.last_seen_lat ?? null,
    last_seen_lng: r.last_seen_lng ?? null,
    reward: r.reward ?? null,
    reporter_name: r.reporter_name ?? null,
    reporter_phone: r.reporter_phone ?? null,
    reporter_email: r.reporter_email ?? null,
    owner_user_id: null,
  }));

  const { error } = await supabase
    .from("lost_pets")
    .upsert(records, { onConflict: "id" });
  if (error) throw new Error(`lost_pets: ${error.message}`);
  console.log(`  ✓ upsert ${records.length}`);
}

(async () => {
  console.log(`\n🌱 Seed → ${url}`);
  if (reset) console.log("   modo: --reset (borra filas seed antes de insertar)");

  try {
    const catalogs = await fetchCatalogs();
    const orgs = await seedOrganizations();
    await seedAdoptions(catalogs, orgs);
    await seedLost(catalogs);
    console.log("\n✅ Seed completado.\n");
  } catch (e) {
    console.error(`\n❌ ${e.message}\n`);
    process.exit(1);
  }
})();
