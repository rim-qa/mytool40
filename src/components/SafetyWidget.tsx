import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Flame, ExternalLink, RefreshCw } from 'lucide-react';
import { AnalyzedReview, ConsumerSafetyData } from '@/lib/types';

interface SafetyWidgetProps {
  reviews: AnalyzedReview[];
}

export const SafetyWidget: React.FC<SafetyWidgetProps> = ({ reviews }) => {
  const [safetyData, setSafetyData] = useState<ConsumerSafetyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Review safety issues
  const safetyReviews = reviews.filter(r => r.is_safety_issue);

  useEffect(() => {
    let isMounted = true;

    async function loadConsumerSafety() {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch('/api/consumer-safety');
        if (!res.ok) {
          throw new Error('API fetch failed');
        }
        const json = await res.json();
        if (json.success && isMounted) {
          setSafetyData(json);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load consumer safety data:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadConsumerSafety();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                안전 이슈 & 소비자원 청소기 사고 통계
              </h3>
              <p className="text-xs text-slate-500">
                제품 발열·위해 리뷰 탐지 및 공공데이터포털 위해 정보 연계
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            24시간 캐시
          </span>
        </div>

        {/* 1. 리뷰에서 감지된 안전 이슈 */}
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-600" />
              리뷰 내 안전·발열 이슈 감지
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-xs">
              {safetyReviews.length}건
            </span>
          </div>

          {safetyReviews.length > 0 ? (
            <div className="mt-3 space-y-2">
              {safetyReviews.map((item) => (
                <div
                  key={item.review_no}
                  className="p-2.5 bg-white rounded-lg border border-rose-200 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-semibold text-rose-700">#{item.review_no}번 리뷰</span>
                    <span>{item.written_on} (별점 {item.rating}점)</span>
                  </div>
                  <p className="text-slate-800 line-clamp-2">"{item.review_text}"</p>
                  {item.improvement_request && (
                    <p className="text-rose-600 mt-1 font-medium text-[11px]">
                      요청: {item.improvement_request}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-rose-700 mt-2">
              이번 업로드 리뷰에서 발열·화재·감전 등 직접적인 안전 이슈는 감지되지 않았습니다.
            </p>
          )}
        </div>

        {/* 2. 한국소비자원 진공청소기 사고 통계 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              한국소비자원 진공청소기 사고 통계 (공공데이터)
            </span>
            <span className="text-[11px] text-slate-500">최근 3,000건 중</span>
          </div>

          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span>소비자원 위해정보 3,000건 조회 중...</span>
            </div>
          ) : error || !safetyData ? (
            /* PRD 원칙: 실패 시 '불러오지 못했습니다' 정적 문구 */
            <div className="py-4 text-center text-xs font-medium text-slate-400">
              불러오지 못했습니다
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-600 mb-2.5">
                가정용 진공청소기 관련 접수 사고: 총 <strong className="text-slate-900 font-bold">{safetyData.totalVacuumAccidents}건</strong>
              </p>

              <div className="space-y-1.5 text-xs">
                {safetyData.topReasons.length > 0 ? (
                  safetyData.topReasons.map((r) => (
                    <div
                      key={r.rank}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            r.rank === 1
                              ? 'bg-amber-100 text-amber-800'
                              : r.rank === 2
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {r.rank}
                        </span>
                        <span className="font-semibold text-slate-800">{r.injuryReason}</span>
                      </div>
                      <span className="font-bold text-slate-700">{r.count}건</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">사고 통계 데이터 없음</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>출처: 한국소비자원 CISS 위해정보접수현황 API</span>
        <span className="text-slate-400">1~3위 위해원인 집계</span>
      </div>
    </div>
  );
};
