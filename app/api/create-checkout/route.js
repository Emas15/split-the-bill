import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const paidId = typeof body.paidId === "string" ? body.paidId.trim() : "";
    const amount = Number(body.amount);

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number." },
        { status: 400 },
      );
    }

    const successParams = new URLSearchParams({ paid: name });
    if (paidId) {
      successParams.set("paidId", paidId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/?${successParams.toString()}`,
      cancel_url: "http://localhost:3000",
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
