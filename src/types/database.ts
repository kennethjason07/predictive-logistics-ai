export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      supply_bases: {
        Row: {
          id: string;
          name: string;
          code: string;
          sector: string;
          altitude_meters: number | null;
          contact_person: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          sector: string;
          altitude_meters?: number | null;
          contact_person?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          sector?: string;
          altitude_meters?: number | null;
          contact_person?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          base_id: string;
          category: string;
          item_name: string;
          sku: string;
          current_quantity: number;
          unit: string;
          minimum_threshold: number;
          critical_threshold: number;
          last_restocked_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          base_id: string;
          category: string;
          item_name: string;
          sku: string;
          current_quantity?: number;
          unit: string;
          minimum_threshold: number;
          critical_threshold: number;
          last_restocked_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          base_id?: string;
          category?: string;
          item_name?: string;
          sku?: string;
          current_quantity?: number;
          unit?: string;
          minimum_threshold?: number;
          critical_threshold?: number;
          last_restocked_at?: string | null;
          updated_at?: string;
        };
      };
      convoys: {
        Row: {
          id: string;
          convoy_number: string;
          origin_base_id: string | null;
          destination_base_id: string | null;
          departure_time: string | null;
          estimated_arrival: string | null;
          actual_arrival: string | null;
          route_name: string | null;
          transit_status: string;
          assigned_escort_unit: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          convoy_number: string;
          origin_base_id?: string | null;
          destination_base_id?: string | null;
          departure_time?: string | null;
          estimated_arrival?: string | null;
          actual_arrival?: string | null;
          route_name?: string | null;
          transit_status?: string;
          assigned_escort_unit?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          convoy_number?: string;
          origin_base_id?: string | null;
          destination_base_id?: string | null;
          departure_time?: string | null;
          estimated_arrival?: string | null;
          actual_arrival?: string | null;
          route_name?: string | null;
          transit_status?: string;
          assigned_escort_unit?: string | null;
          created_at?: string;
        };
      };
      predictive_alerts: {
        Row: {
          id: string;
          base_id: string;
          item_id: string | null;
          alert_type: string;
          severity: string;
          confidence_score: number | null;
          predicted_stockout_date: string | null;
          recommendation: string;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          base_id: string;
          item_id?: string | null;
          alert_type: string;
          severity?: string;
          confidence_score?: number | null;
          predicted_stockout_date?: string | null;
          recommendation: string;
          is_resolved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          base_id?: string;
          item_id?: string | null;
          alert_type?: string;
          severity?: string;
          confidence_score?: number | null;
          predicted_stockout_date?: string | null;
          recommendation?: string;
          is_resolved?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
