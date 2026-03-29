import React from 'react';
import AdminLayout from '../../../components/layout/Sidebar/AdminLayout';
import StatCard    from '../../../components/ui/StatCard';
import BarChart    from '../../../components/charts/BarChart';
import DonutChart  from '../../../components/charts/DonutChart';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
  overviewStats, userGrowthData, contentDistribution, topCreators, moderationStats,
} from '../../../services/adminMockData';

function Btn({ label, bg = '#1e1e2e', color = '#888' }) {
  return (
    <button style={{ background: bg, color }}
      className="text-[10px] font-body px-2 py-1 rounded border-none cursor-pointer hover:opacity-80 whitespace-nowrap">
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const BAR_KEYS = [
    { key:'newUsers', color:'#ff2d78', label:'Người dùng mới' },
    { key:'active',   color:'#ff6b35', label:'Hoạt động'      },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Tổng quan hệ thống VibeTok">

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {overviewStats.map(s => (
          <StatCard key={s.key} label={s.label} value={s.value}
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
              <button className="text-primary border border-primary/40 px-2 py-0.5 rounded text-[10px] hover:bg-primary/10 transition-colors cursor-pointer">Xem tất</button>
            </div>
          </div>
          <BarChart data={userGrowthData} keys={BAR_KEYS} height={160} />
        </div>

        {/* Donut */}
        <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-4">
          <p className="text-white text-[13px] font-semibold font-body mb-3">Phân loại nội dung</p>
          <div className="flex justify-center mb-3">
            <DonutChart data={contentDistribution} size={110} stroke={20} />
          </div>
          <div className="space-y-1.5">
            {contentDistribution.map(d => (
              <div key={d.name} className="flex items-center justify-between text-[10px] font-body">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[#777]">{d.name}</span>
                </div>
                <span className="text-[#888]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mini stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Video chờ duyệt hôm nay', value: moderationStats[0].value, change: moderationStats[0].change, positive:false },
          { label:'Lịch đăng video',          value: 89,    change:-3,  positive:true  },
          { label:'Báo cáo mới hôm nay',      value:'+342', change:+18, positive:false },
        ].map(s => (
          <div key={s.label} className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[#555] text-[10px] font-body mb-1">{s.label}</p>
              <p className="text-white text-[20px] font-display font-bold">{s.value}</p>
            </div>
            <span className={`text-[10px] font-bold font-body px-1.5 py-0.5 rounded-full
              ${s.positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change)}%
            </span>
          </div>
        ))}
      </div>

      {/* ── Top Creators table ── */}
      <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a2a]">
          <p className="text-white text-[13px] font-semibold font-body">Top Creators tuần này</p>
          <div className="flex gap-2">
            <Btn label="Xuất CSV" />
            <Btn label="Xem tất cả" />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a2a]">
              {['#','Tên','Followers','Videos','Lượt xem','Doanh thu','Trạng thái','Hành động'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-body text-[#444] font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCreators.map((c, i) => (
              <tr key={c.id} className={`border-b border-[#1a1a2a]/50 hover:bg-white/[0.02] transition-colors ${i%2===0?'':'bg-white/[0.01]'}`}>
                <td className="px-4 py-3 text-[#555] text-[11px] font-body">{c.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background:c.color }}>{c.initials}</div>
                    <div>
                      <p className="text-white text-[12px] font-semibold font-body leading-tight m-0">{c.name}</p>
                      <p className="text-[#555] text-[10px] font-body m-0">{c.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#888] text-[11px] font-body">{c.followers}</td>
                <td className="px-4 py-3 text-[#888] text-[11px] font-body">{c.videos}</td>
                <td className="px-4 py-3 text-[#888] text-[11px] font-body">{c.views}</td>
                <td className="px-4 py-3 text-white text-[11px] font-body font-semibold">{c.revenue}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Btn label="Xem" />
                    {c.status==='active'  && <Btn label="Ban"   bg="#f59e0b22" color="#f59e0b" />}
                    {c.status==='banned'  && <Btn label="Unban" bg="#10b98122" color="#10b981" />}
                    {c.status==='pending' && <Btn label="Duyệt" bg="#10b98122" color="#10b981" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}