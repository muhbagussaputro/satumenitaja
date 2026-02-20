export default function SurahLoading() {
  return (
    <div className="stack-layout" aria-live="polite" aria-busy="true">
      <section className="card compact loading-card">
        <p className="loading-inline">
          <span className="loading-dot" aria-hidden />
          Memuat surah...
        </p>
        <div className="loading-bar" />
        <div className="loading-bar short" />
      </section>

      <section className="mushaf-sheet mushaf-sheet-loading">
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar short" />
      </section>
    </div>
  );
}
