export const overviewStats = [
  { key:'totalUsers',    label:'Tổng người dùng',     value:'2.41M', change:+12.4, positive:true  },
  { key:'totalViews',    label:'Lượt xem tháng này',  value:'8.13M', change:+8.1,  positive:true  },
  { key:'totalVideos',   label:'Video đã đăng',        value:'847K',  change:-2.3,  positive:false },
  { key:'pendingReport', label:'Báo cáo chờ xử lý',   value:'18.4K', change:+0.5,  positive:false },
];

export const userGrowthData = [
  { date:'10', newUsers:1200, active:3800 },
  { date:'11', newUsers:1800, active:4200 },
  { date:'12', newUsers:2400, active:4800 },
  { date:'13', newUsers:2100, active:5100 },
  { date:'14', newUsers:3200, active:5600 },
  { date:'15', newUsers:1600, active:4300 },
  { date:'16', newUsers:2800, active:5900 },
  { date:'17', newUsers:3800, active:6200 },
  { date:'18', newUsers:2900, active:5400 },
  { date:'19', newUsers:3500, active:6800 },
  { date:'20', newUsers:4200, active:7100 },
  { date:'21', newUsers:3100, active:6500 },
];

export const contentDistribution = [
  { name:'Dance',   value:35, color:'#ff2d78' },
  { name:'Travel',  value:28, color:'#ff6b35' },
  { name:'Gaming',  value:19, color:'#7c3aed' },
  { name:'Âm nhạc',value:13, color:'#06b6d4' },
  { name:'Khác',    value:5,  color:'#3a3a5a' },
];

export const topCreators = [
  { id:'u_001', rank:1, name:'Nguyen Vibe',   username:'@nguyenvibe',  initials:'NV', color:'#ff2d78',
    followers:'48.2K', videos:142, views:'1.2M',  revenue:'₫2.1M', status:'active'  },
  { id:'u_002', rank:2, name:'Trang Dancer',  username:'@trangdancer',  initials:'TD', color:'#ff6b35',
    followers:'112K',  videos:89,  views:'856K',  revenue:'₫1.4M', status:'active'  },
  { id:'u_003', rank:3, name:'Minh Travel',   username:'@minhtravel',   initials:'MT', color:'#f59e0b',
    followers:'61K',   videos:178, views:'754K',  revenue:'₫980K', status:'banned'  },
  { id:'u_004', rank:4, name:'Hai Lofi',      username:'@hailofi',      initials:'HL', color:'#06b6d4',
    followers:'28.4K', videos:63,  views:'370K',  revenue:'₫610K', status:'active'  },
  { id:'u_005', rank:5, name:'Linh Beats',    username:'@linhbeats',    initials:'LB', color:'#7c3aed',
    followers:'33K',   videos:47,  views:'14K',   revenue:'₫85K',  status:'pending' },
];

export const allUsers = [
  { id:'u_001', name:'Nguyen Vibe',  username:'@nguyenvibe', email:'nguyenvibe@email.com', initials:'NV', color:'#ff2d78',
    joinDate:'15/01/2023', followers:48200,  videos:142, status:'active',  role:'creator', reports:0 },
  { id:'u_002', name:'Trang Dancer', username:'@trangdancer', email:'trang@email.com',       initials:'TD', color:'#ff6b35',
    joinDate:'20/11/2022', followers:112000, videos:89,  status:'active',  role:'creator', reports:0 },
  { id:'u_003', name:'Minh Travel',  username:'@minhtravel',  email:'minh@email.com',         initials:'MT', color:'#f59e0b',
    joinDate:'05/09/2022', followers:61000,  videos:178, status:'banned',  role:'creator', reports:12 },
  { id:'u_004', name:'Hai Lofi',     username:'@hailofi',     email:'hailofi@email.com',      initials:'HL', color:'#06b6d4',
    joinDate:'10/03/2023', followers:28400,  videos:63,  status:'active',  role:'creator', reports:0 },
  { id:'u_005', name:'Linh Beats',   username:'@linhbeats',   email:'linh@email.com',         initials:'LB', color:'#7c3aed',
    joinDate:'01/06/2023', followers:33000,  videos:47,  status:'pending', role:'creator', reports:3 },
  { id:'u_006', name:'An Nguyen',    username:'@annguyen',    email:'an@email.com',           initials:'AN', color:'#10b981',
    joinDate:'12/07/2023', followers:1240,   videos:8,   status:'active',  role:'user',    reports:0 },
  { id:'u_007', name:'Mai Pham',     username:'@maipham',     email:'mai@email.com',          initials:'MP', color:'#ec4899',
    joinDate:'03/08/2023', followers:870,    videos:14,  status:'active',  role:'user',    reports:1 },
  { id:'u_008', name:'Duc Tran',     username:'@ductran',     email:'duc@email.com',          initials:'DT', color:'#8b5cf6',
    joinDate:'18/09/2023', followers:2100,   videos:22,  status:'active',  role:'user',    reports:0 },
];

