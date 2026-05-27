export default function BarChart({ data = [], keys = [], height = 160 }) {
    if (!data.length || !keys.length) return null;

    const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k.key] ?? 0)));
    const padB   = 36; // space for date + value labels
    const chartH = height - padB;

    const totalW = 600; // Fixed SVG coordinate space width
    const padL = 40;
    const padR = 40;
    const chartW = totalW - padL - padR;

    const fmtVal = (n) => {
        n = Number(n) || 0;
        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
        return String(n);
    };

    // Calculate dynamic bar widths based on number of items
    const itemCount = data.length;
    const step = chartW / itemCount;
    
    // Group width should be at most 40px, or 60% of the step
    const groupW = Math.min(40, step * 0.6); 
    const barW = keys.length > 0 ? groupW / keys.length : 10;
    const gap = keys.length > 1 ? 2 : 0;

    return (
      <svg viewBox={`0 0 ${totalW} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line key={pct} x1="0" y1={chartH*(1-pct)} x2={totalW} y2={chartH*(1-pct)}
            stroke="#706c6cff" strokeWidth="1" />
        ))}
        {/* Bars */}
        {data.map((d, di) => {
          const centerX = padL + di * step + step / 2;
          const x0 = centerX - groupW / 2;
          const totalVal = keys.reduce((s, k) => s + (d[k.key] ?? 0), 0);

          return (
            <g key={di}>
              {keys.map((k, ki) => {
                const val  = d[k.key] ?? 0;
                const barH = maxVal > 0 ? (val / maxVal) * chartH : 0;
                const currentBarW = barW - (keys.length > 1 ? gap : 0);
                const currentX = x0 + ki * barW;

                return (
                  <rect
                    key={ki}
                    x={currentX}
                    y={chartH - barH}
                    width={Math.max(2, currentBarW)}
                    height={barH}
                    fill={k.color}
                    rx="3"
                    opacity="0.9"
                  />
                );
              })}
              {/* Date label */}
              <text x={centerX} y={chartH + 15} textAnchor="middle"
                fill="#fff" fontSize="9" fontFamily="Arial, sans-serif" fontWeight="500">
                {d.date ? `Ngày ${d.date}` : d.month ? `Tháng ${d.month}` : di}
              </text>
              {/* Value label */}
              <text x={centerX} y={chartH + 28} textAnchor="middle"
                fill={keys[0]?.color ?? '#ff2d78'} fontSize="8" fontWeight="600"
                fontFamily="Arial, sans-serif" opacity="0.8">
                {`+${fmtVal(totalVal)} người dùng`}
              </text>
            </g>
          );
        })}
      </svg>
    );
}