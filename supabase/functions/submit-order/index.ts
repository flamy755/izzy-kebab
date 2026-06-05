import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RECIPIENT = "narocila.izzy@gmail.com";

type Item = {
  name: string;
  qty: number;
  price: number;
  options?: {
    meat?: string;
    sauces?: string[];
    toppings?: string[];
    extras?: string[];
  };
};

type Payload = {
  customer_name: string;
  phone: string;
  address: string;
  notes?: string;
  items: Item[];
  food_total: number;
  delivery_fee: number;
  total: number;
};

const fmt = (n: number) => `€${n.toFixed(2).replace(".", ",")}`;

function validate(p: any): p is Payload {
  if (!p || typeof p !== "object") return false;
  if (typeof p.customer_name !== "string" || p.customer_name.trim().length < 1 || p.customer_name.length > 120) return false;
  if (typeof p.phone !== "string" || p.phone.trim().length < 4 || p.phone.length > 40) return false;
  if (typeof p.address !== "string" || p.address.trim().length < 3 || p.address.length > 250) return false;
  if (p.notes != null && (typeof p.notes !== "string" || p.notes.length > 1000)) return false;
  if (!Array.isArray(p.items) || p.items.length === 0 || p.items.length > 100) return false;
  for (const it of p.items) {
    if (!it || typeof it.name !== "string" || it.name.length > 200) return false;
    if (typeof it.qty !== "number" || it.qty < 1 || it.qty > 99) return false;
    if (typeof it.price !== "number" || it.price < 0 || it.price > 1000) return false;
  }
  if (typeof p.food_total !== "number" || p.food_total < 0) return false;
  if (typeof p.delivery_fee !== "number" || p.delivery_fee < 0) return false;
  if (typeof p.total !== "number" || p.total < 0) return false;
  return true;
}

function buildEmailHtml(p: Payload, orderId: string) {
  const rows = p.items
    .map((it) => {
      const opts: string[] = [];
      if (it.options?.meat) opts.push(`Meso: ${it.options.meat}`);
      if (it.options?.sauces?.length) opts.push(`Omake: ${it.options.sauces.join(", ")}`);
      if (it.options?.toppings?.length) opts.push(`Priloge: ${it.options.toppings.join(", ")}`);
      if (it.options?.extras?.length) opts.push(`Dodatki: ${it.options.extras.join(", ")}`);
      const optHtml = opts.length
        ? `<div style="font-size:12px;color:#666;margin-top:4px">${opts.join(" · ")}</div>`
        : "";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee">
            <div style="font-weight:600">${it.qty}× ${escapeHtml(it.name)}</div>
            ${optHtml}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;font-weight:600">
            ${fmt(it.price * it.qty)}
          </td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="font-family:Arial,sans-serif;background:#fafafa;padding:20px;color:#111">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
    <div style="background:#e11d2e;color:#fff;padding:20px 24px">
      <div style="font-size:12px;letter-spacing:2px;opacity:.85">NOVO NAROČILO</div>
      <div style="font-size:24px;font-weight:800;margin-top:4px">Izzy Döner Kebab</div>
    </div>
    <div style="padding:20px 24px">
      <h3 style="margin:0 0 8px;font-size:16px">Stranka</h3>
      <div><strong>Ime:</strong> ${escapeHtml(p.customer_name)}</div>
      <div><strong>Telefon:</strong> <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></div>
      <div><strong>Naslov:</strong> ${escapeHtml(p.address)}</div>
      ${p.notes ? `<div style="margin-top:8px"><strong>Opombe:</strong><br>${escapeHtml(p.notes).replace(/\n/g, "<br>")}</div>` : ""}

      <h3 style="margin:20px 0 8px;font-size:16px">Izdelki</h3>
      <table style="width:100%;border-collapse:collapse">${rows}</table>

      <table style="width:100%;margin-top:14px;font-size:14px">
        <tr><td>Hrana</td><td style="text-align:right">${fmt(p.food_total)}</td></tr>
        <tr><td>Dostava (Nova Gorica)</td><td style="text-align:right">${fmt(p.delivery_fee)}</td></tr>
        <tr><td style="padding-top:8px;border-top:2px solid #111;font-weight:800;font-size:16px">SKUPAJ</td>
            <td style="padding-top:8px;border-top:2px solid #111;font-weight:800;font-size:16px;text-align:right;color:#e11d2e">${fmt(p.total)}</td></tr>
      </table>

      <div style="margin-top:20px;font-size:12px;color:#888">Naročilo #${orderId.slice(0, 8)} · ${new Date().toLocaleString("sl-SI")}</div>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function sendEmail(html: string, subject: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Izzy Döner <onboarding@resend.dev>",
        to: [RECIPIENT],
        subject,
        html,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("Resend error", r.status, t);
      return { ok: false, error: t };
    }
    return { ok: true };
  }
  console.warn("No RESEND_API_KEY configured — order saved but email not sent");
  return { ok: false, error: "EMAIL_NOT_CONFIGURED" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const payload = await req.json();
    if (!validate(payload)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: inserted, error: insErr } = await supabase
      .from("orders")
      .insert({
        customer_name: payload.customer_name.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        notes: payload.notes?.trim() || null,
        items: payload.items,
        food_total: payload.food_total,
        delivery_fee: payload.delivery_fee,
        total: payload.total,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      console.error("DB insert error", insErr);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml(payload, inserted.id);
    const subject = `Novo naročilo — ${payload.customer_name} (${fmt(payload.total)})`;
    const emailRes = await sendEmail(html, subject);

    if (emailRes.ok) {
      await supabase.from("orders").update({ email_sent: true }).eq("id", inserted.id);
    }

    return new Response(JSON.stringify({ ok: true, orderId: inserted.id, emailSent: emailRes.ok }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-order error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});