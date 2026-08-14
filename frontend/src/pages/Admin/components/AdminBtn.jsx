export default function AdminBtn({ label, bg = 'var(--vt-input)', color = 'var(--color-text-secondary)', onClick, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{ background: bg, color }}
            className="text-[10px] font-body px-2.5 py-1 rounded border-none cursor-pointer hover:opacity-80 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
            {label}
        </button>
    );
}
