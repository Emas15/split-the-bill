"use client";

import { FormEvent, useEffect, useState } from "react";

type Share = {
  id: string;
  name: string;
  amount: number;
};

const MAX_PEOPLE = 50;
const MAX_HISTORY = 20;
const STORAGE_KEY = "split-the-bill";

type HistoryPerson = {
  name: string;
  amount: number;
  paid: boolean;
};

type HistoryEntry = {
  id: string;
  savedAt: string;
  total: number;
  people: HistoryPerson[];
};

type StoredState = {
  total: string;
  peopleCount: string;
  names: string[];
  shares: Share[] | null;
  paidIds: string[];
  paidNames: string[];
  history: HistoryEntry[];
};

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatHistoryDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Saved split";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const item = entry as Partial<HistoryEntry>;
      if (typeof item.id !== "string" || typeof item.savedAt !== "string") {
        return [];
      }

      const people = Array.isArray(item.people)
        ? item.people.filter(
            (person): person is HistoryPerson =>
              Boolean(person) &&
              typeof person.name === "string" &&
              typeof person.amount === "number" &&
              typeof person.paid === "boolean",
          )
        : [];

      return [
        {
          id: item.id,
          savedAt: item.savedAt,
          total: typeof item.total === "number" ? item.total : 0,
          people,
        },
      ];
    })
    .slice(0, MAX_HISTORY);
}

function createPersonId(index: number) {
  return `person-${index + 1}`;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function loadStoredState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredState;
    return {
      total: typeof parsed.total === "string" ? parsed.total : "",
      peopleCount:
        typeof parsed.peopleCount === "string" ? parsed.peopleCount : "2",
      names: Array.isArray(parsed.names) ? parsed.names : ["", ""],
      shares: Array.isArray(parsed.shares)
        ? parsed.shares.map((share, index) => ({
            ...share,
            id:
              typeof share.id === "string" && share.id
                ? share.id
                : createPersonId(index),
          }))
        : null,
      paidIds: Array.isArray(parsed.paidIds) ? parsed.paidIds : [],
      paidNames: Array.isArray(parsed.paidNames) ? parsed.paidNames : [],
      history: parseHistory(parsed.history),
    };
  } catch {
    return null;
  }
}

