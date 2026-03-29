import React, { useState } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard    from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { moderationStats, pendingVideos, violationReports } from '../../services/adminMockData';
import { PlayAdminIcon } from '../../icons/AdminIcons';

function Btn({ label, bg = '#1e1e2e', color = '#888' }) {
  return (
    <button style={{ background:bg, color }}
      className="text-[10px] font-body px-2 py-1 rounded border-none cursor-pointer hover:opacity-80 whitespace-nowrap">
      {label}
    </button>
  );
}

const TABS = ['Tất cả','Mới đăng','Đang xem xét','Đã duyệt','Từ chối','Auto-flagged'];

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [statuses, setStatuses]   = useState(
    Object.fromEntries(pendingVideos.map(v => [v.id, 'pending']))
  );

  const approve = (id) => setStatuses(p => ({ ...p, [id]:'approved' }));
  const reject  = (id) => setStatuses(p => ({ ...p, [id]:'rejected' }));
  const undo    = (id) => setStatuses(p => ({ ...p, [id]:'pending'  }));

  return (
    <AdminLayout title="Kiểm duyệt & Video">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {moderationStats.map((s,i) => (
          <StatCard key={i} label={s.label} value={String(s.value)}
            change={s.change} positive={s.positive} accent={i===0} />
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab} onClick={()=>setActiveTab(tab)}
            className={`shrink-0 text-[11px] font-body px-3 py-1.5 rounded-lg border cursor-pointer transition-colors
              ${activeTab===tab ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-transparent border-[#1e1e2e] text-[#555] hover:text-white'}`}>
            {tab}
          </button>
        ))}
        <div className="ml-auto flex gap-2 shrink-0">
          {['Mới nhất','Phổ biến nhất'].map(s => (
            <button key={s}
              className="text-[11px] font-body px-2.5 py-1.5 rounded-lg border border-[#1e1e2e] text-[#555] hover:text-white cursor-pointer bg-transparent transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Video cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {pendingVideos.map(v => {
          const status = statuses[v.id];
          return (
            <div key={v.id} className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden hover:border-primary/20 transition-colors group">
              {/* Thumbnail */}
              <div className="relative h-[120px] flex items-center justify-center" style={{background:v.bg}}>
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors cursor-pointer">
                  <PlayAdminIcon />
                </div>
                <div className="absolute top-2 left-2">
                  <StatusBadge status={v.flag} label={v.flag==='new'?'Mới':'Flagged'} />
                </div>
                {status !== 'pending' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <StatusBadge status={status==='approved'?'approved':'rejected'} />
                  </div>
                )}
                <span className="absolute bottom-2 right-2 text-[9px] font-bold font-body text-white bg-black/60 px-1.5 py-0.5 rounded">{v.duration}</span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-white text-[12px] font-semibold font-body leading-tight mb-1.5 line-clamp-1">{v.title}</p>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0" style={{background:v.color}}>{v.initials}</div>
                  <span className="text-[#555] text-[10px] font-body">{v.creator}</span>
                  <span className="text-[#333] text-[10px] font-body ml-auto">{v.submitTime}</span>
                </div>
                {status === 'pending' ? (
                  <div className="flex gap-1.5">
                    <button onClick={()=>approve(v.id)} className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-emerald-500/15 text-emerald-400 border-none cursor-pointer hover:bg-emerald-500/25">Duyệt</button>
                    <button onClick={()=>reject(v.id)}  className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-red-500/15 text-red-400 border-none cursor-pointer hover:bg-red-500/25">Từ chối</button>
                    <button className="w-7 text-[10px] font-body py-1.5 rounded bg-[#1e1e2e] text-[#666] border-none cursor-pointer hover:bg-[#2a2a3e]">···</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <StatusBadge status={status==='approved'?'approved':'rejected'} />
                    <button onClick={()=>undo(v.id)} className="text-[10px] font-body text-[#555] bg-transparent border-none cursor-pointer hover:text-white">Hoàn tác</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Violation reports */}
      <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a2a]">
          <p className="text-white text-[13px] font-semibold font-body">Báo cáo vi phạm nhiều nhất</p>
          <div className="flex gap-2">
            <Btn label="Tất cả báo cáo" />
            <Btn label="Bộ lọc" />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a2a]">
              {['Video','Creator','Lý do báo cáo','Số báo cáo','Mức độ','Thời gian','Hành động'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-body text-[#444] font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {violationReports.map((r,i) => (
              <tr key={r.id} className={`border-b border-[#1a1a2a]/40 hover:bg-white/[0.02] transition-colors ${i%2===0?'':'bg-white/[0.01]'}`}>
                <td className="px-4 py-3"><p className="text-white text-[12px] font-semibold font-body m-0 line-clamp-1 max-w-[200px]">{r.videoTitle}</p></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{background:r.color}}>{r.initials}</div>
                    <span className="text-[#666] text-[11px] font-body">{r.creator}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#888] text-[11px] font-body">{r.reason}</td>
                <td className="px-4 py-3">
                  <span className="text-white text-[12px] font-bold font-body">{r.reports}</span>
                  <span className="text-[#555] text-[10px] font-body ml-1">báo cáo</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.severity} /></td>
                <td className="px-4 py-3 text-[#555] text-[11px] font-body whitespace-nowrap">{r.time}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Btn label="Xem xét" bg="#1e3a5f" color="#60a5fa" />
                    <Btn label="Ẩn video" bg="#f59e0b22" color="#f59e0b" />
                    <Btn label="Xoá"      bg="#ef444422" color="#ef4444" />
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