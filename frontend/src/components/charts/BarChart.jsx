export default function BarChart({ data = [], keys = [], height = 160 }) {
    if (!data.length || !keys.length) return null;

    const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k.key] ?? 0)));
    const barW   = 10;
    const gap    = 3;
    const groupW = keys.length * (barW + gap) - gap;
    const totalW = data.length * (groupW + 20) + 10;
    const padB   = 36; // more space for date + value labels
    const chartH = height - padB;

    const fmtVal = (n) => {
        n = Number(n) || 0;
        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
        return String(n);
    };

    return (
      <svg viewBox={`0 0 ${totalW} ${height}`} preserveAspectRatio="none"
        className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line key={pct} x1="0" y1={chartH*(1-pct)} x2={totalW} y2={chartH*(1-pct)}
            stroke="#1a1a2e" strokeWidth="1" />
        ))}
        {/* Bars */}
        {data.map((d, di) => {
          const x0 = 10 + di * (groupW + 20);
          const centerX = x0 + groupW / 2;
          // Sum of all key values for this group
          const totalVal = keys.reduce((s, k) => s + (d[k.key] ?? 0), 0);
          return (
            <g key={di}>
              {keys.map((k, ki) => {
                const val  = d[k.key] ?? 0;
                const barH = maxVal > 0 ? (val / maxVal) * chartH : 0;
                return (
                  <rect key={ki} x={x0 + ki*(barW+gap)} y={chartH-barH}
                    width={barW} height={barH} fill={k.color} rx="2" opacity="0.9" />
                );
              })}
              {/* Date label */}
              <text x={centerX} y={chartH + 13} textAnchor="middle"
                fill="#555" fontSize="8" fontFamily="DM Sans, sans-serif">
                {d.date ?? d.month ?? di}
              </text>
              {/* Value label */}
              <text x={centerX} y={chartH + 25} textAnchor="middle"
                fill={keys[0]?.color ?? '#ff2d78'} fontSize="8" fontWeight="600"
                fontFamily="DM Sans, sans-serif" opacity="0.8">
                {fmtVal(totalVal)}
              </text>
            </g>
          );
        })}
      </svg>
    );
}