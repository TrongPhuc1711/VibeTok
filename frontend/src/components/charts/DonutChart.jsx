export default function DonutChart({ data = [], size = 120, stroke = 22 }) {
    const r    = (size - stroke) / 2;
    const cx   = size / 2;
    const cy   = size / 2;
    const circ = 2 * Math.PI * r;
    const total = data.reduce((s, d) => s + d.value, 0);
  
    let acc = 0;
    const slices = data.map(d => {
      const pct   = total > 0 ? d.value / total : 0;
      const dash  = pct * circ;
      const gap   = circ - dash;
      const offset = -(circ / 4) + acc * circ / total;
      acc += d.value;
      return { ...d, dash, gap, offset };
    });
  
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </svg>
    );
  }