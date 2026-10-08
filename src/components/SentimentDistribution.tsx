import React from 'react';
import { Smile, Frown, Meh, Megaphone, Info } from 'lucide-react';
import { AnalyzedReview } from '@/lib/types';

interface SentimentDistributionProps {
  reviews: AnalyzedReview[];
}

export const SentimentDistribution: React.FC<SentimentDistributionProps> = ({ reviews }) => {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let adCount = 0;

  for (const r of reviews) {
    if (r.sentiment === '광고') {
      adCount++;
    } else if (r.sentiment === '긍정') {
      positiveCount++;
    } else if (r.sentiment === '부정') {
      negativeCount++;
    } else {
      neutralCount++;
    }
  }

  const validTotal = positiveCount + negativeCount + neutralCount;
  const posPct = validTotal > 0 ? Math.round((positiveCount / validTotal) * 1000) / 10 : 0;
  const negPct = validTotal > 0 ? Math.round((negativeCount / validTotal) * 1000) / 10 : 0;
  const neuPct = validTotal > 0 ? Math.round((neutralCount / validTotal) * 1000) / 10 : 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>감성 분포</span>
            <span className="text-xs font-normal text-slate-500">(광고 제외 유효 {validTotal}건)</span>
          </h3>
          {adCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs rounded-full border border-amber-200">
              <Megaphone className="w-3 h-3 text-amber-600" />
              <span>체험단/광고 {adCount}건 제외됨</span>
            </div>
          )}
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex mb-4">
          <div
            style={{ width: `${posPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`긍정: ${positiveCount}건 (${posPct}%)`}
          />
          <div
            style={{ width: `${negPct}%` }}
            className="bg-rose-500 h-full transition-all duration-500"
            title={`부정: ${negativeCount}건 (${negPct}%)`}
          />
          <div
            style={{ width: `${neuPct}%` }}
            className="bg-slate-400 h-full transition-all duration-500"
            title={`중립: ${neutralCount}건 (${neuPct}%)`}
          />
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
              <Smile className="w-4 h-4" />
              <span>긍정</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-900">{posPct}%</span>
              <span className="text-xs text-emerald-600">({positiveCount}건)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-1.5 text-rose-700 text-xs font-medium">
              <Frown className="w-4 h-4" />
              <span>부정</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-rose-900">{negPct}%</span>
              <span className="text-xs text-rose-600">({negativeCount}건)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
              <Meh className="w-4 h-4" />
              <span>중립</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900">{neuPct}%</span>
              <span className="text-xs text-slate-600">({neutralCount}건)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
        <span>
          기준표 원칙: 단순 별점이 아닌 문맥·반어법을 반영하였으며, 체험단/무상제공 리뷰는 통계 왜곡 방지를 위해 집계에서 제외되었습니다.
        </span>
      </div>
    </div>
  );
};
