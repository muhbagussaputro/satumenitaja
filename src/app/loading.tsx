export default function Loading() {
  return (
    <div className="card loading-card" aria-live="polite" aria-busy="true">
      <p className="loading-inline">
        <span className="loading-dot" aria-hidden />
        Memuat data Al-Quran...
      </p>
      <div className="loading-bar" />
      <div className="loading-bar short" />
    </div>
  );
}
