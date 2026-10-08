import React from 'react';
import { Sparkles, Database, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                하루살림 마케팅팀
              </span>
              <span className="text-xs text-slate-500">생활가전 클린핏 미니</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              「클린핏 미니」 리뷰 자동 분석기
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              단일 요청(Single Prompt) AI 분석 · 한국소비자원 위해정보 연계 · Supabase 누적 리포트
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase 연동</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>소비자원 위해정보 24h 캐시</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gemini 503 폴백 지원</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
