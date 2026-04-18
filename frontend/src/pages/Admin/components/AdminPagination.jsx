// Pagination dùng chung cho admin tables
export default function AdminPagination({ page, totalPages, total, pageSize, onPageChange, label = 'mục' }) {
    if (totalPages <= 1) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a2a]">
            <p className="text-[#444] text-[11px] font-body">
                Hiển thị {from}–{to} / {total} {label}
            </p>
            <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-7 h-7 text-[11px] font-body rounded border cursor-pointer transition-colors
                            ${page === p
                                ? 'bg-primary border-primary text-white'
                                : 'bg-transparent border-[#1e1e2e] text-[#555] hover:border-[#333] hover:text-white'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
}
