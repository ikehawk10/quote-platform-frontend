import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getQuoteById, QuotesApiError, type Quote } from "../api/quotes";
import { useQuoteStore } from "../store/quoteStore";

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; quote: Quote }
  | { kind: "not_found"; message: string }
  | { kind: "error"; message: string };

function statusCopy(quote: Quote): { title: string; description: string } {
  switch (quote.status) {
    case "PENDING":
    case "PROCESSING":
      return {
        title: "Processing your quote",
        description:
          "We're working on your quote request. This page will show results when processing finishes.",
      };
    case "COMPLETED":
      return {
        title: "Your quote is ready",
        description: "Here are the details we have for this quote request.",
      };
    case "REJECTED":
      return {
        title: "Quote rejected",
        description:
          "We weren't able to continue with this quote request based on the details provided.",
      };
    case "FAILED":
      return {
        title: "Quote unavailable",
        description:
          "We ran into a problem generating this quote. Please try submitting again.",
      };
    default:
      return {
        title: "Quote status",
        description: "Here is the latest information for this quote request.",
      };
  }
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function QuoteStatusPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const setQuote = useQuoteStore((state) => state.setQuote);
  const [pageState, setPageState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    if (!quoteId) {
      setPageState({
        kind: "not_found",
        message: "We couldn't find that quote. It may have expired or the link is incorrect.",
      });
      return;
    }

    let cancelled = false;

    async function loadQuote() {
      setPageState({ kind: "loading" });

      try {
        const quote = await getQuoteById(quoteId!);
        if (cancelled) {
          return;
        }

        setQuote(quote.id, quote.status);
        setPageState({ kind: "ready", quote });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof QuotesApiError && (error.status === 404 || error.code === "QUOTE_NOT_FOUND")) {
          setPageState({
            kind: "not_found",
            message: error.message,
          });
          return;
        }

        const message =
          error instanceof QuotesApiError
            ? error.message
            : "Something went wrong while loading your quote. Please try again.";

        setPageState({
          kind: "error",
          message,
        });
      }
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [quoteId, setQuote]);

  if (pageState.kind === "loading") {
    return (
      <main className="page">
        <section className="panel status-panel">
          <header className="panel-header">
            <p className="eyebrow">Quote request</p>
            <h1>Loading quote</h1>
            <p className="lede">Fetching the latest status for this quote…</p>
          </header>
          <p className="loading-indicator" aria-live="polite">
            Loading…
          </p>
        </section>
      </main>
    );
  }

  if (pageState.kind === "not_found") {
    return (
      <main className="page">
        <section className="panel status-panel">
          <header className="panel-header">
            <p className="eyebrow">Quote request</p>
            <h1>Quote not found</h1>
            <p className="lede">{pageState.message}</p>
          </header>
          <Link className="text-link" to="/">
            Start a new quote
          </Link>
        </section>
      </main>
    );
  }

  if (pageState.kind === "error") {
    return (
      <main className="page">
        <section className="panel status-panel">
          <header className="panel-header">
            <p className="eyebrow">Quote request</p>
            <h1>Unable to load quote</h1>
            <p className="lede">{pageState.message}</p>
          </header>
          <div className="status-actions">
            <button
              type="button"
              className="submit"
              onClick={() => {
                if (!quoteId) {
                  return;
                }
                setPageState({ kind: "loading" });
                void getQuoteById(quoteId)
                  .then((quote) => {
                    setQuote(quote.id, quote.status);
                    setPageState({ kind: "ready", quote });
                  })
                  .catch((error: unknown) => {
                    if (
                      error instanceof QuotesApiError &&
                      (error.status === 404 || error.code === "QUOTE_NOT_FOUND")
                    ) {
                      setPageState({
                        kind: "not_found",
                        message: error.message,
                      });
                      return;
                    }

                    setPageState({
                      kind: "error",
                      message:
                        error instanceof QuotesApiError
                          ? error.message
                          : "Something went wrong while loading your quote. Please try again.",
                    });
                  });
              }}
            >
              Try again
            </button>
            <Link className="text-link" to="/">
              Start a new quote
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { quote } = pageState;
  const copy = statusCopy(quote);
  const isInProgress =
    quote.status === "PENDING" || quote.status === "PROCESSING";

  return (
    <main className="page">
      <section className="panel status-panel">
        <header className="panel-header">
          <p className="eyebrow">Quote request</p>
          <h1>{copy.title}</h1>
          <p className="lede">{copy.description}</p>
        </header>

        <div className="status-banner" data-status={quote.status}>
          <span className="status-pill" data-status={quote.status}>
            {quote.status}
          </span>
          {isInProgress ? (
            <p>Your quote is being processed. Please check back shortly.</p>
          ) : null}
          {quote.status === "FAILED" ? (
            <p>
              We couldn't complete this quote right now. No internal details are
              shown here — please start a new request or try again later.
            </p>
          ) : null}
          {quote.status === "REJECTED" ? (
            <p>
              {quote.rejection_reason?.trim()
                ? quote.rejection_reason
                : "This quote was rejected. No additional reason was provided."}
            </p>
          ) : null}
        </div>

        <dl className="status-list">
          <DetailItem label="Quote ID" value={quote.id} />
          {quote.status === "COMPLETED" ? (
            <>
              <DetailItem
                label="Applicant"
                value={`${quote.first_name} ${quote.last_name}`}
              />
              <DetailItem label="Email" value={quote.email} />
              <DetailItem label="Date of birth" value={quote.date_of_birth} />
              <DetailItem label="Address" value={quote.address} />
              <DetailItem label="State" value={quote.state} />
              <DetailItem
                label="Vehicle"
                value={`${quote.year} ${quote.make} ${quote.model}`}
              />
              <DetailItem label="VIN" value={quote.vin} />
            </>
          ) : (
            <>
              <DetailItem label="State" value={quote.state} />
              <DetailItem
                label="Vehicle"
                value={`${quote.year} ${quote.make} ${quote.model}`}
              />
            </>
          )}
        </dl>

        <Link className="text-link" to="/">
          Start another quote
        </Link>
      </section>
    </main>
  );
}
