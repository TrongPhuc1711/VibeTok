export default function StatCard({ label, value, change, positive = true, accent = false }) {
    return (
      <div className={`bg-[#0f0f1a] border rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-primary/20
        ${accent ? 'border-primary/30' : 'border-[#1a1a2a]'}`}>
        <div>
          <p className="text-[#555] text-[11px] font-body mb-1">{label}</p>
          <p className="text-white text-[22px] font-display font-bold leading-tight">{value}</p>
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold font-body px-1.5 py-0.5 rounded-full
              ${positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {positive ? '▲' : '▼'} {Math.abs(change)}%
            </span>
            <span className="text-[#444] text-[10px] font-body">so với tháng trước</span>
          </div>
        )}
      </div>
    );
  }