export default function Home() {
  const [total, setTotal] = useState("");
  const [peopleCount, setPeopleCount] = useState("2");
  const [names, setNames] = useState<string[]>(["", ""]);
  const [shares, setShares] = useState<Share[] | null>(null);
  const [paidIds, setPaidIds] = useState<string[]>([]);
  const [paidNames, setPaidNames] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  const count = Math.max(
    0,
    Math.min(MAX_PEOPLE, Math.floor(Number(peopleCount) || 0)),
  );

  useEffect(() => {
    setOrigin(window.location.origin);

    const stored = loadStoredState();
    let nextPaidIds = stored?.paidIds ?? [];
    let nextPaid = stored?.paidNames ?? [];
    const storedShares = stored?.shares ?? null;
    const storedHistory = stored?.history ?? [];

    if (stored) {
      setTotal(stored.total);
      setPeopleCount(stored.peopleCount);
      setNames(stored.names.length > 0 ? stored.names : ["", ""]);
      setShares(storedShares);
      setHistory(storedHistory);
    }

    const searchParams = new URLSearchParams(window.location.search);
    const paidIdFromUrl = searchParams.get("paidId");
    const paidFromUrl = searchParams.get("paid");

    if (paidIdFromUrl) {
      nextPaidIds = addUnique(nextPaidIds, paidIdFromUrl);
    }

    if (paidFromUrl) {
      const matchingShare = storedShares?.find(
        (share) => normalizeName(share.name) === normalizeName(paidFromUrl),
      );

      if (matchingShare) {
        nextPaidIds = addUnique(nextPaidIds, matchingShare.id);
      }

      if (
        !nextPaid.some(
          (name) => normalizeName(name) === normalizeName(paidFromUrl),
        )
      ) {
        nextPaid = addUnique(nextPaid, paidFromUrl);
      }
      setSuccessMessage(`${paidFromUrl} is marked as paid.`);
    }

    if (paidIdFromUrl || paidFromUrl) {
      const nextStoredState: StoredState = {
        total: stored?.total ?? "",
        peopleCount: stored?.peopleCount ?? "2",
        names: stored?.names ?? ["", ""],
        shares: storedShares,
        paidIds: nextPaidIds,
        paidNames: nextPaid,
        history: storedHistory,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStoredState));
      } catch {
        // Ignore storage failures (private mode, quota, etc.)
      }

      window.history.replaceState({}, "", "/");
    }

    setPaidIds(nextPaidIds);
    setPaidNames(nextPaid);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!copiedId) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedId(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedId]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const payload: StoredState = {
      total,
      peopleCount,
      names,
      shares,
      paidIds,
      paidNames,
      history,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }, [ready, total, peopleCount, names, shares, paidIds, paidNames, history]);

  function syncNames(nextCount: number) {
    setNames((prev) => {
      if (nextCount <= prev.length) {
        return prev.slice(0, nextCount);
      }
      return [...prev, ...Array(nextCount - prev.length).fill("")];
    });
  }

  function handlePeopleChange(value: string) {
    setPeopleCount(value);
    setShares(null);

    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed) || parsed < 0) {
      syncNames(0);
      return;
    }
    syncNames(Math.min(MAX_PEOPLE, parsed));
  }

  function handleNameChange(index: number, value: string) {
    setNames((prev) => prev.map((name, i) => (i === index ? value : name)));
  }

  function resetCurrentSplit() {
    setTotal("");
    setPeopleCount("2");
    setNames(["", ""]);
    setShares(null);
    setPaidIds([]);
    setPaidNames([]);
    setSuccessMessage(null);
    setError(null);
    setCopiedId(null);
  }

  function deleteHistoryEntry(id: string) {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }

  function handleReset() {
    if (shares && shares.length > 0) {
      const bill = Number(total);
      const archivedTotal = Number.isFinite(bill)
        ? bill
        : shares.reduce((sum, share) => sum + share.amount, 0);

      const entry: HistoryEntry = {
        id: `split-${Date.now()}`,
        savedAt: new Date().toISOString(),
        total: archivedTotal,
        people: shares.map((share) => ({
          name: share.name,
          amount: share.amount,
          paid: isSharePaid(share),
        })),
      };

      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
    }

    resetCurrentSplit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const bill = Number(total);
    if (!Number.isFinite(bill) || bill <= 0) {
      setError("Enter a valid total bill amount.");
      setShares(null);
      return;
    }
    if (count < 1) {
      setError("Enter at least one person.");
      setShares(null);
      return;
    }

    const share = bill / count;
    const nextShares = names.map((name, index) => ({
      id: createPersonId(index),
      name: name.trim() || `Person ${index + 1}`,
      amount: share,
    }));

    setError(null);
    setShares(nextShares);
    setPaidIds((prev) =>
      prev.filter((paidId) => nextShares.some((person) => person.id === paidId)),
    );
    setPaidNames((prev) =>
      prev.filter((paidName) =>
        nextShares.some(
          (person) => normalizeName(person.name) === normalizeName(paidName),
        ),
      ),
    );
  }

  function isSharePaid(share: Share) {
    return (
      paidIds.includes(share.id) ||
      paidNames.some((name) => normalizeName(name) === normalizeName(share.name))
    );
  }

  function createPaymentUrl(share: Share) {
    const params = new URLSearchParams({
      name: share.name,
      amount: share.amount.toFixed(2),
      paidId: share.id,
    });

    return `${origin || ""}/pay?${params.toString()}`;
  }

  async function copyPaymentUrl(share: Share) {
    const url = createPaymentUrl(share);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(share.id);
    } catch {
      setError("Unable to copy the payment link.");
    }
  }

  const paidCount = shares
    ? shares.filter((share) => isSharePaid(share)).length
    : 0;
  const paidPercent =
    shares && shares.length > 0 ? (paidCount / shares.length) * 100 : 0;
  const allPaid = Boolean(shares && shares.length > 0 && paidCount === shares.length);
  const canReset =
    Boolean(shares) ||
    total !== "" ||
    peopleCount !== "2" ||
    names.some((name) => name.trim() !== "") ||
    paidIds.length > 0 ||
    paidNames.length > 0;

  const inputClassName =
    "mt-1.5 w-full rounded-xl border border-emerald-300/20 bg-black/20 px-3 py-2.5 text-white outline-none placeholder:text-emerald-100/30 backdrop-blur-sm transition focus:border-emerald-400/60 focus:bg-black/30 focus:ring-2 focus:ring-emerald-400/30";

  const glassCardClassName =
    "relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-emerald-950/30 p-6 backdrop-blur-2xl transition hover:border-emerald-300/40 [animation:glowPulse_5s_ease-in-out_infinite]";

  return (
    <main
      className="min-h-screen px-4 py-12 font-[family-name:var(--font-geist-sans)] text-white sm:py-16"
      style={{
        backgroundColor: "#0f3d24",
        backgroundImage: `
          radial-gradient(circle at top, rgba(52,211,153,0.25), transparent 55%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ctext x='10' y='40' font-size='34' fill='%2334d399' fill-opacity='0.08' font-family='Arial' font-weight='bold'%3E%24%3C/text%3E%3Ctext x='65' y='95' font-size='28' fill='%2322c55e' fill-opacity='0.07' font-family='Arial' font-weight='bold'%3E%24%3C/text%3E%3C/svg%3E")
        `,
      }}
    >
      <div className="mx-auto w-full max-w-lg space-y-6">
        <header className="relative overflow-hidden rounded-3xl px-1 py-6 text-center sm:text-left">
          <span className="pointer-events-none absolute left-4 top-2 text-2xl opacity-20 [animation:floatUp_4s_ease-in-out_infinite]">
            $
          </span>
          <span className="pointer-events-none absolute right-8 top-8 text-xl opacity-15 [animation:floatUp_5s_ease-in-out_infinite_0.5s]">
            $
          </span>
          <span className="pointer-events-none absolute bottom-2 right-20 text-lg opacity-10 [animation:floatUp_3.5s_ease-in-out_infinite_1s]">
            $
          </span>

          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <span className="inline-block text-5xl sm:text-6xl [animation:pound_2.2s_ease-in-out_infinite]">
              💰
            </span>
            <h1 className="bg-gradient-to-r from-emerald-300 via-green-400 to-lime-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_25px_rgba(52,211,153,0.35)] sm:text-5xl">
              Let&apos;s split the bill
            </h1>
          </div>
          <p className="mt-2 max-w-md text-emerald-100/70 sm:mx-0 mx-auto">
            Enter the total, how many people are splitting, and their names.
            We&apos;ll do the math.
          </p>
        </header>

        {successMessage && (
          <p className="animate-[fadeIn_0.3s_ease-out] rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.2)] backdrop-blur-md">
            {successMessage}
          </p>
        )}

        <section className={glassCardClassName}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
          <div className="relative">
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-emerald-100">
                  Total bill amount
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={total}
                  onChange={(event) => {
                    setTotal(event.target.value);
                    setShares(null);
                  }}
                  placeholder="0.00"
                  className={inputClassName}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-emerald-100">
                  Number of people
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={MAX_PEOPLE}
                  step="1"
                  value={peopleCount}
                  onChange={(event) => handlePeopleChange(event.target.value)}
                  className={inputClassName}
                />
              </label>

              {count > 0 && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold text-emerald-100">
                    Names
                  </legend>
                  {names.map((name, index) => (
                    <input
                      key={index}
                      type="text"
                      value={name}
                      onChange={(event) =>
                        handleNameChange(index, event.target.value)
                      }
                      placeholder={`Person ${index + 1}`}
                      className={`${inputClassName} mt-0`}
                    />
                  ))}
                </fieldset>
              )}

              {error && (
                <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-[0.98]"
              >
                💵 Split bill
              </button>
              {canReset && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-xl border border-emerald-300/20 bg-black/20 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/40 hover:bg-black/30"
                >
                  Start a new split
                </button>
              )}
            </form>
          </div>
        </section>

        {shares && (
          <section className={glassCardClassName}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
            <div className="relative">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg font-bold text-white">Each share</h2>
                <p className="text-sm font-semibold text-lime-300">
                  {paidCount} of {shares.length} paid
                </p>
              </div>
              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-black/30"
                role="progressbar"
                aria-label="Payment progress"
                aria-valuemin={0}
                aria-valuemax={shares.length}
                aria-valuenow={paidCount}
              >
                <div
                  className="h-full rounded-full bg-[length:200%_100%] bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-400 shadow-[0_0_15px_rgba(163,230,53,0.6)] transition-[width] duration-500 ease-out [animation:shimmer_2.5s_linear_infinite]"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>

              <ul className="mt-5 space-y-3">
                {shares.map((share, index) => {
                  const isPaid = isSharePaid(share);

                  return (
                    <li
                      key={`${index}-${share.name}`}
                      className={`rounded-2xl border px-4 py-3 transition ${
                        isPaid
                          ? "border-emerald-400/40 bg-emerald-400/10"
                          : "border-emerald-300/15 bg-black/20 hover:border-emerald-300/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-white">
                            {share.name}
                          </span>
                          <span className="text-sm text-emerald-200/70">
                            {formatMoney(share.amount)}
                          </span>
                        </span>
                        {isPaid && (
                          <span className="shrink-0 animate-[popIn_0.3s_ease-out] rounded-full bg-emerald-400/20 px-2.5 py-1 text-sm font-semibold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            Paid ✅
                          </span>
                        )}
                      </div>
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => copyPaymentUrl(share)}
                          className="mt-3 w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] transition hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] active:scale-[0.98] sm:w-auto"
                          aria-label={`Copy ${share.name} payment link`}
                        >
                          {copiedId === share.id ? "Copied! ✓" : "🔗 Copy Link"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={handleReset}
                className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  allPaid
                    ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(163,230,53,0.4)] hover:scale-[1.02]"
                    : "border border-emerald-300/20 bg-black/20 text-emerald-100 hover:border-emerald-300/40 hover:bg-black/30"
                }`}
              >
                {allPaid ? "🎉 All paid — start a new split" : "Start a new split"}
              </button>
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className={glassCardClassName}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-lg font-bold text-white">Previous splits</h2>
              <p className="mt-1 text-sm text-emerald-200/50">
                Saved when you start a new split.
              </p>
              <ul className="mt-4 space-y-3">
                {history.map((entry) => {
                  const entryPaid = entry.people.filter((person) => person.paid)
                    .length;

                  return (
                    <li
                      key={entry.id}
                      className="rounded-2xl border border-emerald-300/15 bg-black/20 px-4 py-3 transition hover:border-emerald-300/30"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-white">
                          {formatHistoryDate(entry.savedAt)}
                        </span>
                        <span className="text-sm font-semibold text-lime-300">
                          {formatMoney(entry.total)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-emerald-200/50">
                        {entryPaid} of {entry.people.length} paid
                        {entry.people.length > 0
                          ? ` · ${entry.people.map((person) => person.name).join(", ")}`
                          : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteHistoryEntry(entry.id)}
                        className="mt-2 text-sm font-medium text-red-400 transition hover:text-red-300"
                        aria-label={`Delete split from ${formatHistoryDate(entry.savedAt)}`}
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
