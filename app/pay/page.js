import Link from "next/link";
import PayClient from "./PayClient";

export const metadata = {
  title: "Pay your share",
  description: "Pay your part of a split bill.",
};

export default function PayPage({ searchParams }) {
  const name =
    typeof searchParams.name === "string" ? searchParams.name.trim() : "";
  const amount = Number(searchParams.amount);
  const paidId =
    typeof searchParams.paidId === "string" ? searchParams.paidId.trim() : "";

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
        <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-red-600">Invalid payment link</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            This link is missing details
          </h1>
          <p className="mt-3 text-zinc-600">
            Ask the bill organizer to send you a fresh payment link.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex w-full justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Back to split
          </Link>
        </section>
      </main>
    );
  }

  return <PayClient name={name} amount={amount} paidId={paidId} />;
}
