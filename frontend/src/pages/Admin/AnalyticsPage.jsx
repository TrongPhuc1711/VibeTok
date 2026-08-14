import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard    from '../../components/ui/StatCard';
import BarChart    from '../../components/charts/BarChart';
import AreaChart   from '../../components/charts/AreaChart';
import DonutChart  from '../../components/charts/DonutChart';
import { BounceDots } from '../../components/ui/Spinner';
import { ExportAdminIcon } from '../../icons/AdminIcons';
import { getStats, getUserGrowth, getContentDistribution, getViewsPerDay } from '../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

const DATE_RANGES = [
    { label: '7 ngày',  days: 7  },
    { label: '14 ngày', days: 14 },
    { label: '30 ngày', days: 30 },
];

function Dot({ color, label }) {
    return (
        <span className="flex items-center gap-1 text-[10px] text-[#666] font-body">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
        </span>
    );
}

export default function AnalyticsPage() {
    const [range, setRange]       = useState(7);
    const [stats, setStats]       = useState([]);
    const [growth, setGrowth]     = useState([]);
    const [content, setContent]   = useState([]);
    const [views, setViews]       = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getStats().catch(() => []),
            getUserGrowth(range).catch(() => []),
            getContentDistribution().catch(() => []),
            getViewsPerDay(range).catch(() => []),
        ]).then(([s, g, c, v]) => {
            setStats(s);
            setGrowth(g);
            setContent(c);
            setViews(v);
        }).finally(() => setLoading(false));
    }, [range]);

    const growthKeys = [
        { key: 'newUsers', color: '#ff2d78', label: 'Người dùng mới' },
    ];
    const viewsKeys = [
        { key: 'views',  color: '#ff2d78', label: 'Views' },
        { key: 'likes',  color: '#06b6d4', label: 'Likes' },
        { key: 'shares', color: '#7c3aed', label: 'Shares' },
    ];

    const actions = (
        <div className="flex gap-1.5">
            {DATE_RANGES.map(r => (
                <button
                    key={r.days}
                    onClick={() => setRange(r.days)}
                    className="text-[11px] font-body px-2.5 py-1 rounded border transition-colors cursor-pointer"
                    style={{
                        background: range === r.days ? 'rgba(255, 45, 120, 0.12)' : 'var(--vt-card)',
                        borderColor: range === r.days ? 'rgba(255, 45, 120, 0.4)' : 'var(--color-border)',
                        color: range === r.days ? '#ff2d78' : 'var(--color-text-secondary)',
                    }}
                >
                    {r.label}
                </button>
            ))}
            <button className="flex items-center gap-1.5 text-[11px] font-body px-3 py-1 rounded bg-primary text-white border-none cursor-pointer hover:bg-primary/90 ml-2">
                <ExportAdminIcon /> Xuất báo cáo
            </button>
        </div>
    );

    if (loading) {
        return (
            <AdminLayout title="Analytics" actions={actions}>
                <div className="flex items-center justify-center h-64"><BounceDots /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Analytics" actions={actions}>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {stats.map((s, i) => (
                    <StatCard key={i} label={s.label} value={fmt(s.value)}
                        change={s.change} positive={s.positive} accent={i === 0} />
                ))}
            </div>

            {/* Growth bar + content donut */}
            <div className="grid grid-cols-[1fr_260px] gap-4 mb-4">
                <div className="rounded-xl p-5" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold font-body m-0" style={{ color: 'var(--color-text-primary)' }}>Người dùng mới ({range} ngày)</p>
                        <div className="flex gap-3">
                            {growthKeys.map(k => <Dot key={k.key} color={k.color} label={k.label} />)}
                        </div>
                    </div>
                    {growth.length > 0
                        ? <BarChart data={growth} keys={growthKeys} height={180} />
                        : <p className="text-[11px] font-body text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Chưa có dữ liệu</p>
                    }
                </div>

                <div className="rounded-xl p-5" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                    <p className="text-[13px] font-semibold font-body mb-3" style={{ color: 'var(--color-text-primary)' }}>Phân loại nội dung</p>
                    {content.length > 0 ? (
                        <>
                            <div className="flex justify-center mb-3">
                                <DonutChart data={content} size={130} stroke={24} />
                            </div>
                            <div className="space-y-2">
                                {content.map(d => (
                                    <div key={d.name} className="flex items-center justify-between text-[10px] font-body">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                            <span style={{ color: 'var(--color-text-secondary)' }}>{d.name}</span>
                                        </div>
                                        <span style={{ color: 'var(--color-text-muted)' }}>{d.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-[11px] font-body text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Chưa có dữ liệu</p>
                    )}
                </div>
            </div>

            {/* Views area chart */}
            <div className="rounded-xl p-5" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold font-body m-0" style={{ color: 'var(--color-text-primary)' }}>Lượt xem & tương tác ({range} ngày)</p>
                    <div className="flex gap-3">
                        {viewsKeys.map(k => <Dot key={k.key} color={k.color} label={k.label} />)}
                    </div>
                </div>
                {views.length > 0
                    ? <AreaChart data={views} keys={viewsKeys} height={160} />
                    : <p className="text-[11px] font-body text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Chưa có dữ liệu</p>
                }
            </div>
        </AdminLayout>
    );
}