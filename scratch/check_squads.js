import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: selecoes, error: sErr } = await supabase
    .from("bolao_selecoes")
    .select("id, nome")
    .limit(5);
  if (sErr) console.error("selecoes error:", sErr);
  else console.log("Sample selecoes:", selecoes);

  const { count, error: countErr } = await supabase
    .from("bolao_elenco")
    .select("*", { count: "exact", head: true });
  if (countErr) console.error("elenco count error:", countErr);
  else {
    console.log("Total players in bolao_elenco:", count);
    if (count > 0) {
      const { data: players } = await supabase
        .from("bolao_elenco")
        .select(
          "id, jogador_nome, posicao, numero_camisa, nationalidade:nacionalidade, bolao_selecoes(nome)",
        )
        .limit(5);
      console.log("Sample players:", players);
    }
  }
}

main().catch(console.error);
