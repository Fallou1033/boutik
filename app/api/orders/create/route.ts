import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateDeliveryFee } from "@/lib/delivery";

interface OrderItemInput {
  product_id: string;
  quantity: number;
}

interface CustomerInput {
  full_name: string;
  phone: string;
}

interface DeliveryInput {
  recipient_name: string;
  recipient_phone: string;
  city?: string;
  district?: string;
  address_details?: string;
  landmark?: string;
  delivery_type: "home" | "pickup";
}

/**
 * POST /api/orders/create
 * Crée une commande depuis le storefront public.
 *
 * SÉCURITÉ :
 * - Les prix sont TOUJOURS recalculés côté serveur depuis la DB.
 * - Le client n'envoie que les IDs produits et les quantités.
 * - L'insert order_items est vérifié — rollback si échec.
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
      customer_notes,
    }: {
      store_id: string;
      items: OrderItemInput[];
      customer: CustomerInput;
      delivery: DeliveryInput;
      payment_method: string;
      customer_notes?: string;
    } = body;

    // ── Validation de présence ─────────────────────────────────────────────
    if (!store_id || !items?.length || !customer?.full_name || !customer?.phone || !delivery) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }
    if (!payment_method) {
      return NextResponse.json({ error: "Méthode de paiement manquante" }, { status: 400 });
    }

    const supabase = await createClient();

    // ── FIX #1 : Recalcul des prix côté serveur ────────────────────────────
    // On ne fait JAMAIS confiance aux prix envoyés par le client.
    const productIds = items.map((i) => i.product_id);

    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, images, track_stock, stock_quantity, is_active")
      .in("id", productIds)
      .eq("store_id", store_id)   // Les produits doivent appartenir à cette boutique
      .eq("is_active", true);

    if (productsError || !dbProducts?.length) {
      return NextResponse.json({ error: "Produits introuvables" }, { status: 400 });
    }

    interface DbProduct {
      id: string;
      name: string;
      price: number;
      images: string[] | null;
      track_stock: boolean;
      stock_quantity: number | null;
      is_active: boolean;
    }

    const products = (dbProducts ?? []) as unknown as DbProduct[];

    // Tous les produits demandés doivent exister
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Un ou plusieurs produits sont invalides" }, { status: 400 });
    }

    // Vérifier le stock et calculer les totaux réels
    const productMap = new Map(products.map((p) => [p.id, p]));
    const verifiedItems: Array<{
      product_id: string;
      product_name: string;
      product_image: string | null;
      unit_price: number;
      quantity: number;
      line_total: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json({ error: `Produit introuvable` }, { status: 400 });
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity)));

      // Vérifier le stock si activé
      if (product.track_stock && (product.stock_quantity ?? 0) < qty) {
        return NextResponse.json(
          { error: `Stock insuffisant pour "${product.name}" (disponible : ${product.stock_quantity ?? 0})` },
          { status: 400 }
        );
      }

      verifiedItems.push({
        product_id:    product.id,
        product_name:  product.name,
        product_image: (product.images as string[])?.[0] ?? null,
        unit_price:    product.price,        // ← prix réel DB
        quantity:      qty,
        line_total:    product.price * qty,  // ← calculé serveur
      });
    }

    // Totaux calculés entièrement côté serveur (prix réels DB + tarif zone de livraison)
    const computedSubtotal = verifiedItems.reduce((sum, i) => sum + i.line_total, 0);
    const { fee: calculatedFee } = calculateDeliveryFee(delivery?.district, delivery?.city);
    const computedDeliveryFee = delivery?.delivery_type === "pickup" ? 0 : calculatedFee;
    const computedTotal = computedSubtotal + computedDeliveryFee;

    // ── 1. Upsert customer ─────────────────────────────────────────────────
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          store_id,
          full_name:          customer.full_name,
          phone:              customer.phone,
          preferred_city:     delivery.city,
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

    // ── 2. Créer la livraison ──────────────────────────────────────────────
    const { data: deliveryData, error: deliveryError } = await supabase
      .from("deliveries")
      .insert({
        recipient_name:  delivery.recipient_name,
        recipient_phone: delivery.recipient_phone,
        city:            delivery.city ?? "Dakar",
        district:        delivery.district,
        address_details: delivery.address_details,
        landmark:        delivery.landmark,
        delivery_type:   delivery.delivery_type,
        delivery_fee:    computedDeliveryFee, // ← frais calculés serveur
      } as never)
      .select("id")
      .single();

    if (deliveryError || !deliveryData) {
      console.error("Delivery insert error:", deliveryError);
      return NextResponse.json({ error: "Erreur livraison" }, { status: 500 });
    }

    const deliveryId = (deliveryData as unknown as { id: string }).id;

    // ── 3. Générer la référence commande ───────────────────────────────────
    const { data: refData } = await supabase.rpc(
      "generate_order_reference" as never,
      { p_store_id: store_id } as never
    );
    const reference = (refData as unknown as string) ?? `CMD-${Date.now()}`;

    // ── 4. Créer la commande ───────────────────────────────────────────────
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id,
        customer_id:    customerId,
        delivery_id:    deliveryId,
        reference,
        order_status:   "pending",
        payment_status: "unpaid",
        subtotal:       computedSubtotal,    // ← calculé serveur
        delivery_fee:   computedDeliveryFee, // ← calculé serveur
        total:          computedTotal,       // ← calculé serveur
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

    // ── 5. Créer les lignes de commande ────────────────────────────────────
    // FIX #2 : vérifier le résultat de l'insert + rollback si échec
    const orderItemsData = verifiedItems.map((item) => ({
      order_id: order.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData as never[]);

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      // Rollback : supprimer la commande créée
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement des produits. Veuillez réessayer." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, reference: order.reference, order_id: order.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


