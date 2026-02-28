"use client";

const CATEGORY_LABELS = {
  network: "Network Error",
  timeout: "Timeout",
  rate_limit: "Rate Limited",
  llm_error: "AI Error",
  auth: "Auth Error",
  validation: "Validation",
  server: "Server Error",
  wallet: "Wallet Error",
};

export default function ErrorAlert({ error, onRetry, onDismiss }) {
  if (!error) return null;

  const message =
    typeof error === "string"
      ? error
      : error.message || "Something went wrong.";
  const category = error?.category || "unknown";
  const details = error?.details || "";
  const retryable = error?.retryable ?? !!onRetry;
  const label = CATEGORY_LABELS[category] || "Error";

  return (
    <div role="alert" aria-live="assertive" className="error-alert">
      <div className="error-alert-header">
        <strong>
          {label}: {message}
        </strong>
      </div>
      {details && <p className="error-alert-details">{details}</p>}
      <div className="error-alert-actions">
        {retryable && onRetry && (
          <button className="button button-sm" onClick={onRetry} type="button">
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            className="button button-sm button-ghost"
            onClick={onDismiss}
            type="button"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
