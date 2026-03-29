export default function BarChart({ data = [], keys = [], height = 160 }) {
    if (!data.length || !keys.length) return null;
  
    const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k.key] ?? 0)));
    const barW   = 10;
    const gap    = 3;
    const groupW = keys.length * (barW + gap) - gap;
    const totalW = data.length * (groupW + 20) + 10;
    const chartH = height - 24;
  
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
              <text x={x0+groupW/2} y={height-4} textAnchor="middle"
                fill="#555" fontSize="8" fontFamily="DM Sans, sans-serif">
                {d.date ?? d.month ?? di}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }