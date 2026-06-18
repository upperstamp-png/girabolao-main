export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      atualizacoes: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          descricao: string
          id: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao: string
          id?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      aulas: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          duracao: string | null
          id: string
          modulo_id: string
          ordem: number | null
          thumb_url: string | null
          titulo: string
          video_url: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          duracao?: string | null
          id?: string
          modulo_id: string
          ordem?: number | null
          thumb_url?: string | null
          titulo: string
          video_url?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          duracao?: string | null
          id?: string
          modulo_id?: string
          ordem?: number | null
          thumb_url?: string | null
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amparo_legal_descricao: string | null
          amparo_legal_nome: string | null
          ano_compra: number | null
          codigo_ibge: string | null
          created_at: string
          data_abertura_proposta: string | null
          data_atualizacao: string | null
          data_encerramento_proposta: string | null
          data_inclusao: string | null
          data_publicacao: string | null
          esfera_id: string | null
          id: string
          informacao_complementar: string | null
          itens: Json | null
          justificativa_presencial: string | null
          link_edital: string | null
          link_processo_eletronico: string | null
          link_sistema_origem: string | null
          modalidade: string | null
          modalidade_id: number | null
          modo_disputa_id: number | null
          modo_disputa_nome: string | null
          municipio_nome: string | null
          numero_compra: string | null
          numero_controle_pncp: string | null
          objeto: string
          orgao_cnpj: string | null
          orgao_nome: string
          poder_id: string | null
          processo: string | null
          raw: Json | null
          sequencial_compra: number | null
          situacao_id: number | null
          situacao_nome: string | null
          srp: boolean | null
          status: string | null
          tipo_instrumento_nome: string | null
          uf: string
          uf_nome: string | null
          unidade_codigo: string | null
          unidade_nome: string | null
          updated_at: string | null
          usuario_nome: string | null
          valor_estimado: number | null
          valor_total_homologado: number | null
        }
        Insert: {
          amparo_legal_descricao?: string | null
          amparo_legal_nome?: string | null
          ano_compra?: number | null
          codigo_ibge?: string | null
          created_at?: string
          data_abertura_proposta?: string | null
          data_atualizacao?: string | null
          data_encerramento_proposta?: string | null
          data_inclusao?: string | null
          data_publicacao?: string | null
          esfera_id?: string | null
          id: string
          informacao_complementar?: string | null
          itens?: Json | null
          justificativa_presencial?: string | null
          link_edital?: string | null
          link_processo_eletronico?: string | null
          link_sistema_origem?: string | null
          modalidade?: string | null
          modalidade_id?: number | null
          modo_disputa_id?: number | null
          modo_disputa_nome?: string | null
          municipio_nome?: string | null
          numero_compra?: string | null
          numero_controle_pncp?: string | null
          objeto: string
          orgao_cnpj?: string | null
          orgao_nome: string
          poder_id?: string | null
          processo?: string | null
          raw?: Json | null
          sequencial_compra?: number | null
          situacao_id?: number | null
          situacao_nome?: string | null
          srp?: boolean | null
          status?: string | null
          tipo_instrumento_nome?: string | null
          uf: string
          uf_nome?: string | null
          unidade_codigo?: string | null
          unidade_nome?: string | null
          updated_at?: string | null
          usuario_nome?: string | null
          valor_estimado?: number | null
          valor_total_homologado?: number | null
        }
        Update: {
          amparo_legal_descricao?: string | null
          amparo_legal_nome?: string | null
          ano_compra?: number | null
          codigo_ibge?: string | null
          created_at?: string
          data_abertura_proposta?: string | null
          data_atualizacao?: string | null
          data_encerramento_proposta?: string | null
          data_inclusao?: string | null
          data_publicacao?: string | null
          esfera_id?: string | null
          id?: string
          informacao_complementar?: string | null
          itens?: Json | null
          justificativa_presencial?: string | null
          link_edital?: string | null
          link_processo_eletronico?: string | null
          link_sistema_origem?: string | null
          modalidade?: string | null
          modalidade_id?: number | null
          modo_disputa_id?: number | null
          modo_disputa_nome?: string | null
          municipio_nome?: string | null
          numero_compra?: string | null
          numero_controle_pncp?: string | null
          objeto?: string
          orgao_cnpj?: string | null
          orgao_nome?: string
          poder_id?: string | null
          processo?: string | null
          raw?: Json | null
          sequencial_compra?: number | null
          situacao_id?: number | null
          situacao_nome?: string | null
          srp?: boolean | null
          status?: string | null
          tipo_instrumento_nome?: string | null
          uf?: string
          uf_nome?: string | null
          unidade_codigo?: string | null
          unidade_nome?: string | null
          updated_at?: string | null
          usuario_nome?: string | null
          valor_estimado?: number | null
          valor_total_homologado?: number | null
        }
        Relationships: []
      }
      bolao_analytics: {
        Row: {
          criado_em: string
          id: string
          tela: string
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          tela: string
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          tela?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_analytics_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_artilheiro: {
        Row: {
          acertou: boolean | null
          atualizado_em: string
          bloqueada: boolean
          bloqueado_em: string | null
          confirmado_em: string | null
          criado_em: string
          id: string
          jogador_apostado: string
          jogador_id: string | null
          usuario_id: string
        }
        Insert: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          jogador_apostado: string
          jogador_id?: string | null
          usuario_id: string
        }
        Update: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          jogador_apostado?: string
          jogador_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_artilheiro_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "bolao_elenco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_apostas_artilheiro_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_campeao: {
        Row: {
          acertou: boolean | null
          atualizado_em: string
          bloqueada: boolean
          bloqueado_em: string | null
          confirmado_em: string | null
          criado_em: string
          id: string
          time_campeao: string
          usuario_id: string
        }
        Insert: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          time_campeao: string
          usuario_id: string
        }
        Update: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          time_campeao?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_campeao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_finalistas: {
        Row: {
          acertou_os_dois: boolean | null
          acertou_um: boolean | null
          atualizado_em: string
          bloqueada: boolean
          bloqueado_em: string | null
          confirmado_em: string | null
          criado_em: string
          id: string
          time1: string
          time2: string
          usuario_id: string
        }
        Insert: {
          acertou_os_dois?: boolean | null
          acertou_um?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          time1: string
          time2: string
          usuario_id: string
        }
        Update: {
          acertou_os_dois?: boolean | null
          acertou_um?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          time1?: string
          time2?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_finalistas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_goleada: {
        Row: {
          acertou: boolean | null
          atualizado_em: string
          bloqueada: boolean
          bloqueado_em: string | null
          confirmado_em: string | null
          criado_em: string
          gols_casa: number
          gols_fora: number
          id: string
          time_casa: string
          time_fora: string
          usuario_id: string
        }
        Insert: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          gols_casa: number
          gols_fora: number
          id?: string
          time_casa: string
          time_fora: string
          usuario_id: string
        }
        Update: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          gols_casa?: number
          gols_fora?: number
          id?: string
          time_casa?: string
          time_fora?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_goleada_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_zebra: {
        Row: {
          acertou: boolean | null
          atualizado_em: string
          bloqueada: boolean
          bloqueado_em: string | null
          confirmado_em: string | null
          criado_em: string
          id: string
          usuario_id: string
          zebra_apostada: string
        }
        Insert: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          usuario_id: string
          zebra_apostada: string
        }
        Update: {
          acertou?: boolean | null
          atualizado_em?: string
          bloqueada?: boolean
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          usuario_id?: string
          zebra_apostada?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_zebra_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_auditoria_jogos: {
        Row: {
          criado_em: string
          id: string
          jogo_id: string | null
          placar_casa_antigo: number | null
          placar_casa_novo: number | null
          placar_fora_antigo: number | null
          placar_fora_novo: number | null
          responsavel: string
          status_antigo: string | null
          status_novo: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          jogo_id?: string | null
          placar_casa_antigo?: number | null
          placar_casa_novo?: number | null
          placar_fora_antigo?: number | null
          placar_fora_novo?: number | null
          responsavel: string
          status_antigo?: string | null
          status_novo?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          jogo_id?: string | null
          placar_casa_antigo?: number | null
          placar_casa_novo?: number | null
          placar_fora_antigo?: number | null
          placar_fora_novo?: number | null
          responsavel?: string
          status_antigo?: string | null
          status_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_auditoria_jogos_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_automacoes_log: {
        Row: {
          acao: string
          criado_em: string
          detalhes: Json | null
          id: string
          status: string
        }
        Insert: {
          acao: string
          criado_em?: string
          detalhes?: Json | null
          id?: string
          status: string
        }
        Update: {
          acao?: string
          criado_em?: string
          detalhes?: Json | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      bolao_broadcasts: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          mensagem: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          mensagem: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          mensagem?: string
        }
        Relationships: []
      }
      bolao_chat_mensagens: {
        Row: {
          canal: string
          criado_em: string
          fixada: boolean
          id: string
          mensagem: string
          respondendo_a_id: string | null
          usuario_id: string
        }
        Insert: {
          canal: string
          criado_em?: string
          fixada?: boolean
          id?: string
          mensagem: string
          respondendo_a_id?: string | null
          usuario_id: string
        }
        Update: {
          canal?: string
          criado_em?: string
          fixada?: boolean
          id?: string
          mensagem?: string
          respondendo_a_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_chat_mensagens_respondendo_a_id_fkey"
            columns: ["respondendo_a_id"]
            isOneToOne: false
            referencedRelation: "bolao_chat_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_chat_mensagens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_chat_reacoes: {
        Row: {
          criado_em: string
          id: string
          mensagem_id: string
          reacao: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          mensagem_id: string
          reacao: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          mensagem_id?: string
          reacao?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_chat_reacoes_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "bolao_chat_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_chat_reacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_chaveamentos: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_hora: string | null
          estadio: string | null
          fase: string
          id: string
          jogo_id: string | null
          placar_time1: number | null
          placar_time2: number | null
          posicao: number | null
          time1: string | null
          time2: string | null
          vencedor: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_hora?: string | null
          estadio?: string | null
          fase: string
          id?: string
          jogo_id?: string | null
          placar_time1?: number | null
          placar_time2?: number | null
          posicao?: number | null
          time1?: string | null
          time2?: string | null
          vencedor?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_hora?: string | null
          estadio?: string | null
          fase?: string
          id?: string
          jogo_id?: string | null
          placar_time1?: number | null
          placar_time2?: number | null
          posicao?: number | null
          time1?: string | null
          time2?: string | null
          vencedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_chaveamentos_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_classificacao_grupos: {
        Row: {
          atualizado_em: string
          derrotas: number
          empates: number
          gols_contra: number
          gols_pro: number
          grupo_id: string
          id: string
          jogos: number
          pontos: number
          posicao: number
          saldo: number
          selecao_id: string
          vitorias: number
        }
        Insert: {
          atualizado_em?: string
          derrotas?: number
          empates?: number
          gols_contra?: number
          gols_pro?: number
          grupo_id: string
          id?: string
          jogos?: number
          pontos?: number
          posicao: number
          saldo?: number
          selecao_id: string
          vitorias?: number
        }
        Update: {
          atualizado_em?: string
          derrotas?: number
          empates?: number
          gols_contra?: number
          gols_pro?: number
          grupo_id?: string
          id?: string
          jogos?: number
          pontos?: number
          posicao?: number
          saldo?: number
          selecao_id?: string
          vitorias?: number
        }
        Relationships: [
          {
            foreignKeyName: "bolao_classificacao_grupos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "bolao_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_classificacao_grupos_selecao_id_fkey"
            columns: ["selecao_id"]
            isOneToOne: false
            referencedRelation: "bolao_selecoes"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_config: {
        Row: {
          admin_pin: string
          api_football_chamadas_hoje: number
          api_football_data: string | null
          atualizado_em: string
          exclusividade_placar: boolean
          id: number
          palpites_liberados: boolean
          premio_descricao: string | null
          ranking_snapshot: Json | null
          status: string
          total_jogos_api: number
          ultima_sync_api: string | null
          ultima_sync_api_football: string | null
          ultima_sync_noticias: string | null
          ultima_sync_statsbomb: string | null
          ultima_sync_thesportsdb: string | null
        }
        Insert: {
          admin_pin?: string
          api_football_chamadas_hoje?: number
          api_football_data?: string | null
          atualizado_em?: string
          exclusividade_placar?: boolean
          id?: number
          palpites_liberados?: boolean
          premio_descricao?: string | null
          ranking_snapshot?: Json | null
          status?: string
          total_jogos_api?: number
          ultima_sync_api?: string | null
          ultima_sync_api_football?: string | null
          ultima_sync_noticias?: string | null
          ultima_sync_statsbomb?: string | null
          ultima_sync_thesportsdb?: string | null
        }
        Update: {
          admin_pin?: string
          api_football_chamadas_hoje?: number
          api_football_data?: string | null
          atualizado_em?: string
          exclusividade_placar?: boolean
          id?: number
          palpites_liberados?: boolean
          premio_descricao?: string | null
          ranking_snapshot?: Json | null
          status?: string
          total_jogos_api?: number
          ultima_sync_api?: string | null
          ultima_sync_api_football?: string | null
          ultima_sync_noticias?: string | null
          ultima_sync_statsbomb?: string | null
          ultima_sync_thesportsdb?: string | null
        }
        Relationships: []
      }
      bolao_config_artilheiro: {
        Row: {
          acumulado_anterior: number
          artilheiro_real: string | null
          atualizado_em: string
          bloqueio_em: string | null
          id: number
          prazo_fim: string
          status: string
          total_arrecadado: number
        }
        Insert: {
          acumulado_anterior?: number
          artilheiro_real?: string | null
          atualizado_em?: string
          bloqueio_em?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
        }
        Update: {
          acumulado_anterior?: number
          artilheiro_real?: string | null
          atualizado_em?: string
          bloqueio_em?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
        }
        Relationships: []
      }
      bolao_config_campeao: {
        Row: {
          acumulado_anterior: number
          atualizado_em: string
          bloqueio_em: string | null
          campeao_real: string | null
          id: number
          prazo_fim: string
          status: string
          total_arrecadado: number
        }
        Insert: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          campeao_real?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
        }
        Update: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          campeao_real?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
        }
        Relationships: []
      }
      bolao_config_finalistas: {
        Row: {
          acumulado_anterior: number
          atualizado_em: string
          bloqueio_em: string | null
          finalista1_real: string | null
          finalista2_real: string | null
          id: number
          prazo_fim: string | null
          status: string
          total_arrecadado: number
        }
        Insert: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          finalista1_real?: string | null
          finalista2_real?: string | null
          id?: number
          prazo_fim?: string | null
          status?: string
          total_arrecadado?: number
        }
        Update: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          finalista1_real?: string | null
          finalista2_real?: string | null
          id?: number
          prazo_fim?: string | null
          status?: string
          total_arrecadado?: number
        }
        Relationships: []
      }
      bolao_config_goleada: {
        Row: {
          acumulado_anterior: number
          atualizado_em: string
          bloqueio_em: string | null
          goleada_gols_casa_real: number | null
          goleada_gols_fora_real: number | null
          goleada_time_casa_real: string | null
          goleada_time_fora_real: string | null
          id: number
          prazo_fim: string
          status: string
          total_arrecadado: number
        }
        Insert: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          goleada_gols_casa_real?: number | null
          goleada_gols_fora_real?: number | null
          goleada_time_casa_real?: string | null
          goleada_time_fora_real?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
        }
        Update: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          goleada_gols_casa_real?: number | null
          goleada_gols_fora_real?: number | null
          goleada_time_casa_real?: string | null
          goleada_time_fora_real?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
        }
        Relationships: []
      }
      bolao_config_zebra: {
        Row: {
          acumulado_anterior: number
          atualizado_em: string
          bloqueio_em: string | null
          id: number
          prazo_fim: string
          status: string
          total_arrecadado: number
          zebra_real: string | null
        }
        Insert: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
          zebra_real?: string | null
        }
        Update: {
          acumulado_anterior?: number
          atualizado_em?: string
          bloqueio_em?: string | null
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
          zebra_real?: string | null
        }
        Relationships: []
      }
      bolao_convites: {
        Row: {
          codigo: string
          criado_em: string
          expira_em: string | null
          id: string
          limite_vagas: number | null
          vagas_usadas: number
        }
        Insert: {
          codigo: string
          criado_em?: string
          expira_em?: string | null
          id?: string
          limite_vagas?: number | null
          vagas_usadas?: number
        }
        Update: {
          codigo?: string
          criado_em?: string
          expira_em?: string | null
          id?: string
          limite_vagas?: number | null
          vagas_usadas?: number
        }
        Relationships: []
      }
      bolao_elenco: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_nascimento: string | null
          fonte: string
          foto_url: string | null
          id: string
          jogador_nome: string
          nacionalidade: string | null
          numero_camisa: number | null
          posicao: string | null
          selecao_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_nascimento?: string | null
          fonte?: string
          foto_url?: string | null
          id?: string
          jogador_nome: string
          nacionalidade?: string | null
          numero_camisa?: number | null
          posicao?: string | null
          selecao_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_nascimento?: string | null
          fonte?: string
          foto_url?: string | null
          id?: string
          jogador_nome?: string
          nacionalidade?: string | null
          numero_camisa?: number | null
          posicao?: string | null
          selecao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_elenco_selecao_id_fkey"
            columns: ["selecao_id"]
            isOneToOne: false
            referencedRelation: "bolao_selecoes"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_grupos: {
        Row: {
          codigo: string
          criado_em: string
          id: string
          nome: string | null
        }
        Insert: {
          codigo: string
          criado_em?: string
          id?: string
          nome?: string | null
        }
        Update: {
          codigo?: string
          criado_em?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      bolao_historico_alteracoes: {
        Row: {
          acao: string
          criado_em: string
          gols_casa_antigo: number | null
          gols_casa_novo: number
          gols_fora_antigo: number | null
          gols_fora_novo: number
          id: string
          jogo_id: string
          usuario_id: string
        }
        Insert: {
          acao: string
          criado_em?: string
          gols_casa_antigo?: number | null
          gols_casa_novo: number
          gols_fora_antigo?: number | null
          gols_fora_novo: number
          id?: string
          jogo_id: string
          usuario_id: string
        }
        Update: {
          acao?: string
          criado_em?: string
          gols_casa_antigo?: number | null
          gols_casa_novo?: number
          gols_fora_antigo?: number | null
          gols_fora_novo?: number
          id?: string
          jogo_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_historico_alteracoes_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_historico_alteracoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_jogo_estatisticas: {
        Row: {
          atualizado_em: string
          cartoes_amarelos_casa: number | null
          cartoes_amarelos_fora: number | null
          cartoes_vermelhos_casa: number | null
          cartoes_vermelhos_fora: number | null
          chutes_casa: number | null
          chutes_fora: number | null
          chutes_gol_casa: number | null
          chutes_gol_fora: number | null
          dados_brutos: Json | null
          escanteios_casa: number | null
          escanteios_fora: number | null
          faltas_casa: number | null
          faltas_fora: number | null
          id: string
          jogo_id: string
          posse_casa: number | null
          posse_fora: number | null
        }
        Insert: {
          atualizado_em?: string
          cartoes_amarelos_casa?: number | null
          cartoes_amarelos_fora?: number | null
          cartoes_vermelhos_casa?: number | null
          cartoes_vermelhos_fora?: number | null
          chutes_casa?: number | null
          chutes_fora?: number | null
          chutes_gol_casa?: number | null
          chutes_gol_fora?: number | null
          dados_brutos?: Json | null
          escanteios_casa?: number | null
          escanteios_fora?: number | null
          faltas_casa?: number | null
          faltas_fora?: number | null
          id?: string
          jogo_id: string
          posse_casa?: number | null
          posse_fora?: number | null
        }
        Update: {
          atualizado_em?: string
          cartoes_amarelos_casa?: number | null
          cartoes_amarelos_fora?: number | null
          cartoes_vermelhos_casa?: number | null
          cartoes_vermelhos_fora?: number | null
          chutes_casa?: number | null
          chutes_fora?: number | null
          chutes_gol_casa?: number | null
          chutes_gol_fora?: number | null
          dados_brutos?: Json | null
          escanteios_casa?: number | null
          escanteios_fora?: number | null
          faltas_casa?: number | null
          faltas_fora?: number | null
          id?: string
          jogo_id?: string
          posse_casa?: number | null
          posse_fora?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_jogo_estatisticas_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: true
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_jogo_eventos: {
        Row: {
          criado_em: string
          detalhe: Json | null
          fonte: string
          id: string
          jogador: string | null
          jogo_id: string
          minuto: number | null
          periodo: string | null
          time: string | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          detalhe?: Json | null
          fonte?: string
          id?: string
          jogador?: string | null
          jogo_id: string
          minuto?: number | null
          periodo?: string | null
          time?: string | null
          tipo: string
        }
        Update: {
          criado_em?: string
          detalhe?: Json | null
          fonte?: string
          id?: string
          jogador?: string | null
          jogo_id?: string
          minuto?: number | null
          periodo?: string | null
          time?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_jogo_eventos_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_jogos: {
        Row: {
          acumulado: number
          api_football_id: number | null
          api_jogo_id: number
          atualizado_em: string
          bloqueado_manual: boolean
          criado_em: string
          data_hora: string
          e_brasil: boolean
          estadio: string | null
          fase: string
          fonte_sync: string | null
          grupo_id: string | null
          id: string
          minuto_jogo: number | null
          numero_rodada: number | null
          placar_casa: number | null
          placar_casa_ht: number | null
          placar_fora: number | null
          placar_fora_ht: number | null
          rodada_id: string | null
          status: string
          time_casa: string
          time_casa_id: string | null
          time_fora: string
          time_fora_id: string | null
          valor_entrada: number
        }
        Insert: {
          acumulado?: number
          api_football_id?: number | null
          api_jogo_id: number
          atualizado_em?: string
          bloqueado_manual?: boolean
          criado_em?: string
          data_hora: string
          e_brasil?: boolean
          estadio?: string | null
          fase: string
          fonte_sync?: string | null
          grupo_id?: string | null
          id?: string
          minuto_jogo?: number | null
          numero_rodada?: number | null
          placar_casa?: number | null
          placar_casa_ht?: number | null
          placar_fora?: number | null
          placar_fora_ht?: number | null
          rodada_id?: string | null
          status?: string
          time_casa: string
          time_casa_id?: string | null
          time_fora: string
          time_fora_id?: string | null
          valor_entrada?: number
        }
        Update: {
          acumulado?: number
          api_football_id?: number | null
          api_jogo_id?: number
          atualizado_em?: string
          bloqueado_manual?: boolean
          criado_em?: string
          data_hora?: string
          e_brasil?: boolean
          estadio?: string | null
          fase?: string
          fonte_sync?: string | null
          grupo_id?: string | null
          id?: string
          minuto_jogo?: number | null
          numero_rodada?: number | null
          placar_casa?: number | null
          placar_casa_ht?: number | null
          placar_fora?: number | null
          placar_fora_ht?: number | null
          rodada_id?: string | null
          status?: string
          time_casa?: string
          time_casa_id?: string | null
          time_fora?: string
          time_fora_id?: string | null
          valor_entrada?: number
        }
        Relationships: [
          {
            foreignKeyName: "bolao_jogos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "bolao_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_jogos_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "bolao_rodadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_jogos_time_casa_id_fkey"
            columns: ["time_casa_id"]
            isOneToOne: false
            referencedRelation: "bolao_selecoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_jogos_time_fora_id_fkey"
            columns: ["time_fora_id"]
            isOneToOne: false
            referencedRelation: "bolao_selecoes"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_noticias: {
        Row: {
          criado_em: string
          id: string
          imagem_url: string | null
          link: string
          publicado_em: string
          resumo: string | null
          titulo: string
        }
        Insert: {
          criado_em?: string
          id?: string
          imagem_url?: string | null
          link: string
          publicado_em: string
          resumo?: string | null
          titulo: string
        }
        Update: {
          criado_em?: string
          id?: string
          imagem_url?: string | null
          link?: string
          publicado_em?: string
          resumo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      bolao_notificacoes: {
        Row: {
          conteudo: string
          criado_em: string
          id: string
          lida: boolean
          link: string | null
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          conteudo: string
          criado_em?: string
          id?: string
          lida?: boolean
          link?: string | null
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          conteudo?: string
          criado_em?: string
          id?: string
          lida?: boolean
          link?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_palpites: {
        Row: {
          acertou: boolean | null
          atualizado_em: string
          confirmado_em: string | null
          criado_em: string
          gols_casa: number
          gols_fora: number
          id: string
          ip_usuario: string | null
          jogo_id: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          acertou?: boolean | null
          atualizado_em?: string
          confirmado_em?: string | null
          criado_em?: string
          gols_casa: number
          gols_fora: number
          id?: string
          ip_usuario?: string | null
          jogo_id: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          acertou?: boolean | null
          atualizado_em?: string
          confirmado_em?: string | null
          criado_em?: string
          gols_casa?: number
          gols_fora?: number
          id?: string
          ip_usuario?: string | null
          jogo_id?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_palpites_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_palpites_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_premios: {
        Row: {
          criado_em: string
          id: string
          modalidade: string
          referencia_id: string | null
          status: string
          usuario_id: string | null
          valor: number
        }
        Insert: {
          criado_em?: string
          id?: string
          modalidade: string
          referencia_id?: string | null
          status?: string
          usuario_id?: string | null
          valor: number
        }
        Update: {
          criado_em?: string
          id?: string
          modalidade?: string
          referencia_id?: string | null
          status?: string
          usuario_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "bolao_premios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_push_tokens: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_push_tokens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_reacoes: {
        Row: {
          criado_em: string
          emoji: string
          id: string
          jogo_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          emoji: string
          id?: string
          jogo_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          emoji?: string
          id?: string
          jogo_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_reacoes_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_reacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_rodadas: {
        Row: {
          criado_em: string
          fase: string
          grupo_id: string | null
          id: string
          nome: string
          numero: number | null
        }
        Insert: {
          criado_em?: string
          fase: string
          grupo_id?: string | null
          id?: string
          nome: string
          numero?: number | null
        }
        Update: {
          criado_em?: string
          fase?: string
          grupo_id?: string | null
          id?: string
          nome?: string
          numero?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_rodadas_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "bolao_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_selecoes: {
        Row: {
          api_football_id: number | null
          atualizado_em: string
          bandeira_emoji: string | null
          codigo_iso: string | null
          criado_em: string
          escudo_url: string | null
          estadio: string | null
          grupo_id: string | null
          id: string
          nome: string
          pais: string | null
          tecnico: string | null
          thesportsdb_id: string | null
        }
        Insert: {
          api_football_id?: number | null
          atualizado_em?: string
          bandeira_emoji?: string | null
          codigo_iso?: string | null
          criado_em?: string
          escudo_url?: string | null
          estadio?: string | null
          grupo_id?: string | null
          id?: string
          nome: string
          pais?: string | null
          tecnico?: string | null
          thesportsdb_id?: string | null
        }
        Update: {
          api_football_id?: number | null
          atualizado_em?: string
          bandeira_emoji?: string | null
          codigo_iso?: string | null
          criado_em?: string
          escudo_url?: string | null
          estadio?: string | null
          grupo_id?: string | null
          id?: string
          nome?: string
          pais?: string | null
          tecnico?: string | null
          thesportsdb_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_selecoes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "bolao_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_sync_log: {
        Row: {
          criado_em: string
          detalhes: Json | null
          duracao_ms: number | null
          fonte: string
          id: string
          registros: number
          status: string
        }
        Insert: {
          criado_em?: string
          detalhes?: Json | null
          duracao_ms?: number | null
          fonte: string
          id?: string
          registros?: number
          status: string
        }
        Update: {
          criado_em?: string
          detalhes?: Json | null
          duracao_ms?: number | null
          fonte?: string
          id?: string
          registros?: number
          status?: string
        }
        Relationships: []
      }
      bolao_usuarios: {
        Row: {
          acertos_placar: number | null
          acertos_resultado: number | null
          artilheiro_acertos: number | null
          campeao_acertos: number | null
          criado_em: string
          e_participante_padrao: boolean
          excluido_manualmente: boolean
          goleadas: number | null
          id: string
          nome: string
          pin_hash: string | null
          pontos: number | null
          posicao_ranking: number | null
          posicao_ranking_anterior: number | null
          vice_campeao_acertos: number | null
          zebras: number | null
        }
        Insert: {
          acertos_placar?: number | null
          acertos_resultado?: number | null
          artilheiro_acertos?: number | null
          campeao_acertos?: number | null
          criado_em?: string
          e_participante_padrao?: boolean
          excluido_manualmente?: boolean
          goleadas?: number | null
          id?: string
          nome: string
          pin_hash?: string | null
          pontos?: number | null
          posicao_ranking?: number | null
          posicao_ranking_anterior?: number | null
          vice_campeao_acertos?: number | null
          zebras?: number | null
        }
        Update: {
          acertos_placar?: number | null
          acertos_resultado?: number | null
          artilheiro_acertos?: number | null
          campeao_acertos?: number | null
          criado_em?: string
          e_participante_padrao?: boolean
          excluido_manualmente?: boolean
          goleadas?: number | null
          id?: string
          nome?: string
          pin_hash?: string | null
          pontos?: number | null
          posicao_ranking?: number | null
          posicao_ranking_anterior?: number | null
          vice_campeao_acertos?: number | null
          zebras?: number | null
        }
        Relationships: []
      }
      candidato_dna: {
        Row: {
          atualizado_em: string | null
          candidato_id: string
          cor_fundo: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          criado_em: string | null
          elementos_visuais: string[] | null
          estilo: string | null
          fonte_corpo: string | null
          fonte_titulo: string | null
          id: string
          intensidade: string | null
          observacoes: string | null
          pose: string | null
          roupa: string | null
          tom: string | null
        }
        Insert: {
          atualizado_em?: string | null
          candidato_id: string
          cor_fundo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string | null
          elementos_visuais?: string[] | null
          estilo?: string | null
          fonte_corpo?: string | null
          fonte_titulo?: string | null
          id?: string
          intensidade?: string | null
          observacoes?: string | null
          pose?: string | null
          roupa?: string | null
          tom?: string | null
        }
        Update: {
          atualizado_em?: string | null
          candidato_id?: string
          cor_fundo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string | null
          elementos_visuais?: string[] | null
          estilo?: string | null
          fonte_corpo?: string | null
          fonte_titulo?: string | null
          id?: string
          intensidade?: string | null
          observacoes?: string | null
          pose?: string | null
          roupa?: string | null
          tom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidato_dna_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: true
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cargo: string
          cidade: string | null
          criado_em: string | null
          estado: string | null
          foto_url: string | null
          id: string
          nome: string
          numero: string | null
          partido: string
          slogan: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cargo: string
          cidade?: string | null
          criado_em?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          numero?: string | null
          partido: string
          slogan?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cargo?: string
          cidade?: string | null
          criado_em?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          numero?: string | null
          partido?: string
          slogan?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidatos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          atualizado_em: string | null
          conteudo: string
          criado_em: string | null
          id: string
          parent_id: string | null
          post_id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          conteudo: string
          criado_em?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          conteudo?: string
          criado_em?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_comunidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      correcoes_admin: {
        Row: {
          admin_id: string | null
          campo_alterado: string
          created_at: string | null
          evento_id: string | null
          id: string
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          admin_id?: string | null
          campo_alterado: string
          created_at?: string | null
          evento_id?: string | null
          id?: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          admin_id?: string | null
          campo_alterado?: string
          created_at?: string | null
          evento_id?: string | null
          id?: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correcoes_admin_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      curtidas: {
        Row: {
          criado_em: string | null
          id: string
          post_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          post_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          post_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curtidas_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_comunidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curtidas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string | null
          descricao: string | null
          hash_evento: string | null
          id: string
          minuto: string | null
          partida_id: string | null
          placar_mandante: number | null
          placar_visitante: number | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          hash_evento?: string | null
          id?: string
          minuto?: string | null
          partida_id?: string | null
          placar_mandante?: number | null
          placar_visitante?: number | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          hash_evento?: string | null
          id?: string
          minuto?: string | null
          partida_id?: string | null
          placar_mandante?: number | null
          placar_visitante?: number | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          output_url: string | null
          prompt: string
          status: string
          style: string | null
          type: string
          updated_at: string
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          output_url?: string | null
          prompt: string
          status?: string
          style?: string | null
          type: string
          updated_at?: string
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          output_url?: string | null
          prompt?: string
          status?: string
          style?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      geracoes: {
        Row: {
          candidato_id: string
          criado_em: string | null
          formato: string | null
          id: string
          modelo_ia: string | null
          prompt_usado: string
          status: string | null
          tipo: string | null
        }
        Insert: {
          candidato_id: string
          criado_em?: string | null
          formato?: string | null
          id?: string
          modelo_ia?: string | null
          prompt_usado: string
          status?: string | null
          tipo?: string | null
        }
        Update: {
          candidato_id?: string
          criado_em?: string | null
          formato?: string | null
          id?: string
          modelo_ia?: string | null
          prompt_usado?: string
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geracoes_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      geracoes_imagens: {
        Row: {
          candidato_id: string
          criado_em: string | null
          favorita: boolean | null
          geracao_id: string
          id: string
          tags: string[] | null
          thumb_url: string | null
          url: string
        }
        Insert: {
          candidato_id: string
          criado_em?: string | null
          favorita?: boolean | null
          geracao_id: string
          id?: string
          tags?: string[] | null
          thumb_url?: string | null
          url: string
        }
        Update: {
          candidato_id?: string
          criado_em?: string | null
          favorita?: boolean | null
          geracao_id?: string
          id?: string
          tags?: string[] | null
          thumb_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "geracoes_imagens_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geracoes_imagens_geracao_id_fkey"
            columns: ["geracao_id"]
            isOneToOne: false
            referencedRelation: "geracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          created_at: string
          id: string
          kind: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          text?: string
        }
        Relationships: []
      }
      mercadopago_config: {
        Row: {
          access_token_encrypted: string
          created_at: string
          id: string
          is_active: boolean
          public_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          id?: string
          is_active?: boolean
          public_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          id?: string
          is_active?: boolean
          public_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      modulos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          ordem: number | null
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          titulo?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payment_method: string | null
          pix_copia_cola: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_copia_cola?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_copia_cola?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas: {
        Row: {
          created_at: string | null
          data_jogo: string | null
          fase: string | null
          fifa_id: string | null
          id: string
          mandante: string
          status: string | null
          visitante: string
        }
        Insert: {
          created_at?: string | null
          data_jogo?: string | null
          fase?: string | null
          fifa_id?: string | null
          id?: string
          mandante: string
          status?: string | null
          visitante: string
        }
        Update: {
          created_at?: string | null
          data_jogo?: string | null
          fase?: string | null
          fifa_id?: string | null
          id?: string
          mandante?: string
          status?: string | null
          visitante?: string
        }
        Relationships: []
      }
      post_anexos: {
        Row: {
          criado_em: string | null
          id: string
          nome_arquivo: string | null
          post_id: string
          referencia_id: string | null
          tipo: string
          url_arquivo: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          nome_arquivo?: string | null
          post_id: string
          referencia_id?: string | null
          tipo: string
          url_arquivo?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          nome_arquivo?: string | null
          post_id?: string
          referencia_id?: string | null
          tipo?: string
          url_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_anexos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_comunidade"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_comunidade: {
        Row: {
          atualizado_em: string | null
          conteudo: string
          criado_em: string | null
          id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          conteudo: string
          criado_em?: string | null
          id?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          conteudo?: string
          criado_em?: string | null
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_comunidade_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents: number
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits_balance: number
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits_balance?: number
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits_balance?: number
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          categoria: string
          conteudo: string
          criado_em: string | null
          descricao: string | null
          id: string
          ordem: number | null
          thumb_url: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria: string
          conteudo: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          thumb_url?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria?: string
          conteudo?: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          thumb_url?: string | null
          titulo?: string
        }
        Relationships: []
      }
      sistemas: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          conteudo: string
          criado_em: string | null
          descricao: string | null
          id: string
          ordem: number | null
          thumb_url: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          conteudo: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          thumb_url?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          conteudo?: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          thumb_url?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      templates_campanha: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          criado_em: string | null
          descricao: string | null
          formato: string | null
          id: string
          ordem: number | null
          prompt_base: string
          thumb_url: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          criado_em?: string | null
          descricao?: string | null
          formato?: string | null
          id?: string
          ordem?: number | null
          prompt_base: string
          thumb_url?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          criado_em?: string | null
          descricao?: string | null
          formato?: string | null
          id?: string
          ordem?: number | null
          prompt_base?: string
          thumb_url?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          auth_id: string | null
          criado_em: string | null
          email: string
          foto_url: string | null
          id: string
          instagram: string | null
          nome: string | null
          papel: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_id?: string | null
          criado_em?: string | null
          email: string
          foto_url?: string | null
          id?: string
          instagram?: string | null
          nome?: string | null
          papel?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_id?: string | null
          criado_em?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          instagram?: string | null
          nome?: string | null
          papel?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          id: string
          json_structure: Json
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          json_structure?: Json
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          json_structure?: Json
          name?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      bolao_apostas_artilheiro_publica: {
        Row: {
          acertou: boolean | null
          bloqueado_em: string | null
          confirmado_em: string | null
          criado_em: string | null
          id: string | null
          jogador_apostado: string | null
          jogador_id: string | null
          revelado: boolean | null
          usuario_id: string | null
        }
        Insert: {
          acertou?: boolean | null
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string | null
          id?: string | null
          jogador_apostado?: string | null
          jogador_id?: string | null
          revelado?: never
          usuario_id?: string | null
        }
        Update: {
          acertou?: boolean | null
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string | null
          id?: string | null
          jogador_apostado?: string | null
          jogador_id?: string | null
          revelado?: never
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_artilheiro_jogador_id_fkey"
            columns: ["jogador_id"]
            isOneToOne: false
            referencedRelation: "bolao_elenco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_apostas_artilheiro_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_campeao_publica: {
        Row: {
          acertou: boolean | null
          criado_em: string | null
          id: string | null
          revelado: boolean | null
          time_campeao: string | null
          usuario_id: string | null
        }
        Insert: {
          acertou?: boolean | null
          criado_em?: string | null
          id?: string | null
          revelado?: never
          time_campeao?: string | null
          usuario_id?: string | null
        }
        Update: {
          acertou?: boolean | null
          criado_em?: string | null
          id?: string | null
          revelado?: never
          time_campeao?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_campeao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_finalistas_publica: {
        Row: {
          acertou_os_dois: boolean | null
          acertou_um: boolean | null
          bloqueado_em: string | null
          confirmado_em: string | null
          criado_em: string | null
          id: string | null
          revelado: boolean | null
          time1: string | null
          time2: string | null
          usuario_id: string | null
        }
        Insert: {
          acertou_os_dois?: boolean | null
          acertou_um?: boolean | null
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string | null
          id?: string | null
          revelado?: never
          time1?: string | null
          time2?: string | null
          usuario_id?: string | null
        }
        Update: {
          acertou_os_dois?: boolean | null
          acertou_um?: boolean | null
          bloqueado_em?: string | null
          confirmado_em?: string | null
          criado_em?: string | null
          id?: string | null
          revelado?: never
          time1?: string | null
          time2?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_finalistas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_goleada_publica: {
        Row: {
          acertou: boolean | null
          criado_em: string | null
          gols_casa: number | null
          gols_fora: number | null
          id: string | null
          revelado: boolean | null
          time_casa: string | null
          time_fora: string | null
          usuario_id: string | null
        }
        Insert: {
          acertou?: boolean | null
          criado_em?: string | null
          gols_casa?: number | null
          gols_fora?: number | null
          id?: string | null
          revelado?: never
          time_casa?: string | null
          time_fora?: string | null
          usuario_id?: string | null
        }
        Update: {
          acertou?: boolean | null
          criado_em?: string | null
          gols_casa?: number | null
          gols_fora?: number | null
          id?: string | null
          revelado?: never
          time_casa?: string | null
          time_fora?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_goleada_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_apostas_zebra_publica: {
        Row: {
          acertou: boolean | null
          criado_em: string | null
          id: string | null
          revelado: boolean | null
          usuario_id: string | null
          zebra_apostada: string | null
        }
        Insert: {
          acertou?: boolean | null
          criado_em?: string | null
          id?: string | null
          revelado?: never
          usuario_id?: string | null
          zebra_apostada?: string | null
        }
        Update: {
          acertou?: boolean | null
          criado_em?: string | null
          id?: string | null
          revelado?: never
          usuario_id?: string | null
          zebra_apostada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_zebra_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bolao_palpites_publica: {
        Row: {
          acertou: boolean | null
          confirmado_em: string | null
          criado_em: string | null
          gols_casa: number | null
          gols_fora: number | null
          id: string | null
          jogo_id: string | null
          revelado: boolean | null
          usuario_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_palpites_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "bolao_jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_palpites_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "bolao_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      atualizar_ranking_geral: { Args: never; Returns: undefined }
      bolao_aplicar_prazo_oitavas: { Args: never; Returns: undefined }
      bolao_bloquear_apostas_especiais: { Args: never; Returns: undefined }
      bolao_init_participantes_padrao: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
