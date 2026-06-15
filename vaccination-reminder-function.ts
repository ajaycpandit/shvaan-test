// Supabase Edge Function: vaccination-reminders
// Sends an email to owners whose dog has a vaccination expiring within 30 days (or expired).
// Deploy with: supabase functions deploy vaccination-reminders --no-verify-jwt
// Schedule it daily with a Supabase cron (see README_BACKEND_SETUP.md).
//
// Required environment variables (set in Supabase dashboard → Edge Functions → Secrets):
//   SUPABASE_URL            - your project URL
//   SUPABASE_SERVICE_ROLE   - service role key (NOT the anon key — keep this secret)
//   RESEND_API_KEY          - from resend.com
//   FROM_EMAIL              - e.g. "Shvaan Pet Care <reminders@yourdomain.com>"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE")!
  );

  const resendKey = Deno.env.get("RESEND_API_KEY")!;
  const fromEmail = Deno.env.get("FROM_EMAIL") || "Shvaan Pet Care <onboarding@resend.dev>";

  // Pull all dogs
  const { data: dogs, error } = await supabase.from("dogs").select("*");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const toNotify: { dog: any; vaccine: string; date: string; expired: boolean }[] = [];

  for (const d of dogs || []) {
    if (!d.owner_email) continue; // can't email without an address
    const checks: [string, string | null][] = [
      ["Rabies", d.vacc_rabies],
      ["DHPP", d.vacc_dhpp],
      ["Bordetella", d.vacc_bordetella],
    ];
    for (const [name, dt] of checks) {
      if (!dt) continue;
      const exp = new Date(dt);
      if (exp <= soon) {
        toNotify.push({ dog: d, vaccine: name, date: dt, expired: exp < now });
      }
    }
  }

  let sent = 0;
  const errors: string[] = [];

  for (const item of toNotify) {
    const expStr = new Date(item.date).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    const subject = `${item.dog.dog_name}'s ${item.vaccine} vaccination ${item.expired ? "has expired" : "is expiring soon"}`;
    const body = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#2A211A">
        <h2 style="color:#C25E18">Shvaan Pet Care — Vaccination Reminder</h2>
        <p>Hi ${item.dog.owner_name || "there"},</p>
        <p>This is a friendly reminder that <strong>${item.dog.dog_name}'s ${item.vaccine}</strong> vaccination
        ${item.expired ? "expired on" : "is set to expire on"} <strong>${expStr}</strong>.</p>
        <p>To keep ${item.dog.dog_name}'s boarding eligibility current, please arrange to update this vaccination
        and send us the new record at your earliest convenience.</p>
        <p>Thank you,<br>Shvaan Pet Care</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromEmail, to: item.dog.owner_email, subject, html: body }),
    });
    if (res.ok) sent++;
    else errors.push(`${item.dog.dog_name}: ${await res.text()}`);
  }

  return new Response(JSON.stringify({ checked: dogs?.length || 0, sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
