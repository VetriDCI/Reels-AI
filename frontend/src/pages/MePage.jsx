import React, { useState, useEffect } from 'react';
import {
  User, Calendar, Briefcase, Wallet, Folder, Shield, Eye, Bell,
  Palette, HelpCircle, LogOut, ChevronRight, ChevronLeft, Film, Users2, DollarSign
} from 'lucide-react';
import api from '../services/api';

import ProfileOverviewPage from './settings/ProfileOverviewPage';
import AnalyticsHubPage from './settings/AnalyticsHubPage';
import TotalViewsPage from './settings/TotalViewsPage';
import FollowersAnalyticsPage from './settings/FollowersAnalyticsPage';
import AdRevenuePage from './settings/AdRevenuePage';
import PostSchedulerPage from './settings/PostSchedulerPage';
import BrandCollabPage from './settings/BrandCollabPage';
import BillingEarningsPage from './settings/BillingEarningsPage';
import ContentArchivePage from './settings/ContentArchivePage';
import AccountSecurityPage from './settings/AccountSecurityPage';
import PrivacyVisibilityPage from './settings/PrivacyVisibilityPage';
import NotificationsSettingsPage from './settings/NotificationsSettingsPage';
import InterfaceAccessibilityPage from './settings/InterfaceAccessibilityPage';
import HelpSupportPage from './settings/HelpSupportPage';

const menuItems = [
  { key: 'profileOverview', label: 'Profile Overview', icon: User, color: 'from-pink-500 to-purple-500' },
  { key: 'scheduler', label: 'Post Scheduler & Queue', icon: Calendar, color: 'from-purple-500 to-blue-500' },
  { key: 'brandCollab', label: 'Brand Collaborations', icon: Briefcase, color: 'from-pink-500 to-orange-400' },
  { key: 'billing', label: 'Billing, Ads & Earnings', icon: Wallet, color: 'from-blue-500 to-cyan-400' },
  { key: 'archive', label: 'Content Archive', icon: Folder, color: 'from-indigo-500 to-blue-400' },
  { key: 'security', label: 'Account & Security', icon: Shield, color: 'from-purple-500 to-pink-500' },
  { key: 'privacy', label: 'Privacy & Visibility', icon: Eye, color: 'from-pink-500 to-purple-400' },
  { key: 'notifications', label: 'Notifications', icon: Bell, color: 'from-orange-400 to-pink-500' },
  { key: 'interface', label: 'Interface & Accessibility', icon: Palette, color: 'from-blue-400 to-purple-500' },
  { key: 'help', label: 'Help & Support', icon: HelpCircle, color: 'from-purple-400 to-pink-400' },
];

export default function MePage({ onLogout, onBack }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('main');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const back = () => setView('main');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  if (view === 'profileOverview') return <ProfileOverviewPage user={user} onBack={back} onUpdated={loadUser} />;
  if (view === 'analytics') return (
    <AnalyticsHubPage
      user={user}
      onBack={back}
      onOpenViews={() => setView('totalViews')}
      onOpenFollowers={() => setView('followers')}
      onOpenRevenue={() => setView('adRevenue')}
    />
  );
  if (view === 'totalViews') return <TotalViewsPage user={user} onBack={() => setView('analytics')} />;
  if (view === 'followers') return <FollowersAnalyticsPage user={user} onBack={() => setView('analytics')} />;
  if (view === 'adRevenue') return <AdRevenuePage user={user} onBack={() => setView('analytics')} />;
  if (view === 'scheduler') return <PostSchedulerPage onBack={back} />;
  if (view === 'brandCollab') return <BrandCollabPage user={user} onBack={back} />;
  if (view === 'billing') return <BillingEarningsPage user={user} onBack={back} />;
  if (view === 'archive') return <ContentArchivePage user={user} onBack={back} />;
  if (view === 'security') return <AccountSecurityPage onBack={back} />;
  if (view === 'privacy') return <PrivacyVisibilityPage onBack={back} />;
  if (view === 'notifications') return <NotificationsSettingsPage onBack={back} />;
  if (view === 'interface') return <InterfaceAccessibilityPage onBack={back} />;
  if (view === 'help') return <HelpSupportPage onBack={back} />;

  const postsCount = user?.postsCount ?? user?.posts?.length ?? 0;
  const followersCount = user?.followersCount ?? user?.followers?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 pb-24">
      <div className="relative bg-gradient-to-r from-pink-500 to-blue-500 px-4 pt-6 pb-8 text-white">
        <h1 className="text-lg font-bold text-center mb-4">RA Social Studio</h1>
        {onBack && (
          <button onClick={onBack} className="absolute top-6 left-4 text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-2xl font-bold mb-2 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (user?.fullName?.[0] || user?.username?.[0] || 'U').toUpperCase()
            )}
          </div>
          <p className="font-bold text-lg">{user?.fullName || user?.username}</p>
          <p className="text-sm opacity-80">@{user?.username} · Creator</p>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <p className="text-xs text-gray-400 uppercase font-semibold mb-2 mt-4">Channel Performance & Stats</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-pink-500 text-xs font-semibold mb-1">
              <Film className="w-4 h-4" /> TOTAL CONTENT
            </div>
            <p className="text-2xl font-bold text-gray-800">{postsCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-purple-500 text-xs font-semibold mb-1">
              <Users2 className="w-4 h-4" /> FOLLOWERS
            </div>
            <p className="text-2xl font-bold text-gray-800">{followersCount}</p>
          </div>
          <button onClick={() => setView('analytics')} className="col-span-2 bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-500 text-sm font-semibold">
              <DollarSign className="w-4 h-4" /> View Full Analytics
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Dashboard Management & Settings</p>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 mb-4">
          {menuItems.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => setView(key)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="flex-1 font-medium text-gray-700 text-sm">{label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm text-red-500 font-medium"
        >
          <LogOut className="w-5 h-5" /> Logout Account
        </button>
      </div>
    </div>
  );
}
