export default function AdminBtn({ label, bg = '#1e1e2e', color = '#888', onClick, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{ background: bg, color }}
            className="text-[10px] font-body px-2 py-1 rounded border-none cursor-pointer hover:opacity-80 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
            {label}
        </button>
    );
}
