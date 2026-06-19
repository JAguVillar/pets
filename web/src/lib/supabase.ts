import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan variables PUBLIC_SUPABASE_URL y/o PUBLIC_SUPABASE_ANON_KEY",
  );
}

export const supabase = createClient(url, anonKey);
