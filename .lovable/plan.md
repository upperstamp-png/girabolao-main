# Auditoria Final — Bolão Copa 2026

O escopo desta solicitação é enorme (15 áreas distintas, incluindo migração de banco, realtime, chat, notificações, central de notícias, painel admin, segurança, reset de dados e relatório de QA). Tentar entregar tudo numa única leva geraria horas de trabalho não revisável e altíssimo risco de regressão. Proponho dividir em **6 fases entregáveis**, cada uma testável isoladamente. Você aprova fase por fase.

Antes de começar, **3 decisões** precisam de confirmação — sem elas as fases mudam de forma:

1. **Reset oficial (item 14)** — apagar TODOS os palpites, apostas, prêmios, pontuações, ranking e jogos com `data_hora < 2026-06-18`? Mantém usuários, PINs, configs, elenco e seleções. **Operação irreversível.**
2. **Travamento de 15 min após início (item 4)** — isso **contradiz a regra atual** (palpite bloqueia no início oficial do jogo). Confirma trocar para "início + 15min" em TODOS os jogos? Afeta `palpite-placar`, view pública e UI de countdown.
3. **Realtime** — usar **Supabase Realtime** (já disponível, sem custo extra) para jogos ao vivo / ranking / chat / notificações, com polling como fallback? Alternativa seria SSE via server route (mais trabalho, sem ganho real aqui).

---

## Fase 1 — Fundamentos (horários + reset + regras de aposta)
- Migration: garantir todas as colunas `*_em` / `data_hora` em `timestamptz` (UTC). Auditar e converter qualquer coluna `timestamp` sem TZ.
- Frontend: criar `src/lib/datetime.ts` com `formatBR(date)` usando `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })`. Substituir TODOS os `toLocaleString` / `format` espalhados (jogos, home, ranking, chat, notificações, admin).
- Migration: alterar trigger de bloqueio de palpite para `now() > data_hora + interval '15 minutes'` (se confirmado item 2).
- Edge fn `palpite-placar`: idem na validação server-side. Registrar `ip` (já vem em `req.headers`) + `user_agent` no insert.
- Migration de reset (se confirmado item 1): `DELETE` em `bolao_palpites`, `bolao_apostas_*`, `bolao_premios`, `bolao_jogo_eventos`, `bolao_jogo_estatisticas`, `bolao_auditoria_jogos`, `bolao_chaveamentos`, `bolao_classificacao_grupos`, `bolao_jogos WHERE data_hora < '2026-06-18'`. Zerar `pontos`/`acertos_*` em `bolao_usuarios`. Reabrir configs.

## Fase 2 — Realtime + Home inteligente
- Habilitar Realtime via migration: `ALTER PUBLICATION supabase_realtime ADD TABLE bolao_jogos, bolao_jogo_eventos, bolao_usuarios, bolao_notificacoes, bolao_chat_mensagens;`
- Hook `useRealtimeTable<T>(table, filter)` em `src/lib/realtime.ts` — assina dentro de `useEffect`, cleanup com `removeChannel`.
- Refatorar `src/routes/index.tsx`:
  - Seção "🔴 AO VIVO" no topo (jogos com `status='ao_vivo'`) com tempo decorrido + placar + últimos eventos.
  - "⏭️ Próximos" (3 jogos futuros mais próximos, ordenados por `data_hora`).
  - "✅ Últimos Resultados" (3 jogos `status='apurado'`).
- Substituir `useQuery` + polling onde Realtime cobre.

## Fase 3 — Pontuação oficial + Ranking
- A função `atualizar_ranking_geral` JÁ implementa a maioria dos pontos pedidos (placar exato 10, resultado 5, gols próximos +2, goleada +5, zebra +10, campeão +50, artilheiro +30, vice +25). Verificar:
  - Diferença "gols próximos" — atualmente `≤1` em casa E fora; o pedido é "diferença máxima de 1 gol" → manter como está e confirmar leitura.
  - Garantir trigger em `bolao_jogos` (`AFTER UPDATE WHEN status IN ('encerrado','apurado')`) chamando `atualizar_ranking_geral` — listar e validar.
- Página `/ranking` (já existe): adicionar colunas faltantes (acertos exatos, resultado, zebras, goleadas, campeão, artilheiro, vice). Realtime na tabela `bolao_usuarios`.

## Fase 4 — Chat completo
- Tabela `bolao_chat_mensagens` já existe. Tabela `bolao_chat_reacoes` já existe. Adicionar `fixada boolean default false` se faltar.
- Nova rota `src/routes/chat.tsx`: lista mensagens com Realtime, composer, responder, reagir, fixar (admin), indicador "digitando" (Realtime broadcast channel).
- Canais: `geral` (padrão). "Por bolão" não se aplica — temos um único bolão. Esclarecer se quer canais por seleção / por grupo.

## Fase 5 — Notificações + Notícias + Admin
- Notificações: tabela e triggers JÁ existem (jogo iniciado, gol, cartão, ultrapassagem, chat). Falta UI: dropdown no header com badge de não-lidas, lista paginada, marcar como lida. Realtime em `bolao_notificacoes WHERE usuario_id IS NULL OR usuario_id=<me>`.
- Notícias: `bolao_noticias` + `sync-noticias` já existem. Garantir cron a cada 1h. Página `/noticias` (já existe) — validar filtros por categoria.
- Admin: rota `/admin` já existe. Adicionar abas faltantes (logs `bolao_automacoes_log` + `bolao_sync_log`, gerenciar regras, broadcast).

## Fase 6 — Segurança, performance, validação
- Adicionar índices: `bolao_jogos(status, data_hora)`, `bolao_palpites(usuario_id, jogo_id)`, `bolao_notificacoes(usuario_id, lida, criado_em)`.
- Rate limit nas edge fns sensíveis (palpite/aposta/chat) — tabela `bolao_rate_limit` ou usar `bolao_analytics` com check de janela 60s.
- Zod em TODAS as edge fns (auditar — algumas usam validação manual).
- Checklist final: rodar `supabase--linter`, `bun run build`, testes em `src/tests/`, browser--screenshot das telas principais.
- Relatório `RELATORIO_AUDITORIA.md` em `/mnt/documents/`.

---

## Itens fora de escopo / a esclarecer
- **JWT / Refresh Token / CSRF (item 13)**: o sistema é **sem auth** (PIN de 4 dígitos por nome). Implementar JWT exige redesenhar o login. Mantenho rate limit + sanitização + RLS reforçada, e sinalizo no relatório que JWT real exige migração para Supabase Auth (decisão sua).
- **WebSocket próprio**: Supabase Realtime já é WS por baixo. Não vou implementar um servidor WS paralelo.
- **Chat "por bolão"**: só existe 1 bolão. Vou implementar canais por tema (geral / zoeira / análises) — confirma?

**Responda:**
1. Reset confirmado? (sim/não)
2. Travamento "+15 min" confirmado? (sim/não)
3. Realtime via Supabase OK? (sim/não)
4. Começo pela **Fase 1**?
