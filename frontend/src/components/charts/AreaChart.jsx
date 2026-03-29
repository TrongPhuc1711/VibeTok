export default function AreaChart({ data = [], keys = [], height = 130 }) {
    if (!data.length || !keys.length) return null;
  
    const W = 600, H = height;
    const padL = 8, padR = 8, padT = 8, padB = 24;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k.key] ?? 0)));
  
    const gx = (i) => padL + (i / (data.length - 1)) * chartW;
    const gy = (v) => padT + chartH - (maxVal > 0 ? (v / maxVal) * chartH : 0);
  
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <defs>
          {keys.map(k => (
            <linearGradient key={k.key} id={`ag-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={k.color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={k.color} stopOpacity="0"/>
            </linearGradient>
          ))}
        </defs>
        {/* Grid */}
        {[0, 0.33, 0.66, 1].map(pct => (
          <line key={pct} x1={padL} y1={padT+chartH*(1-pct)} x2={padL+chartW} y2={padT+chartH*(1-pct)}
            stroke="#1a1a2e" strokeWidth="1" />
        ))}
        {keys.map(k => {
          const pts  = data.map((d,i) => `${gx(i)},${gy(d[k.key]??0)}`).join(' ');
          const area = [`${gx(0)},${padT+chartH}`, ...data.map((d,i)=>`${gx(i)},${gy(d[k.key]??0)}`), `${gx(data.length-1)},${padT+chartH}`].join(' ');
          return (
            <g key={k.key}>
              <polygon points={area} fill={`url(#ag-${k.key})`} />
              <polyline points={pts} fill="none" stroke={k.color}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
        {/* X labels */}
        {data.map((d,i) => i % Math.ceil(data.length/6) === 0 && (
          <text key={i} x={gx(i)} y={H-6} textAnchor="middle"
            fill="#555" fontSize="9" fontFamily="DM Sans, sans-serif">
            {d.date ?? d.time ?? i}
          </text>
        ))}
      </svg>
    );
  }