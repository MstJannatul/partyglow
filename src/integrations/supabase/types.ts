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
    PostgrestVersion: '12.2.12 (cd3cf9e)'
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_user_id: string
          booking_id: string
          created_at: string
          id: string
          new_data: Json | null
          notes: string | null
          previous_data: Json | null
        }
        Insert: {
          action: string
          admin_user_id: string
          booking_id: string
          created_at?: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          booking_id?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'admin_actions_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      admin_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note: string
          target_user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note: string
          target_user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          target_user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      automated_reminders: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_sent: boolean
          message_template: string | null
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_sent?: boolean
          message_template?: string | null
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_sent?: boolean
          message_template?: string | null
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      booking_audit_log: {
        Row: {
          action: string
          booking_id: string
          id: string
          new_data: Json | null
          notes: string | null
          previous_data: Json | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          booking_id: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          booking_id?: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          quantity: number
          vendor_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number
          vendor_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number
          vendor_id?: string
        }
        Relationships: []
      }
      booking_delivery_details: {
        Row: {
          address: string | null
          booking_id: string
          created_at: string
          delivery_type: string
          id: string
          instructions: string | null
          preferred_time_window: string | null
          vendor_id: string
        }
        Insert: {
          address?: string | null
          booking_id: string
          created_at?: string
          delivery_type: string
          id?: string
          instructions?: string | null
          preferred_time_window?: string | null
          vendor_id: string
        }
        Update: {
          address?: string | null
          booking_id?: string
          created_at?: string
          delivery_type?: string
          id?: string
          instructions?: string | null
          preferred_time_window?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_delivery_details_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      booking_disputes: {
        Row: {
          booking_id: string
          created_at: string
          description: string
          dispute_type: string
          evidence_urls: string[] | null
          id: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          description: string
          dispute_type: string
          evidence_urls?: string[] | null
          id?: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          description?: string
          dispute_type?: string
          evidence_urls?: string[] | null
          id?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_disputes_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      booking_drafts: {
        Row: {
          created_at: string
          duration_hours: number | null
          expires_at: string
          id: string
          is_converted: boolean
          listing_id: string
          selected_date: string | null
          selected_end_time: string | null
          selected_start_time: string | null
          total_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number | null
          expires_at?: string
          id?: string
          is_converted?: boolean
          listing_id: string
          selected_date?: string | null
          selected_end_time?: string | null
          selected_start_time?: string | null
          total_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_hours?: number | null
          expires_at?: string
          id?: string
          is_converted?: boolean
          listing_id?: string
          selected_date?: string | null
          selected_end_time?: string | null
          selected_start_time?: string | null
          total_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      booking_items: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          quantity: number
          total_price: number | null
          unit_price: number | null
          vendor_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
          vendor_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_items_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      booking_modifications: {
        Row: {
          admin_notes: string | null
          booking_id: string
          created_at: string
          id: string
          modification_fee: number | null
          modification_type: string
          new_end_date: string | null
          new_start_date: string | null
          original_end_date: string | null
          original_start_date: string | null
          processed_at: string | null
          reason: string | null
          refund_amount: number | null
          requested_by: string
          status: string | null
          updated_at: string
          vendor_approval_notes: string | null
          vendor_approval_required: boolean | null
          vendor_approved_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          created_at?: string
          id?: string
          modification_fee?: number | null
          modification_type: string
          new_end_date?: string | null
          new_start_date?: string | null
          original_end_date?: string | null
          original_start_date?: string | null
          processed_at?: string | null
          reason?: string | null
          refund_amount?: number | null
          requested_by: string
          status?: string | null
          updated_at?: string
          vendor_approval_notes?: string | null
          vendor_approval_required?: boolean | null
          vendor_approved_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          modification_fee?: number | null
          modification_type?: string
          new_end_date?: string | null
          new_start_date?: string | null
          original_end_date?: string | null
          original_start_date?: string | null
          processed_at?: string | null
          reason?: string | null
          refund_amount?: number | null
          requested_by?: string
          status?: string | null
          updated_at?: string
          vendor_approval_notes?: string | null
          vendor_approval_required?: boolean | null
          vendor_approved_at?: string | null
        }
        Relationships: []
      }
      booking_reminders: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_active: boolean
          message_template: string | null
          recipient_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string | null
          recipient_id: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string | null
          recipient_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'booking_reminders_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      booking_requests: {
        Row: {
          created_at: string
          customer_id: string
          delivery_address: string | null
          id: string
          listing_id: string
          notes_to_vendor: string | null
          requested_date: string
          requested_end_time: string | null
          requested_start_time: string | null
          selected_items: Json | null
          status: string
          total_price: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          id?: string
          listing_id: string
          notes_to_vendor?: string | null
          requested_date: string
          requested_end_time?: string | null
          requested_start_time?: string | null
          selected_items?: Json | null
          status?: string
          total_price?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          id?: string
          listing_id?: string
          notes_to_vendor?: string | null
          requested_date?: string
          requested_end_time?: string | null
          requested_start_time?: string | null
          selected_items?: Json | null
          status?: string
          total_price?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_requests_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      booking_timeline_events: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string
          event_data: Json | null
          event_type: string
          id: string
          notes: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by: string
          event_data?: Json | null
          event_type: string
          id?: string
          notes?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'booking_timeline_events_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      bookings: {
        Row: {
          auto_close_at: string | null
          auto_finalize_at: string | null
          auto_finalized: boolean | null
          booking_type: string
          breakdown_duration_minutes: number | null
          cancellation_deadline: string | null
          created_at: string
          customer_confirmed_complete_at: string | null
          customer_id: string
          customer_payment_receipt_url: string | null
          delivery_instructions: string | null
          delivery_window_end: string | null
          delivery_window_start: string | null
          end_date: string
          event_timeline_notes: string | null
          finalization_window_hours: number | null
          group_booking_id: string | null
          id: string
          invoice_generated: boolean
          is_paid: boolean | null
          is_seeded: boolean | null
          listing_id: string
          notes: string | null
          payment_notes: string | null
          payment_reference_number: string | null
          payment_status: Database['public']['Enums']['payment_status'] | null
          service_phase: Database['public']['Enums']['service_phase'] | null
          setup_duration_minutes: number | null
          start_date: string
          status: Database['public']['Enums']['booking_status']
          stripe_payment_intent_id: string | null
          total_price: number
          updated_at: string
          vendor_arrived_at: string | null
          vendor_id: string
          vendor_payment_confirmed_at: string | null
        }
        Insert: {
          auto_close_at?: string | null
          auto_finalize_at?: string | null
          auto_finalized?: boolean | null
          booking_type?: string
          breakdown_duration_minutes?: number | null
          cancellation_deadline?: string | null
          created_at?: string
          customer_confirmed_complete_at?: string | null
          customer_id: string
          customer_payment_receipt_url?: string | null
          delivery_instructions?: string | null
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          end_date: string
          event_timeline_notes?: string | null
          finalization_window_hours?: number | null
          group_booking_id?: string | null
          id?: string
          invoice_generated?: boolean
          is_paid?: boolean | null
          is_seeded?: boolean | null
          listing_id: string
          notes?: string | null
          payment_notes?: string | null
          payment_reference_number?: string | null
          payment_status?: Database['public']['Enums']['payment_status'] | null
          service_phase?: Database['public']['Enums']['service_phase'] | null
          setup_duration_minutes?: number | null
          start_date: string
          status?: Database['public']['Enums']['booking_status']
          stripe_payment_intent_id?: string | null
          total_price: number
          updated_at?: string
          vendor_arrived_at?: string | null
          vendor_id: string
          vendor_payment_confirmed_at?: string | null
        }
        Update: {
          auto_close_at?: string | null
          auto_finalize_at?: string | null
          auto_finalized?: boolean | null
          booking_type?: string
          breakdown_duration_minutes?: number | null
          cancellation_deadline?: string | null
          created_at?: string
          customer_confirmed_complete_at?: string | null
          customer_id?: string
          customer_payment_receipt_url?: string | null
          delivery_instructions?: string | null
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          end_date?: string
          event_timeline_notes?: string | null
          finalization_window_hours?: number | null
          group_booking_id?: string | null
          id?: string
          invoice_generated?: boolean
          is_paid?: boolean | null
          is_seeded?: boolean | null
          listing_id?: string
          notes?: string | null
          payment_notes?: string | null
          payment_reference_number?: string | null
          payment_status?: Database['public']['Enums']['payment_status'] | null
          service_phase?: Database['public']['Enums']['service_phase'] | null
          setup_duration_minutes?: number | null
          start_date?: string
          status?: Database['public']['Enums']['booking_status']
          stripe_payment_intent_id?: string | null
          total_price?: number
          updated_at?: string
          vendor_arrived_at?: string | null
          vendor_id?: string
          vendor_payment_confirmed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_bookings_group_booking'
            columns: ['group_booking_id']
            isOneToOne: false
            referencedRelation: 'group_bookings'
            referencedColumns: ['id']
          }
        ]
      }
      cancellation_policies: {
        Row: {
          created_at: string
          hours_before_event: number
          id: string
          is_active: boolean | null
          modification_fee: number | null
          no_show_fee: number | null
          policy_description: string | null
          policy_name: string
          refund_percentage: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          hours_before_event: number
          id?: string
          is_active?: boolean | null
          modification_fee?: number | null
          no_show_fee?: number | null
          policy_description?: string | null
          policy_name: string
          refund_percentage?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          hours_before_event?: number
          id?: string
          is_active?: boolean | null
          modification_fee?: number | null
          no_show_fee?: number | null
          policy_description?: string | null
          policy_name?: string
          refund_percentage?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string | null
          customer_id: string
          duration_hours: number | null
          expires_at: string | null
          id: string
          inventory_item_id: string | null
          item_type: string | null
          listing_id: string
          quantity: number | null
          reserved_until: string | null
          vendor_id: string
        }
        Insert: {
          added_at?: string | null
          customer_id: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_type?: string | null
          listing_id: string
          quantity?: number | null
          reserved_until?: string | null
          vendor_id: string
        }
        Update: {
          added_at?: string | null
          customer_id?: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_type?: string | null
          listing_id?: string
          quantity?: number | null
          reserved_until?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string | null
          sort_order: number | null
          type: Database['public']['Enums']['listing_type']
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          type: Database['public']['Enums']['listing_type']
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          type?: Database['public']['Enums']['listing_type']
        }
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      category_stock_images: {
        Row: {
          alt_text: string | null
          category_id: string
          created_at: string
          id: string
          image_url: string
          is_default: boolean
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          category_id: string
          created_at?: string
          id?: string
          image_url: string
          is_default?: boolean
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string
          is_default?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fk_category_stock_images_category_id'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      contracts: {
        Row: {
          booking_id: string
          created_at: string
          customer_agreed: boolean | null
          id: string
          signed_at: string | null
          terms: string | null
          vendor_agreed: boolean | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_agreed?: boolean | null
          id?: string
          signed_at?: string | null
          terms?: string | null
          vendor_agreed?: boolean | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_agreed?: boolean | null
          id?: string
          signed_at?: string | null
          terms?: string | null
          vendor_agreed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'contracts_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: true
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      conversation_disputes: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string
          dispute_type: string
          evidence_urls: string[] | null
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description: string
          dispute_type: string
          evidence_urls?: string[] | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string
          dispute_type?: string
          evidence_urls?: string[] | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversation_disputes_thread_id_fkey'
            columns: ['thread_id']
            isOneToOne: false
            referencedRelation: 'message_threads'
            referencedColumns: ['id']
          }
        ]
      }
      dispute_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          dispute_id: string | null
          id: string
          new_value: string | null
          notes: string | null
          previous_value: string | null
          report_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          dispute_id?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          previous_value?: string | null
          report_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          dispute_id?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          previous_value?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dispute_logs_dispute_id_fkey'
            columns: ['dispute_id']
            isOneToOne: false
            referencedRelation: 'conversation_disputes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dispute_logs_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'message_reports'
            referencedColumns: ['id']
          }
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          error_message: string
          id: string
          metadata: Json | null
          resolved: boolean
          resolved_at: string | null
          severity: string
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          id?: string
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_schedules: {
        Row: {
          booking_id: string
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_breakdown_phase: boolean | null
          is_setup_phase: boolean | null
          phase_name: string
          requires_vendor_arrival: boolean | null
          start_time: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_breakdown_phase?: boolean | null
          is_setup_phase?: boolean | null
          phase_name: string
          requires_vendor_arrival?: boolean | null
          start_time: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_breakdown_phase?: boolean | null
          is_setup_phase?: boolean | null
          phase_name?: string
          requires_vendor_arrival?: boolean | null
          start_time?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      flagged_listings: {
        Row: {
          admin_notes: string | null
          created_at: string
          flagged_by: string | null
          flagged_images: string[] | null
          id: string
          listing_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          flagged_by?: string | null
          flagged_images?: string[] | null
          id?: string
          listing_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          flagged_by?: string | null
          flagged_images?: string[] | null
          id?: string
          listing_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flagged_listings_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      flags: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flags_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      group_bookings: {
        Row: {
          created_at: string
          customer_id: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string
          timezone: string | null
          title: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string
          timezone?: string | null
          title?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string
          timezone?: string | null
          title?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          delivery_type: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          listing_id: string | null
          name: string
          price_per_unit: number | null
          quantity_available: number
          reserved_quantity: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          delivery_type?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          listing_id?: string | null
          name: string
          price_per_unit?: number | null
          quantity_available?: number
          reserved_quantity?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          delivery_type?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          listing_id?: string | null
          name?: string
          price_per_unit?: number | null
          quantity_available?: number
          reserved_quantity?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_items_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      inventory_package_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          package_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          package_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          package_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_package_items_inventory_item_id_fkey'
            columns: ['inventory_item_id']
            isOneToOne: false
            referencedRelation: 'inventory_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_package_items_package_id_fkey'
            columns: ['package_id']
            isOneToOne: false
            referencedRelation: 'inventory_packages'
            referencedColumns: ['id']
          }
        ]
      }
      inventory_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          is_taxable: boolean
          item_name: string
          listing_id: string | null
          quantity: number
          total_price: number
          unit_price: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          is_taxable?: boolean
          item_name: string
          listing_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          is_taxable?: boolean
          item_name?: string
          listing_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invoice_line_items_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          }
        ]
      }
      invoices: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          invoice_number: string
          pdf_url: string | null
          platform_fee_amount: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          invoice_number: string
          pdf_url?: string | null
          platform_fee_amount?: number
          status?: string
          subtotal: number
          tax_amount?: number
          total_amount: number
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          invoice_number?: string
          pdf_url?: string | null
          platform_fee_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      listing_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'listing_categories_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listing_categories_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      listing_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_name: string
          listing_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          listing_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          listing_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'listing_packages_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      listings: {
        Row: {
          category_id: string | null
          created_at: string
          delivery_type: string | null
          description: string | null
          id: string
          is_active: boolean
          is_package: boolean
          is_seeded: boolean | null
          is_taxable: boolean
          listing_type: string
          location: string | null
          max_booking_hours: number | null
          media_urls: string[] | null
          min_booking_hours: number | null
          moderated: boolean
          price: number
          tags: string[] | null
          title: string
          type: Database['public']['Enums']['listing_type']
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_package?: boolean
          is_seeded?: boolean | null
          is_taxable?: boolean
          listing_type?: string
          location?: string | null
          max_booking_hours?: number | null
          media_urls?: string[] | null
          min_booking_hours?: number | null
          moderated?: boolean
          price: number
          tags?: string[] | null
          title: string
          type: Database['public']['Enums']['listing_type']
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_package?: boolean
          is_seeded?: boolean | null
          is_taxable?: boolean
          listing_type?: string
          location?: string | null
          max_booking_hours?: number | null
          media_urls?: string[] | null
          min_booking_hours?: number | null
          moderated?: boolean
          price?: number
          tags?: string[] | null
          title?: string
          type?: Database['public']['Enums']['listing_type']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'listings_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'listings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'public_vendor_profiles'
            referencedColumns: ['user_id']
          }
        ]
      }
      message_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          message_id: string
          reason: string
          reported_by: string
          reported_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id: string
          reason: string
          reported_by: string
          reported_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string
          reason?: string
          reported_by?: string
          reported_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'message_reports_message_id_fkey'
            columns: ['message_id']
            isOneToOne: false
            referencedRelation: 'messages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_reports_thread_id_fkey'
            columns: ['thread_id']
            isOneToOne: false
            referencedRelation: 'message_threads'
            referencedColumns: ['id']
          }
        ]
      }
      message_threads: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          last_message: string | null
          last_updated: string | null
          listing_id: string | null
          status: string | null
          type: string
          unread_count_customer: number | null
          unread_count_vendor: number | null
          vendor_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          last_message?: string | null
          last_updated?: string | null
          listing_id?: string | null
          status?: string | null
          type?: string
          unread_count_customer?: number | null
          unread_count_vendor?: number | null
          vendor_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          last_message?: string | null
          last_updated?: string | null
          listing_id?: string | null
          status?: string | null
          type?: string
          unread_count_customer?: number | null
          unread_count_vendor?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'message_threads_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_threads_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'message_threads_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'public_vendor_profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'message_threads_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_threads_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'message_threads_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'public_vendor_profiles'
            referencedColumns: ['user_id']
          }
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string
          id: string
          is_read: boolean
          receiver_id: string
          seen_at: string | null
          sender_id: string
          sent_at: string
          thread_id: string | null
        }
        Insert: {
          booking_id?: string | null
          content: string
          id?: string
          is_read?: boolean
          receiver_id: string
          seen_at?: string | null
          sender_id: string
          sent_at?: string
          thread_id?: string | null
        }
        Update: {
          booking_id?: string | null
          content?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          seen_at?: string | null
          sender_id?: string
          sent_at?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_thread_id_fkey'
            columns: ['thread_id']
            isOneToOne: false
            referencedRelation: 'message_threads'
            referencedColumns: ['id']
          }
        ]
      }
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string | null
          contract_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          recipient_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          recipient_id: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          recipient_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payment_reminders_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      payment_timeline_events: {
        Row: {
          booking_id: string
          created_at: string | null
          created_by: string
          event_data: Json | null
          event_type: string
          id: string
          notes: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          created_by: string
          event_data?: Json | null
          event_type: string
          id?: string
          notes?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          created_by?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payment_timeline_events_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      performer_profiles: {
        Row: {
          bio: string | null
          certifications: string[] | null
          created_at: string
          hourly_rate: number | null
          id: string
          specialties: string[] | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          specialties?: string[] | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          specialties?: string[] | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      platform_fees: {
        Row: {
          created_at: string
          fee_amount: number
          fee_cap: number | null
          fee_percentage: number
          id: string
          invoice_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          fee_amount: number
          fee_cap?: number | null
          fee_percentage: number
          id?: string
          invoice_id: string
          user_type: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          fee_cap?: number | null
          fee_percentage?: number
          id?: string
          invoice_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'platform_fees_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          }
        ]
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_by: string | null
          accessed_profile_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_by?: string | null
          accessed_profile_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_by?: string | null
          accessed_profile_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability_enabled: boolean | null
          avatar_url: string | null
          bio: string | null
          business_description: string | null
          business_name: string | null
          cancellation_policy: string | null
          certifications: string[] | null
          created_at: string
          deposit_percentage: number | null
          email: string
          full_name: string | null
          hourly_rate: number | null
          id: string
          is_seeded: boolean | null
          is_verified: boolean
          location: string | null
          payment_instructions: string | null
          payment_methods: Json | null
          phone: string | null
          portfolio_media_urls: string[] | null
          preferred_payment_method: string | null
          require_manual_booking_approval: boolean | null
          requires_manual_confirmation: boolean
          response_time_hours: number | null
          role: Database['public']['Enums']['user_role']
          service_area: string | null
          specialties: string[] | null
          timezone: string | null
          updated_at: string
          user_id: string
          vendor_type: string | null
          years_experience: number | null
        }
        Insert: {
          availability_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          business_description?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          certifications?: string[] | null
          created_at?: string
          deposit_percentage?: number | null
          email: string
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_seeded?: boolean | null
          is_verified?: boolean
          location?: string | null
          payment_instructions?: string | null
          payment_methods?: Json | null
          phone?: string | null
          portfolio_media_urls?: string[] | null
          preferred_payment_method?: string | null
          require_manual_booking_approval?: boolean | null
          requires_manual_confirmation?: boolean
          response_time_hours?: number | null
          role?: Database['public']['Enums']['user_role']
          service_area?: string | null
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          vendor_type?: string | null
          years_experience?: number | null
        }
        Update: {
          availability_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          business_description?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          certifications?: string[] | null
          created_at?: string
          deposit_percentage?: number | null
          email?: string
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_seeded?: boolean | null
          is_verified?: boolean
          location?: string | null
          payment_instructions?: string | null
          payment_methods?: Json | null
          phone?: string | null
          portfolio_media_urls?: string[] | null
          preferred_payment_method?: string | null
          require_manual_booking_approval?: boolean | null
          requires_manual_confirmation?: boolean
          response_time_hours?: number | null
          role?: Database['public']['Enums']['user_role']
          service_area?: string | null
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          vendor_type?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      rate_limit_counters: {
        Row: {
          count: number
          key: string
          limiter_type: string
          updated_at: string
          window_ms: number
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          limiter_type: string
          updated_at?: string
          window_ms: number
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          limiter_type?: string
          updated_at?: string
          window_ms?: number
          window_start?: string
        }
        Relationships: []
      }
      refund_calculations: {
        Row: {
          booking_id: string
          calculated_refund: number
          calculation_notes: string | null
          cancellation_fee: number | null
          created_at: string
          final_refund_amount: number
          id: string
          modification_fee: number | null
          modification_id: string
          original_amount: number
          processed: boolean | null
          processed_at: string | null
          processing_fee: number | null
          refund_percentage: number
        }
        Insert: {
          booking_id: string
          calculated_refund: number
          calculation_notes?: string | null
          cancellation_fee?: number | null
          created_at?: string
          final_refund_amount: number
          id?: string
          modification_fee?: number | null
          modification_id: string
          original_amount: number
          processed?: boolean | null
          processed_at?: string | null
          processing_fee?: number | null
          refund_percentage: number
        }
        Update: {
          booking_id?: string
          calculated_refund?: number
          calculation_notes?: string | null
          cancellation_fee?: number | null
          created_at?: string
          final_refund_amount?: number
          id?: string
          modification_fee?: number | null
          modification_id?: string
          original_amount?: number
          processed?: boolean | null
          processed_at?: string | null
          processing_fee?: number | null
          refund_percentage?: number
        }
        Relationships: []
      }
      review_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'review_votes_review_id_fkey'
            columns: ['review_id']
            isOneToOne: false
            referencedRelation: 'reviews'
            referencedColumns: ['id']
          }
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          helpfulness_score: number | null
          id: string
          is_featured: boolean | null
          is_seeded: boolean | null
          media_urls: string[] | null
          rating: number
          response_date: string | null
          response_text: string | null
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          helpfulness_score?: number | null
          id?: string
          is_featured?: boolean | null
          is_seeded?: boolean | null
          media_urls?: string[] | null
          rating: number
          response_date?: string | null
          response_text?: string | null
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          helpfulness_score?: number | null
          id?: string
          is_featured?: boolean | null
          is_seeded?: boolean | null
          media_urls?: string[] | null
          rating?: number
          response_date?: string | null
          response_text?: string | null
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: true
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
      system_metrics: {
        Row: {
          created_at: string
          date: string
          metadata: Json | null
          metric_type: string
          value: number
        }
        Insert: {
          created_at?: string
          date: string
          metadata?: Json | null
          metric_type: string
          value?: number
        }
        Update: {
          created_at?: string
          date?: string
          metadata?: Json | null
          metric_type?: string
          value?: number
        }
        Relationships: []
      }
      tax_calculations: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          location: string | null
          tax_amount: number
          tax_rate: number
          tax_type: string
          taxable_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          location?: string | null
          tax_amount: number
          tax_rate?: number
          tax_type?: string
          taxable_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          location?: string | null
          tax_amount?: number
          tax_rate?: number
          tax_type?: string
          taxable_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'tax_calculations_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          }
        ]
      }
      thread_deletions: {
        Row: {
          deleted_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'thread_deletions_thread_id_fkey'
            columns: ['thread_id']
            isOneToOne: false
            referencedRelation: 'message_threads'
            referencedColumns: ['id']
          }
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_blackout_dates: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          reason: string | null
          start_date: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          reason?: string | null
          start_date: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          start_date?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_blockouts: {
        Row: {
          created_at: string
          end_date: string
          end_time: string | null
          id: string
          is_active: boolean
          listing_id: string | null
          reason: string | null
          start_date: string
          start_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string | null
          reason?: string | null
          start_date: string
          start_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string | null
          reason?: string | null
          start_date?: string
          start_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_conflict_reports: {
        Row: {
          affected_vendors: string[] | null
          booking_id: string
          conflict_type: string
          created_at: string
          description: string
          id: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          affected_vendors?: string[] | null
          booking_id: string
          conflict_type: string
          created_at?: string
          description: string
          id?: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          affected_vendors?: string[] | null
          booking_id?: string
          conflict_type?: string
          created_at?: string
          description?: string
          id?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vendor_coordination_messages: {
        Row: {
          created_at: string
          group_booking_id: string | null
          id: string
          individual_booking_id: string | null
          is_broadcast: boolean | null
          is_read: boolean | null
          message_content: string
          message_type: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          thread_id: string | null
        }
        Insert: {
          created_at?: string
          group_booking_id?: string | null
          id?: string
          individual_booking_id?: string | null
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message_content: string
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          thread_id?: string | null
        }
        Update: {
          created_at?: string
          group_booking_id?: string | null
          id?: string
          individual_booking_id?: string | null
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message_content?: string
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          thread_id?: string | null
        }
        Relationships: []
      }
      vendor_coordination_status: {
        Row: {
          booking_id: string
          breakdown_complete_time: string | null
          confirmed_arrival_time: string | null
          id: string
          last_updated: string
          setup_complete_time: string | null
          status: Database['public']['Enums']['coordination_status'] | null
          status_notes: string | null
          updated_by: string
          vendor_id: string
        }
        Insert: {
          booking_id: string
          breakdown_complete_time?: string | null
          confirmed_arrival_time?: string | null
          id?: string
          last_updated?: string
          setup_complete_time?: string | null
          status?: Database['public']['Enums']['coordination_status'] | null
          status_notes?: string | null
          updated_by: string
          vendor_id: string
        }
        Update: {
          booking_id?: string
          breakdown_complete_time?: string | null
          confirmed_arrival_time?: string | null
          id?: string
          last_updated?: string
          setup_complete_time?: string | null
          status?: Database['public']['Enums']['coordination_status'] | null
          status_notes?: string | null
          updated_by?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_timeline_requirements: {
        Row: {
          arrival_buffer_minutes: number | null
          booking_id: string
          breakdown_time_required: number | null
          created_at: string
          equipment_delivery_notes: string | null
          id: string
          preferred_arrival_time: string | null
          setup_time_required: number | null
          special_requirements: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          arrival_buffer_minutes?: number | null
          booking_id: string
          breakdown_time_required?: number | null
          created_at?: string
          equipment_delivery_notes?: string | null
          id?: string
          preferred_arrival_time?: string | null
          setup_time_required?: number | null
          special_requirements?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          arrival_buffer_minutes?: number | null
          booking_id?: string
          breakdown_time_required?: number | null
          created_at?: string
          equipment_delivery_notes?: string | null
          id?: string
          preferred_arrival_time?: string | null
          setup_time_required?: number | null
          special_requirements?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          created_at: string
          document_type: string
          file_path: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_vendor_profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          business_description: string | null
          business_name: string | null
          created_at: string | null
          full_name: string | null
          is_verified: boolean | null
          location: string | null
          review_count: number | null
          role: Database['public']['Enums']['user_role'] | null
          service_area: string | null
          specialties: string[] | null
          user_id: string | null
          vendor_type: string | null
          years_experience: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_finalize_booking: {
        Args: { p_admin_id: string; p_booking_id: string; p_notes?: string }
        Returns: undefined
      }
      admin_override_payment: {
        Args: {
          p_admin_id: string
          p_booking_id: string
          p_is_paid: boolean
          p_notes?: string
        }
        Returns: undefined
      }
      auto_finalize_booking: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      bump_rate_limit: {
        Args: {
          p_key: string
          p_limiter_type: string
          p_max_requests: number
          p_window_ms: number
        }
        Returns: Json
      }
      check_inventory_availability: {
        Args: { p_listing_id: string; p_quantity: number }
        Returns: Json
      }
      cleanup_expired_guest_cart_items: {
        Args: { p_guest_cart_items: Json }
        Returns: Json
      }
      clear_cart: {
        Args: { p_customer_id: string }
        Returns: undefined
      }
      confirm_booking_inventory: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      detect_booking_conflicts: {
        Args: { p_end_time: string; p_listing_id: string; p_start_time: string }
        Returns: boolean
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_booking_available_actions: {
        Args: { p_booking_id: string; p_user_id?: string }
        Returns: Json
      }
      get_booking_timeline_stats: {
        Args: { user_id: string }
        Returns: Json
      }
      get_cart_items: {
        Args: { p_customer_id: string }
        Returns: {
          added_at: string
          customer_id: string
          duration_hours: number
          id: string
          inventory_info: Json
          item_type: string
          listing: Json
          listing_id: string
          quantity: number
          reserved_until: string
          vendor: Json
          vendor_id: string
        }[]
      }
      get_optimized_listings: {
        Args: {
          p_category_id?: string
          p_limit?: number
          p_location?: string
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          average_rating: number
          category: Json
          category_id: string
          created_at: string
          delivery_type: string
          description: string
          id: string
          is_active: boolean
          listing_type: string
          location: string
          max_booking_hours: number
          media_urls: string[]
          min_booking_hours: number
          price: number
          reviews_count: number
          title: string
          updated_at: string
          user_id: string
          vendor: Json
        }[]
      }
      get_safe_vendor_profile: {
        Args: { vendor_user_id: string }
        Returns: {
          avatar_url: string
          average_rating: number
          bio: string
          business_name: string
          created_at: string
          full_name: string
          is_verified: boolean
          location: string
          total_reviews: number
          user_id: string
          vendor_type: string
        }[]
      }
      get_service_phase_progress: {
        Args: { p_service_phase: Database['public']['Enums']['service_phase'] }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: string
      }
      get_vendor_availability_intersection: {
        Args: { p_date: string; p_duration: number; p_vendor_ids: string[] }
        Returns: {
          available_vendors: string[]
          end_time: string
          start_time: string
        }[]
      }
      get_vendor_available_blocks: {
        Args: { p_date: string; p_vendor_id: string }
        Returns: {
          booking_id: string
          end_time: string
          id: string
          is_booked: boolean
          start_time: string
        }[]
      }
      get_vendor_available_slots: {
        Args: { p_date: string; p_duration_hours?: number; p_vendor_id: string }
        Returns: {
          end_time: string
          is_available: boolean
          start_time: string
        }[]
      }
      has_user_reviewed_booking: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: boolean
      }
      insert_cart_item: {
        Args:
          | {
              p_customer_id: string
              p_duration_hours?: number
              p_listing_id: string
              p_quantity?: number
              p_vendor_id: string
            }
          | {
              p_customer_id: string
              p_duration_hours?: number
              p_listing_id: string
              p_vendor_id: string
            }
        Returns: string
      }
      lock_blocks_for_booking: {
        Args: {
          p_booking_id: string
          p_end_date: string
          p_start_date: string
          p_vendor_id: string
        }
        Returns: undefined
      }
      log_profile_access: {
        Args: { p_access_type: string; p_profile_id: string }
        Returns: undefined
      }
      mark_availability_block_as_booked: {
        Args: {
          p_booking_id: string
          p_end_date: string
          p_start_date: string
          p_vendor_id: string
        }
        Returns: undefined
      }
      release_availability_block: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      release_expired_cart_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      release_inventory_reservation: {
        Args: { p_cart_item_id: string }
        Returns: undefined
      }
      remove_cart_item: {
        Args: { p_customer_id: string; p_item_id: string }
        Returns: undefined
      }
      reserve_inventory_for_cart: {
        Args: {
          p_cart_item_id: string
          p_inventory_item_id: string
          p_quantity: number
        }
        Returns: boolean
      }
      schedule_booking_reminders: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      schedule_payment_reminders: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      set_auto_finalization_timer: {
        Args: { p_booking_id: string; p_hours?: number }
        Returns: undefined
      }
      simple_booking_availability: {
        Args: {
          p_end_date: string
          p_exclude_booking_id?: string
          p_start_date: string
          p_vendor_id: string
        }
        Returns: boolean
      }
      transition_service_phase: {
        Args: {
          p_booking_id: string
          p_new_phase: Database['public']['Enums']['service_phase']
          p_notes?: string
        }
        Returns: undefined
      }
      update_booking_status_with_fulfillment: {
        Args: {
          p_booking_id: string
          p_event_type: string
          p_fulfillment_timestamp?: string
          p_new_status: Database['public']['Enums']['booking_status']
          p_notes?: string
        }
        Returns: undefined
      }
      update_booking_status_with_timeline: {
        Args: {
          p_booking_id: string
          p_event_type: string
          p_new_status: Database['public']['Enums']['booking_status']
          p_notes?: string
        }
        Returns: undefined
      }
      update_cart_item: {
        Args: {
          p_customer_id: string
          p_duration_hours: number
          p_item_id: string
        }
        Returns: undefined
      }
      validate_block_booking_availability: {
        Args: { p_end_date: string; p_start_date: string; p_vendor_id: string }
        Returns: boolean
      }
      validate_booking_availability: {
        Args: { p_end_date: string; p_start_date: string; p_vendor_id: string }
        Returns: boolean
      }
      validate_flexible_booking_availability: {
        Args: { p_end_date: string; p_start_date: string; p_vendor_id: string }
        Returns: Json
      }
    }
    Enums: {
      booking_status:
        | 'requested'
        | 'confirmed'
        | 'cancelled'
        | 'completed'
        | 'in_progress'
        | 'awaiting_pickup'
        | 'out_for_delivery'
        | 'item_delivered'
        | 'item_in_use'
        | 'awaiting_return'
        | 'item_returned'
      coordination_status:
        | 'pending'
        | 'coordinating'
        | 'confirmed'
        | 'conflict'
        | 'resolved'
      listing_type: 'equipment' | 'service' | 'package'
      payment_status:
        | 'pending_instructions'
        | 'instructions_sent'
        | 'payment_uploaded'
        | 'confirmed'
        | 'disputed'
      service_phase:
        | 'setup_pending'
        | 'service_active'
        | 'cleanup_pending'
        | 'service_completed'
      user_role: 'customer' | 'vendor' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        'requested',
        'confirmed',
        'cancelled',
        'completed',
        'in_progress',
        'awaiting_pickup',
        'out_for_delivery',
        'item_delivered',
        'item_in_use',
        'awaiting_return',
        'item_returned'
      ],
      coordination_status: [
        'pending',
        'coordinating',
        'confirmed',
        'conflict',
        'resolved'
      ],
      listing_type: ['equipment', 'service', 'package'],
      payment_status: [
        'pending_instructions',
        'instructions_sent',
        'payment_uploaded',
        'confirmed',
        'disputed'
      ],
      service_phase: [
        'setup_pending',
        'service_active',
        'cleanup_pending',
        'service_completed'
      ],
      user_role: ['customer', 'vendor', 'admin']
    }
  }
} as const
