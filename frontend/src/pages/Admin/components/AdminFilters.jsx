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
                        className={`flex items-center gap-1.5 text-[11px] font-body px-3 py-1.5 rounded-lg border transition-colors cursor-pointer
                            ${active === f.value
                                ? 'bg-primary/15 border-primary/40 text-primary'
                                : 'bg-transparent border-[#1e1e2e] text-[#666] hover:text-white'}`}
                    >
                        {f.label}
                        {f.count !== undefined && (
                            <span className={`text-[9px] px-1 py-px rounded-full font-bold
                                ${active === f.value ? 'bg-primary/20 text-primary' : 'bg-[#1e1e2e] text-[#555]'}`}>
                                {f.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {onSearch && (
                <div className="flex items-center gap-2 bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-1.5 w-[220px]">
                    <SearchAdminIcon />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-[11px] font-body w-full placeholder:text-[#444]"
                    />
                </div>
            )}
        </div>
    );
}
