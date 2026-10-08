'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Home, ShieldCheck, BarChart3, MessageSquareText, Plus } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  match: (pathname: string) => boolean;
}

export default function GlobalNavbar() {
  const pathname = usePathname();

  // 메뉴 리스트: 향후 새로운 업무 도구가 생기면 여기에 객체 한 줄만 추가하면 됨
  const navItems: NavItem[] = [
    {
      name: '홈',
      href: '/',
      icon: Home,
      match: (p: string) => p === '/',
    },
    {
      name: '경비 정산',
      href: '/expense',
      icon: ShieldCheck,
      match: (p: string) => p.startsWith('/expense'),
    },
    {
      name: '지점 매출',
      href: '/sales',
      icon: BarChart3,
      match: (p: string) => p.startsWith('/sales') || p.startsWith('/submit') || p.startsWith('/admin'),
    },
    {
      name: '리뷰 분석',
      href: '/reviews',
      icon: MessageSquareText,
      match: (p: string) => p.startsWith('/reviews'),
    },
  ];

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* 로고 & 서비스 타이틀 */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg p-1"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                  내 업무 도구함
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline -mt-0.5">
                  통합 스마트 워크스페이스
                </span>
              </div>
            </Link>
          </div>

          {/* 중앙/우측 네비게이션 메뉴 (모든 페이지 상시 노출) */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded-full border border-blue-400/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
