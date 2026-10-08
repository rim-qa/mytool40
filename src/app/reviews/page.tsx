'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { AnalysisSummary } from '@/components/AnalysisSummary';
import { SentimentDistribution } from '@/components/SentimentDistribution';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { SafetyWidget } from '@/components/SafetyWidget';
import { ImprovementNotes } from '@/components/ImprovementNotes';
import { ReviewTable } from '@/components/ReviewTable';
import { HistoryList } from '@/components/HistoryList';
import { ReviewInput, AnalyzedReview } from '@/lib/types';
import { Sparkles, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [analyzedReviews, setAnalyzedReviews] = useState<AnalyzedReview[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [savedToDb, setSavedToDb] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [historyTrigger, setHistoryTrigger] = useState<number>(0);

  const handleAnalyze = async (reviews: ReviewInput[], fileName: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리뷰 분석 요청에 실패했습니다.');
      }

      const result = await response.json();
      setAnalyzedReviews(result.analyzedReviews || []);
      setModelUsed(result.modelUsed || 'gemini-3.8-flash');
      setSavedToDb(result.savedToDatabase ?? false);

      // Trigger history list refresh
      setHistoryTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Product Quick Context Card */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 mb-2">
                분석 대상 제품
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                무선 핸디 청소기 「클린핏 미니」
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                무게 0.9kg · 먼지통 0.2L · 충전 4~5시간(전용 어댑터) · 표준 25분 / 강모드 약 8분 · 소음 78dB
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div>
                <span className="block text-slate-400 text-[11px]">출시일</span>
                <span className="font-semibold text-white">2026-08-15</span>
              </div>
              <div className="w-px h-7 bg-white/20" />
              <div>
                <span className="block text-slate-400 text-[11px]">판매가</span>
                <span className="font-semibold text-emerald-300">79,000원</span>
              </div>
              <div className="w-px h-7 bg-white/20" />
              <div>
                <span className="block text-slate-400 text-[11px]">설명서</span>
                <span className="font-semibold text-white">영문/중문 (QR한글)</span>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <FileUpload onAnalyze={handleAnalyze} isLoading={isLoading} />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">분석 데이터 처리 오류</p>
              <p className="text-xs sm:text-sm mt-0.5">{errorMessage}</p>
              <p className="text-xs text-rose-600 mt-1">
                ※ 정적 문구 안내: 「불러오지 못했습니다」
              </p>
            </div>
          </div>
        )}

        {/* Analysis Dashboard (Rendered when analysis results exist) */}
        {analyzedReviews.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Summary Card */}
            <AnalysisSummary
              modelUsed={modelUsed}
              analyzedReviews={analyzedReviews}
              savedToDatabase={savedToDb}
            />

            {/* 2. Sentiment & Safety row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SentimentDistribution reviews={analyzedReviews} />
              <SafetyWidget reviews={analyzedReviews} />
            </div>

            {/* 3. Category Breakdown */}
            <CategoryBreakdown reviews={analyzedReviews} />

            {/* 4. Action Notes (User direct input) */}
            <ImprovementNotes />

            {/* 5. Detailed Review Table */}
            <ReviewTable reviews={analyzedReviews} />
          </div>
        )}

        {/* Past History Section (Always visible at the bottom) */}
        <HistoryList refreshTrigger={historyTrigger} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 하루살림 마케팅팀 · 「클린핏 미니」 리뷰 자동 분석 시스템</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Powered by Google Gemini Single Prompt & Supabase Database
        </p>
      </footer>
    </div>
  );
}
