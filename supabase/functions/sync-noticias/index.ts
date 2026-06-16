import { json, preflight } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";

const FEED_URL = "https://ge.globo.com/rss/ge/futebol/futebol-internacional/";

function parseXml(xml: string) {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];

    const titleMatch = content.match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/title>/);
    const title = (titleMatch ? titleMatch[1] || titleMatch[2] : "").trim();

    const linkMatch = content.match(/<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/link>/);
    const link = (linkMatch ? linkMatch[1] || linkMatch[2] : "").trim();

    const descMatch = content.match(
      /<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/description>/,
    );
    let description = (descMatch ? descMatch[1] || descMatch[2] : "").trim();
    // Remover tags HTML da descrição
    description = description.replace(/<[^>]*>/g, "").trim();

    const dateMatch = content.match(/<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/pubDate>/);
    const pubDateStr = (dateMatch ? dateMatch[1] || dateMatch[2] : "").trim();
    let publicado_em = new Date();
    try {
      if (pubDateStr) publicado_em = new Date(pubDateStr);
    } catch (_) {}

    let imagem_url: string | null = null;
    const mediaMatch = content.match(/<(?:media:content|enclosure)[^>]+url=["']([^"']+)["']/i);
    if (mediaMatch) {
      imagem_url = mediaMatch[1];
    } else {
      const imgMatch = match[1].match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imagem_url = imgMatch[1];
    }

    if (title && link) {
      items.push({
        titulo: title,
        resumo: description || null,
        link,
        imagem_url,
        publicado_em: publicado_em.toISOString(),
      });
    }
  }
  return items;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const supabase = admin();
  const logs: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const force = !!body.force;

    // 1. VERIFICAR FECHAMENTO AUTOMÁTICO DO BOLÃO
    logs.push("Verificando prazo de fechamento do bolão...");
    const { data: cfg } = await supabase
      .from("bolao_config")
      .select("status, palpites_liberados, ultima_sync_noticias")
      .eq("id", 1)
      .single();

    const statusAtual = cfg?.status || "ABERTO";
    const palpitesLiberados = cfg?.palpites_liberados || false;

    // Buscar o primeiro jogo
    const { data: primeiroJogo } = await supabase
      .from("bolao_jogos")
      .select("data_hora")
      .order("data_hora", { ascending: true })
      .limit(1)
      .maybeSingle();

    // ---- Automatic global closing logic disabled ----

    // 2. SINCRONIZAR NOTÍCIAS (COM CACHE)
    let noticiasAdicionadas = 0;
    const cacheLimit = 15 * 60 * 1000; // 15 minutos de cache
    const ultimaSync = cfg?.ultima_sync_noticias ? new Date(cfg.ultima_sync_noticias).getTime() : 0;
    const tempoDecorrido = Date.now() - ultimaSync;

    if (force || tempoDecorrido >= cacheLimit) {
      logs.push("Cache expirado ou force=true. Buscando feed RSS...");
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error(`Falha ao carregar RSS: HTTP ${res.status}`);
      const xmlText = await res.text();
      const parsedItems = parseXml(xmlText);

      logs.push(`Encontradas ${parsedItems.length} notícias no feed. Salvando no banco...`);
      for (const item of parsedItems) {
        const { error: upsertErr } = await supabase
          .from("bolao_noticias")
          .upsert(item, { onConflict: "link" });

        if (!upsertErr) {
          noticiasAdicionadas++;
        }
      }

      // Atualizar timestamp no bolao_config
      await supabase
        .from("bolao_config")
        .update({ ultima_sync_noticias: new Date().toISOString() })
        .eq("id", 1);

      await supabase.from("bolao_automacoes_log").insert({
        acao: "sync_noticias",
        status: "sucesso",
        detalhes: {
          feed_url: FEED_URL,
          total_encontrado: parsedItems.length,
          novas_adicionadas: noticiasAdicionadas,
        },
      });
      logs.push(`Sincronização de notícias concluída. Adicionadas: ${noticiasAdicionadas}`);
    } else {
      logs.push(
        `Cache de notícias ativo. Última sync foi há ${Math.round(tempoDecorrido / 1000)}s.`,
      );
    }

    return json({ ok: true, logs, noticias_adicionadas: noticiasAdicionadas });
  } catch (err) {
    console.error("Erro na automação:", err);
    await supabase.from("bolao_automacoes_log").insert({
      acao: "automacao_erro",
      status: "erro",
      detalhes: { erro: (err as Error).message },
    });
    return json({ error: (err as Error).message, logs }, 500);
  }
});
