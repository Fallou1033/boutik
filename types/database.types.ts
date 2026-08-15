/**
 * Types générés automatiquement par Supabase CLI.
 * Pour regénérer : npx supabase gen types typescript --project-id <id> > types/database.types.ts
 *
 * Ces types seront mis à jour après avoir exécuté les migrations SQL.
 * En attendant, ce fichier fournit une structure de base typée manuellement.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string;
          plan: "free" | "starter" | "pro";
          plan_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string;
          plan?: "free" | "starter" | "pro";
          plan_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchants"]["Insert"]>;
      };
      stores: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          whatsapp_number: string;
          city: string;
          district: string | null;
          address_details: string | null;
          instagram_handle: string | null;
          tiktok_handle: string | null;
          currency: "XOF" | "EUR" | "USD";
          is_active: boolean;
          accepts_delivery: boolean;
          max_products: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          whatsapp_number: string;
          city?: string;
          district?: string | null;
          address_details?: string | null;
          instagram_handle?: string | null;
          tiktok_handle?: string | null;
          currency?: "XOF" | "EUR" | "USD";
          is_active?: boolean;
          accepts_delivery?: boolean;
          max_products?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          description: string | null;
          price: number;
          compare_price: number | null;
          track_stock: boolean;
          stock_quantity: number | null;
          images: string[];
          category: string | null;
          tags: string[];
          is_active: boolean;
          is_featured: boolean;
          meta_description: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          price: number;
          compare_price?: number | null;
          track_stock?: boolean;
          stock_quantity?: number | null;
          images?: string[];
          category?: string | null;
          tags?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          meta_description?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          store_id: string;
          full_name: string;
          phone: string;
          preferred_city: string | null;
          preferred_district: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          full_name: string;
          phone: string;
          preferred_city?: string | null;
          preferred_district?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      deliveries: {
        Row: {
          id: string;
          recipient_name: string;
          recipient_phone: string;
          city: string;
          district: string;
          address_details: string | null;
          landmark: string | null;
          delivery_type: "home" | "pickup";
          delivery_fee: number;
          status: "pending" | "assigned" | "in_transit" | "delivered" | "failed" | "returned";
          notes: string | null;
          estimated_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipient_name: string;
          recipient_phone: string;
          city?: string;
          district: string;
          address_details?: string | null;
          landmark?: string | null;
          delivery_type?: "home" | "pickup";
          delivery_fee?: number;
          status?: "pending" | "assigned" | "in_transit" | "delivered" | "failed" | "returned";
          notes?: string | null;
          estimated_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deliveries"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          customer_id: string;
          delivery_id: string | null;
          reference: string;
          order_status:
            | "pending"
            | "awaiting_payment"
            | "paid"
            | "preparing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded";
          payment_status: "unpaid" | "pending" | "paid" | "failed" | "refunded";
          subtotal: number;
          delivery_fee: number;
          total: number;
          currency: "XOF" | "EUR" | "USD";
          payment_method: "wave" | "orange_money" | "free_money" | "cash_on_delivery" | null;
          payment_ref: string | null;
          paid_at: string | null;
          webhook_received_at: string | null;
          webhook_idempotency_key: string | null;
          customer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          customer_id: string;
          delivery_id?: string | null;
          reference: string;
          order_status?: "pending" | "awaiting_payment" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_status?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
          subtotal: number;
          delivery_fee?: number;
          total: number;
          currency?: "XOF" | "EUR" | "USD";
          payment_method?: "wave" | "orange_money" | "free_money" | "cash_on_delivery" | null;
          payment_ref?: string | null;
          paid_at?: string | null;
          webhook_received_at?: string | null;
          webhook_idempotency_key?: string | null;
          customer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_image: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_image?: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      payment_logs: {
        Row: {
          id: string;
          order_id: string;
          store_id: string;
          event_type:
            | "payment_initiated"
            | "webhook_received"
            | "webhook_verified"
            | "webhook_failed_signature"
            | "webhook_duplicate"
            | "payment_confirmed"
            | "payment_failed"
            | "refund_initiated"
            | "refund_confirmed";
          provider: "wave" | "cinetpay" | "orange_money" | "manual";
          raw_payload: Json | null;
          provider_ref: string | null;
          amount: number | null;
          currency: "XOF" | "EUR" | "USD" | null;
          success: boolean | null;
          error_message: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          store_id: string;
          event_type: Database["public"]["Tables"]["payment_logs"]["Row"]["event_type"];
          provider: Database["public"]["Tables"]["payment_logs"]["Row"]["provider"];
          raw_payload?: Json | null;
          provider_ref?: string | null;
          amount?: number | null;
          currency?: "XOF" | "EUR" | "USD" | null;
          success?: boolean | null;
          error_message?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: never; // payment_logs est immuable
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_merchant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_merchant_store_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      generate_order_reference: {
        Args: { p_store_id: string };
        Returns: string;
      };
      process_successful_payment: {
        Args: {
          p_order_reference: string;
          p_payment_provider_ref: string;
          p_amount: number;
          p_idempotency_key: string;
          p_raw_payload: Json;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
};

// ── Convenience type aliases ───────────────────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDTO<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDTO<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Row types
export type Merchant    = Tables<"merchants">;
export type Store       = Tables<"stores">;
export type Product     = Tables<"products">;
export type Customer    = Tables<"customers">;
export type Delivery    = Tables<"deliveries">;
export type Order       = Tables<"orders">;
export type OrderItem   = Tables<"order_items">;
export type PaymentLog  = Tables<"payment_logs">;

// Status types
export type OrderStatus   = Order["order_status"];
export type PaymentStatus = Order["payment_status"];
export type DeliveryStatus = Delivery["status"];
export type MerchantPlan  = Merchant["plan"];
