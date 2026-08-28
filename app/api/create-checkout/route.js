import { NextResponse } from "next/server";
import { stripe } from '@/lib/stripe';
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function POST(request) {
  try {
    const { name, amount } = await request.json();
    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Bill share — ${name}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/success?name=${encodeURIComponent(name)}&redirect=true`,
      cancel_url: `${baseUrl}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
