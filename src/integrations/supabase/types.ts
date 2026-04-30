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
      clients: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          default_role: string | null
          developer_id: string
          email: string | null
          first_name: string
          id: string
          is_archived: boolean
          last_name: string
          notify_hourly_agreement: boolean
          notify_issue_report: boolean
          notify_quality_report: boolean
          notify_sign_off: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_role?: string | null
          developer_id: string
          email?: string | null
          first_name: string
          id?: string
          is_archived?: boolean
          last_name: string
          notify_hourly_agreement?: boolean
          notify_issue_report?: boolean
          notify_quality_report?: boolean
          notify_sign_off?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_role?: string | null
          developer_id?: string
          email?: string | null
          first_name?: string
          id?: string
          is_archived?: boolean
          last_name?: string
          notify_hourly_agreement?: boolean
          notify_issue_report?: boolean
          notify_quality_report?: boolean
          notify_sign_off?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_care_defects: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          issue_number: string | null
          job_id: string
          location: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_number?: string | null
          job_id: string
          location?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_number?: string | null
          job_id?: string
          location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_care_defects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "customer_care_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_care_jobs: {
        Row: {
          address: string | null
          appointment_date: string | null
          archived_at: string | null
          assigned_decorator_id: string | null
          attachment_url: string | null
          contact_notes: string | null
          created_at: string
          date_completed: string | null
          date_received: string | null
          developer_id: string | null
          external_ref: string | null
          homeowner_email: string | null
          homeowner_name: string | null
          homeowner_phone: string | null
          house_type: string | null
          id: string
          notes: string | null
          priority: string | null
          raised_by: string | null
          site_id: string | null
          sla_date: string | null
          source_format: string | null
          status: string
          unit_reference: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          appointment_date?: string | null
          archived_at?: string | null
          assigned_decorator_id?: string | null
          attachment_url?: string | null
          contact_notes?: string | null
          created_at?: string
          date_completed?: string | null
          date_received?: string | null
          developer_id?: string | null
          external_ref?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          house_type?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          raised_by?: string | null
          site_id?: string | null
          sla_date?: string | null
          source_format?: string | null
          status?: string
          unit_reference?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          appointment_date?: string | null
          archived_at?: string | null
          assigned_decorator_id?: string | null
          attachment_url?: string | null
          contact_notes?: string | null
          created_at?: string
          date_completed?: string | null
          date_received?: string | null
          developer_id?: string | null
          external_ref?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          house_type?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          raised_by?: string | null
          site_id?: string | null
          sla_date?: string | null
          source_format?: string | null
          status?: string
          unit_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_care_jobs_assigned_decorator_id_fkey"
            columns: ["assigned_decorator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_care_jobs_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_care_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "customer_care_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "customer_care_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          address_1: string | null
          city: string | null
          county: string | null
          created_at: string
          id: string
          is_archived: boolean
          logo_url: string | null
          name: string
          post_code: string | null
          reg_number: string | null
          website: string | null
        }
        Insert: {
          address_1?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          logo_url?: string | null
          name: string
          post_code?: string | null
          reg_number?: string | null
          website?: string | null
        }
        Update: {
          address_1?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          logo_url?: string | null
          name?: string
          post_code?: string | null
          reg_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      hourly_agreements: {
        Row: {
          created_at: string
          descriptions: string[]
          hours: number
          id: string
          invoiced: boolean
          manager_email: string | null
          other_description: string | null
          photo_urls: string[]
          plot_id: string
          plot_name: string | null
          rate: number | null
          reference_number: string | null
          signature_data: string | null
          site_id: string
          site_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          descriptions?: string[]
          hours: number
          id?: string
          invoiced?: boolean
          manager_email?: string | null
          other_description?: string | null
          photo_urls?: string[]
          plot_id: string
          plot_name?: string | null
          rate?: number | null
          reference_number?: string | null
          signature_data?: string | null
          site_id: string
          site_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          descriptions?: string[]
          hours?: number
          id?: string
          invoiced?: boolean
          manager_email?: string | null
          other_description?: string | null
          photo_urls?: string[]
          plot_id?: string
          plot_name?: string | null
          rate?: number | null
          reference_number?: string | null
          signature_data?: string | null
          site_id?: string
          site_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_hourly_agreements: {
        Row: {
          created_at: string
          hourly_agreement_id: string
          id: string
          invoice_id: string
        }
        Insert: {
          created_at?: string
          hourly_agreement_id: string
          id?: string
          invoice_id: string
        }
        Update: {
          created_at?: string
          hourly_agreement_id?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_hourly_agreements_hourly_agreement_id_fkey"
            columns: ["hourly_agreement_id"]
            isOneToOne: false
            referencedRelation: "hourly_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_hourly_agreements_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_misc_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          hours: number
          id: string
          invoice_id: string
          note: string | null
          photo_urls: string[]
          rate: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          hours: number
          id?: string
          invoice_id: string
          note?: string | null
          photo_urls?: string[]
          rate?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          hours?: number
          id?: string
          invoice_id?: string
          note?: string | null
          photo_urls?: string[]
          rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_misc_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_plot_items: {
        Row: {
          amount: number
          created_at: string
          full_price: number
          id: string
          invoice_id: string
          note: string | null
          percentage: number
          plot_id: string
          plot_name: string | null
          price_type: string
          site_id: string
          site_name: string | null
          task_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          full_price: number
          id?: string
          invoice_id: string
          note?: string | null
          percentage: number
          plot_id: string
          plot_name?: string | null
          price_type: string
          site_id: string
          site_name?: string | null
          task_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          full_price?: number
          id?: string
          invoice_id?: string
          note?: string | null
          percentage?: number
          plot_id?: string
          plot_name?: string | null
          price_type?: string
          site_id?: string
          site_name?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_plot_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          document_urls: string[]
          email_queued: boolean | null
          id: string
          invoice_number: number | null
          notes: string | null
          reference_number: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_urls?: string[]
          email_queued?: boolean | null
          id?: string
          invoice_number?: number | null
          notes?: string | null
          reference_number?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_urls?: string[]
          email_queued?: boolean | null
          id?: string
          invoice_number?: number | null
          notes?: string | null
          reference_number?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      issue_report_submissions: {
        Row: {
          created_at: string
          id: string
          issues: string[]
          photo_urls: string[]
          plot_id: string
          reference_number: string | null
          site_id: string
          submitted_by: string | null
          task_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          issues: string[]
          photo_urls?: string[]
          plot_id: string
          reference_number?: string | null
          site_id: string
          submitted_by?: string | null
          task_name: string
        }
        Update: {
          created_at?: string
          id?: string
          issues?: string[]
          photo_urls?: string[]
          plot_id?: string
          reference_number?: string | null
          site_id?: string
          submitted_by?: string | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_report_submissions_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["plot_id"]
          },
          {
            foreignKeyName: "issue_report_submissions_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_report_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "issue_report_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "issue_report_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_takeoffs: {
        Row: {
          created_at: string
          id: string
          plot_id: string
          quantity: number
          site_rate_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plot_id: string
          quantity?: number
          site_rate_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plot_id?: string
          quantity?: number
          site_rate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_takeoffs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["plot_id"]
          },
          {
            foreignKeyName: "plot_takeoffs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_takeoffs_site_rate_id_fkey"
            columns: ["site_rate_id"]
            isOneToOne: false
            referencedRelation: "site_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_tasks: {
        Row: {
          archived: boolean
          assigned_to: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          plot_id: string
          price: number | null
          price_source: string
          sort_order: number
          status: string
          task_template_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          assigned_to?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          plot_id: string
          price?: number | null
          price_source?: string
          sort_order?: number
          status?: string
          task_template_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          assigned_to?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          plot_id?: string
          price?: number | null
          price_source?: string
          sort_order?: number
          status?: string
          task_template_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_tasks_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["plot_id"]
          },
          {
            foreignKeyName: "plot_tasks_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_tasks_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          created_at: string
          external_price: number | null
          house_type: string | null
          id: string
          internal_price: number | null
          is_archived: boolean
          notes: string | null
          plot_name: string
          site_id: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_price?: number | null
          house_type?: string | null
          id?: string
          internal_price?: number | null
          is_archived?: boolean
          notes?: string | null
          plot_name: string
          site_id?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_price?: number | null
          house_type?: string | null
          id?: string
          internal_price?: number | null
          is_archived?: boolean
          notes?: string | null
          plot_name?: string
          site_id?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "plots_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "plots_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_number: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          last_seen_at: string | null
          national_insurance_number: string | null
          notify_hourly_agreement: boolean
          notify_invoice: boolean
          notify_issue_report: boolean
          notify_quality_report: boolean
          notify_sign_off: boolean
          phone: string | null
          post_code: string | null
          sort_code: string | null
          status: string
          updated_at: string
          user_id: string
          utr_number: string | null
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          last_seen_at?: string | null
          national_insurance_number?: string | null
          notify_hourly_agreement?: boolean
          notify_invoice?: boolean
          notify_issue_report?: boolean
          notify_quality_report?: boolean
          notify_sign_off?: boolean
          phone?: string | null
          post_code?: string | null
          sort_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
          utr_number?: string | null
        }
        Update: {
          account_number?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          last_seen_at?: string | null
          national_insurance_number?: string | null
          notify_hourly_agreement?: boolean
          notify_invoice?: boolean
          notify_issue_report?: boolean
          notify_quality_report?: boolean
          notify_sign_off?: boolean
          phone?: string | null
          post_code?: string | null
          sort_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          utr_number?: string | null
        }
        Relationships: []
      }
      quality_report_submissions: {
        Row: {
          created_at: string
          id: string
          photos: Json
          plot_id: string
          plot_name: string | null
          reference_number: string | null
          site_id: string
          site_name: string | null
          submitted_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          photos?: Json
          plot_id: string
          plot_name?: string | null
          reference_number?: string | null
          site_id: string
          site_name?: string | null
          submitted_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          photos?: Json
          plot_id?: string
          plot_name?: string | null
          reference_number?: string | null
          site_id?: string
          site_name?: string | null
          submitted_by?: string | null
        }
        Relationships: []
      }
      sign_offs: {
        Row: {
          created_at: string
          id: string
          manager_email: string | null
          manager_name: string | null
          manager_signature: string | null
          notes: string | null
          plot_id: string
          plot_name: string | null
          reference_number: string | null
          site_id: string
          site_name: string | null
          task_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_email?: string | null
          manager_name?: string | null
          manager_signature?: string | null
          notes?: string | null
          plot_id: string
          plot_name?: string | null
          reference_number?: string | null
          site_id: string
          site_name?: string | null
          task_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_email?: string | null
          manager_name?: string | null
          manager_signature?: string | null
          notes?: string | null
          plot_id?: string
          plot_name?: string | null
          reference_number?: string | null
          site_id?: string
          site_name?: string | null
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      site_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          role: string
          site_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          role: string
          site_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          role?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "site_contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "site_contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_rates: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          labour_rate: number
          material_rate: number
          site_id: string
          sort_order: number
          unit: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          labour_rate?: number
          material_rate?: number
          site_id: string
          sort_order?: number
          unit: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          labour_rate?: number
          material_rate?: number
          site_id?: string
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_rates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "site_rates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "site_rates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          client_id: string | null
          contacts: string | null
          created_at: string
          dec_split: number
          developer_id: string | null
          grid_reference: string | null
          id: string
          is_archived: boolean
          latitude: number | null
          longitude: number | null
          markup_percentage: number
          mist_split: number
          name: string
          notes: string | null
          site_plan_url: string | null
          site_plans: string | null
          snag1_split: number
          snag2_split: number
          status: string
          total_plots: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          contacts?: string | null
          created_at?: string
          dec_split?: number
          developer_id?: string | null
          grid_reference?: string | null
          id?: string
          is_archived?: boolean
          latitude?: number | null
          longitude?: number | null
          markup_percentage?: number
          mist_split?: number
          name: string
          notes?: string | null
          site_plan_url?: string | null
          site_plans?: string | null
          snag1_split?: number
          snag2_split?: number
          status?: string
          total_plots?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_id?: string | null
          contacts?: string | null
          created_at?: string
          dec_split?: number
          developer_id?: string | null
          grid_reference?: string | null
          id?: string
          is_archived?: boolean
          latitude?: number | null
          longitude?: number | null
          markup_percentage?: number
          mist_split?: number
          name?: string
          notes?: string | null
          site_plan_url?: string | null
          site_plans?: string | null
          snag1_split?: number
          snag2_split?: number
          status?: string
          total_plots?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "plot_progress"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "sites_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          type: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          rate: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          rate?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          rate?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      activity_feed: {
        Row: {
          created_at: string | null
          first_name: string | null
          form_type: string | null
          id: string | null
          last_name: string | null
          plot_name: string | null
          site_name: string | null
          source_table: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: []
      }
      plot_progress: {
        Row: {
          client_id: string | null
          client_name: string | null
          external_price: number | null
          house_type: string | null
          internal_price: number | null
          plot_id: string | null
          plot_name: string | null
          plot_status: string | null
          site_id: string | null
          site_name: string | null
        }
        Relationships: []
      }
      site_summary: {
        Row: {
          client_name: string | null
          completed_plots: number | null
          site_id: string | null
          site_name: string | null
          status: string | null
          total_external_value: number | null
          total_internal_value: number | null
          total_plots: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bulk_upsert_plot_tasks: { Args: { items: Json }; Returns: undefined }
      create_user: {
        Args: {
          _account_number?: string
          _email: string
          _first_name: string
          _last_name: string
          _national_insurance_number?: string
          _password: string
          _phone?: string
          _post_code?: string
          _rate?: number
          _role?: string
          _sort_code?: string
          _utr_number?: string
        }
        Returns: string
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          account_number: string
          created_at: string
          email: string
          first_name: string
          last_name: string
          national_insurance_number: string
          phone: string
          role: string
          sort_code: string
          status: string
          user_id: string
          utr_number: string
        }[]
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_developer_stats: {
        Args: never
        Returns: {
          developer_id: string
          site_count: number
          unit_count: number
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      hard_delete_user: { Args: { _user_id: string }; Returns: undefined }
      has_elevated_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      toggle_user_active: {
        Args: { _is_active: boolean; _user_id: string }
        Returns: undefined
      }
      touch_last_seen: { Args: never; Returns: undefined }
      update_user_status: {
        Args: { new_status: string; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "subcontractor" | "decorator" | "trainee"
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
      app_role: ["admin", "supervisor", "subcontractor", "decorator"],
    },
  },
} as const