export const revenueStats = [
  { label:'Tổng doanh thu',      value:'₫4.82B', change:18.2, positive:true },
  { label:'Doanh thu quảng cáo', value:'₫2.14B', change:12.5, positive:true },
  { label:'Subscription',        value:'₫1.68B', change:8.9,  positive:true },
  { label:'Creator fund',        value:'₫1.0B',  change:22.1, positive:true },
];

export const revenueChartData = [
  { date:'T1', adRevenue:280, subscription:120, creator:80  },
  { date:'T2', adRevenue:320, subscription:145, creator:95  },
  { date:'T3', adRevenue:290, subscription:138, creator:88  },
  { date:'T4', adRevenue:420, subscription:180, creator:120 },
  { date:'T5', adRevenue:380, subscription:160, creator:105 },
  { date:'T6', adRevenue:460, subscription:210, creator:145 },
  { date:'T7', adRevenue:520, subscription:240, creator:160 },
];

export const revenueDistribution = [
  { name:'Quảng cáo',    value:44, color:'#ff2d78' },
  { name:'Creator fund', value:22, color:'#ff6b35' },
  { name:'Subscription', value:21, color:'#7c3aed' },
  { name:'Other',        value:13, color:'#3a3a5a' },
];

export const viewsData = [
  { date:'T1', views:1800, likes:420,  shares:180 },
  { date:'T2', views:2200, likes:580,  shares:220 },
  { date:'T3', views:1900, likes:460,  shares:195 },
  { date:'T4', views:3100, likes:780,  shares:310 },
  { date:'T5', views:2800, likes:690,  shares:275 },
  { date:'T6', views:3600, likes:920,  shares:380 },
  { date:'T7', views:4200, likes:1050, shares:420 },
];

export const onlineUsersData = [
  { time:'00:00', users:8200  },
  { time:'03:00', users:4100  },
  { time:'06:00', users:6300  },
  { time:'09:00', users:12400 },
  { time:'12:00', users:18600 },
  { time:'15:00', users:22100 },
  { time:'18:00', users:31400 },
  { time:'21:00', users:28700 },
  { time:'24:00', users:14200 },
];

export const moderationStats = [
  { label:'Chờ duyệt',         value:89,  change:6,   positive:false },
  { label:'Đã duyệt hôm nay',  value:234, change:12,  positive:true  },
  { label:'Từ chối hôm nay',   value:41,  change:3,   positive:true  },
  { label:'Auto-flagged',       value:147, change:18,  positive:false },
];

export const pendingVideos = [
  { id:'v_r01', title:'Dance challenge cô chủ',       creator:'Trang Dancer', initials:'TD', color:'#ff6b35',
    duration:'0:45', submitTime:'10 phút trước', category:'Dance',  flag:'new',     bg:'#1a0a2e' },
  { id:'v_r02', title:'Trải nghiệm Phú Quốc 4K',     creator:'Minh Travel',  initials:'MT', color:'#f59e0b',
    duration:'2:10', submitTime:'25 phút trước', category:'Travel', flag:'flagged', bg:'#0a1a2e' },
  { id:'v_r03', title:'Hoàng hôn Đà Nẵng tuyệt đẹp', creator:'Hai Lofi',    initials:'HL', color:'#06b6d4',
    duration:'1:30', submitTime:'1 giờ trước',   category:'Travel', flag:'new',     bg:'#001a1a' },
  { id:'v_r04', title:'Hướng dẫn beat FL Studio',     creator:'Linh Beats',  initials:'LB', color:'#7c3aed',
    duration:'8:22', submitTime:'2 giờ trước',   category:'Music',  flag:'new',     bg:'#0d001a' },
];

export const violationReports = [
  { id:'rp_01', videoTitle:'Dance challenge cô chủ',   creator:'@trangdancer', initials:'TD', color:'#ff6b35',
    reason:'Spam / quảng cáo',     reports:31, severity:'low',    time:'15 phút trước' },
  { id:'rp_02', videoTitle:'Beat nhạc không bản quyền', creator:'@linhbeats', initials:'LB', color:'#7c3aed',
    reason:'Vi phạm bản quyền',    reports:12, severity:'high',   time:'45 phút trước' },
  { id:'rp_03', videoTitle:'Review sản phẩm XYZ',       creator:'@annguyen',  initials:'AN', color:'#10b981',
    reason:'Nội dung sai sự thật', reports:8,  severity:'medium', time:'2 giờ trước'  },
];