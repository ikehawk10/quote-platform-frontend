import { Link, useParams } from "react-router-dom";
import { useQuoteStore } from "../store/quoteStore";

export function QuoteStatusPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const storedId = useQuoteStore((state) => state.quoteId);
  const status = useQuoteStore((state) => state.status);

  const hasMatchingQuote = Boolean(
    quoteId && storedId && quoteId === storedId && status,
  );

  return (
    <main className="page">
      <section className="panel status-panel">
        <header className="panel-header">
          <p className="eyebrow">Quote request</p>
          <h1>Quote submitted</h1>
          <p className="lede">
            Your request was accepted and is waiting to be processed.
          </p>
        </header>

        <dl className="status-list">
          <div>
            <dt>Quote ID</dt>
            <dd>
              <code>{quoteId ?? "Unknown"}</code>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              {hasMatchingQuote ? (
                <span className="status-pill">{status}</span>
              ) : (
                <span className="muted">
                  Status is only available from this session’s submission.
                </span>
              )}
            </dd>
          </div>
        </dl>

        <p className="note">
          Live quote details will appear here once quote lookup is connected.
        </p>

        <Link className="text-link" to="/">
          Start another quote
        </Link>
      </section>
    </main>
  );
}
