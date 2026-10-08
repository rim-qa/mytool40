import React, { useState } from 'react';
import { Search, Flame, Megaphone, Star, ArrowUpDown } from 'lucide-react';
import { AnalyzedReview } from '@/lib/types';

interface ReviewTableProps {
  reviews: AnalyzedReview[];
}

export const ReviewTable: React.FC<ReviewTableProps> = ({ reviews }) => {
  const [filterSentiment, setFilterSentiment] = useState<string>('ALL');
  const [filterSafetyOnly, setFilterSafetyOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const filtered = reviews.filter((r) => {
    if (filterSafetyOnly && !r.is_safety_issue) return false;
    if (filterSentiment !== 'ALL' && r.sentiment !== filterSentiment) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const textMatch = r.review_text?.toLowerCase().includes(term);
      const catMatch = r.categories?.toLowerCase().includes(term);
      const reqMatch = r.improvement_request?.toLowerCase().includes(term);
      if (!textMatch && !catMatch && !reqMatch) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentReviews = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case '긍정':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">긍정</span>;
      case '부정':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">부정</span>;
      case '광고':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
            <Megaphone className="w-3 h-3" /> 광고
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">중립</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            리뷰별 상세 분석 내역
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            총 {reviews.length}건 중 {filtered.length}건 표시
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="리뷰 내용/유형 검색"
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
            />
          </div>

          {/* Sentiment Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            {['ALL', '긍정', '부정', '중립', '광고'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setFilterSentiment(s);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  filterSentiment === s
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? '전체' : s}
              </button>
            ))}
          </div>

          {/* Safety only toggle */}
          <button
            onClick={() => {
              setFilterSafetyOnly(!filterSafetyOnly);
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1 border transition-all ${
              filterSafetyOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>안전 이슈만</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 w-24">작성일</th>
              <th className="py-2.5 px-3 w-16 text-center">별점</th>
              <th className="py-2.5 px-3 w-20 text-center">감성</th>
              <th className="py-2.5 px-3 w-28">유형</th>
              <th className="py-2.5 px-3">리뷰 원문</th>
              <th className="py-2.5 px-3 w-40">개선 요청</th>
              <th className="py-2.5 px-3 w-16 text-center">안전</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentReviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  조건에 해당하는 리뷰가 없습니다.
                </td>
              </tr>
            ) : (
              currentReviews.map((r) => (
                <tr
                  key={r.review_no}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    r.is_safety_issue ? 'bg-rose-50/30' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                    {r.review_no}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {r.written_on || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="font-semibold text-amber-600 flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {getSentimentBadge(r.sentiment)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                      {r.categories || '기타'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 min-w-[200px]">
                    <p className="line-clamp-2">{r.review_text}</p>
                  </td>
                  <td className="py-2.5 px-3 text-indigo-700 font-medium">
                    {r.improvement_request ? (
                      <span className="line-clamp-2">{r.improvement_request}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {r.is_safety_issue ? (
                      <span className="inline-flex items-center justify-center p-1 bg-rose-100 text-rose-600 rounded-full" title="안전 이슈 감지">
                        <Flame className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            총 {totalPages} 페이지 중 {currentPage} 페이지
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 disabled:opacity-40"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded text-xs font-medium ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
