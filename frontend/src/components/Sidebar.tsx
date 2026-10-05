'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  Wrench,
  BarChart3,
  Globe,
  Clock,
  Bell,
  FileCheck2,
  ShieldAlert,
  Home,
  Layers,
  Building2,
  Utensils,
  User,
  HelpCircle,
  Repeat,
  LogIn
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role;

  let navItems: Array<{ label?: string; href?: string; icon?: any; section?: string; danger?: boolean }> = [];

  if (!role) {
    // Public User (not logged in)
    navItems = [
      { label: 'Login', href: '/', icon: LogIn },
      { label: 'Public Track', href: '/track', icon: Globe },
      { label: 'Help & FAQs', href: '/help', icon: HelpCircle },
    ];
  } else if (role === 'student') {
    navItems = [
      { label: 'Student Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'New Complaint', href: '/new', icon: PlusCircle },
      { label: 'Mess Feedback', href: '/mess', icon: Utensils },
      { label: 'My Profile', href: '/profile', icon: User },
      { section: 'SHARED RESOURCES' },
      { label: 'Notices', href: '/notices', icon: Bell },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Tracker', href: '/tracker', icon: Globe },
      { label: 'Emergency', href: '/emergency', icon: ShieldAlert, danger: true },
    ];
  } else if (role === 'office') {
    navItems = [
      { label: 'Office Dashboard', href: '/office', icon: Wrench },
      { section: 'SHARED RESOURCES' },
      { label: 'Notices', href: '/notices', icon: Bell },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Tracker', href: '/tracker', icon: Globe },
      { label: 'Emergency', href: '/emergency', icon: ShieldAlert, danger: true },
    ];
  } else if (role === 'warden') {
    navItems = [
      { label: 'Warden Dashboard', href: '/warden', icon: ShieldCheck },
      { label: 'Students', href: '/warden/students', icon: User },
      { label: 'Duplicate Groups', href: '/groups', icon: Layers },
      { label: 'SLA Tracking', href: '/sla', icon: Clock },
      { label: 'Repeat Complaints', href: '/repeats', icon: Repeat },
      { section: 'SHARED RESOURCES' },
      { label: 'Notices', href: '/notices', icon: Bell },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Tracker', href: '/tracker', icon: Globe },
      { label: 'Emergency', href: '/emergency', icon: ShieldAlert, danger: true },
    ];
  } else if (role === 'admin') {
    navItems = [
      { label: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
      { label: 'Audit Log', href: '/audit', icon: FileCheck2 },
      { label: 'Workload Matrix', href: '/workload', icon: Building2 },
      { section: 'SHARED RESOURCES' },
      { label: 'Notices', href: '/notices', icon: Bell },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Tracker', href: '/tracker', icon: Globe },
      { label: 'Emergency', href: '/emergency', icon: ShieldAlert, danger: true },
    ];
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="nav-section-title">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = pathname === item.href;

          return (
            <Link
              key={idx}
              href={item.href!}
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={item.danger ? { color: '#dc2626' } : undefined}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem',
          fontSize: '0.725rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>Current Role: <strong style={{ textTransform: 'uppercase' }}>{role || 'Public'}</strong></div>
      </div>
    </aside>
  );
};
