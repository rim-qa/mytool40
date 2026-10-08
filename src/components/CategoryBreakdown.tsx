import React from 'react';
import { Tag, BarChart3 } from 'lucide-react';
import { AnalyzedReview } from '@/lib/types';

interface CategoryBreakdownProps {
  reviews: AnalyzedReview[];
}

const STANDARD_CATEGORIES = [
  '배터리',
  '흡입력',
  '소음',
  '무게·사용감',
  '디자인',
  '관리·청소',
  '구성품',
  '품질·불량',
  '배송',
  '포장',
  '고객센터',
  '가격',
  '설명서',
  '기타'
];

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ reviews }) => {
  // Aggregate category frequencies (especially for negative / complaints or all reviews)
  // Let's count both total mentions and negative mentions
  const stats: Record<string, { total: number; negative: number }> = {};
  STANDARD_CATEGORIES.forEach(cat => {
    stats[cat] = { total: 0, negative: 0 };
  });

  reviews.forEach(r => {
    if (!r.categories) return;
    const isNegative = r.sentiment === '부정';
    // Split categories by comma
    const tokens = r.categories.split(',').map(s => s.trim());
    tokens.forEach(tok => {
      // Find matching standard category or match loose
      const matched = STANDARD_CATEGORIES.find(c => c === tok || c.includes(tok) || tok.includes(c));
      const targetCat = matched || '기타';
      if (stats[targetCat]) {
        stats[targetCat].total += 1;
        if (isNegative) {
          stats[targetCat].negative += 1;
        }
      }
    });
  });

  // Sort categories by negative count descending, then total count descending
  const sortedCategories = [...STANDARD_CATEGORIES].sort((a, b) => {
    if (stats[b].negative !== stats[a].negative) {
      return stats[b].negative - stats[a].negative;
    }
    return stats[b].total - stats[a].total;
  });

  const maxCount = Math.max(...sortedCategories.map(c => stats[c].total), 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            유형별 언급 및 불만 집계 표
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            14개 표준 유형별 전체 언급 건수 및 부정(불만) 건수 집계
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">유형</th>
              <th className="py-2.5 px-3 text-right">불만(부정) 건수</th>
              <th className="py-2.5 px-3 text-right">전체 언급 건수</th>
              <th className="py-2.5 px-3 w-1/3">불만 비중 분포</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedCategories.map((cat, idx) => {
              const item = stats[cat];
              const barWidth = Math.min(100, Math.round((item.total / maxCount) * 100));
              const isTopComplaint = item.negative > 0 && idx < 3;

              return (
                <tr key={cat} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cat}</span>
                    {isTopComplaint && (
                      <span className="px-1.5 py-0.2 text-[10px] bg-rose-100 text-rose-700 rounded font-semibold">
                        주요불만
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={item.negative > 0 ? 'font-bold text-rose-600' : 'text-slate-400'}>
                      {item.negative}건
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {item.total}건
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      {/* Negative portion in red, other mentions in slate */}
                      <div
                        style={{
                          width: `${item.total > 0 ? (item.negative / item.total) * barWidth : 0}%`,
                        }}
                        className="bg-rose-500 h-full"
                      />
                      <div
                        style={{
                          width: `${item.total > 0 ? ((item.total - item.negative) / item.total) * barWidth : 0}%`,
                        }}
                        className="bg-indigo-300 h-full"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
