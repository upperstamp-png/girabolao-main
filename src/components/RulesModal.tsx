import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Award, ShieldAlert, Zap } from "lucide-react";
import { useState } from "react";

interface RulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RulesModal({ open, onOpenChange }: RulesModalProps) {
  const [value, setValue] = useState("prazos"); // Estado controlado

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border shadow-glow max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-display text-2xl flex items-center gap-2 text-primary">
            <BookOpen className="h-5.5 w-5.5" /> Regras do Bolão Copa 2026
          </DialogTitle>
        </DialogHeader>

        <Tabs value={value} onValueChange={setValue} className="w-full mt-4">
          <TabsList className="grid grid-cols-4 bg-secondary/30 p-1 rounded-xl">
            <TabsTrigger value="prazos" className="text-xs font-semibold">
              <Calendar className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Prazos
            </TabsTrigger>
            <TabsTrigger value="pontos" className="text-xs font-semibold">
              <Award className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Pontos
            </TabsTrigger>
            <TabsTrigger value="bonus" className="text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Bônus
            </TabsTrigger>
            <TabsTrigger value="desempate" className="text-xs font-semibold">
              <ShieldAlert className="h-3.5 w-3.5 mr-1 hidden sm:inline" /> Desempate
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Prazos e Confirmação */}
          <TabsContent value="prazos" className="space-y-4 pt-4 text-sm leading-relaxed">
            <div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5">⏰ Prazo Limite de Apostas</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Os palpites para cada jogo podem ser registrados ou modificados até **exatamente 15 minutos após o horário oficial de início da partida**.
                Após essa tolerância de 15 minutos, o sistema bloqueia automaticamente novos palpites no backend e no frontend.
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
              <h4 className="font-bold text-primary text-xs sm:text-sm flex items-center gap-1.5 mb-1">
                ✏️ Alterações Permitidas
              </h4>
              <p className="text-muted-foreground text-xs">
                Você pode <strong>alterar seu palpite a qualquer momento dentro da janela de 15 minutos</strong> após o início do jogo.
                Isso permite que você ajuste sua aposta conforme vê o começo da partida.
              </p>
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5">👁️ Palpites Públicos</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Todos os palpites de todos os participantes são <strong>visíveis para todos</strong> desde o momento em que são registrados.
                Isso garante transparência e permite que todos acompanhem as apostas dos demais participantes.
              </p>
            </div>
          </TabsContent>

          {/* TAB 2: Critérios de Pontuação — CORRIGIDO */}
          <TabsContent value="pontos" className="space-y-4 pt-4 text-sm leading-relaxed">
            <div>
              <h3 className="font-display font-bold text-base text-foreground mb-2">🎯 Critérios de Pontuação Padrão</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 border border-border bg-secondary/15 rounded-xl space-y-1">
                  <div className="font-bold text-primary flex items-center gap-1 text-sm">
                    🎯 Placar Exato (+10 pts)
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Você ganha <strong>10 pontos</strong> se acertar o resultado e a quantidade exata de gols de ambos os times (ex: palpite 2x1, jogo 2x1).
                  </p>
                </div>
                <div className="p-3 border border-border bg-secondary/15 rounded-xl space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1 text-sm">
                    ⚽ Resultado Correto (+5 pts)
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Você ganha <strong>5 pontos</strong> se acertar o vencedor ou empate, mesmo sem acertar o placar exato (ex: palpite 2x0, jogo 3x1).
                  </p>
                </div>
                <div className="p-3 border border-border bg-secondary/15 rounded-xl space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1 text-sm">
                    📏 Gols Próximos (+2 pts)
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Se você acertar o resultado (vencedor/empate) e os gols estiverem dentro de ±1 (ex: palpite 2x1, jogo 3x2), ganha <strong>2 pontos extras</strong> → total de <strong>7 pontos</strong>.
                  </p>
                </div>
                <div className="p-3 border border-border bg-secondary/15 rounded-xl space-y-1">
                  <div className="font-bold text-primary flex items-center gap-1 text-sm">
                    🔥 Goleada (+5 pts bônus)
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Se o jogo terminar com diferença de 4+ gols (ex: 4x0, 5x1) e você acertar o vencedor, ganha <strong>+5 pontos extras</strong> → total de <strong>10 pontos</strong> (5 por resultado + 5 por goleada).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5">📺 Jogos Ao Vivo</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Os placares, o tempo de jogo, os eventos (gols, cartões, substituições) e as estatísticas de posse e finalizações são atualizados em tempo real a cada <strong>5 segundos</strong> diretamente da nossa API oficial integrada.
              </p>
            </div>
          </TabsContent>

          {/* TAB 3: Apostas Especiais e Bônus */}
          <TabsContent value="bonus" className="space-y-4 pt-4 text-sm leading-relaxed">
            <div>
              <h3 className="font-display font-bold text-base text-foreground mb-2">🎰 Apostas Especiais (Configuráveis)</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🏆 Campeão:</span>
                  <span>Palpite na equipe que levantará a taça da Copa do Mundo. Acerto garante <strong>+10 pontos</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🤝 Finalistas:</span>
                  <span>Aposte nos dois finalistas da Copa do Mundo. Acertar um finalista garante <strong>+5 pontos</strong>, acertar os dois garante <strong>+10 pontos</strong> e acertar a dupla exata garante <strong>+15 pontos</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">⚽ Artilheiro:</span>
                  <span>Aposte no principal goleador do torneio. Acerto garante <strong>+10 pontos</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🦓 Zebra:</span>
                  <span>Bônus ativado ao acertar o placar exato de uma partida considerada clássico ou onde um time azarão vence o favorito (pontuação definida pelo admin).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔥 Goleada:</span>
                  <span>Bônus especial de pontuação ao acertar partidas com placares com 4 ou mais gols do vencedor.</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* TAB 4: Regras de Desempate */}
          <TabsContent value="desempate" className="space-y-4 pt-4 text-sm leading-relaxed">
            <div>
              <h3 className="font-display font-bold text-base text-foreground mb-2">⚖️ Critérios de Desempate</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mb-3">
                Caso dois ou mais participantes empatem na pontuação geral do ranking do bolão, a ordem de colocação na classificação geral será definida pelos seguintes critérios sucessivos:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>Maior número de acertos de <strong>Placar Exato (10 pontos)</strong>.</li>
                <li>Maior número de acertos de <strong>Resultado (5 pontos)</strong>.</li>
                <li>Maior pontuação acumulada em <strong>Apostas Especiais</strong>.</li>
                <li>Ordem do sorteio do bolão (participante sorteado na frente leva vantagem).</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-3 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground">
            💡 Boa sorte a todos os participantes! Dúvidas adicionais devem ser esclarecidas com o administrador do bolão.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}