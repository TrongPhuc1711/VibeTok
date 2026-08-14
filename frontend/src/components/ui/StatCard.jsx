export default function StatCard({ label, value, change, positive = true, accent = false }) {
    return (
      <div
        className="rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-primary/30"
        style={{
          background: 'var(--vt-card)',
          border: accent ? '1px solid rgba(255, 45, 120, 0.35)' : '1px solid var(--color-border)',
        }}
      >
        <div>
          <p className="text-[11px] font-body mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
          <p className="text-[22px] font-display font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold font-body px-1.5 py-0.5 rounded-full
              ${positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
              {positive ? '▲' : '▼'} {Math.abs(change)}%
            </span>
            <span className="text-[10px] font-body" style={{ color: 'var(--color-text-muted)' }}>so với tháng trước</span>
          </div>
        )}
      </div>
    );
}