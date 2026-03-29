import React, { useState } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard    from '../../components/ui/StatCard';
import BarChart    from '../../components/charts/BarChart';
import DonutChart  from '../../components/charts/DonutChart';
import AreaChart   from '../../components/charts/AreaChart';
import {
  revenueStats, revenueChartData, revenueDistribution, viewsData, onlineUsersData,
} from '../../services/adminMockData';
import { ExportAdminIcon } from '../../icons/AdminIcons';

const DATE_RANGES = ['Hôm nay','7 ngày','1 tháng','3 tháng','1 năm'];

function Dot({ color, label }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-[#666] font-body">
      <span className="w-2 h-2 rounded-full" style={{ background:color }} />
      {label}
    </span>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('7 ngày');

  const actions = (
    <div className="flex gap-1.5">
      {DATE_RANGES.map(r => (
        <button key={r} onClick={()=>setRange(r)}
          className={`text-[11px] font-body px-2.5 py-1 rounded border transition-colors cursor-pointer
            ${range===r ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-transparent border-[#1e1e2e] text-[#555] hover:text-white'}`}>
          {r}
        </button>
      ))}
      <button className="flex items-center gap-1.5 text-[11px] font-body px-3 py-1 rounded bg-primary text-white border-none cursor-pointer hover:bg-primary/90 ml-2">
        <ExportAdminIcon /> Xuất báo cáo
      </button>
    </div>
  );

  const revenueBarKeys = [
    { key:'adRevenue',    color:'#ff2d78', label:'Quảng cáo'    },
    { key:'subscription', color:'#ff6b35', label:'Subscription' },
    { key:'creator',      color:'#7c3aed', label:'Creator'      },
  ];
  const viewsKeys  = [
    { key:'views',  color:'#ff2d78', label:'Views'  },
    { key:'likes',  color:'#06b6d4', label:'Likes'  },
    { key:'shares', color:'#7c3aed', label:'Shares' },
  ];
  const onlineKeys = [{ key:'users', color:'#ff6b35', label:'Online' }];

  return (
    <AdminLayout title="Analytics & Revenue" actions={actions}>
      {/* Revenue stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {revenueStats.map((s,i) => (
          <StatCard key={i} label={s.label} value={s.value} change={s.change} positive={s.positive} accent={i===0} />
        ))}
      </div>

      {/* Revenue bar + donut */}
      <div className="grid grid-cols-[1fr_260px] gap-4 mb-4">
        <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white text-[13px] font-semibold font-body">Doanh thu theo tháng (7 tháng gần nhất)</p>
            <div className="flex gap-3">
              {revenueBarKeys.map(k => <Dot key={k.key} color={k.color} label={k.label} />)}
            </div>
          </div>
          <BarChart data={revenueChartData} keys={revenueBarKeys} height={180} />
        </div>

        <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-5">
          <p className="text-white text-[13px] font-semibold font-body mb-3">Phân bổ nguồn thu</p>
          <div className="flex justify-center mb-3">
            <DonutChart data={revenueDistribution} size={130} stroke={24} />
          </div>
          <div className="space-y-2">
            {revenueDistribution.map(d => (
              <div key={d.name} className="flex items-center justify-between text-[10px] font-body">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background:d.color }} />
                  <span className="text-[#666]">{d.name}</span>
                </div>
                <span className="text-[#888]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-[13px] font-semibold font-body">Lượt xem & tương tác</p>
            <div className="flex gap-3">
              {viewsKeys.map(k => <Dot key={k.key} color={k.color} label={k.label} />)}
            </div>
          </div>
          <AreaChart data={viewsData} keys={viewsKeys} height={130} />
        </div>

        <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-5">
          <p className="text-white text-[13px] font-semibold font-body mb-3">Users online theo giờ</p>
          <AreaChart data={onlineUsersData} keys={onlineKeys} height={130} />
        </div>
      </div>
    </AdminLayout>
  );
}