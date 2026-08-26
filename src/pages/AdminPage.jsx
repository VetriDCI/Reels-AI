import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Video, Flag, TrendingUp, Search, Filter, ChevronDown, ChevronLeft,
  Calendar, Eye, Ban, Trash2, Shield, Star, MoreVertical, X, Check,
  Download, LayoutDashboard, BarChart3, Settings, Menu, Sparkles,
  Heart, Play, AlertTriangle, Verified, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// MOCK DATA - Replace with Supabase
// supabase.from('profiles').select('*')
// supabase.from('reels').select('*, profiles(username)')
// supabase.from('reports').select('*')
// import { supabase } from '../lib/supabaseClient'

type UserStatus = 'active' | 'banned' | 'reported' | 'pending' | 'deleted';
type ReelStatus = 'active' | 'hidden' | 'reported' | 'deleted' | 'featured';
type ContentType = 'reels' | 'live' | 'story';
type Category = 'Dance' | 'Comedy' | 'Education' | 'DCI Training' | 'Music' | 'Fitness' | 'Food' | 'Travel';

const mockUsers = [
  { id: 'u1', name: 'Arjun Kumar', username: 'arjun_dance', email: 'arjun.kumar@gmail.com', avatar: 'AK', reels: 42, followers: 12500, status: 'active' as UserStatus, joined: '2024-01-15', verified: true, category: 'Dance' },
  { id: 'u2', name: 'Priya Sharma', username: 'priya_comedy', email: 'priya.s@outlook.com', avatar: 'PS', reels: 128, followers: 45200, status: 'active' as UserStatus, joined: '2023-11-02', verified: true, category: 'Comedy' },
  { id: 'u3', name: 'Vikram R', username: 'vikram_dci', email: 'vikram.r@gmail.com', avatar: 'VR', reels: 15, followers: 3200, status: 'active' as UserStatus, joined: '2024-03-10', verified: false, category: 'DCI Training' },
  { id: 'u4', name: 'Ananya S', username: 'ananya_music', email: 'ananya.music@gmail.com', avatar: 'AS', reels: 67, followers: 28900, status: 'reported' as UserStatus, joined: '2023-12-20', verified: true, category: 'Music' },
  { id: 'u5', name: 'Karthi M', username: 'karthi_fitness', email: 'karthi.m@gmail.com', avatar: 'KM', reels: 34, followers: 8900, status: 'active' as UserStatus, joined: '2024-02-18', verified: false, category: 'Fitness' },
  { id: 'u6', name: 'Meena J', username: 'meena_foodie', email: 'meena.j@gmail.com', avatar: 'MJ', reels: 91, followers: 15600, status: 'banned' as UserStatus, joined: '2023-10-05', verified: false, category: 'Food' },
  { id: 'u7', name: 'Suresh P', username: 'suresh_travel', email: 'suresh.p@gmail.com', avatar: 'SP', reels: 23, followers: 5400, status: 'active' as UserStatus, joined: '2024-04-01', verified: false, category: 'Travel' },
  { id: 'u8', name: 'Divya K', username: 'divya_edu', email: 'divya.edu@gmail.com', avatar: 'DK', reels: 56, followers: 22100, status: 'pending' as UserStatus, joined: '2024-05-12', verified: true, category: 'Education' },
  { id: 'u9', name: 'Rahul N', username: 'rahul_beats', email: 'rahul.n@gmail.com', avatar: 'RN', reels: 103, followers: 67800, status: 'active' as UserStatus, joined: '2023-09-14', verified: true, category: 'Dance' },
  { id: 'u10', name: 'Lakshmi V', username: 'lakshmi_classical', email: 'lakshmi.v@gmail.com', avatar: 'LV', reels: 19, followers: 4100, status: 'active' as UserStatus, joined: '2024-01-30', verified: false, category: 'Dance' },
  { id: 'u11', name: 'Mohan Das', username: 'mohan_comedy_', email: 'mohan.d@gmail.com', avatar: 'MD', reels: 77, followers: 33400, status: 'active' as UserStatus, joined: '2023-12-08', verified: true, category: 'Comedy' },
  { id: 'u12', name: 'Janani R', username: 'janani_dci_pro', email: 'janani.r@gmail.com', avatar: 'JR', reels: 8, followers: 1200, status: 'active' as UserStatus, joined: '2024-06-01', verified: false, category: 'DCI Training' },
];

