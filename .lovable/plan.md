
# Bolão Copa do Mundo 2026

Sistema completo em TanStack Start + Supabase (Lovable Cloud) com Edge Functions e cron automático. **Sem login** — usuários são identificados apenas pelo nome cadastrado (até 10). Como a doc pede, palpites ficam ocultos até o prazo de cada jogo/modalidade.

> Observação de segurança: "sem login" significa que qualquer pessoa com o link pode palpitar em nome de qualquer participante cadastrado. Apropriado para um bolão privado entre amigos; vou adicionar um **PIN simples de 4 dígitos opcional por participante** para evitar trolagem entre o próprio grupo.

---

## 1. Banco de dados (Supabase)

Tabelas novas no schema `public` (prefixadas com `bolao_` para não conflitar com tabelas existentes):

- `bolao_usuarios` — id, nome (único), pin_hash (opcional)
- `bolao_jogos` — espelho dos jogos da API (api_jogo_id, times, placar, fase, e_brasil, valor_entrada, status, data_hora, acumulado)
- `bolao_palpites` — Modalidade A (placar). UNIQUE (usuario_id, jogo_id)
- `bolao_apostas_artilheiro` — Modalidade B. UNIQUE por usuário
- `bolao_apostas_finalistas` — Modalidade C. UNIQUE por usuário
- `bolao_config_artilheiro` / `bolao_config_finalistas` — singletons de status, valores reais e acumulado
- `bolao_premios` — histórico de premiações (modalidade, referencia_id, usuario_id, valor, status)

RLS ligado em todas, com GRANTs para `anon` e `service_role`. Como não há auth, as políticas serão:

- SELECT público liberado **com filtro** (palpites/apostas só retornam linhas após o prazo expirar — usando uma view ou função `security definer` que esconde gols/jogador/times até `data_hora <= now()` ou status da modalidade ≠ aberta).
- INSERT/UPDATE bloqueados via RLS para `anon`; toda escrita passa por **Edge Functions** com service role, que validam: nome existe, PIN bate (se houver), prazo ainda aberto, dados válidos.

## 2. Edge Functions

Todas em `supabase/functions/`:

- `sync-copa` — busca `worldcup26.ir/get/games` (com fallback openfootball), faz upsert em `bolao_jogos`, marca `e_brasil`, define `valor_entrada` (10 BR / 5 outros), atualiza placares e status. Detecta abertura das oitavas e marca `bolao_config_finalistas.status = 'aberta'`.
- `apurar-jogo` — para cada jogo encerrado: marca palpites acertou=true/false, calcula prêmio (participantes × valor_entrada + acumulado), insere em `bolao_premios` ou rola o acumulado para o próximo jogo.
- `apurar-artilheiro` / `apurar-finalistas` — chamadas pelo admin com o resultado oficial; distribuem o pool ou acumulam.
- `palpite-placar`, `aposta-artilheiro`, `aposta-finalistas` — recebem nome + PIN + dados, validam prazo, gravam.
- `usuarios` — cria/remove participante (limite 10), valida unicidade, define PIN opcional.

## 3. Cron (pg_cron)

Dois jobs via `pg_cron` + `pg_net` chamando `sync-copa` e `apurar-jogo`:

- `sync-copa`: a cada 5 minutos
- `apurar-jogo`: a cada 10 minutos

Configurados via SQL com a anon key como `apikey` header.

## 4. Frontend (TanStack Start)

Rotas em `src/routes/`:

```
/                         → landing + cards de status das 3 modalidades + próximos jogos
/participantes            → cadastro (até 10) + PIN opcional
/jogos                    → lista filtrável por fase
/jogos/$id                → palpite de placar + countdown + revelação pós-prazo
/artilheiro               → aposta da Modalidade B
/finalistas               → aposta da Modalidade C (com aviso "abre nas oitavas")
/ranking                  → tabela geral + acumulados
/admin                    → apurar artilheiro/finalistas manualmente, botão sync, ver resumo financeiro
```

Cada rota define `head()` com title/description próprios. Layout raiz com header de navegação.

Para identificar o usuário no navegador: ao selecionar nome + PIN na tela de palpite, guarda no `localStorage` como atalho (não é auth — toda validação real é server-side na edge function).

## 5. Design

Tema esportivo da Copa: verde/amarelo/azul com sotaques, tipografia condensada para placares (Bebas Neue ou similar) + Inter no corpo. Cards com gradiente sutil, bandeiras dos países nos jogos, countdown em destaque, confete (canvas-confetti) quando um palpite acerta. Dark mode por padrão.

## 6. Detalhes técnicos

- **API da Copa**: chamada server-side dentro de `sync-copa` (evita CORS e expõe a URL só do backend). Fallback automático para `openfootball/worldcup.json` se a principal falhar.
- **Cálculo de prêmio (placar)**: `participantes_que_palpitaram × valor_entrada + acumulado_anterior`. Se ninguém acertou → o `acumulado` rola para o próximo jogo. Se múltiplos acertaram → dividido igualmente.
- **Artilheiro**: critério de desempate da doc (menos assistências; se ainda empate → nulo, acumula).
- **Finalistas**: acerto = ambos os times, ordem não importa. Consolação opcional (1 de 2) gravada mas sem premiação (apenas exibida).
- **Ocultar palpites**: view `bolao_palpites_publica` que só revela `gols_casa/gols_fora` se `jogo.data_hora <= now()`. Mesmo padrão para artilheiro/finalistas (revela só após `status='apurada'`).
- **Validação Zod** em todas as edge functions.

## 7. Cronograma de entrega (tudo numa leva)

1. Migração SQL (tabelas + view pública + grants + RLS + cron)
2. Edge functions (8 funções)
3. Deploy edge functions + setup pg_cron
4. Frontend: rotas, componentes, design system
5. Admin + ranking + resumo financeiro

Ao final faço sync inicial para popular jogos da Copa 2026.

---

**Confirma para eu começar?** Se quiser, posso também:
- Trocar PIN por senha-mestre única do grupo (mais simples)
- Adicionar canal de Realtime para revelar placar/palpites ao vivo sem refresh
