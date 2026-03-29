import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard    from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { allUsers } from '../../services/adminMockData';

const fmt = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n);

function Btn({ label, bg = '#1e1e2e', color = '#888', onClick }) {
  return (
    <button onClick={onClick} style={{ background:bg, color }}
      className="text-[10px] font-body px-2 py-1 rounded border-none cursor-pointer hover:opacity-80 whitespace-nowrap">
      {label}
    </button>
  );
}

const FILTERS = [
  { label:'Tất cả',    value:'all'     },
  { label:'Active',    value:'active'  },
  { label:'Creator',   value:'creator' },
  { label:'Banned',    value:'banned'  },
  { label:'Chờ duyệt',value:'pending' },
];
const PAGE_SIZE = 6;

export default function UserManagement() {
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState([]);
  const [page,     setPage]     = useState(1);

  const counts = useMemo(() => ({
    all:     allUsers.length,
    active:  allUsers.filter(u=>u.status==='active').length,
    creator: allUsers.filter(u=>u.role==='creator').length,
    banned:  allUsers.filter(u=>u.status==='banned').length,
    pending: allUsers.filter(u=>u.status==='pending').length,
  }), []);

  const filtered = useMemo(() => {
    let list = allUsers;
    if (filter !== 'all')
      list = list.filter(u => filter==='creator' ? u.role==='creator' : u.status===filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, search]);

  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  const toggleAll    = ()   => setSelected(s => s.length===paginated.length ? [] : paginated.map(u=>u.id));
  const changeFilter = (f)  => { setFilter(f); setPage(1); setSelected([]); };

  const actions = (
    <button className="flex items-center gap-2 bg-primary text-white text-[12px] font-semibold font-body px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-primary/90">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
      Thêm người dùng
    </button>
  );

  return (
    <AdminLayout title="Quản lý người dùng" actions={actions}>
      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Tổng người dùng" value={fmt(allUsers.length)} change={12.4} positive accent />
        <StatCard label="Creator"         value={fmt(counts.creator)}  change={5.2}  positive />
        <StatCard label="Đã ban"          value={String(counts.banned)} change={2.1} positive />
        <StatCard label="Chờ duyệt"       value={String(counts.pending)} change={1.3} positive={false} />
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-primary text-[12px] font-body font-semibold">Đã chọn {selected.length} người dùng</span>
          <div className="flex gap-2 ml-auto">
            <Btn label="Ban"  bg="#f59e0b22" color="#f59e0b" />
            <Btn label="Xoá" bg="#ef444422" color="#ef4444" />
            <button onClick={()=>setSelected([])} className="text-[#555] text-[11px] cursor-pointer bg-transparent border-none hover:text-white">Huỷ</button>
          </div>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button key={f.value} onClick={()=>changeFilter(f.value)}
              className={`flex items-center gap-1.5 text-[11px] font-body px-3 py-1.5 rounded-lg border transition-colors cursor-pointer
                ${filter===f.value ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-transparent border-[#1e1e2e] text-[#666] hover:text-white'}`}>
              {f.label}
              <span className={`text-[9px] px-1 py-px rounded-full font-bold
                ${filter===f.value ? 'bg-primary/20 text-primary' : 'bg-[#1e1e2e] text-[#555]'}`}>
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-1.5 w-[220px]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M8.5 8.5l2.5 2.5"/></svg>
          <input type="text" placeholder="Tìm người dùng..." value={search}
            onChange={e=>{setSearch(e.target.value); setPage(1);}}
            className="bg-transparent border-none outline-none text-white text-[11px] font-body w-full placeholder:text-[#444]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a2a]">
              <th className="px-4 py-3 w-8">
                <input type="checkbox" className="accent-primary cursor-pointer w-3 h-3"
                  checked={selected.length===paginated.length && paginated.length>0} onChange={toggleAll} />
              </th>
              {['Người dùng','Email','Ngày tham gia','Followers','Videos','Trạng thái','Báo cáo','Hành động'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-body text-[#444] font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((u, i) => (
              <tr key={u.id}
                className={`border-b border-[#1a1a2a]/40 hover:bg-white/[0.02] transition-colors cursor-pointer
                  ${selected.includes(u.id) ? 'bg-primary/[0.04]' : i%2===0?'':'bg-white/[0.01]'}`}
                onClick={()=>toggleSelect(u.id)}>
                <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" className="accent-primary cursor-pointer w-3 h-3"
                    checked={selected.includes(u.id)} onChange={()=>toggleSelect(u.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{background:u.color}}>{u.initials}</div>
                    <div>
                      <p className="text-white text-[12px] font-semibold font-body leading-tight m-0">{u.name}</p>
                      <p className="text-[#555] text-[10px] font-body m-0">{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#666] text-[11px] font-body">{u.email}</td>
                <td className="px-4 py-3 text-[#666] text-[11px] font-body whitespace-nowrap">{u.joinDate}</td>
                <td className="px-4 py-3 text-[#888] text-[11px] font-body">{fmt(u.followers)}</td>
                <td className="px-4 py-3 text-[#888] text-[11px] font-body">{u.videos}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    <StatusBadge status={u.status} />
                    {u.role==='creator' && <StatusBadge status="creator" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.reports > 0
                    ? <span className="text-red-400 text-[11px] font-bold font-body">{u.reports} báo cáo</span>
                    : <span className="text-[#444] text-[11px] font-body">—</span>}
                </td>
                <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Btn label="Xem" />
                    <Btn label="Sửa" bg="#1e3a5f" color="#60a5fa" />
                    {u.status==='active'  && <Btn label="Ban"   bg="#f59e0b22" color="#f59e0b" />}
                    {u.status==='banned'  && <Btn label="Unban" bg="#10b98122" color="#10b981" />}
                    {u.status==='pending' && <Btn label="Duyệt" bg="#10b98122" color="#10b981" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a2a]">
          <p className="text-[#444] text-[11px] font-body">
            Hiển thị {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} / {filtered.length} người dùng
          </p>
          <div className="flex gap-1">
            {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
              <button key={p} onClick={()=>setPage(p)}
                className={`w-7 h-7 text-[11px] font-body rounded border cursor-pointer transition-colors
                  ${page===p ? 'bg-primary border-primary text-white' : 'bg-transparent border-[#1e1e2e] text-[#555] hover:border-[#333] hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}