const mockReels = [
  { id: 'r1', title: 'DCI Training - Day 12 Full Body', user: 'vikram_dci', userName: 'Vikram R', views: 45200, likes: 3200, reports: 0, status: 'active' as ReelStatus, created: '2024-06-10', category: 'DCI Training' as Category, type: 'reels' as ContentType, duration: '0:42' },
  { id: 'r2', title: 'Kollywood Dance Challenge 🔥', user: 'arjun_dance', userName: 'Arjun Kumar', views: 125000, likes: 15400, reports: 2, status: 'featured' as ReelStatus, created: '2024-06-12', category: 'Dance' as Category, type: 'reels' as ContentType, duration: '0:28' },
  { id: 'r3', title: 'Comedy: Amma vs Smartphone', user: 'priya_comedy', userName: 'Priya Sharma', views: 89200, likes: 9800, reports: 0, status: 'active' as ReelStatus, created: '2024-06-11', category: 'Comedy' as Category, type: 'reels' as ContentType, duration: '0:35' },
  { id: 'r4', title: 'Live: DCI Doubts Clearing Session', user: 'janani_dci_pro', userName: 'Janani R', views: 3200, likes: 450, reports: 0, status: 'active' as ReelStatus, created: '2024-06-13', category: 'DCI Training' as Category, type: 'live' as ContentType, duration: '45:12' },
  { id: 'r5', title: 'Tamil Beat - Vijay Mass Edit', user: 'rahul_beats', userName: 'Rahul N', views: 234000, likes: 22100, reports: 12, status: 'reported' as ReelStatus, created: '2024-06-09', category: 'Music' as Category, type: 'reels' as ContentType, duration: '0:22' },
  { id: 'r6', title: 'Protein Dosai Recipe 💪', user: 'meena_foodie', userName: 'Meena J', views: 18700, likes: 1200, reports: 5, status: 'hidden' as ReelStatus, created: '2024-06-08', category: 'Food' as Category, type: 'reels' as ContentType, duration: '0:58' },
  { id: 'r7', title: 'Story: Morning Workout Routine', user: 'karthi_fitness', userName: 'Karthi M', views: 5600, likes: 890, reports: 0, status: 'active' as ReelStatus, created: '2024-06-13', category: 'Fitness' as Category, type: 'story' as ContentType, duration: '0:15' },
  { id: 'r8', title: 'How to Crack DCI - Tips #5', user: 'vikram_dci', userName: 'Vikram R', views: 12300, likes: 1500, reports: 0, status: 'active' as ReelStatus, created: '2024-06-07', category: 'Education' as Category, type: 'reels' as ContentType, duration: '1:02' },
  { id: 'r9', title: 'Chennai Street Food Tour', user: 'suresh_travel', userName: 'Suresh P', views: 34200, likes: 2800, reports: 1, status: 'active' as ReelStatus, created: '2024-06-05', category: 'Travel' as Category, type: 'reels' as ContentType, duration: '0:47' },
  { id: 'r10', title: 'Classical Bharatanatyam - Thillana', user: 'lakshmi_classical', userName: 'Lakshmi V', views: 28900, likes: 3400, reports: 0, status: 'featured' as ReelStatus, created: '2024-06-12', category: 'Dance' as Category, type: 'reels' as ContentType, duration: '1:15' },
  { id: 'r11', title: 'Office Comedy: Monday Blues', user: 'mohan_comedy_', userName: 'Mohan Das', views: 67800, likes: 7200, reports: 0, status: 'active' as ReelStatus, created: '2024-06-04', category: 'Comedy' as Category, type: 'reels' as ContentType, duration: '0:31' },
  { id: 'r12', title: 'Maths Shortcuts for DCI', user: 'divya_edu', userName: 'Divya K', views: 15600, likes: 2100, reports: 0, status: 'active' as ReelStatus, created: '2024-06-11', category: 'Education' as Category, type: 'reels' as ContentType, duration: '0:55' },
  { id: 'r13', title: 'DCI Training - Live Mock Test', user: 'janani_dci_pro', userName: 'Janani R', views: 8900, likes: 1100, reports: 0, status: 'active' as ReelStatus, created: '2024-06-03', category: 'DCI Training' as Category, type: 'live' as ContentType, duration: '60:00' },
  { id: 'r14', title: 'Ananya Live Singing - Kaadhal', user: 'ananya_music', userName: 'Ananya S', views: 44500, likes: 5600, reports: 3, status: 'reported' as ReelStatus, created: '2024-06-10', category: 'Music' as Category, type: 'live' as ContentType, duration: '12:34' },
  { id: 'r15', title: 'Dance Duo - Trending Step', user: 'arjun_dance', userName: 'Arjun Kumar', views: 98000, likes: 11200, reports: 0, status: 'active' as ReelStatus, created: '2024-06-02', category: 'Dance' as Category, type: 'reels' as ContentType, duration: '0:19' },
  { id: 'r16', title: 'Weight Loss Sambar Challenge', user: 'karthi_fitness', userName: 'Karthi M', views: 22300, likes: 1800, reports: 0, status: 'active' as ReelStatus, created: '2024-06-01', category: 'Fitness' as Category, type: 'reels' as ContentType, duration: '0:40' },
  { id: 'r17', title: 'Mini Vlog: Mahabalipuram', user: 'suresh_travel', userName: 'Suresh P', views: 41200, likes: 3200, reports: 0, status: 'active' as ReelStatus, created: '2024-05-30', category: 'Travel' as Category, type: 'reels' as ContentType, duration: '0:52' },
  { id: 'r18', title: 'Instant Filter Coffee Hack', user: 'meena_foodie', userName: 'Meena J', views: 56700, likes: 4300, reports: 1, status: 'active' as ReelStatus, created: '2024-05-28', category: 'Food' as Category, type: 'reels' as ContentType, duration: '0:33' },
  { id: 'r19', title: 'DCI Motivation - 3AM Study', user: 'vikram_dci', userName: 'Vikram R', views: 18900, likes: 2400, reports: 0, status: 'featured' as ReelStatus, created: '2024-06-13', category: 'DCI Training' as Category, type: 'reels' as ContentType, duration: '0:25' },
  { id: 'r20', title: 'English vs Tanglish Comedy', user: 'priya_comedy', userName: 'Priya Sharma', views: 112000, likes: 13400, reports: 0, status: 'active' as ReelStatus, created: '2024-06-12', category: 'Comedy' as Category, type: 'reels' as ContentType, duration: '0:29' },
];

