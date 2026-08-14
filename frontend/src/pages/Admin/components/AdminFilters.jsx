import { SearchAdminIcon } from '../../../icons/AdminIcons';

// Filter tabs + search bar dùng chung cho Users + Videos
export default function AdminFilters({ filters, active, onChange, search, onSearch, placeholder = 'Tìm kiếm...' }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 flex-wrap">
                {filters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => onChange(f.value)}
                        className="flex items-center gap-1.5 text-[11px] font-body px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
                        style={{
                            background: active === f.value ? 'rgba(255, 45, 120, 0.12)' : 'var(--vt-card)',
                            borderColor: active === f.value ? 'rgba(255, 45, 120, 0.4)' : 'var(--color-border)',
                            color: active === f.value ? '#ff2d78' : 'var(--color-text-secondary)',
                        }}
                    >
                        {f.label}
                        {f.count !== undefined && (
                            <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                                style={{
                                    background: active === f.value ? 'rgba(255, 45, 120, 0.2)' : 'var(--color-border)',
                                    color: active === f.value ? '#ff2d78' : 'var(--color-text-muted)',
                                }}
                            >
                                {f.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {onSearch && (
                <div
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 w-[220px]"
                    style={{
                        background: 'var(--vt-card)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    <SearchAdminIcon />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                        className="bg-transparent border-none outline-none text-[11px] font-body w-full"
                        style={{ color: 'var(--color-text-primary)' }}
                    />
                </div>
            )}
        </div>
    );
}
