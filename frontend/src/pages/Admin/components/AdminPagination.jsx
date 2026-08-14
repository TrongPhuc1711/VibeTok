// Pagination dùng chung cho admin tables
export default function AdminPagination({ page, totalPages, total, pageSize, onPageChange, label = 'mục' }) {
    if (totalPages <= 1) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div
            className="flex items-center justify-between px-5 py-3 border-t"
            style={{ borderColor: 'var(--color-border)' }}
        >
            <p className="text-[11px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>
                Hiển thị {from}–{to} / {total} {label}
            </p>
            <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className="w-7 h-7 text-[11px] font-body rounded border cursor-pointer transition-colors"
                        style={{
                            background: page === p ? 'var(--color-primary, #ff2d78)' : 'transparent',
                            borderColor: page === p ? 'var(--color-primary, #ff2d78)' : 'var(--color-border)',
                            color: page === p ? '#fff' : 'var(--color-text-secondary)',
                        }}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
}
