export interface OrdemSorteio {
  posicao: number;
  usuario_id: string;
  nome?: string;
}

/** Verifica se é a vez do participante na sequência do sorteio do jogo. */
export function verificarVezNaSequencia(
  ordem: OrdemSorteio[],
  usuario_id: string | undefined,
  usuariosComPalpite: Set<string>,
): { podeApostar: boolean; mensagem?: string; aguardando?: string; minhaPosicao?: number } {
  if (!usuario_id) {
    return { podeApostar: false, mensagem: "Entre com nome e PIN para apostar." };
  }
  if (ordem.length === 0) {
    return { podeApostar: false, mensagem: "Aguardando sorteio deste jogo..." };
  }

  const minhaPosicao = ordem.find(o => o.usuario_id === usuario_id)?.posicao;

  if (usuariosComPalpite.has(usuario_id)) {
    return { podeApostar: true, minhaPosicao };
  }

  for (const item of ordem) {
    if (!usuariosComPalpite.has(item.usuario_id)) {
      if (item.usuario_id === usuario_id) {
        return { podeApostar: true, minhaPosicao };
      }
      return {
        podeApostar: false,
        mensagem: `Aguarde a vez de ${item.nome ?? "outro participante"} (${item.posicao}º).`,
        aguardando: item.nome,
        minhaPosicao,
      };
    }
  }

  return { podeApostar: true, minhaPosicao };
}
