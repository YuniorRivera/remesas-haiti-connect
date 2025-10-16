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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          address_old: string
          agente_id: string | null
          business_type: string | null
          code: string | null
          contrato_url: string | null
          created_at: string
          cuenta_bancaria_encriptada: string | null
          daily_limit_dop: number | null
          float_balance_dop: number | null
          float_balance_dop_old: number
          gps_coords_legacy: string | null
          gps_lat: number | null
          gps_lon: number | null
          id: string
          is_active: boolean | null
          is_active_old: boolean
          kyb_status: Database["public"]["Enums"]["verification_status"] | null
          kyb_verified_at: string | null
          kyb_verified_by: string | null
          legal_name: string | null
          nombre_comercial: string | null
          owner_user_id: string | null
          razon_social: string | null
          rnc: string | null
          telefono: string | null
          trade_name: string | null
          trade_name_old: string
          updated_at: string
        }
        Insert: {
          address_old: string
          agente_id?: string | null
          business_type?: string | null
          code?: string | null
          contrato_url?: string | null
          created_at?: string
          cuenta_bancaria_encriptada?: string | null
          daily_limit_dop?: number | null
          float_balance_dop?: number | null
          float_balance_dop_old?: number
          gps_coords_legacy?: string | null
          gps_lat?: number | null
          gps_lon?: number | null
          id?: string
          is_active?: boolean | null
          is_active_old?: boolean
          kyb_status?: Database["public"]["Enums"]["verification_status"] | null
          kyb_verified_at?: string | null
          kyb_verified_by?: string | null
          legal_name?: string | null
          nombre_comercial?: string | null
          owner_user_id?: string | null
          razon_social?: string | null
          rnc?: string | null
          telefono?: string | null
          trade_name?: string | null
          trade_name_old: string
          updated_at?: string
        }
        Update: {
          address_old?: string
          agente_id?: string | null
          business_type?: string | null
          code?: string | null
          contrato_url?: string | null
          created_at?: string
          cuenta_bancaria_encriptada?: string | null
          daily_limit_dop?: number | null
          float_balance_dop?: number | null
          float_balance_dop_old?: number
          gps_coords_legacy?: string | null
          gps_lat?: number | null
          gps_lon?: number | null
          id?: string
          is_active?: boolean | null
          is_active_old?: boolean
          kyb_status?: Database["public"]["Enums"]["verification_status"] | null
          kyb_verified_at?: string | null
          kyb_verified_by?: string | null
          legal_name?: string | null
          nombre_comercial?: string | null
          owner_user_id?: string | null
          razon_social?: string | null
          rnc?: string | null
          telefono?: string | null
          trade_name?: string | null
          trade_name_old?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fees_matrix: {
        Row: {
          acquiring_dop: number
          channel: Database["public"]["Enums"]["channel_type"]
          corridor: string | null
          created_at: string
          effective_from: string
          fixed_fee_dop: number
          fx_dop_htg_mid: number
          fx_usd_dop: number
          gov_fee_usd: number | null
          id: string
          is_active: boolean | null
          min_partner_fee_htg: number
          notes: string | null
          partner_fee_flat_htg: number
          partner_fee_percent: number
          percent_fee_client: number
          platform_commission_pct: number
          spread_bps: number
          store_commission_pct: number
        }
        Insert: {
          acquiring_dop: number
          channel: Database["public"]["Enums"]["channel_type"]
          corridor?: string | null
          created_at?: string
          effective_from?: string
          fixed_fee_dop: number
          fx_dop_htg_mid: number
          fx_usd_dop: number
          gov_fee_usd?: number | null
          id?: string
          is_active?: boolean | null
          min_partner_fee_htg: number
          notes?: string | null
          partner_fee_flat_htg: number
          partner_fee_percent: number
          percent_fee_client: number
          platform_commission_pct: number
          spread_bps: number
          store_commission_pct: number
        }
        Update: {
          acquiring_dop?: number
          channel?: Database["public"]["Enums"]["channel_type"]
          corridor?: string | null
          created_at?: string
          effective_from?: string
          fixed_fee_dop?: number
          fx_dop_htg_mid?: number
          fx_usd_dop?: number
          gov_fee_usd?: number | null
          id?: string
          is_active?: boolean | null
          min_partner_fee_htg?: number
          notes?: string | null
          partner_fee_flat_htg?: number
          partner_fee_percent?: number
          percent_fee_client?: number
          platform_commission_pct?: number
          spread_bps?: number
          store_commission_pct?: number
        }
        Relationships: []
      }
      kyb_documents: {
        Row: {
          agent_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "kyb_documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyb_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_number?: string | null
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          agent_id: string | null
          code: string
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          agent_id?: string | null
          code: string
          created_at?: string
          currency: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          agent_id?: string | null
          code?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          credit_account: string
          currency: string
          debit_account: string
          entry_at: string
          id: string
          memo: string | null
          txn_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          credit_account: string
          currency: string
          debit_account: string
          entry_at?: string
          id?: string
          memo?: string | null
          txn_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          credit_account?: string
          currency?: string
          debit_account?: string
          entry_at?: string
          id?: string
          memo?: string | null
          txn_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_credit_account_fkey"
            columns: ["credit_account"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_debit_account_fkey"
            columns: ["debit_account"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      limits: {
        Row: {
          amount_dop: number | null
          count_limit: number | null
          created_at: string
          created_by: string | null
          effective_from: string
          effective_until: string | null
          entity_id: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          limit_type: string
          updated_at: string
        }
        Insert: {
          amount_dop?: number | null
          count_limit?: number | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          limit_type: string
          updated_at?: string
        }
        Update: {
          amount_dop?: number | null
          count_limit?: number | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          limit_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_id: string | null
          created_at: string
          direccion: string | null
          documento_identidad: string | null
          full_name: string
          id: string
          kyc_level: Database["public"]["Enums"]["kyc_level"] | null
          kyc_status: Database["public"]["Enums"]["verification_status"] | null
          kyc_verified_at: string | null
          kyc_verified_by: string | null
          phone: string | null
          selfie_url: string | null
          tipo_documento: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          direccion?: string | null
          documento_identidad?: string | null
          full_name: string
          id: string
          kyc_level?: Database["public"]["Enums"]["kyc_level"] | null
          kyc_status?: Database["public"]["Enums"]["verification_status"] | null
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          phone?: string | null
          selfie_url?: string | null
          tipo_documento?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          direccion?: string | null
          documento_identidad?: string | null
          full_name?: string
          id?: string
          kyc_level?: Database["public"]["Enums"]["kyc_level"] | null
          kyc_status?: Database["public"]["Enums"]["verification_status"] | null
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          phone?: string | null
          selfie_url?: string | null
          tipo_documento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliations: {
        Row: {
          created_at: string
          data_json: Json | null
          file_ref: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          source: Database["public"]["Enums"]["reconciliation_source"]
          status: string | null
          variance_dop: number | null
        }
        Insert: {
          created_at?: string
          data_json?: Json | null
          file_ref?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          source: Database["public"]["Enums"]["reconciliation_source"]
          status?: string | null
          variance_dop?: number | null
        }
        Update: {
          created_at?: string
          data_json?: Json | null
          file_ref?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          source?: Database["public"]["Enums"]["reconciliation_source"]
          status?: string | null
          variance_dop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      remittance_events: {
        Row: {
          actor_id: string | null
          actor_type: Database["public"]["Enums"]["actor_type"]
          created_at: string
          event: string
          event_at: string
          id: string
          meta: Json | null
          remittance_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type: Database["public"]["Enums"]["actor_type"]
          created_at?: string
          event: string
          event_at?: string
          id?: string
          meta?: Json | null
          remittance_id: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: Database["public"]["Enums"]["actor_type"]
          created_at?: string
          event?: string
          event_at?: string
          id?: string
          meta?: Json | null
          remittance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remittance_events_remittance_id_fkey"
            columns: ["remittance_id"]
            isOneToOne: false
            referencedRelation: "remittances"
            referencedColumns: ["id"]
          },
        ]
      }
      remittances: {
        Row: {
          acquiring_cost_dop: number | null
          agent_id: string | null
          agent_id_legacy: string | null
          agente_id: string | null
          beneficiario_documento: string | null
          beneficiario_nombre: string
          beneficiario_telefono: string | null
          channel: Database["public"]["Enums"]["channel_type"] | null
          client_fee_fixed_dop: number | null
          client_fee_pct_dop: number | null
          codigo_referencia: string
          comision_agente: number
          completada_at: string | null
          confirmed_at: string | null
          created_at: string
          emisor_documento: string | null
          emisor_id: string | null
          emisor_nombre: string
          emisor_telefono: string | null
          estado: Database["public"]["Enums"]["transaction_status"]
          failed_at: string | null
          fx_client_sell: number | null
          fx_mid_dop_htg: number | null
          fx_spread_rev_dop: number | null
          gov_fee_dop: number | null
          htg_before_partner: number | null
          htg_to_beneficiary: number | null
          id: string
          margen_plataforma: number
          memo: string | null
          monto_recibido_htg: number
          origin_cashier_user: string | null
          origin_device_fingerprint: string | null
          origin_ip: string | null
          origin_terminal_id: string | null
          paid_at: string | null
          partner_cost_dop_equiv: number | null
          partner_fee_htg: number | null
          payout_address: string | null
          payout_agent_code: string | null
          payout_agent_name: string | null
          payout_city: string | null
          payout_country: string | null
          payout_lat: number | null
          payout_lon: number | null
          payout_network: string | null
          payout_operator_id: string | null
          payout_receipt_num: string | null
          platform_commission_dop: number | null
          platform_gross_margin_dop: number | null
          principal_dop: number
          quoted_at: string | null
          receipt_hash: string | null
          refunded_at: string | null
          sent_at: string | null
          settled_at: string | null
          state: Database["public"]["Enums"]["remittance_state"] | null
          tasa_cambio: number
          total_client_fees_dop: number | null
          total_client_pays_dop: number | null
        }
        Insert: {
          acquiring_cost_dop?: number | null
          agent_id?: string | null
          agent_id_legacy?: string | null
          agente_id?: string | null
          beneficiario_documento?: string | null
          beneficiario_nombre: string
          beneficiario_telefono?: string | null
          channel?: Database["public"]["Enums"]["channel_type"] | null
          client_fee_fixed_dop?: number | null
          client_fee_pct_dop?: number | null
          codigo_referencia: string
          comision_agente?: number
          completada_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          emisor_documento?: string | null
          emisor_id?: string | null
          emisor_nombre: string
          emisor_telefono?: string | null
          estado?: Database["public"]["Enums"]["transaction_status"]
          failed_at?: string | null
          fx_client_sell?: number | null
          fx_mid_dop_htg?: number | null
          fx_spread_rev_dop?: number | null
          gov_fee_dop?: number | null
          htg_before_partner?: number | null
          htg_to_beneficiary?: number | null
          id?: string
          margen_plataforma?: number
          memo?: string | null
          monto_recibido_htg: number
          origin_cashier_user?: string | null
          origin_device_fingerprint?: string | null
          origin_ip?: string | null
          origin_terminal_id?: string | null
          paid_at?: string | null
          partner_cost_dop_equiv?: number | null
          partner_fee_htg?: number | null
          payout_address?: string | null
          payout_agent_code?: string | null
          payout_agent_name?: string | null
          payout_city?: string | null
          payout_country?: string | null
          payout_lat?: number | null
          payout_lon?: number | null
          payout_network?: string | null
          payout_operator_id?: string | null
          payout_receipt_num?: string | null
          platform_commission_dop?: number | null
          platform_gross_margin_dop?: number | null
          principal_dop: number
          quoted_at?: string | null
          receipt_hash?: string | null
          refunded_at?: string | null
          sent_at?: string | null
          settled_at?: string | null
          state?: Database["public"]["Enums"]["remittance_state"] | null
          tasa_cambio: number
          total_client_fees_dop?: number | null
          total_client_pays_dop?: number | null
        }
        Update: {
          acquiring_cost_dop?: number | null
          agent_id?: string | null
          agent_id_legacy?: string | null
          agente_id?: string | null
          beneficiario_documento?: string | null
          beneficiario_nombre?: string
          beneficiario_telefono?: string | null
          channel?: Database["public"]["Enums"]["channel_type"] | null
          client_fee_fixed_dop?: number | null
          client_fee_pct_dop?: number | null
          codigo_referencia?: string
          comision_agente?: number
          completada_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          emisor_documento?: string | null
          emisor_id?: string | null
          emisor_nombre?: string
          emisor_telefono?: string | null
          estado?: Database["public"]["Enums"]["transaction_status"]
          failed_at?: string | null
          fx_client_sell?: number | null
          fx_mid_dop_htg?: number | null
          fx_spread_rev_dop?: number | null
          gov_fee_dop?: number | null
          htg_before_partner?: number | null
          htg_to_beneficiary?: number | null
          id?: string
          margen_plataforma?: number
          memo?: string | null
          monto_recibido_htg?: number
          origin_cashier_user?: string | null
          origin_device_fingerprint?: string | null
          origin_ip?: string | null
          origin_terminal_id?: string | null
          paid_at?: string | null
          partner_cost_dop_equiv?: number | null
          partner_fee_htg?: number | null
          payout_address?: string | null
          payout_agent_code?: string | null
          payout_agent_name?: string | null
          payout_city?: string | null
          payout_country?: string | null
          payout_lat?: number | null
          payout_lon?: number | null
          payout_network?: string | null
          payout_operator_id?: string | null
          payout_receipt_num?: string | null
          platform_commission_dop?: number | null
          platform_gross_margin_dop?: number | null
          principal_dop?: number
          quoted_at?: string | null
          receipt_hash?: string | null
          refunded_at?: string | null
          sent_at?: string | null
          settled_at?: string | null
          state?: Database["public"]["Enums"]["remittance_state"] | null
          tasa_cambio?: number
          total_client_fees_dop?: number | null
          total_client_pays_dop?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "remittances_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_origin_cashier_user_fkey"
            columns: ["origin_cashier_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_tienda_id_fkey"
            columns: ["agent_id_legacy"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_flags: {
        Row: {
          auto_generated: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          flag_type: string
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          auto_generated?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          flag_type: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
        }
        Update: {
          auto_generated?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          flag_type?: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_transaction_for_agent: {
        Args: { transaction_id: string }
        Returns: {
          beneficiario_nombre: string
          codigo_referencia: string
          comision_agente: number
          completada_at: string
          created_at: string
          emisor_nombre: string
          estado: Database["public"]["Enums"]["transaction_status"]
          id: string
          monto_enviado_dop: number
          monto_recibido_htg: number
          tasa_cambio: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      actor_type: "USER" | "SYSTEM" | "ADMIN" | "AGENT"
      app_role:
        | "admin"
        | "agent_owner"
        | "agent_clerk"
        | "compliance_officer"
        | "sender_user"
      channel_type: "MONCASH" | "SPIH"
      doc_type:
        | "CEDULA"
        | "PASSPORT"
        | "RNC"
        | "CONTRACT"
        | "SELFIE"
        | "BUSINESS_LICENSE"
        | "BANK_STATEMENT"
      kyc_level: "L1" | "L2" | "L3"
      reconciliation_source: "BANK" | "PAYOUT"
      remittance_state:
        | "CREATED"
        | "QUOTED"
        | "CONFIRMED"
        | "SENT"
        | "PAID"
        | "FAILED"
        | "REFUNDED"
      transaction_status:
        | "pendiente"
        | "completada"
        | "cancelada"
        | "en_proceso"
      verification_status: "pending" | "approved" | "rejected" | "review"
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
      actor_type: ["USER", "SYSTEM", "ADMIN", "AGENT"],
      app_role: [
        "admin",
        "agent_owner",
        "agent_clerk",
        "compliance_officer",
        "sender_user",
      ],
      channel_type: ["MONCASH", "SPIH"],
      doc_type: [
        "CEDULA",
        "PASSPORT",
        "RNC",
        "CONTRACT",
        "SELFIE",
        "BUSINESS_LICENSE",
        "BANK_STATEMENT",
      ],
      kyc_level: ["L1", "L2", "L3"],
      reconciliation_source: ["BANK", "PAYOUT"],
      remittance_state: [
        "CREATED",
        "QUOTED",
        "CONFIRMED",
        "SENT",
        "PAID",
        "FAILED",
        "REFUNDED",
      ],
      transaction_status: [
        "pendiente",
        "completada",
        "cancelada",
        "en_proceso",
      ],
      verification_status: ["pending", "approved", "rejected", "review"],
    },
  },
} as const
