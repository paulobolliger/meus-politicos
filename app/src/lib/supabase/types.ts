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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acompanhamentos: {
        Row: {
          criado_em: string | null
          id: string
          politico_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          politico_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          politico_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acompanhamentos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acompanhamentos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      atuacao: {
        Row: {
          ano: number
          atualizado_em: string | null
          comissoes: number | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          discursos_total: number | null
          id: string
          media_presenca_casa: number | null
          media_projetos_casa: number | null
          media_relatorias_casa: number | null
          pareceres: number | null
          politico_id: string
          projetos_apresentados: number | null
          relatorias: number | null
          requerimentos: number | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          comissoes?: number | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          discursos_total?: number | null
          id?: string
          media_presenca_casa?: number | null
          media_projetos_casa?: number | null
          media_relatorias_casa?: number | null
          pareceres?: number | null
          politico_id: string
          projetos_apresentados?: number | null
          relatorias?: number | null
          requerimentos?: number | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          comissoes?: number | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          discursos_total?: number | null
          id?: string
          media_presenca_casa?: number | null
          media_projetos_casa?: number | null
          media_relatorias_casa?: number | null
          pareceres?: number | null
          politico_id?: string
          projetos_apresentados?: number | null
          relatorias?: number | null
          requerimentos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atuacao_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atuacao_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          atualizado_em: string | null
          bens_declarados: number | null
          candidaturas: number | null
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          collected_at: string | null
          cor_raca: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          eleicao_ano: number
          foto_atualizada_em: string | null
          foto_fonte: string | null
          foto_url: string | null
          genero: string | null
          ia_corrigido_em: string | null
          ia_corrigido_motivo: string | null
          ia_gerado_em: string | null
          ia_modelo: string | null
          ia_processado: boolean | null
          id: string
          id_tse: string | null
          mandatos_ant: number | null
          municipio_id: string | null
          nome: string
          nome_urna: string | null
          numero_urna: number | null
          partido_id: string | null
          perfil_tipo: Database["public"]["Enums"]["perfil_candidato"] | null
          politico_id: string | null
          proposta_resumo: Json | null
          proposta_temas: string[] | null
          proposta_url: string | null
          removido_em: string | null
          sequencial_tse: string | null
          situacao: Database["public"]["Enums"]["situacao_candidato"] | null
          slug: string
          source_id: string | null
          source_record_id: string | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          bens_declarados?: number | null
          candidaturas?: number | null
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          collected_at?: string | null
          cor_raca?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          eleicao_ano?: number
          foto_atualizada_em?: string | null
          foto_fonte?: string | null
          foto_url?: string | null
          genero?: string | null
          ia_corrigido_em?: string | null
          ia_corrigido_motivo?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          id_tse?: string | null
          mandatos_ant?: number | null
          municipio_id?: string | null
          nome: string
          nome_urna?: string | null
          numero_urna?: number | null
          partido_id?: string | null
          perfil_tipo?: Database["public"]["Enums"]["perfil_candidato"] | null
          politico_id?: string | null
          proposta_resumo?: Json | null
          proposta_temas?: string[] | null
          proposta_url?: string | null
          removido_em?: string | null
          sequencial_tse?: string | null
          situacao?: Database["public"]["Enums"]["situacao_candidato"] | null
          slug: string
          source_id?: string | null
          source_record_id?: string | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          bens_declarados?: number | null
          candidaturas?: number | null
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          collected_at?: string | null
          cor_raca?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          eleicao_ano?: number
          foto_atualizada_em?: string | null
          foto_fonte?: string | null
          foto_url?: string | null
          genero?: string | null
          ia_corrigido_em?: string | null
          ia_corrigido_motivo?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          id_tse?: string | null
          mandatos_ant?: number | null
          municipio_id?: string | null
          nome?: string
          nome_urna?: string | null
          numero_urna?: number | null
          partido_id?: string | null
          perfil_tipo?: Database["public"]["Enums"]["perfil_candidato"] | null
          politico_id?: string | null
          proposta_resumo?: Json | null
          proposta_temas?: string[] | null
          proposta_url?: string | null
          removido_em?: string | null
          sequencial_tse?: string | null
          situacao?: Database["public"]["Enums"]["situacao_candidato"] | null
          slug?: string
          source_id?: string | null
          source_record_id?: string | null
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidatos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidatos_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidatos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidatos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      candidaturas_historico: {
        Row: {
          atualizado_em: string | null
          candidato_id: string | null
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          cd_municipio_tse: number | null
          criado_em: string | null
          eleicao_ano: number
          id: string
          id_tse: string | null
          link_fonte: string | null
          municipio_id: string | null
          numero_urna: number | null
          partido_id: string | null
          percentual: number | null
          politico_id: string | null
          resultado: string
          sq_candidato: string | null
          uf: string | null
          votos: number | null
        }
        Insert: {
          atualizado_em?: string | null
          candidato_id?: string | null
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          cd_municipio_tse?: number | null
          criado_em?: string | null
          eleicao_ano: number
          id?: string
          id_tse?: string | null
          link_fonte?: string | null
          municipio_id?: string | null
          numero_urna?: number | null
          partido_id?: string | null
          percentual?: number | null
          politico_id?: string | null
          resultado: string
          sq_candidato?: string | null
          uf?: string | null
          votos?: number | null
        }
        Update: {
          atualizado_em?: string | null
          candidato_id?: string | null
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          cd_municipio_tse?: number | null
          criado_em?: string | null
          eleicao_ano?: number
          id?: string
          id_tse?: string | null
          link_fonte?: string | null
          municipio_id?: string | null
          numero_urna?: number | null
          partido_id?: string | null
          percentual?: number | null
          politico_id?: string | null
          resultado?: string
          sq_candidato?: string | null
          uf?: string | null
          votos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidaturas_historico_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidaturas_historico_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidaturas_historico_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidaturas_historico_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidaturas_historico_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      coletas_log: {
        Row: {
          concluido_em: string | null
          criado_em: string | null
          duracao_ms: number | null
          erros: number | null
          fonte: string
          id: string
          iniciado_em: string
          mensagem: string | null
          metadata: Json | null
          registros: number | null
          status: Database["public"]["Enums"]["coleta_status"]
          tipo: string
        }
        Insert: {
          concluido_em?: string | null
          criado_em?: string | null
          duracao_ms?: number | null
          erros?: number | null
          fonte: string
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          metadata?: Json | null
          registros?: number | null
          status: Database["public"]["Enums"]["coleta_status"]
          tipo: string
        }
        Update: {
          concluido_em?: string | null
          criado_em?: string | null
          duracao_ms?: number | null
          erros?: number | null
          fonte?: string
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          metadata?: Json | null
          registros?: number | null
          status?: Database["public"]["Enums"]["coleta_status"]
          tipo?: string
        }
        Relationships: []
      }
      correcoes: {
        Row: {
          candidato_id: string | null
          criado_em: string | null
          dado_correto: string
          dado_incorreto: string
          email_solicitante: string | null
          id: string
          link_fonte: string
          motivo_rejeicao: string | null
          nome_solicitante: string | null
          politico_id: string | null
          revisado_em: string | null
          revisado_por: string | null
          status: Database["public"]["Enums"]["correcao_status"] | null
        }
        Insert: {
          candidato_id?: string | null
          criado_em?: string | null
          dado_correto: string
          dado_incorreto: string
          email_solicitante?: string | null
          id?: string
          link_fonte: string
          motivo_rejeicao?: string | null
          nome_solicitante?: string | null
          politico_id?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["correcao_status"] | null
        }
        Update: {
          candidato_id?: string | null
          criado_em?: string | null
          dado_correto?: string
          dado_incorreto?: string
          email_solicitante?: string | null
          id?: string
          link_fonte?: string
          motivo_rejeicao?: string | null
          nome_solicitante?: string | null
          politico_id?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["correcao_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "correcoes_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correcoes_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correcoes_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      discursos: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          fase_sessao: string | null
          hora: string | null
          ia_gerado_em: string | null
          ia_modelo: string | null
          ia_processado: boolean | null
          id: string
          impacto_nivel: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string
          politico_id: string
          removido_em: string | null
          resumo: string | null
          tema_id: string | null
          tipo: string | null
          transcricao_url: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          fase_sessao?: string | null
          hora?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string
          politico_id: string
          removido_em?: string | null
          resumo?: string | null
          tema_id?: string | null
          tipo?: string | null
          transcricao_url?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data?: string
          fase_sessao?: string | null
          hora?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string
          politico_id?: string
          removido_em?: string | null
          resumo?: string | null
          tema_id?: string | null
          tipo?: string | null
          transcricao_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discursos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discursos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discursos_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      emendas: {
        Row: {
          ano: number
          area: string | null
          atualizado_em: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          descricao: string | null
          id: string
          link_fonte: string
          municipio_destino: string | null
          municipio_id: string | null
          politico_id: string
          uf_destino: string | null
          valor: number
        }
        Insert: {
          ano: number
          area?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          descricao?: string | null
          id?: string
          link_fonte: string
          municipio_destino?: string | null
          municipio_id?: string | null
          politico_id: string
          uf_destino?: string | null
          valor: number
        }
        Update: {
          ano?: number
          area?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          descricao?: string | null
          id?: string
          link_fonte?: string
          municipio_destino?: string | null
          municipio_id?: string | null
          politico_id?: string
          uf_destino?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "emendas_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emendas_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emendas_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      feed_eventos: {
        Row: {
          atualizado_em: string | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          descricao: string | null
          descricao_simples: string | null
          id: string
          impacto_nivel: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string | null
          metadata: Json | null
          politico_id: string
          source_id: string | null
          source_record_id: string | null
          tema_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          descricao?: string | null
          descricao_simples?: string | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string | null
          metadata?: Json | null
          politico_id: string
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data?: string
          descricao?: string | null
          descricao_simples?: string | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string | null
          metadata?: Json | null
          politico_id?: string
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_eventos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_eventos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_eventos_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          ano: number
          atualizado_em: string | null
          categoria: string | null
          cnpj_cpf: string | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          descricao: string | null
          fornecedor: string | null
          id: string
          impacto_nivel: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string
          mes: number
          politico_id: string
          source_id: string | null
          source_record_id: string | null
          valor: number
          valor_glosa: number | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          categoria?: string | null
          cnpj_cpf?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string
          mes: number
          politico_id: string
          source_id?: string | null
          source_record_id?: string | null
          valor: number
          valor_glosa?: number | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          categoria?: string | null
          cnpj_cpf?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string
          mes?: number
          politico_id?: string
          source_id?: string | null
          source_record_id?: string | null
          valor?: number
          valor_glosa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          atualizado_em: string | null
          cd_municipio_tse: number | null
          codigo_ibge: number
          criado_em: string | null
          id: string
          nome: string
          populacao: number | null
          regiao: string | null
          uf: string
        }
        Insert: {
          atualizado_em?: string | null
          cd_municipio_tse?: number | null
          codigo_ibge: number
          criado_em?: string | null
          id?: string
          nome: string
          populacao?: number | null
          regiao?: string | null
          uf: string
        }
        Update: {
          atualizado_em?: string | null
          cd_municipio_tse?: number | null
          codigo_ibge?: number
          criado_em?: string | null
          id?: string
          nome?: string
          populacao?: number | null
          regiao?: string | null
          uf?: string
        }
        Relationships: []
      }
      partidos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cor: string | null
          criado_em: string | null
          id: string
          logo_url: string | null
          nome: string
          numero: number | null
          sigla: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cor?: string | null
          criado_em?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          numero?: number | null
          sigla: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cor?: string | null
          criado_em?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          numero?: number | null
          sigla?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          id: string
          municipio: string | null
          nome: string | null
          notif_candidato: boolean | null
          notif_falta: boolean | null
          notif_gasto: boolean | null
          notif_partido: boolean | null
          notif_votacao: boolean | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          id: string
          municipio?: string | null
          nome?: string | null
          notif_candidato?: boolean | null
          notif_falta?: boolean | null
          notif_gasto?: boolean | null
          notif_partido?: boolean | null
          notif_votacao?: boolean | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          municipio?: string | null
          nome?: string | null
          notif_candidato?: boolean | null
          notif_falta?: boolean | null
          notif_gasto?: boolean | null
          notif_partido?: boolean | null
          notif_votacao?: boolean | null
          uf?: string | null
        }
        Relationships: []
      }
      politico_ids: {
        Row: {
          criado_em: string | null
          id: string
          idecadastro: number
          politico_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          idecadastro: number
          politico_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          idecadastro?: number
          politico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politico_ids_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politico_ids_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      politico_partidos: {
        Row: {
          criado_em: string | null
          fim: string | null
          id: string
          inicio: string
          motivo: string | null
          partido_id: string
          politico_id: string
        }
        Insert: {
          criado_em?: string | null
          fim?: string | null
          id?: string
          inicio: string
          motivo?: string | null
          partido_id: string
          politico_id: string
        }
        Update: {
          criado_em?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          motivo?: string | null
          partido_id?: string
          politico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politico_partidos_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politico_partidos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politico_partidos_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      politico_senado_ids: {
        Row: {
          criado_em: string | null
          id: string
          id_senado: number
          match_confidence: number
          politico_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_senado: number
          match_confidence: number
          politico_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_senado?: number
          match_confidence?: number
          politico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politico_senado_ids_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politico_senado_ids_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      politicos: {
        Row: {
          atualizado_em: string | null
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          codigo_siafi: string | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          data_nascimento: string | null
          email: string | null
          escolaridade: string | null
          foto_atualizada_em: string | null
          foto_fonte: string | null
          foto_url: string | null
          gasto_total_ano: number | null
          id: string
          id_camara: number | null
          id_senado: number | null
          id_tse: string | null
          mandato_fim: string | null
          mandato_inicio: string | null
          municipio_id: string | null
          naturalidade: string | null
          nome: string
          nome_civil: string | null
          nome_eleitoral: string | null
          numero_mandato: number | null
          ocupacao: string | null
          partido_id: string | null
          presenca_pct_atual: number | null
          removido_em: string | null
          situacao: Database["public"]["Enums"]["situacao_politico"] | null
          slug: string
          source_id: string | null
          source_record_id: string | null
          total_votacoes: number | null
          uf: string
        }
        Insert: {
          atualizado_em?: string | null
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          codigo_siafi?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data_nascimento?: string | null
          email?: string | null
          escolaridade?: string | null
          foto_atualizada_em?: string | null
          foto_fonte?: string | null
          foto_url?: string | null
          gasto_total_ano?: number | null
          id?: string
          id_camara?: number | null
          id_senado?: number | null
          id_tse?: string | null
          mandato_fim?: string | null
          mandato_inicio?: string | null
          municipio_id?: string | null
          naturalidade?: string | null
          nome: string
          nome_civil?: string | null
          nome_eleitoral?: string | null
          numero_mandato?: number | null
          ocupacao?: string | null
          partido_id?: string | null
          presenca_pct_atual?: number | null
          removido_em?: string | null
          situacao?: Database["public"]["Enums"]["situacao_politico"] | null
          slug: string
          source_id?: string | null
          source_record_id?: string | null
          total_votacoes?: number | null
          uf: string
        }
        Update: {
          atualizado_em?: string | null
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          codigo_siafi?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data_nascimento?: string | null
          email?: string | null
          escolaridade?: string | null
          foto_atualizada_em?: string | null
          foto_fonte?: string | null
          foto_url?: string | null
          gasto_total_ano?: number | null
          id?: string
          id_camara?: number | null
          id_senado?: number | null
          id_tse?: string | null
          mandato_fim?: string | null
          mandato_inicio?: string | null
          municipio_id?: string | null
          naturalidade?: string | null
          nome?: string
          nome_civil?: string | null
          nome_eleitoral?: string | null
          numero_mandato?: number | null
          ocupacao?: string | null
          partido_id?: string | null
          presenca_pct_atual?: number | null
          removido_em?: string | null
          situacao?: Database["public"]["Enums"]["situacao_politico"] | null
          slug?: string
          source_id?: string | null
          source_record_id?: string | null
          total_votacoes?: number | null
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "politicos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politicos_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
        ]
      }
      presenca: {
        Row: {
          ano: number
          atualizado_em: string | null
          ausencias: number | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          id: string
          mes: number | null
          percentual: number
          politico_id: string
          presencas: number
          source_id: string | null
          source_record_id: string | null
          total_sessoes: number
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          ausencias?: number | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          id?: string
          mes?: number | null
          percentual: number
          politico_id: string
          presencas: number
          source_id?: string | null
          source_record_id?: string | null
          total_sessoes: number
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          ausencias?: number | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          id?: string
          mes?: number | null
          percentual?: number
          politico_id?: string
          presencas?: number
          source_id?: string | null
          source_record_id?: string | null
          total_sessoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "presenca_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presenca_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_senado: {
        Row: {
          checksum: string
          collected_at: string
          endpoint: string
          error_message: string | null
          id: string
          params: Json | null
          parse_status: Database["public"]["Enums"]["parse_status_tipo"] | null
          parsed_at: string | null
          response_xml: string
        }
        Insert: {
          checksum: string
          collected_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          params?: Json | null
          parse_status?: Database["public"]["Enums"]["parse_status_tipo"] | null
          parsed_at?: string | null
          response_xml: string
        }
        Update: {
          checksum?: string
          collected_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          params?: Json | null
          parse_status?: Database["public"]["Enums"]["parse_status_tipo"] | null
          parsed_at?: string | null
          response_xml?: string
        }
        Relationships: []
      }
      redes_sociais: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          handle: string | null
          id: string
          plataforma: string
          politico_id: string
          removido_em: string | null
          url: string
          verificado: boolean | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          handle?: string | null
          id?: string
          plataforma: string
          politico_id: string
          removido_em?: string | null
          url: string
          verificado?: boolean | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          handle?: string | null
          id?: string
          plataforma?: string
          politico_id?: string
          removido_em?: string | null
          url?: string
          verificado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "redes_sociais_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redes_sociais_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      senado_comissoes: {
        Row: {
          atualizado_em: string | null
          cargo: string | null
          collected_at: string | null
          criado_em: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          nome_comissao: string | null
          senador_id: string
          sigla_comissao: string
          source_id: string | null
          source_record_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          cargo?: string | null
          collected_at?: string | null
          criado_em?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome_comissao?: string | null
          senador_id: string
          sigla_comissao: string
          source_id?: string | null
          source_record_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          cargo?: string | null
          collected_at?: string | null
          criado_em?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome_comissao?: string | null
          senador_id?: string
          sigla_comissao?: string
          source_id?: string | null
          source_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "senado_comissoes_senador_id_fkey"
            columns: ["senador_id"]
            isOneToOne: false
            referencedRelation: "senadores"
            referencedColumns: ["id"]
          },
        ]
      }
      senado_discursos: {
        Row: {
          atualizado_em: string | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          fase_sessao: string | null
          hora: string | null
          ia_gerado_em: string | null
          ia_modelo: string | null
          ia_processado: boolean | null
          id: string
          impacto_nivel: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string | null
          removido_em: string | null
          resumo: string | null
          senador_id: string
          source_id: string | null
          source_record_id: string | null
          tema_id: string | null
          tipo: string | null
          transcricao_url: string | null
        }
        Insert: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          fase_sessao?: string | null
          hora?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string | null
          removido_em?: string | null
          resumo?: string | null
          senador_id: string
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          tipo?: string | null
          transcricao_url?: string | null
        }
        Update: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data?: string
          fase_sessao?: string | null
          hora?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string | null
          removido_em?: string | null
          resumo?: string | null
          senador_id?: string
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          tipo?: string | null
          transcricao_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "senado_discursos_senador_id_fkey"
            columns: ["senador_id"]
            isOneToOne: false
            referencedRelation: "senadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "senado_discursos_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      senado_materias: {
        Row: {
          ano: number | null
          atualizado_em: string | null
          codigo_materia: string
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          data_apresentacao: string | null
          ementa: string | null
          ementa_simples: string | null
          id: string
          link_fonte: string | null
          numero: number | null
          senador_id: string | null
          situacao: string | null
          source_id: string | null
          source_record_id: string | null
          tema_id: string | null
          tipo: string
        }
        Insert: {
          ano?: number | null
          atualizado_em?: string | null
          codigo_materia: string
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data_apresentacao?: string | null
          ementa?: string | null
          ementa_simples?: string | null
          id?: string
          link_fonte?: string | null
          numero?: number | null
          senador_id?: string | null
          situacao?: string | null
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          tipo: string
        }
        Update: {
          ano?: number | null
          atualizado_em?: string | null
          codigo_materia?: string
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data_apresentacao?: string | null
          ementa?: string | null
          ementa_simples?: string | null
          id?: string
          link_fonte?: string | null
          numero?: number | null
          senador_id?: string | null
          situacao?: string | null
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "senado_materias_senador_id_fkey"
            columns: ["senador_id"]
            isOneToOne: false
            referencedRelation: "senadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "senado_materias_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      senado_sessoes: {
        Row: {
          atualizado_em: string | null
          codigo_sessao: string
          collected_at: string | null
          criado_em: string | null
          data: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          legislatura: number | null
          numero_sessao: number | null
          situacao: string | null
          source_id: string | null
          source_record_id: string | null
          tipo_sessao: string | null
        }
        Insert: {
          atualizado_em?: string | null
          codigo_sessao: string
          collected_at?: string | null
          criado_em?: string | null
          data: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          legislatura?: number | null
          numero_sessao?: number | null
          situacao?: string | null
          source_id?: string | null
          source_record_id?: string | null
          tipo_sessao?: string | null
        }
        Update: {
          atualizado_em?: string | null
          codigo_sessao?: string
          collected_at?: string | null
          criado_em?: string | null
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          legislatura?: number | null
          numero_sessao?: number | null
          situacao?: string | null
          source_id?: string | null
          source_record_id?: string | null
          tipo_sessao?: string | null
        }
        Relationships: []
      }
      senado_votacoes: {
        Row: {
          atualizado_em: string | null
          codigo_sessao: string | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          descricao: string | null
          descricao_simples: string | null
          hora: string | null
          id: string
          impacto_nivel: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string | null
          proposicao: string | null
          proposicao_id: string | null
          senador_id: string
          source_id: string | null
          source_record_id: string | null
          tema_id: string | null
          voto: Database["public"]["Enums"]["voto_tipo"]
        }
        Insert: {
          atualizado_em?: string | null
          codigo_sessao?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          descricao?: string | null
          descricao_simples?: string | null
          hora?: string | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string | null
          proposicao?: string | null
          proposicao_id?: string | null
          senador_id: string
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          voto: Database["public"]["Enums"]["voto_tipo"]
        }
        Update: {
          atualizado_em?: string | null
          codigo_sessao?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data?: string
          descricao?: string | null
          descricao_simples?: string | null
          hora?: string | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte?: string | null
          proposicao?: string | null
          proposicao_id?: string | null
          senador_id?: string
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          voto?: Database["public"]["Enums"]["voto_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "senado_votacoes_senador_id_fkey"
            columns: ["senador_id"]
            isOneToOne: false
            referencedRelation: "senadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "senado_votacoes_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      senadores: {
        Row: {
          atualizado_em: string | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          email: string | null
          foto_url: string | null
          id: string
          id_senado: number
          is_current: boolean | null
          mandato_fim: string | null
          mandato_inicio: string | null
          nome: string
          nome_completo: string | null
          partido_id: string | null
          politico_id: string | null
          removido_em: string | null
          source_id: string | null
          source_record_id: string | null
          uf: string
        }
        Insert: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          email?: string | null
          foto_url?: string | null
          id?: string
          id_senado: number
          is_current?: boolean | null
          mandato_fim?: string | null
          mandato_inicio?: string | null
          nome: string
          nome_completo?: string | null
          partido_id?: string | null
          politico_id?: string | null
          removido_em?: string | null
          source_id?: string | null
          source_record_id?: string | null
          uf: string
        }
        Update: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          email?: string | null
          foto_url?: string | null
          id?: string
          id_senado?: number
          is_current?: boolean | null
          mandato_fim?: string | null
          mandato_inicio?: string | null
          nome?: string
          nome_completo?: string | null
          partido_id?: string | null
          politico_id?: string | null
          removido_em?: string | null
          source_id?: string | null
          source_record_id?: string | null
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "senadores_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "senadores_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "senadores_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
        ]
      }
      temas: {
        Row: {
          cor: string | null
          criado_em: string | null
          icone: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          cor?: string | null
          criado_em?: string | null
          icone?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          cor?: string | null
          criado_em?: string | null
          icone?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      votacoes: {
        Row: {
          atualizado_em: string | null
          collected_at: string | null
          criado_em: string | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          descricao: string | null
          descricao_simples: string | null
          hora: string | null
          ia_corrigido_em: string | null
          ia_corrigido_motivo: string | null
          ia_gerado_em: string | null
          ia_modelo: string | null
          ia_processado: boolean | null
          id: string
          impacto_nivel: Database["public"]["Enums"]["impacto_nivel"] | null
          legislatura: number | null
          link_fonte: string
          politico_id: string
          proposicao: string | null
          proposicao_id: string | null
          source_id: string | null
          source_record_id: string | null
          tema_id: string | null
          voto: Database["public"]["Enums"]["voto_tipo"]
        }
        Insert: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data: string
          descricao?: string | null
          descricao_simples?: string | null
          hora?: string | null
          ia_corrigido_em?: string | null
          ia_corrigido_motivo?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          legislatura?: number | null
          link_fonte: string
          politico_id: string
          proposicao?: string | null
          proposicao_id?: string | null
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          voto: Database["public"]["Enums"]["voto_tipo"]
        }
        Update: {
          atualizado_em?: string | null
          collected_at?: string | null
          criado_em?: string | null
          dado_estado?: Database["public"]["Enums"]["dado_estado"] | null
          data?: string
          descricao?: string | null
          descricao_simples?: string | null
          hora?: string | null
          ia_corrigido_em?: string | null
          ia_corrigido_motivo?: string | null
          ia_gerado_em?: string | null
          ia_modelo?: string | null
          ia_processado?: boolean | null
          id?: string
          impacto_nivel?: Database["public"]["Enums"]["impacto_nivel"] | null
          legislatura?: number | null
          link_fonte?: string
          politico_id?: string
          proposicao?: string | null
          proposicao_id?: string | null
          source_id?: string | null
          source_record_id?: string | null
          tema_id?: string | null
          voto?: Database["public"]["Enums"]["voto_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "votacoes_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "politicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votacoes_politico_id_fkey"
            columns: ["politico_id"]
            isOneToOne: false
            referencedRelation: "resumo_politico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votacoes_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      feed_usuario: {
        Row: {
          cargo: Database["public"]["Enums"]["cargo_tipo"] | null
          data: string | null
          descricao: string | null
          detalhe: string | null
          evento_id: string | null
          foto_url: string | null
          impacto_nivel: Database["public"]["Enums"]["impacto_nivel"] | null
          link_fonte: string | null
          partido: string | null
          politico_id: string | null
          politico_nome: string | null
          tema: string | null
          tema_cor: string | null
          tema_icone: string | null
          tipo_evento: string | null
          usuario_id: string | null
        }
        Relationships: []
      }
      fila_ia_pendente: {
        Row: {
          data_registro: string | null
          ia_gerado_em: string | null
          ia_modelo: string | null
          item_id: string | null
          politico_nome: string | null
          referencia: string | null
          tipo: string | null
        }
        Relationships: []
      }
      resumo_politico: {
        Row: {
          atualizado_em: string | null
          cargo: Database["public"]["Enums"]["cargo_tipo"] | null
          dado_estado: Database["public"]["Enums"]["dado_estado"] | null
          foto_url: string | null
          gasto_total_ano: number | null
          id: string | null
          mandato_fim: string | null
          mandato_inicio: string | null
          nome: string | null
          numero_mandato: number | null
          partido: string | null
          partido_cor: string | null
          presenca_pct: number | null
          situacao: Database["public"]["Enums"]["situacao_politico"] | null
          slug: string | null
          total_seguidores: number | null
          total_votacoes: number | null
          uf: string | null
        }
        Relationships: []
      }
      ultima_coleta_por_fonte: {
        Row: {
          concluido_em: string | null
          duracao_ms: number | null
          erros: number | null
          fonte: string | null
          iniciado_em: string | null
          mensagem: string | null
          registros: number | null
          status: Database["public"]["Enums"]["coleta_status"] | null
          tipo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cargo_tipo:
        | "presidente"
        | "vice_presidente"
        | "governador"
        | "vice_governador"
        | "senador"
        | "deputado_federal"
        | "deputado_estadual"
        | "prefeito"
        | "vice_prefeito"
        | "vereador"
      coleta_status: "ok" | "atrasado" | "falhou" | "em_andamento"
      correcao_status: "pendente" | "aprovado" | "rejeitado" | "arquivado"
      dado_estado:
        | "oficial"
        | "parcial"
        | "atrasado"
        | "em_processamento"
        | "indisponivel"
      impacto_nivel: "1" | "2" | "3" | "4"
      parse_status_tipo: "pending" | "parsed" | "error"
      perfil_candidato: "em_exercicio" | "ex_mandatario" | "sem_mandato"
      situacao_candidato: "deferido" | "indeferido" | "cassado" | "pendente"
      situacao_politico:
        | "ativo"
        | "licenciado"
        | "suplente"
        | "afastado"
        | "inativo"
      voto_tipo:
        | "sim"
        | "nao"
        | "abstencao"
        | "ausente"
        | "obstrucao"
        | "artigo_17"
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
    Enums: {
      cargo_tipo: [
        "presidente",
        "vice_presidente",
        "governador",
        "vice_governador",
        "senador",
        "deputado_federal",
        "deputado_estadual",
        "prefeito",
        "vice_prefeito",
        "vereador",
      ],
      coleta_status: ["ok", "atrasado", "falhou", "em_andamento"],
      correcao_status: ["pendente", "aprovado", "rejeitado", "arquivado"],
      dado_estado: [
        "oficial",
        "parcial",
        "atrasado",
        "em_processamento",
        "indisponivel",
      ],
      impacto_nivel: ["1", "2", "3", "4"],
      parse_status_tipo: ["pending", "parsed", "error"],
      perfil_candidato: ["em_exercicio", "ex_mandatario", "sem_mandato"],
      situacao_candidato: ["deferido", "indeferido", "cassado", "pendente"],
      situacao_politico: [
        "ativo",
        "licenciado",
        "suplente",
        "afastado",
        "inativo",
      ],
      voto_tipo: [
        "sim",
        "nao",
        "abstencao",
        "ausente",
        "obstrucao",
        "artigo_17",
      ],
    },
  },
} as const
