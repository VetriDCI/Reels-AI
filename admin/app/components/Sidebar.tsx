'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Video, Flag, Wallet, Settings, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/posts', label: 'Posts / Reels', icon: Video },
  { href: '/reports', label: 'Reports', icon: Flag },
  { href: '/payouts', label: 'Payouts', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('admin_token');
      window.location.href = '/';
    }
  }

  return (
    <div className="w-56 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="font-bold text-lg">RA Social Admin</span>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition border-l-4 ${
                active
                  ? 'bg-gray-800 text-white border-cyan-400'
                  : 'text-gray-400 border-transparent hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </a>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
