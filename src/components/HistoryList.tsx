import React, { useEffect, useState } from 'react';
import { History, Calendar, RefreshCw } from 'lucide-react';
import { HistoryGroup } from '@/lib/types';

interface HistoryListProps {
  refreshTrigger?: number;
}

export const HistoryList: React.FC<HistoryListProps> = ({ refreshTrigger }) => {
  const [history, setHistory] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch('/api/history');
        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }
        const json = await res.json();
        if (json.success && isMounted) {
          setHistory(json.history || []);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('History load error:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            과거 분석 이력 (Supabase 연동)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            분석일자 단위로 그룹화된 누적 데이터 (수정 및 삭제 미제공)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>과거 이력 데이터를 불러오는 중...</span>
        </div>
      ) : error ? (
        /* PRD 지침: 오류 시 정적 문구 「불러오지 못했습니다」 출력 */
        <div className="py-8 text-center text-xs font-medium text-slate-400">
          불러오지 못했습니다
        </div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          아직 저장된 과거 분석 이력이 없습니다. 리뷰 파일을 업로드하여 첫 분석을 시작해 보세요.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">분석일자</th>
                <th className="py-2.5 px-4 text-center">총 건수</th>
                <th className="py-2.5 px-4 text-center">부정 비율</th>
                <th className="py-2.5 px-4 text-right">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((group) => (
                <tr key={group.analyzed_on} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{group.analyzed_on}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                    {group.total_count}건
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        group.negative_ratio > 40
                          ? 'bg-rose-100 text-rose-700'
                          : group.negative_ratio > 20
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {group.negative_ratio}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-slate-400 font-medium">
                    저장 완료
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
