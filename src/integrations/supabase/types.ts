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
      bolao_apostas_artilheiro: {
        Row: {
          acertou: boolean | null
          atualizado_em: string
          criado_em: string
          id: string
          jogador_apostado: string
          usuario_id: string
        }
        Insert: {
          acertou?: boolean | null
          atualizado_em?: string
          criado_em?: string
          id?: string
          jogador_apostado: string
          usuario_id: string
        }
        Update: {
          acertou?: boolean | null
          atualizado_em?: string
          criado_em?: string
          id?: string
          jogador_apostado?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_artilheiro_usuario_id_fkey"
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
      bolao_config_artilheiro: {
        Row: {
          acumulado_anterior: number
          artilheiro_real: string | null
          atualizado_em: string
          id: number
          prazo_fim: string
          status: string
          total_arrecadado: number
        }
        Insert: {
          acumulado_anterior?: number
          artilheiro_real?: string | null
          atualizado_em?: string
          id?: number
          prazo_fim?: string
          status?: string
          total_arrecadado?: number
        }
        Update: {
          acumulado_anterior?: number
          artilheiro_real?: string | null
          atualizado_em?: string
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
          finalista1_real?: string | null
          finalista2_real?: string | null
          id?: number
          prazo_fim?: string | null
          status?: string
          total_arrecadado?: number
        }
        Relationships: []
      }
      bolao_jogos: {
        Row: {
          acumulado: number
          api_jogo_id: number
          atualizado_em: string
          criado_em: string
          data_hora: string
          e_brasil: boolean
          estadio: string | null
          fase: string
          id: string
          placar_casa: number | null
          placar_fora: number | null
          status: string
          time_casa: string
          time_fora: string
          valor_entrada: number
        }
        Insert: {
          acumulado?: number
          api_jogo_id: number
          atualizado_em?: string
          criado_em?: string
          data_hora: string
          e_brasil?: boolean
          estadio?: string | null
          fase: string
          id?: string
          placar_casa?: number | null
          placar_fora?: number | null
          status?: string
          time_casa: string
          time_fora: string
          valor_entrada?: number
        }
        Update: {
          acumulado?: number
          api_jogo_id?: number
          atualizado_em?: string
          criado_em?: string
          data_hora?: string
          e_brasil?: boolean
          estadio?: string | null
          fase?: string
          id?: string
          placar_casa?: number | null
          placar_fora?: number | null
          status?: string
          time_casa?: string
          time_fora?: string
          valor_entrada?: number
        }
        Relationships: []
      }
      bolao_palpites: {
        Row: {
          acertou: boolean | null
          atualizado_em: string
          criado_em: string
          gols_casa: number
          gols_fora: number
          id: string
          jogo_id: string
          usuario_id: string
        }
        Insert: {
          acertou?: boolean | null
          atualizado_em?: string
          criado_em?: string
          gols_casa: number
          gols_fora: number
          id?: string
          jogo_id: string
          usuario_id: string
        }
        Update: {
          acertou?: boolean | null
          atualizado_em?: string
          criado_em?: string
          gols_casa?: number
          gols_fora?: number
          id?: string
          jogo_id?: string
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
      bolao_usuarios: {
        Row: {
          criado_em: string
          id: string
          nome: string
          pin_hash: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          pin_hash?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          pin_hash?: string | null
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
          criado_em: string | null
          id: string | null
          jogador_apostado: string | null
          revelado: boolean | null
          usuario_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bolao_apostas_artilheiro_usuario_id_fkey"
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
          criado_em: string | null
          id: string | null
          revelado: boolean | null
          time1: string | null
          time2: string | null
          usuario_id: string | null
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
      bolao_palpites_publica: {
        Row: {
          acertou: boolean | null
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
      [_ in never]: never
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
