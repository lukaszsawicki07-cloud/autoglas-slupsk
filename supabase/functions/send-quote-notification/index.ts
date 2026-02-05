import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuoteNotification {
  name: string;
  phone: string;
  email?: string;
  vehicle: string;
  vin?: string;
  description: string;
}

const RECIPIENT_EMAILS = [
  "autoglasslupsk@gmail.com",
  "lukasz.sawicki07@gmail.com"
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: QuoteNotification = await req.json();

    console.log("New quote request received:", {
      name: data.name,
      phone: data.phone,
      vehicle: data.vehicle,
    });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailHtml = `
      <h2>Nowe zapytanie o wycenę!</h2>
      <p><strong>Imię i nazwisko:</strong> ${data.name}</p>
      <p><strong>Telefon:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
      <p><strong>Email:</strong> ${data.email ? `<a href="mailto:${data.email}">${data.email}</a>` : "Nie podano"}</p>
      <p><strong>Pojazd:</strong> ${data.vehicle}</p>
      <p><strong>VIN:</strong> ${data.vin || "Nie podano"}</p>
      <p><strong>Opis uszkodzenia:</strong></p>
      <p>${data.description}</p>
      <hr>
      <p><em>Skontaktuj się z klientem jak najszybciej!</em></p>
    `;

    const emailText = `
Nowe zapytanie o wycenę!

Imię i nazwisko: ${data.name}
Telefon: ${data.phone}
Email: ${data.email || "Nie podano"}
Pojazd: ${data.vehicle}
VIN: ${data.vin || "Nie podano"}
Opis uszkodzenia: ${data.description}

---
Skontaktuj się z klientem jak najszybciej!
    `.trim();

    const emailPromises = RECIPIENT_EMAILS.map(async (to) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Auto Glas Słupsk <noreply@autoglasslupsk.pl>",
          to: [to],
          subject: `🔔 Nowe zapytanie od ${data.name}`,
          html: emailHtml,
          text: emailText,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`Failed to send email to ${to}:`, error);
        throw new Error(`Failed to send email to ${to}: ${error}`);
      }

      return res.json();
    });

    await Promise.all(emailPromises);

    console.log(`Emails sent successfully to: ${RECIPIENT_EMAILS.join(", ")}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification emails sent successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing notification:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
