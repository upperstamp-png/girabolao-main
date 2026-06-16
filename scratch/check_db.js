import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking bolao_noticias table...");
  const { data: news, error: newsErr } = await supabase.from("bolao_noticias").select("*").limit(1);
  if (newsErr) console.log("bolao_noticias error:", newsErr.message);
  else console.log("bolao_noticias check success!");

  console.log("Checking bolao_config columns...");
  const { data: config, error: configErr } = await supabase
    .from("bolao_config")
    .select("status, palpites_liberados, ultima_sync_noticias")
    .eq("id", 1)
    .single();
  if (configErr) console.log("bolao_config error:", configErr.message);
  else console.log("bolao_config columns exist! data:", config);

  console.log("Checking bolao_apostas_artilheiro columns...");
  const { data: art, error: artErr } = await supabase
    .from("bolao_apostas_artilheiro")
    .select("jogador_id")
    .limit(1);
  if (artErr) console.log("bolao_apostas_artilheiro error:", artErr.message);
  else console.log("bolao_apostas_artilheiro jogador_id column exists!");
}

main().catch(console.error);
