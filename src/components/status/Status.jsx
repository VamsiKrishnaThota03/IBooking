import "./status.css";

export const Loading = ({ label = "Loading…" }) => (
  <div className="status" role="status">
    <span className="spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const ErrorMessage = ({ error, onRetry }) => (
  <div className="status status-error" role="alert">
    <span>{error?.message || "Something went wrong."}</span>
    {onRetry && (
      <button type="button" className="btn btn-outline" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export const Empty = ({ title, children }) => (
  <div className="status status-empty">
    <strong>{title}</strong>
    {children && <span>{children}</span>}
  </div>
);
