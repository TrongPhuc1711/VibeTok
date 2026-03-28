import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import CreatorCard from '../components/common/CreatorCard';
import UserDropdown from '../components/layout/UserDropdown';
import { useExplore } from '../hooks/useExplore';
import { SpinnerCenter } from '../components/ui/Spinner';
import { formatCount } from '../utils/formatters';

const GRADIENTS = [
    ['#ff2d78', '#ff6b35'], ['#7c3aed', '#06b6d4'], ['#059669', '#10b981'],
    ['#d97706', '#f59e0b'], ['#2563eb', '#7c3aed'], ['#db2777', '#9333ea'], ['#0891b2', '#06b6d4'],
];

export default function ExplorePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        categories, hashtags, creators, results,
        loading, searching, query, activeTab,
        setActiveTab, handleQueryChange, clearSearch, doSearch,
    } = useExplore(searchParams.get('q') || '');

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) { setSearchParams({ q: query }); doSearch(query); }
        else { clearSearch(); setSearchParams({}); }
    };

    return (
        <PageLayout>
            {/* Category tabs va userdropdown */}
            <div className="flex items-center border-b border-border shrink-0 pr-4">
                {/*Category*/}
                <div className="flex-1 flex items-center overflow-x-auto [scrollbar-width:none]">
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setActiveTab(cat.value)}
                            className={`shrink-0 bg-transparent border-none px-4 py-[18px] text-sm font-body cursor-pointer transition-all whitespace-nowrap border-b-2
        ${activeTab === cat.value ? 'text-primary font-semibold border-primary' : 'text-text-faint border-transparent hover:text-text-secondary'}`}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/*UserDropdown */}
                <div className="ml-4 shrink-0 relative z-50">
                    <UserDropdown />
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto p-6">
                {/* Search bar */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="bg-surface border border-border rounded-xl flex items-center gap-3 px-5 py-3.5">
                        <SearchIcon />
                        <input type="text" value={query} onChange={e => handleQueryChange(e.target.value)}
                            placeholder="Tìm kiếm video, creator, âm nhạc, hashtag..."
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm font-body placeholder:text-text-faint" />
                        {query && (
                            <button type="button" onClick={clearSearch}
                                className="bg-transparent border-none text-text-faint cursor-pointer text-lg hover:text-white">×</button>
                        )}
                    </div>
                </form>

                {/* Category chips */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {[{ label: '🔥 Hot', value: 'hot' }, ...categories.slice(1)].map((c, i) => (
                        <button key={i} onClick={() => setActiveTab(c.value)}
                            className={`border rounded-full px-4 py-1.5 text-[13px] font-body cursor-pointer transition-all
                ${activeTab === c.value ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-transparent border-border2 text-text-faint hover:border-primary/30'}`}>
                            {c.label}
                        </button>
                    ))}
                </div>

                {loading ? <SpinnerCenter /> : results ? (
                    /* Search results */
                    <div>
                        {results.users?.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-text-secondary text-[13px] font-body mb-3 tracking-[0.5px]">CREATORS</h3>
                                <div className="flex flex-col gap-1">
                                    {results.users.map(u => <CreatorCard key={u.id} user={u} layout="row" />)}
                                </div>
                            </div>
                        )}
                        {results.hashtags?.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-text-secondary text-[13px] font-body mb-3 tracking-[0.5px]">HASHTAGS</h3>
                                <div className="flex flex-wrap gap-2">
                                    {results.hashtags.map(tag => (
                                        <div key={tag.id} className="bg-primary/8 border border-primary/20 rounded-full px-3.5 py-1.5 flex items-center gap-2">
                                            <span className="text-primary text-[13px] font-body">{tag.tag}</span>
                                            <span className="text-text-faint text-[11px] font-body">{formatCount(tag.videos)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!results.videos?.length && !results.users?.length && (
                            <div className="text-center py-16 text-text-subtle font-body flex flex-col items-center gap-3">
                                <span className="text-[32px]">🔍</span>
                                <p>Không tìm thấy kết quả cho "{results.query}"</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Default content */
                    <>
                        <h2 className="text-[#ddd] text-base font-bold font-body mb-3.5">Trending ngay bây giờ</h2>
                        <div className="grid gap-2 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
                            {hashtags.map((tag, i) => (
                                <div key={tag.id}
                                    className={`rounded-xl p-4 cursor-pointer transition-transform hover:scale-[1.02] flex flex-col justify-end border overflow-hidden relative
                    ${i === 0 || i === 3 ? 'row-span-2 min-h-[180px]' : 'min-h-[90px]'}`}
                                    style={{ background: `linear-gradient(135deg,${GRADIENTS[i % 7][0]}20,${GRADIENTS[i % 7][1]}10)`, borderColor: `${GRADIENTS[i % 7][0]}30` }}>
                                    <div className="absolute top-2.5 right-2.5 w-[26px] h-[26px] rounded-full bg-black/30 flex items-center justify-center text-white text-[10px]">☆</div>
                                    <p className="text-white text-[13px] font-bold font-body m-0 mb-1">{tag.tag}</p>
                                    <p className="text-white/50 text-[11px] font-body m-0">{formatCount(tag.videos)} videos</p>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-[#ddd] text-base font-bold font-body mb-3.5">Creator nổi bật tuần này</h2>
                        <div className="flex gap-3 overflow-x-auto pb-3">
                            {creators.map(c => <CreatorCard key={c.id} user={c} layout="card" />)}
                        </div>
                    </>
                )}
            </div>
        </PageLayout>
    );
}

function SearchIcon() {
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M13 13l4 4" />
    </svg>;
}