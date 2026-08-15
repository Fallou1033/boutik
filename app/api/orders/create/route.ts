import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface CustomerInput {
  full_name: string;
  phone: string;
}

interface DeliveryInput {
  recipient_name: string;
  recipient_phone: string;
  city: string;
  district: string;
  address_details?: string;
  landmark?: string;
  delivery_type: "home" | "pickup";
  delivery_fee: number;
}

/**
 * POST /api/orders/create
 * Crée une commande depuis le storefront public.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      store_id,
      items,
      customer,
      delivery,
      payment_method,
      subtotal,
      delivery_fee,
      total,
      customer_notes,
    }: {
      store_id: string;
      items: OrderItem[];
      customer: CustomerInput;
      delivery: DeliveryInput;
      payment_method: string;
      subtotal: number;
      delivery_fee: number;
      total: number;
      customer_notes?: string;
    } = body;

    if (!store_id || !items?.length || !customer || !delivery) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Upsert customer
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          store_id,
          full_name: customer.full_name,
          phone: customer.phone,
          preferred_city: delivery.city,
          preferred_district: delivery.district,
        } as never,
        { onConflict: "store_id,phone", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (customerError || !customerData) {
      console.error("Customer upsert error:", customerError);
      return NextResponse.json({ error: "Erreur client" }, { status: 500 });
    }

    const customerId = (customerData as unknown as { id: string }).id;

    // 2. Créer la livraison
    let deliveryId: string | null = null;
    const { data: deliveryData } = await supabase
      .from("deliveries")
      .insert({
        recipient_name:  delivery.recipient_name,
        recipient_phone: delivery.recipient_phone,
        city:            delivery.city ?? "Dakar",
        district:        delivery.district,
        address_details: delivery.address_details,
        landmark:        delivery.landmark,
        delivery_type:   delivery.delivery_type,
        delivery_fee:    delivery.delivery_fee,
      } as never)
      .select("id")
      .single();

    if (deliveryData) {
      deliveryId = (deliveryData as unknown as { id: string }).id;
    }

    // 3. Générer la référence commande
    const { data: refData } = await supabase.rpc(
      "generate_order_reference" as never,
      { p_store_id: store_id } as never
    );
    const reference = (refData as unknown as string) ?? `CMD-${Date.now()}`;

    // 4. Créer la commande
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id,
        customer_id:    customerId,
        delivery_id:    deliveryId,
        reference,
        order_status:   "pending",
        payment_status: "unpaid",
        subtotal,
        delivery_fee,
        total,
        currency:       "XOF",
        payment_method,
        customer_notes,
      } as never)
      .select("id, reference")
      .single();

    if (orderError || !orderData) {
      console.error("Order error:", orderError);
      return NextResponse.json({ error: "Erreur commande" }, { status: 500 });
    }

    const order = orderData as unknown as { id: string; reference: string };

    // 5. Créer les lignes de commande
    const orderItemsData = items.map((item) => ({
      order_id:      order.id,
      product_id:    item.product_id,
      product_name:  item.product_name,
      product_image: item.product_image,
      unit_price:    item.unit_price,
      quantity:      item.quantity,
      line_total:    item.line_total,
    }));

    await supabase.from("order_items").insert(orderItemsData as never[]);

    return NextResponse.json(
      { success: true, reference: order.reference, order_id: order.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
