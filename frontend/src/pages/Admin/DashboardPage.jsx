import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard    from '../../components/ui/StatCard';
import BarChart    from '../../components/charts/BarChart';
import DonutChart  from '../../components/charts/DonutChart';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminBtn    from './components/AdminBtn';
import { BounceDots } from '../../components/ui/Spinner';
import { getStats, getUserGrowth, getContentDistribution, getTopCreators } from '../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

export default function DashboardPage() {
    const [stats, setStats]       = useState([]);
    const [growth, setGrowth]     = useState([]);
    const [content, setContent]   = useState([]);
    const [creators, setCreators] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        Promise.all([
            getStats().catch(() => []),
            getUserGrowth().catch(() => []),
            getContentDistribution().catch(() => []),
            getTopCreators().catch(() => []),
        ]).then(([s, g, c, cr]) => {
            setStats(s);
            setGrowth(g);
            setContent(c);
            setCreators(cr);
        }).finally(() => setLoading(false));
    }, []);

    const BAR_KEYS = [
        { key: 'newUsers', color: '#ff2d78', label: 'Người dùng mới' },
    ];

    if (loading) {
        return (
            <AdminLayout title="Dashboard" subtitle="Tổng quan hệ thống VibeTok">
                <div className="flex items-center justify-center h-64"><BounceDots /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard" subtitle="Tổng quan hệ thống VibeTok">

            {/* ── 4 stat cards ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {stats.map(s => (
                    <StatCard key={s.key} label={s.label} value={fmt(s.value)}
                        change={s.change} positive={s.positive} accent={s.key === 'totalUsers'} />
                ))}
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-[1fr_272px] gap-4 mb-4">
                {/* Bar chart */}
                <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-white text-[13px] font-semibold font-body">Người dùng mới theo ngày</p>
                        <div className="flex items-center gap-3">
                            {BAR_KEYS.map(k => (
                                <span key={k.key} className="flex items-center gap-1 text-[10px] font-body text-[#666]">
                                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: k.color }} />
                                    {k.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    {growth.length > 0
                        ? <BarChart data={growth} keys={BAR_KEYS} height={160} />
                        : <p className="text-[#444] text-[11px] font-body text-center py-8">Chưa có dữ liệu</p>
                    }
                </div>

                {/* Donut */}
                <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-4">
                    <p className="text-white text-[13px] font-semibold font-body mb-3">Phân loại nội dung</p>
                    {content.length > 0 ? (
                        <>
                            <div className="flex justify-center mb-3">
                                <DonutChart data={content} size={110} stroke={20} />
                            </div>
                            <div className="space-y-1.5">
                                {content.map(d => (
                                    <div key={d.name} className="flex items-center justify-between text-[10px] font-body">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                            <span className="text-[#777]">{d.name}</span>
                                        </div>
                                        <span className="text-[#888]">{d.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-[#444] text-[11px] font-body text-center py-8">Chưa có dữ liệu</p>
                    )}
                </div>
            </div>

            {/* ── Top Creators table ── */}
            <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a2a]">
                    <p className="text-white text-[13px] font-semibold font-body">Top Creators</p>
                </div>
                {creators.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1a1a2a]">
                                {['#', 'Tên', 'Followers', 'Videos', 'Lượt thích', 'Trạng thái', 'Hành động'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-body text-[#444] font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {creators.map((c, i) => (
                                <tr key={c.id} className={`border-b border-[#1a1a2a]/50 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                                    <td className="px-4 py-3 text-[#555] text-[11px] font-body">{c.rank}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: c.color }}>{c.initials}</div>
                                            <div>
                                                <p className="text-white text-[12px] font-semibold font-body leading-tight m-0">{c.name}</p>
                                                <p className="text-[#555] text-[10px] font-body m-0">{c.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[#888] text-[11px] font-body">{c.followers}</td>
                                    <td className="px-4 py-3 text-[#888] text-[11px] font-body">{c.videos}</td>
                                    <td className="px-4 py-3 text-[#888] text-[11px] font-body">{c.views}</td>
                                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                    <td className="px-4 py-3">
                                        <AdminBtn label="Xem" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-[#444] text-[11px] font-body text-center py-8">Chưa có dữ liệu</p>
                )}
            </div>
        </AdminLayout>
    );
}
