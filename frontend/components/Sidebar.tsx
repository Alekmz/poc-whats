'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, MessageSquare, Eye, FileText, LogOut, Smartphone, Bot } from 'lucide-react';
import { auth } from '@/lib/auth';

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { href: '/supervisor', label: 'Supervisor', icon: Eye, roles: ['ADMIN', 'SUPERVISOR'] },
    { href: '/whatsapp-numbers', label: 'Números WhatsApp', icon: Smartphone, roles: ['ADMIN', 'SUPERVISOR'] },
    { href: '/bot-flows', label: 'Fluxos de Bot (URA)', icon: Bot, roles: ['ADMIN', 'SUPERVISOR'] },
    { href: '/logs', label: 'Logs', icon: FileText, roles: ['ADMIN', 'SUPERVISOR'] },
    { href: '/users', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary-400">WhatsApp Platform</h1>
      </div>
      <nav className="mt-8">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 ${
                isActive ? 'bg-gray-700 border-r-4 border-primary-500' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-64">
        <button
          onClick={() => auth.logout()}
          className="w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </div>
  );
}

