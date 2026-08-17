export default function Loading() {
  return (
    <main className="loading-page">
      <div className="loading-orb" />
      <div className="loading-card">
        <span className="loading-skeleton-line" style={{ width: "32%" }} />
        <span className="loading-skeleton-line" style={{ width: "62%", height: 22 }} />
        <span className="loading-skeleton-line" style={{ width: "92%", height: 14 }} />
        <span className="loading-skeleton-line" style={{ width: "86%", height: 14 }} />
        <span className="loading-skeleton-line" style={{ width: "72%", height: 14 }} />
      </div>
      <style>{`
        .loading-orb{position:absolute;width:520px;height:520px;border-radius:50%;right:-200px;top:-180px;background:radial-gradient(circle,rgba(139,76,242,.22),transparent 65%);filter:blur(20px)}
        .loading-card{max-width:520px;margin:80px auto 0;padding:34px 38px;display:grid;gap:14px}
        .loading-skeleton-line{display:block;height:10px;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.14),rgba(255,255,255,.04));background-size:200% 100%;animation:loading-shimmer 1.4s ease-in-out infinite}
        @keyframes loading-shimmer{0%{background-position:100% 50%}100%{background-position:-100% 50%}}
      `}</style>
    </main>
  );
}