const mockReports = [
  { id: 'rep1', contentId: 'r5', contentTitle: 'Tamil Beat - Vijay Mass Edit', reason: 'Copyright music', reporter: 'isai_label', reportedUser: 'rahul_beats', status: 'pending', date: '2024-06-12', type: 'reels' },
  { id: 'rep2', contentId: 'r14', contentTitle: 'Ananya Live Singing', reason: 'Abusive comments in live', reporter: 'user_284', reportedUser: 'ananya_music', status: 'pending', date: '2024-06-11', type: 'live' },
  { id: 'rep3', contentId: 'r6', contentTitle: 'Protein Dosai Recipe', reason: 'Misleading info', reporter: 'nutrition_expert', reportedUser: 'meena_foodie', status: 'resolved', date: '2024-06-09', type: 'reels' },
  { id: 'rep4', contentId: 'u6', contentTitle: 'User: meena_foodie', reason: 'Spam posting', reporter: 'multiple', reportedUser: 'meena_foodie', status: 'pending', date: '2024-06-08', type: 'user' },
  { id: 'rep5', contentId: 'r2', contentTitle: 'Kollywood Dance Challenge', reason: 'Inappropriate outfit', reporter: 'user_192', reportedUser: 'arjun_dance', status: 'dismissed', date: '2024-06-12', type: 'reels' },
];

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'reels' | 'reports' | 'analytics' | 'settings' | 'dashboard'>('dashboard');
  const [showFilters, setShowFilters] = useState(true);
  const [toasts, setToasts] = useState<{id: string, msg: string, type: 'success' | 'error' | 'info'}[]>([]);
  const [confirmModal, setConfirmModal] = useState<{show: boolean, title: string, desc: string, onConfirm: ()=>void} | null>(null);
  const [reelViewMode, setReelViewMode] = useState<'table' | 'grid'>('table');
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'views' | 'reports'>('newest');

  // Selections
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedReels, setSelectedReels] = useState<string[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [usersData, setUsersData] = useState(mockUsers);
  const [reelsData, setReelsData] = useState(mockReels);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const addToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(()=> setToasts(t=> t.filter(x=>x.id!==id)), 3000);
  };

  const activeFilterChips = useMemo(()=>{
    const chips: {key: string, label: string, onClear: ()=>void}[] = [];
    if(search) chips.push({key: 'search', label: `Search: ${search}`, onClear: ()=>setSearch('')});
    if(dateRange!=='all') chips.push({key: 'date', label: `Date: ${dateRange}`, onClear: ()=>setDateRange('all')});
    if(statusFilter!=='all') chips.push({key: 'status', label: `Status: ${statusFilter}`, onClear: ()=>setStatusFilter('all')});
    if(contentTypeFilter!=='all') chips.push({key: 'type', label: `Type: ${contentTypeFilter}`, onClear: ()=>setContentTypeFilter('all')});
    if(categoryFilter!=='all') chips.push({key: 'cat', label: `Category: ${categoryFilter}`, onClear: ()=>setCategoryFilter('all')});
    if(verifiedFilter!=='all') chips.push({key: 'ver', label: `Verified: ${verifiedFilter}`, onClear: ()=>setVerifiedFilter('all')});
    return chips;
  },[search, dateRange, statusFilter, contentTypeFilter, categoryFilter, verifiedFilter]);

  const isWithinDate = (dateStr: string) => {
    if(dateRange==='all') return true;
    const d = new Date(dateStr);
    const now = new Date();
    if(dateRange==='today') return d.toDateString()===now.toDateString();
    if(dateRange==='7days') { const diff = (now.getTime()-d.getTime())/(1000*3600*24); return diff<=7; }
    if(dateRange==='30days') { const diff = (now.getTime()-d.getTime())/(1000*3600*24); return diff<=30; }
    if(dateRange==='custom' && customDateStart && customDateEnd){
      return d >= new Date(customDateStart) && d <= new Date(customDateEnd);
    }
    return true;
  };

  const filteredUsers = useMemo(()=>{
    let list = [...usersData];
    if(search){
      const q = search.toLowerCase();
      list = list.filter(u=> u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.category.toLowerCase().includes(q));
    }
    if(statusFilter!=='all') list = list.filter(u=> u.status===statusFilter);
    if(categoryFilter!=='all') list = list.filter(u=> u.category===categoryFilter);
    if(verifiedFilter!=='all') list = list.filter(u=> verifiedFilter==='verified' ? u.verified : !u.verified);
    list = list.filter(u=> isWithinDate(u.joined));
    if(sortBy==='newest') list.sort((a,b)=> new Date(b.joined).getTime()-new Date(a.joined).getTime());
    if(sortBy==='likes') list.sort((a,b)=> b.followers-a.followers);
    if(sortBy==='views') list.sort((a,b)=> b.reels-a.reels);
    return list;
  // eslint-disable-next-line
  },[usersData, search, statusFilter, categoryFilter, verifiedFilter, dateRange, customDateStart, customDateEnd, sortBy]);

  const filteredReels = useMemo(()=>{
    let list = [...reelsData];
    if(search){
      const q = search.toLowerCase();
      list = list.filter(r=> r.title.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    if(statusFilter!=='all') list = list.filter(r=> r.status===statusFilter);
    if(contentTypeFilter!=='all') list = list.filter(r=> r.type===contentTypeFilter);
    if(categoryFilter!=='all') list = list.filter(r=> r.category===categoryFilter);
    list = list.filter(r=> isWithinDate(r.created));
    if(sortBy==='newest') list.sort((a,b)=> new Date(b.created).getTime()-new Date(a.created).getTime());
    if(sortBy==='likes') list.sort((a,b)=> b.likes-a.likes);
    if(sortBy==='views') list.sort((a,b)=> b.views-a.views);
    if(sortBy==='reports') list.sort((a,b)=> b.reports-a.reports);
    return list;
  // eslint-disable-next-line
  },[reelsData, search, statusFilter, contentTypeFilter, categoryFilter, dateRange, customDateStart, customDateEnd, sortBy]);

  const filteredReports = useMemo(()=>{
    let list = [...mockReports];
    if(search){
      const q = search.toLowerCase();
      list = list.filter(r=> r.contentTitle.toLowerCase().includes(q) || r.reportedUser.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
    }
    if(statusFilter!=='all') list = list.filter(r=> r.status===statusFilter);
    return list;
  },[search, statusFilter]);

  const paginatedUsers = useMemo(()=> filteredUsers.slice((currentPage-1)*pageSize, currentPage*pageSize), [filteredUsers, currentPage]);
  const paginatedReels = useMemo(()=> filteredReels.slice((currentPage-1)*pageSize, currentPage*pageSize), [filteredReels, currentPage]);

  useEffect(()=> setCurrentPage(1), [search, statusFilter, categoryFilter, dateRange]);

  const handleBanToggle = (userId: string) => {
    setUsersData(prev=> prev.map(u=> u.id===userId ? {...u, status: u.status==='banned' ? 'active' as UserStatus : 'banned' as UserStatus } : u));
    const user = usersData.find(u=>u.id===userId);
    addToast(user?.status==='banned' ? `Unbanned ${user?.username}` : `Banned ${user?.username}`, user?.status==='banned' ? 'success' : 'error');
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete User?',
      desc: 'This will permanently delete the user and all their reels. This action cannot be undone.',
      onConfirm: ()=>{
        setUsersData(prev=> prev.filter(u=>u.id!==userId));
        setSelectedUsers(prev=> prev.filter(id=>id!==userId));
        addToast('User deleted permanently', 'error');
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteReel = (reelId: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Reel?',
      desc: 'This reel will be deleted and removed from feeds.',
      onConfirm: ()=>{
        setReelsData(prev=> prev.filter(r=>r.id!==reelId));
        addToast('Reel deleted', 'error');
        setConfirmModal(null);
      }
    });
  };

  const handleExport = () => {
    const csv = activeTab==='users' ? filteredUsers.map(u=>`${u.username},${u.email},${u.followers},${u.status}`).join('\n') : filteredReels.map(r=>`${r.title},${r.user},${r.views},${r.likes}`).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`reelsra_${activeTab}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${activeTab} CSV (${activeTab==='users'?filteredUsers.length:filteredReels.length} rows)`, 'success');
  };

  const totalPagesUsers = Math.ceil(filteredUsers.length / pageSize);
  const totalPagesReels = Math.ceil(filteredReels.length / pageSize);

  return (
    <div className="min-h-screen bg-[#f6f5fb] font-[Inter,system-ui] text-[#1a1a2e] flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'} hidden lg:flex flex-col bg-[#0f0f19] text-white transition-all duration-300 sticky top-0 h-screen shrink-0 z-30`}>
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5a9e] to-[#6d5bff] flex items-center justify-center font-bold">RA</div>
              <div>
                <div className="font-bold leading-none">Reels RA</div>
                <div className="text-[11px] text-white/60">Admin Panel</div>
              </div>
            </div>
          )}
          <button onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
            {id: 'users', label: 'Users', icon: Users, count: usersData.length},
            {id: 'reels', label: 'Reels', icon: Video, count: reelsData.length},
            {id: 'reports', label: 'Reports', icon: Flag, count: mockReports.filter(r=>r.status==='pending').length, alert: true},
            {id: 'analytics', label: 'Analytics', icon: BarChart3},
            {id: 'settings', label: 'Settings', icon: Settings},
          ].map(item=> (
            <button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] transition-all ${activeTab===item.id ? 'bg-gradient-to-r from-[#ff5a9e] to-[#6d5bff] text-white shadow-lg shadow-[#ff5a9e]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              <item.icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}
              {!sidebarCollapsed && item.count!==undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${item.alert && item.count>0 ? 'bg-red-500 text-white' : 'bg-white/15'}`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="rounded-[16px] bg-gradient-to-br from-[#ff5a9e]/20 to-[#6d5bff]/20 border border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-1"><Sparkles className="w-4 h-4 text-[#ff5a9e]" /> Pro Tip</div>
              <p className="text-[12px] text-white/60 leading-relaxed">Use bulk actions to moderate faster. Select multiple rows → Ban/Delete.</p>
            </div>
            <div className="mt-4 flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">A</div>
              <div className="text-sm"><div className="font-medium">Admin RA</div><div className="text-[11px] text-white/50">admin@reelsra.app</div></div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-[280px] bg-[#0f0f19] text-white p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5a9e] to-[#6d5bff] flex items-center justify-center font-bold">RA</div><div className="font-bold">Reels RA</div></div>
              <button onClick={()=>setMobileSidebar(false)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <nav className="space-y-1">
              {[
                {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
                {id: 'users', label: 'Users', icon: Users},
                {id: 'reels', label: 'Reels', icon: Video},
                {id: 'reports', label: 'Reports', icon: Flag},
                {id: 'analytics', label: 'Analytics', icon: BarChart3},
                {id: 'settings', label: 'Settings', icon: Settings},
              ].map(item=> (
                <button key={item.id} onClick={()=>{setActiveTab(item.id as any); setMobileSidebar(false)}} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] ${activeTab===item.id ? 'bg-gradient-to-r from-[#ff5a9e] to-[#6d5bff]' : 'text-white/70'}`}>
                  <item.icon className="w-5 h-5" /> {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 bg-black/50" onClick={()=>setMobileSidebar(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-black/5">
          <div className="px-4 lg:px-8 py-4 flex items-center gap-4">
            <button onClick={()=>setMobileSidebar(true)} className="lg:hidden w-9 h-9 rounded-xl bg-[#0f0f19] text-white flex items-center justify-center"><Menu className="w-5 h-5" /></button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] lg:text-[24px] font-bold tracking-tight flex items-center gap-2">
                {activeTab==='dashboard' ? 'Dashboard Overview' : activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}
                {activeTab!=='dashboard' && <span className="hidden sm:inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f1eefc] text-[#6d5bff] border border-[#6d5bff]/20">PlayCircle Style</span>}
              </h1>
              <p className="text-[13px] text-black/50 mt-0.5 hidden sm:block">Manage your Tamil community reels, users and reports with advanced filters.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="h-10 px-4 rounded-xl bg-white border border-black/10 text-[13px] font-medium flex items-center gap-2 hover:bg-black/[0.02]"><Download className="w-4 h-4" /> <span className="hidden sm:inline">Export CSV</span></button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5a9e] to-[#6d5bff] flex items-center justify-center text-white font-bold">A</div>
            </div>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label: 'Total Users', value: usersData.length.toLocaleString(), change: '+12.5%', up: true, icon: Users, gradient: 'from-[#ff5a9e] to-[#ff8a5c]'},
              {label: 'Total Reels', value: reelsData.length.toLocaleString(), change: '+8.2%', up: true, icon: Video, gradient: 'from-[#6d5bff] to-[#8a6bff]'},
              {label: 'Reported', value: mockReports.filter(r=>r.status==='pending').length.toString(), change: '-3.1%', up: false, icon: Flag, gradient: 'from-[#ff5a5a] to-[#ff8a8a]'},
              {label: 'Engagement', value: '84.2%', change: '+5.7%', up: true, icon: TrendingUp, gradient: 'from-[#00d2a0] to-[#00e8b5]'},
            ].map((stat,i)=>(
              <div key={i} className="bg-white rounded-[20px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04] relative overflow-hidden group hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-[12px] bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${stat.up ? 'bg-[#e6faf3] text-[#00a87a]' : 'bg-[#ffecec] text-[#d93a3a]'}`}>
                    {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-[28px] font-bold leading-none tracking-tight">{stat.value}</div>
                  <div className="text-[13px] text-black/50 mt-1 font-medium">{stat.label}</div>
                </div>
                <div className="mt-4 h-1 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`} style={{width: `${65+i*10}%`}} />
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Filters Bar */}
          <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04] overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.06] cursor-pointer" onClick={()=>setShowFilters(!showFilters)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f1eefc] flex items-center justify-center text-[#6d5bff]"><Filter className="w-5 h-5" /></div>
                <div>
                  <div className="font-semibold text-[14px] flex items-center gap-2">Advanced Filters <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#ff5a9e]/10 text-[#ff5a9e] font-bold">PlayCircle Style</span></div>
                  <div className="text-[12px] text-black/50">{activeFilterChips.length} active • Live filtering</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterChips.length>0 && <span className="hidden sm:inline-flex text-[11px] bg-[#0f0f19] text-white px-2.5 py-1 rounded-full">{activeFilterChips.length} filters</span>}
                <ChevronDown className={`w-5 h-5 text-black/30 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {showFilters && (
              <div className="p-5 space-y-5 animate-[fadeIn_0.2s]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-4">
                    <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Users, reels, hashtags, titles..." className="w-full h-[44px] pl-10 pr-4 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6d5bff]/20 focus:border-[#6d5bff]/30 placeholder:text-black/30" />
                      {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center"><X className="w-3 h-3" /></button>}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Date Range</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                      <select value={dateRange} onChange={e=>setDateRange(e.target.value as any)} className="w-full h-[44px] pl-10 pr-8 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6d5bff]/20">
                        <option value="all">All time</option>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                        <option value="custom">Custom</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Status</label>
                    <div className="relative">
                      <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full h-[44px] px-3 pr-8 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6d5bff]/20">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                        <option value="reported">Reported</option>
                        <option value="pending">Pending</option>
                        <option value="hidden">Hidden</option>
                        <option value="featured">Featured</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Content Type */}
                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Content Type</label>
                    <div className="relative">
                      <select value={contentTypeFilter} onChange={e=>setContentTypeFilter(e.target.value)} className="w-full h-[44px] px-3 pr-8 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6d5bff]/20">
                        <option value="all">All Types</option>
                        <option value="reels">Reels</option>
                        <option value="live">Live</option>
                        <option value="story">Story</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Sort By</label>
                    <div className="relative">
                      <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="w-full h-[44px] px-3 pr-8 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6d5bff]/20">
                        <option value="newest">Newest</option>
                        <option value="likes">Most Liked</option>
                        <option value="views">Most Viewed</option>
                        <option value="reports">Most Reported</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-3">
                    <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Category</label>
                    <div className="relative">
                      <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="w-full h-[44px] px-3 pr-8 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px] appearance-none focus:outline-none">
                        <option value="all">All Categories</option>
                        <option>Dance</option><option>Comedy</option><option>Education</option><option>DCI Training</option><option>Music</option><option>Fitness</option><option>Food</option><option>Travel</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Verification</label>
                    <div className="relative">
                      <select value={verifiedFilter} onChange={e=>setVerifiedFilter(e.target.value)} className="w-full h-[44px] px-3 pr-8 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px] appearance-none focus:outline-none">
                        <option value="all">All Users</option>
                        <option value="verified">Verified Only</option>
                        <option value="unverified">Unverified</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                    </div>
                  </div>
                  {dateRange==='custom' && (
                    <>
                      <div className="lg:col-span-3">
                        <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">Start Date</label>
                        <input type="date" value={customDateStart} onChange={e=>setCustomDateStart(e.target.value)} className="w-full h-[44px] px-3 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px]" />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="text-[11px] font-bold tracking-widest text-black/40 uppercase mb-2 block">End Date</label>
                        <input type="date" value={customDateEnd} onChange={e=>setCustomDateEnd(e.target.value)} className="w-full h-[44px] px-3 rounded-xl bg-[#f8f7fb] border border-black/5 text-[14px]" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-black/[0.06]">
                  <div className="flex gap-2">
                    <button onClick={()=>{addToast('Filters applied','success')}} className="h-10 px-6 rounded-xl bg-gradient-to-r from-[#ff5a9e] to-[#6d5bff] text-white text-[13px] font-semibold shadow-lg shadow-[#6d5bff]/20 hover:shadow-[#6d5bff]/30 transition-all flex items-center gap-2"><Check className="w-4 h-4" /> Apply Filters</button>
                    <button onClick={()=>{setSearch(''); setDateRange('all'); setStatusFilter('all'); setContentTypeFilter('all'); setCategoryFilter('all'); setVerifiedFilter('all'); setSortBy('newest'); setCustomDateStart(''); setCustomDateEnd(''); addToast('Filters reset','info')}} className="h-10 px-5 rounded-xl bg-black/[0.04] text-[13px] font-medium hover:bg-black/[0.08]">Reset</button>
                  </div>
                  {activeFilterChips.length>0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeFilterChips.map(chip=>(
                        <span key={chip.key} className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-[#0f0f19] text-white text-[12px] font-medium">
                          {chip.label}
                          <button onClick={chip.onClear} className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {[
              {id: 'dashboard', label: 'Overview'},
              {id: 'users', label: `Users (${filteredUsers.length})`},
              {id: 'reels', label: `Reels (${filteredReels.length})`},
              {id: 'reports', label: `Reports (${filteredReports.length})`},
              {id: 'analytics', label: 'Analytics'},
              {id: 'settings', label: 'Settings'},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`whitespace-nowrap h-10 px-5 rounded-full text-[13px] font-semibold border transition-all ${activeTab===tab.id ? 'bg-[#0f0f19] text-white border-[#0f0f19] shadow-lg' : 'bg-white border-black/10 text-black/60 hover:text-black hover:border-black/20'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab==='dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-[16px]">Recent Activity</h3>
                  <button onClick={()=>setActiveTab('reels')} className="text-[12px] font-semibold text-[#6d5bff] hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {filteredReels.slice(0,5).map(reel=>(
                    <div key={reel.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f8f7fb] transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff5a9e] to-[#6d5bff] flex items-center justify-center text-white font-bold text-[11px] shrink-0">{reel.duration}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[14px] truncate">{reel.title}</div>
                        <div className="text-[12px] text-black/50 flex items-center gap-2"><span>{reel.userName}</span><span className="w-1 h-1 bg-black/20 rounded-full" /><span className="flex items-center gap-1"><Eye className="w-3 h-3" />{reel.views.toLocaleString()}</span></div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${reel.status==='featured' ? 'bg-[#fff2cc] text-[#a67c00]' : reel.status==='reported' ? 'bg-[#ffecec] text-[#d93a3a]' : 'bg-[#e8f5e9] text-[#2e7d32]'}`}>{reel.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-[#0f0f19] rounded-[20px] p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#ff5a9e]/30 to-[#6d5bff]/30 rounded-full blur-[40px]" />
                  <h3 className="font-bold relative">Quick Actions</h3>
                  <div className="mt-4 space-y-2 relative">
                    <button onClick={()=>addToast('Moderation queue opened','info')} className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-left px-4 text-[13px] font-medium flex items-center justify-between"><span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Review Reports</span><span className="bg-red-500 text-[11px] px-2 py-0.5 rounded-full">3 new</span></button>
                    <button onClick={()=>setActiveTab('users')} className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-left px-4 text-[13px] font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Manage Users</button>
                    <button onClick={()=>setActiveTab('analytics')} className="w-full h-11 rounded-xl bg-gradient-to-r from-[#ff5a9e] to-[#6d5bff] text-left px-4 text-[13px] font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4" /> View Analytics</button>
                  </div>
                </div>
                <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04]">
                  <h3 className="font-bold text-[14px] mb-4">Top Categories</h3>
                  {[
                    {cat: 'DCI Training', count: reelsData.filter(r=>r.category==='DCI Training').length, pct: 35},
                    {cat: 'Dance', count: reelsData.filter(r=>r.category==='Dance').length, pct: 25},
                    {cat: 'Comedy', count: reelsData.filter(r=>r.category==='Comedy').length, pct: 20},
                  ].map(row=>(
                    <div key={row.cat} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-[13px] mb-1"><span className="font-medium">{row.cat}</span><span className="text-black/50">{row.count} reels</span></div>
                      <div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#ff5a9e] to-[#6d5bff] rounded-full" style={{width: `${row.pct}%`}} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab==='users' && (
            <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04] overflow-hidden">
              {selectedUsers.length>0 && (
                <div className="px-6 py-3 bg-[#0f0f19] text-white flex items-center justify-between">
                  <span className="text-[13px] font-medium">{selectedUsers.length} selected</span>
                  <div className="flex gap-2">
                    <button onClick={()=>{setUsersData(prev=>prev.map(u=> selectedUsers.includes(u.id) ? {...u, status: 'banned' as UserStatus} : u)); setSelectedUsers([]); addToast(`Banned ${selectedUsers.length} users`,'error')}} className="h-8 px-3 rounded-lg bg-white/15 text-[12px] flex items-center gap-1"><Ban className="w-3 h-3" /> Ban all</button>
                    <button onClick={()=>{setConfirmModal({show:true,title:`Delete ${selectedUsers.length} users?`,desc:'Bulk delete cannot be undone.',onConfirm:()=>{setUsersData(prev=>prev.filter(u=>!selectedUsers.includes(u.id))); setSelectedUsers([]); addToast('Bulk delete done','error'); setConfirmModal(null)}})}} className="h-8 px-3 rounded-lg bg-red-500 text-[12px] flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                    <button onClick={()=>setSelectedUsers([])} className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f8f7fb] border-b border-black/[0.06] text-[11px] font-bold tracking-widest uppercase text-black/40">
                    <tr>
                      <th className="px-6 py-4 w-12"><input type="checkbox" checked={selectedUsers.length===paginatedUsers.length && paginatedUsers.length>0} onChange={e=> setSelectedUsers(e.target.checked ? paginatedUsers.map(u=>u.id) : [])} className="rounded" /></th>
                      <th className="px-4 py-4">User</th>
                      <th className="px-4 py-4 hidden md:table-cell">Email</th>
                      <th className="px-4 py-4">Reels</th>
                      <th className="px-4 py-4 hidden lg:table-cell">Followers</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4 hidden sm:table-cell">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {paginatedUsers.map(user=>(
                      <tr key={user.id} className="hover:bg-[#fbfafe] group">
                        <td className="px-6 py-4"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={e=> setSelectedUsers(prev=> e.target.checked ? [...prev, user.id] : prev.filter(id=>id!==user.id))} className="rounded" /></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff5a9e] to-[#6d5bff] text-white flex items-center justify-center font-bold text-[13px]">{user.avatar}</div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[14px] flex items-center gap-1.5 truncate">{user.name} {user.verified && <Verified className="w-4 h-4 text-[#6d5bff] fill-[#6d5bff]/20" />}</div>
                              <div className="text-[12px] text-black/50">@{user.username} • {user.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell text-[13px] text-black/60">{user.email}</td>
                        <td className="px-4 py-4"><span className="inline-flex h-7 px-2.5 rounded-full bg-[#f1eefc] text-[#6d5bff] text-[12px] font-bold items-center">{user.reels}</span></td>
                        <td className="px-4 py-4 hidden lg:table-cell text-[13px] font-medium">{user.followers.toLocaleString()}</td>
                        <td className="px-4 py-4"><span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full ${user.status==='active' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : user.status==='banned' ? 'bg-[#fce8e6] text-[#c5221f]' : user.status==='reported' ? 'bg-[#fef7e0] text-[#b7791f]' : 'bg-[#e8eaed] text-[#5f6368]'}`}>{user.status}</span></td>
                        <td className="px-4 py-4 hidden sm:table-cell text-[12px] text-black/50">{new Date(user.joined).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={()=>addToast(`Viewing ${user.username}`,'info')} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center"><Eye className="w-4 h-4 text-black/60" /></button>
                            <button onClick={()=>handleBanToggle(user.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.status==='banned' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'hover:bg-[#fce8e6] text-[#c5221f]/70 hover:text-[#c5221f]'}`}><Ban className="w-4 h-4" /></button>
                            <button onClick={()=>handleDeleteUser(user.id)} className="w-8 h-8 rounded-lg hover:bg-[#fce8e6] flex items-center justify-center text-[#c5221f]/70 hover:text-[#c5221f]"><Trash2 className="w-4 h-4" /></button>
                            <button onClick={()=>addToast('More actions','info')} className="w-8 h-8 rounded-lg hover:bg-black/5 hidden lg:flex items-center justify-center"><MoreVertical className="w-4 h-4 text-black/30" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-black/[0.06] flex items-center justify-between">
                <div className="text-[12px] text-black/50">Showing {paginatedUsers.length} of {filteredUsers.length} users</div>
                <div className="flex items-center gap-2">
                  <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} className="h-8 px-3 rounded-lg border border-black/10 text-[12px] disabled:opacity-40">Prev</button>
                  <span className="text-[12px] font-medium px-2">{currentPage} / {totalPagesUsers || 1}</span>
                  <button disabled={currentPage>=totalPagesUsers} onClick={()=>setCurrentPage(p=>p+1)} className="h-8 px-3 rounded-lg border border-black/10 text-[12px] disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
          )}

          {activeTab==='reels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={()=>setReelViewMode('table')} className={`h-9 px-4 rounded-xl text-[13px] font-medium border ${reelViewMode==='table' ? 'bg-[#0f0f19] text-white border-[#0f0f19]' : 'bg-white border-black/10'}`}>Table</button>
                  <button onClick={()=>setReelViewMode('grid')} className={`h-9 px-4 rounded-xl text-[13px] font-medium border ${reelViewMode==='grid' ? 'bg-[#0f0f19] text-white border-[#0f0f19]' : 'bg-white border-black/10'}`}>Grid</button>
                </div>
                {selectedReels.length>0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium">{selectedReels.length} selected</span>
                    <button onClick={()=>{setReelsData(prev=>prev.map(r=> selectedReels.includes(r.id) ? {...r, status: 'hidden' as ReelStatus} : r)); setSelectedReels([]); addToast('Hidden selected reels','info')}} className="h-8 px-3 rounded-lg bg-[#0f0f19] text-white text-[12px]">Hide</button>
                    <button onClick={()=>{setReelsData(prev=>prev.filter(r=>!selectedReels.includes(r.id))); setSelectedReels([]); addToast('Deleted','error')}} className="h-8 px-3 rounded-lg bg-red-500 text-white text-[12px]">Delete</button>
                  </div>
                )}
              </div>

              {reelViewMode==='table' ? (
                <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#f8f7fb] border-b border-black/[0.06] text-[11px] font-bold tracking-widest uppercase text-black/40">
                        <tr>
                          <th className="px-6 py-4 w-12"><input type="checkbox" checked={selectedReels.length===paginatedReels.length && paginatedReels.length>0} onChange={e=> setSelectedReels(e.target.checked ? paginatedReels.map(r=>r.id) : [])} className="rounded" /></th>
                          <th className="px-4 py-4">Reel</th>
                          <th className="px-4 py-4 hidden md:table-cell">User</th>
                          <th className="px-4 py-4">Views</th>
                          <th className="px-4 py-4 hidden sm:table-cell">Likes</th>
                          <th className="px-4 py-4 hidden lg:table-cell">Reports</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {paginatedReels.map(reel=>(
                          <tr key={reel.id} className="hover:bg-[#fbfafe]">
                            <td className="px-6 py-4"><input type="checkbox" checked={selectedReels.includes(reel.id)} onChange={e=> setSelectedReels(prev=> e.target.checked ? [...prev, reel.id] : prev.filter(id=>id!==reel.id))} className="rounded" /></td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-[64px] h-[36px] rounded-lg bg-gradient-to-br from-[#0f0f19] to-[#2a2a4a] relative overflow-hidden shrink-0 flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white/80" />
                                  <span className="absolute bottom-0.5 right-1 text-[9px] bg-black/70 text-white px-1 rounded">{reel.duration}</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-[13px] truncate max-w-[200px]">{reel.title}</div>
                                  <div className="text-[11px] text-black/50 flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${reel.type==='live' ? 'bg-red-500 animate-pulse' : reel.type==='story' ? 'bg-amber-400' : 'bg-[#6d5bff]'}`} />{reel.type} • {reel.category} • {new Date(reel.created).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell text-[13px]">@{reel.user}</td>
                            <td className="px-4 py-4 text-[13px] font-medium flex items-center gap-1 mt-3"><Eye className="w-3.5 h-3.5 text-black/30" />{reel.views.toLocaleString()}</td>
                            <td className="px-4 py-4 hidden sm:table-cell text-[13px]"><span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[#ff5a9e]" />{reel.likes.toLocaleString()}</span></td>
                            <td className="px-4 py-4 hidden lg:table-cell"><span className={`text-[11px] px-2 py-1 rounded-full font-bold ${reel.reports>5 ? 'bg-[#fce8e6] text-[#c5221f]' : reel.reports>0 ? 'bg-[#fef7e0] text-[#b7791f]' : 'bg-[#e6f4ea] text-[#1e8e3e]'}`}>{reel.reports}</span></td>
                            <td className="px-4 py-4"><span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${reel.status==='featured' ? 'bg-[#fff8e1] text-[#a67c00] border border-[#ffe082]' : reel.status==='reported' ? 'bg-[#fce8e6] text-[#c5221f]' : reel.status==='hidden' ? 'bg-[#e8eaed] text-[#5f6368]' : 'bg-[#e6f4ea] text-[#1e8e3e]'}`}>{reel.status}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-1">
                                <button onClick={()=>addToast(`Viewing ${reel.title}`,'info')} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center"><Eye className="w-4 h-4" /></button>
                                <button onClick={()=>{setReelsData(prev=>prev.map(r=> r.id===reel.id ? {...r, status: r.status==='featured' ? 'active' as ReelStatus : 'featured' as ReelStatus} : r)); addToast(reel.status==='featured' ? 'Unfeatured' : 'Featured ★','success')}} className={`w-8 h-8 rounded-lg flex items-center justify-center ${reel.status==='featured' ? 'bg-[#fff8e1] text-[#a67c00]' : 'hover:bg-[#fff8e1]'}`}><Star className="w-4 h-4" /></button>
                                <button onClick={()=>handleDeleteReel(reel.id)} className="w-8 h-8 rounded-lg hover:bg-[#fce8e6] text-[#c5221f]/70 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 border-t border-black/[0.06] flex items-center justify-between">
                    <div className="text-[12px] text-black/50">Showing {paginatedReels.length} of {filteredReels.length}</div>
                    <div className="flex gap-2"><button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} className="h-8 px-3 rounded-lg border text-[12px] disabled:opacity-40">Prev</button><span className="text-[12px] px-2 py-1 font-medium">{currentPage}/{totalPagesReels||1}</span><button disabled={currentPage>=totalPagesReels} onClick={()=>setCurrentPage(p=>p+1)} className="h-8 px-3 rounded-lg border text-[12px] disabled:opacity-40">Next</button></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginatedReels.map(reel=>(
                    <div key={reel.id} className="bg-white rounded-[16px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04] group hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] transition-all">
                      <div className="aspect-[9/12] bg-gradient-to-br from-[#1a1a2e] to-[#3a2a6e] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur">{reel.type}</span>
                          {reel.status==='featured' && <span className="text-[10px] px-2 py-1 rounded-full bg-[#ff5a9e] text-white">Featured</span>}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="text-white font-semibold text-[13px] leading-tight line-clamp-2">{reel.title}</div>
                          <div className="text-white/70 text-[11px] mt-1 flex items-center gap-2"><Eye className="w-3 h-3" />{reel.views.toLocaleString()} • <Heart className="w-3 h-3" />{reel.likes.toLocaleString()}</div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play className="w-5 h-5 text-white ml-0.5" /></div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="text-[12px] font-medium truncate">@{reel.user}</div>
                        <div className="flex gap-1">
                          <button onClick={()=>handleDeleteReel(reel.id)} className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab==='reports' && (
            <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04] overflow-hidden">
              <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Reports Queue <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full">{filteredReports.filter(r=>r.status==='pending').length}</span></h3>
                <div className="flex gap-2">
                  <button onClick={()=>addToast('All reports dismissed','success')} className="h-9 px-4 rounded-xl bg-black/[0.04] text-[12px] font-medium">Dismiss All</button>
                </div>
              </div>
              <div className="divide-y divide-black/[0.04]">
                {filteredReports.map(report=>(
                  <div key={report.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-[#fbfafe]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${report.status==='pending' ? 'bg-[#fef7e0] text-[#b7791f]' : report.status==='resolved' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#e8eaed] text-[#5f6368]'}`}>{report.status}</span>
                        <span className="text-[11px] px-2 py-1 rounded-full bg-[#f1eefc] text-[#6d5bff]">{report.type}</span>
                        <span className="text-[12px] text-black/40">{new Date(report.date).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 font-semibold text-[14px]">{report.contentTitle}</div>
                      <div className="mt-1 text-[13px] text-black/60"><span className="font-medium text-[#c5221f]">Reason:</span> {report.reason} • Reported by <span className="font-medium">@{report.reporter}</span> • Against <span className="font-medium">@{report.reportedUser}</span></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={()=>addToast(`Dismissed report ${report.id}`,'success')} className="h-9 px-4 rounded-xl bg-white border border-black/10 text-[12px] font-medium hover:bg-black/[0.02]">Dismiss</button>
                      <button onClick={()=>{addToast(`Banned ${report.reportedUser}`,'error')}} className="h-9 px-4 rounded-xl bg-[#fce8e6] text-[#c5221f] text-[12px] font-bold hover:bg-[#f8d7da]">Ban User</button>
                      <button onClick={()=>addToast(`Deleted content ${report.contentId}`,'error')} className="h-9 px-4 rounded-xl bg-[#0f0f19] text-white text-[12px] font-bold">Delete Content</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab==='analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04]">
                <h3 className="font-bold mb-6">User Growth (Last 7 Days)</h3>
                <div className="h-[220px] flex items-end gap-2">
                  {[20,45,30,60,55,80,70].map((h,i)=>(
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gradient-to-t from-[#6d5bff] to-[#ff5a9e] rounded-t-xl transition-all hover:opacity-80" style={{height: `${h*2}px`}} />
                      <span className="text-[11px] text-black/40 font-medium">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-[12px]">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#ff5a9e] to-[#6d5bff]" /> New users</span>
                  <span className="text-black/50">+12% vs last week</span>
                </div>
              </div>
              <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04]">
                <h3 className="font-bold mb-6">Reels Uploads & Engagement</h3>
                <div className="space-y-4">
                  {[
                    {label: 'Avg. Views per Reel', value: '24.5k', change: '+8%' },
                    {label: 'Avg. Likes per Reel', value: '3.2k', change: '+12%' },
                    {label: 'Report Rate', value: '0.8%', change: '-2%', down: true },
                    {label: 'DCI Training CTR', value: '42%', change: '+18%' },
                  ].map(row=>(
                    <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-[#f8f7fb]">
                      <span className="text-[13px] font-medium">{row.label}</span>
                      <div className="flex items-center gap-3"><span className="font-bold">{row.value}</span><span className={`text-[11px] px-2 py-1 rounded-full font-bold ${row.down ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#e6f4ea] text-[#1e8e3e]'}`}>{row.change}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 bg-[#0f0f19] rounded-[20px] p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff5a9e]/20 via-transparent to-[#6d5bff]/20" />
                <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[18px]">Tamil Community Insights</h3>
                    <p className="text-white/60 text-[13px] mt-1 max-w-[500px]">DCI Training reels drive 3.2x more saves. Peak posting: 7-9 PM IST. Comedy + Education combo has highest retention.</p>
                  </div>
                  <button onClick={()=>addToast('Full analytics exported','success')} className="h-10 px-5 rounded-xl bg-white text-black text-[13px] font-bold shrink-0">Download Full Report</button>
                </div>
              </div>
            </div>
          )}

          {activeTab==='settings' && (
            <div className="max-w-[720px] space-y-6">
              <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04]">
                <h3 className="font-bold mb-4">Moderation Settings</h3>
                <div className="space-y-4">
                  {[
                    {label: 'Auto-hide reels with >10 reports', checked: true},
                    {label: 'Require manual approval for DCI Training', checked: false},
                    {label: 'Email alerts for pending reports', checked: true},
                  ].map((item,i)=>(
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#f8f7fb] border border-black/[0.04]">
                      <span className="text-[14px] font-medium">{item.label}</span>
                      <button onClick={()=>addToast('Setting toggled','success')} className={`w-12 h-7 rounded-full p-1 transition-all ${item.checked ? 'bg-[#6d5bff]' : 'bg-black/20'}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${item.checked ? 'translate-x-5' : ''}`} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.04]">
                <h3 className="font-bold mb-2">Supabase Integration</h3>
                <p className="text-[12px] text-black/50 mb-4 font-mono bg-[#f8f7fb] p-3 rounded-xl border">npm i @supabase/supabase-js<br/>const supabase = createClient(URL, ANON_KEY)<br/>// supabase.from('profiles').select('*').eq('status','active')<br/>// supabase.from('reels').select('*, profiles!inner(username)').order('created_at', desc)<br/>// supabase.from('reports').select('*').eq('status','pending')</p>
                <button onClick={()=>addToast('Supabase client example copied','info')} className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#ff5a9e] to-[#6d5bff] text-white text-[13px] font-bold">Copy Client Template</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-8 py-6 text-[11px] text-black/30 text-center border-t border-black/[0.04] mt-8">Reels RA Admin • PlayCircle Advanced Filters Style • Built with Tailwind • Supabase Ready • Mock data: {usersData.length} users, {reelsData.length} reels</div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-[360px] w-[calc(100%-32px)]">
        {toasts.map(t=>(
          <div key={t.id} className={`px-4 py-3 rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] text-[13px] font-medium flex items-start gap-3 border backdrop-blur-xl animate-[slideIn_0.25s] ${t.type==='success' ? 'bg-[#0f0f19] text-white border-white/10' : t.type==='error' ? 'bg-[#2a0f14] text-white border-red-500/20' : 'bg-white text-black border-black/10'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${t.type==='success' ? 'bg-white/15' : t.type==='error' ? 'bg-red-500/20' : 'bg-black/5'}`}>{t.type==='success' ? <Check className="w-4 h-4" /> : t.type==='error' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</div>
            <span className="flex-1 leading-snug">{t.msg}</span>
            <button onClick={()=>setToasts(prev=>prev.filter(x=>x.id!==t.id))} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmModal?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f0f19]/60 backdrop-blur-sm" onClick={()=>setConfirmModal(null)} />
          <div className="relative bg-white rounded-[20px] p-6 w-full max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[scaleIn_0.2s]">
            <div className="w-12 h-12 rounded-full bg-[#fce8e6] flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-[#c5221f]" /></div>
            <h3 className="font-bold text-[18px]">{confirmModal.title}</h3>
            <p className="text-[13px] text-black/60 mt-2 leading-relaxed">{confirmModal.desc}</p>
            <div className="mt-6 flex gap-3">
              <button onClick={()=>setConfirmModal(null)} className="flex-1 h-11 rounded-xl bg-black/[0.06] text-[14px] font-semibold">Cancel</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 h-11 rounded-xl bg-[#c5221f] text-white text-[14px] font-bold">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{font-family: Inter, system-ui, sans-serif}
        @keyframes slideIn { from { transform: translateX(20px); opacity:0 } to { transform: translateX(0); opacity:1 } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity:0 } to { transform: scale(1); opacity:1 } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(-6px)} to { opacity:1; transform: translateY(0)} }
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{ -ms-overflow-style:none; scrollbar-width:none }
      `}</style>
    </div>
  );
}
