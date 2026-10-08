import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Calendar, Layers } from 'lucide-react';
import { AnalyzedReview } from '@/lib/types';

interface AnalysisSummaryProps {
  modelUsed: string;
  analyzedReviews: AnalyzedReview[];
  savedToDatabase: boolean;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  modelUsed,
  analyzedReviews,
  savedToDatabase,
}) => {
  const isFallback = modelUsed === 'gemini-3.5-flash-lite';
  const totalCount = analyzedReviews.length;
  const analyzedDate = analyzedReviews[0]?.analyzed_on || new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            분석 완료 리포트
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            클린핏 미니 리뷰 분석 요약
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Response Model Badge (Mandatory by PRD) */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              isFallback
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>응답 모델: <strong>{modelUsed}</strong></span>
            {isFallback && (
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-normal">
                503 폴백 적용
              </span>
            )}
          </div>

          {/* Database Save Status */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              savedToDatabase
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {savedToDatabase ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Supabase 저장 완료</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>DB 저장 대기/확인</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-xs sm:text-sm">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-500 flex items-center gap-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> 총 분석 건수
          </span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{totalCount}건</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-500 flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> 분석 실행일
          </span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{analyzedDate}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
          <span className="text-slate-500 flex items-center gap-1 text-xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" /> 전송 방식
          </span>
          <p className="text-sm font-bold text-indigo-700 mt-1.5 truncate">
            단일 요청 (Single Prompt)
          </p>
        </div>
      </div>
    </div>
  );
};
