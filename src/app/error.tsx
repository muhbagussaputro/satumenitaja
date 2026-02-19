"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-box">
      <h1>Terjadi error</h1>
      <p>{error.message || "Unexpected error."}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Coba Lagi
      </button>
    </div>
  );
}
