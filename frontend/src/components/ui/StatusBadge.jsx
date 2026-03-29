const STYLES = {
    active:   { bg:'#10b98120', color:'#10b981', label:'Active'   },
    banned:   { bg:'#ef444420', color:'#ef4444', label:'Banned'   },
    pending:  { bg:'#f59e0b20', color:'#f59e0b', label:'Pending'  },
    creator:  { bg:'#ff2d7820', color:'#ff2d78', label:'Creator'  },
    new:      { bg:'#3b82f620', color:'#60a5fa', label:'Mới'      },
    flagged:  { bg:'#ef444420', color:'#ef4444', label:'Flagged'  },
    approved: { bg:'#10b98120', color:'#10b981', label:'Duyệt'    },
    rejected: { bg:'#ef444420', color:'#ef4444', label:'Từ chối' },
    low:      { bg:'#3b82f620', color:'#60a5fa', label:'Thấp'     },
    medium:   { bg:'#f59e0b20', color:'#f59e0b', label:'Trung'    },
    high:     { bg:'#ef444420', color:'#ef4444', label:'Cao'      },
  };
  
  export default function StatusBadge({ status, label }) {
    const s = STYLES[status] ?? STYLES.pending;
    return (
      <span style={{ background: s.bg, color: s.color }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body">
        <span style={{ background: s.color, width:6, height:6, borderRadius:'50%', display:'inline-block' }} />
        {label ?? s.label}
      </span>
    );
  }