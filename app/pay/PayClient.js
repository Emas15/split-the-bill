"use client";

import { useState } from "react";

function formatMoney(amount) {
  return `$${amount.toFixed(2)}`;
}

export default function PayClient({ name, amount, paidId }) {
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  async function handlePay() {
    setError(null);
    setIsPaying(true);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount, paidId }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error || "Unable to start checkout.");
        setIsPaying(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Unable to start checkout.");
      setIsPaying(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Split the Bill</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Pay your share
        </h1>
        <div className="mt-6 rounded-2xl bg-zinc-50 p-5">
          <p className="text-sm text-zinc-500">For</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{name}</p>
          <p className="mt-5 text-sm text-zinc-500">Amount due</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-zinc-900">
            {formatMoney(amount)}
          </p>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handlePay}
          disabled={isPaying}
          className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPaying ? "Opening checkout..." : `Pay ${formatMoney(amount)}`}
        </button>
      </section>
    </main>
  );
}
