"use client";

import React, { useMemo } from "react";
import { AuditedExpenseItem } from "@/lib/types";
import { ARTICLE_META } from "@/constants/policyRules";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Scale,
  TrendingDown,
  DollarSign,
  Utensils,
  Car,
  Receipt,
  Users2,
  Clock,
  CopyCheck,
} from "lucide-react";

interface SummaryCardsProps {
  items: AuditedExpenseItem[];
  selectedArticleFilter?: string | null;
  onSelectArticleFilter?: (articleKey: string | null) => void;
  onOpenRejectModal?: () => void;
}

export default function SummaryCards({
  items,
  selectedArticleFilter,
  onSelectArticleFilter,
  onOpenRejectModal,
}: SummaryCardsProps) {
  // 핵심 지표 계산
  const {
    totalCount,
    totalAmount,
    normalCount,
    normalAmount,
    violationCount,
    violationAmount,
    complianceRate,
    articleStats,
  } = useMemo(() => {
    const totalCount = items.length;
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const violationItems = items.filter((item) => item.isViolation);
    const violationCount = violationItems.length;
    const violationAmount = violationItems.reduce((sum, item) => sum + item.amount, 0);

    const normalCount = totalCount - violationCount;
    const normalAmount = totalAmount - violationAmount;

    const complianceRate =
      totalCount > 0 ? Math.round((normalCount / totalCount) * 100) : 100;

    // 조항별 집계
    const articleStats: Record<
      string,
      { count: number; amount: number; key: string }
    > = {
      ARTICLE_5: { count: 0, amount: 0, key: "ARTICLE_5" },
      ARTICLE_6: { count: 0, amount: 0, key: "ARTICLE_6" },
      ARTICLE_7: { count: 0, amount: 0, key: "ARTICLE_7" },
      ARTICLE_8: { count: 0, amount: 0, key: "ARTICLE_8" },
      ARTICLE_9_1: { count: 0, amount: 0, key: "ARTICLE_9_1" },
      ARTICLE_9_2: { count: 0, amount: 0, key: "ARTICLE_9_2" },
    };

    violationItems.forEach((item) => {
      item.violations.forEach((v) => {
        if (articleStats[v.type]) {
          articleStats[v.type].count++;
          articleStats[v.type].amount += item.amount;
        }
      });
    });

    return {
      totalCount,
      totalAmount,
      normalCount,
      normalAmount,
      violationCount,
      violationAmount,
      complianceRate,
      articleStats,
    };
  }, [items]);

  const articleConfig = [
    {
      key: "ARTICLE_5",
      meta: ARTICLE_META.ARTICLE_5,
      icon: Utensils,
      color: "amber",
      borderColor: "border-amber-200",
      bgColor: "bg-amber-50",
      activeBg: "bg-amber-500 text-white",
      textColor: "text-amber-800",
      subDesc: "1인 12,000원 한도",
    },
    {
      key: "ARTICLE_6",
      meta: ARTICLE_META.ARTICLE_6,
      icon: Car,
      color: "sky",
      borderColor: "border-sky-200",
      bgColor: "bg-sky-50",
      activeBg: "bg-sky-600 text-white",
      textColor: "text-sky-800",
      subDesc: "22:00 이전 퇴근택시",
    },
    {
      key: "ARTICLE_7",
      meta: ARTICLE_META.ARTICLE_7,
      icon: Receipt,
      color: "orange",
      borderColor: "border-orange-200",
      bgColor: "bg-orange-50",
      activeBg: "bg-orange-500 text-white",
      textColor: "text-orange-800",
      subDesc: "3만원 이상 간이영수증",
    },
    {
      key: "ARTICLE_8",
      meta: ARTICLE_META.ARTICLE_8,
      icon: Users2,
      color: "purple",
      borderColor: "border-purple-200",
      bgColor: "bg-purple-50",
      activeBg: "bg-purple-600 text-white",
      textColor: "text-purple-800",
      subDesc: "30만원 초과 품의누락",
    },
    {
      key: "ARTICLE_9_1",
      meta: ARTICLE_META.ARTICLE_9_1,
      icon: Clock,
      color: "rose",
      borderColor: "border-rose-200",
      bgColor: "bg-rose-50",
      activeBg: "bg-rose-600 text-white",
      textColor: "text-rose-800",
      subDesc: "30일 초과 지연제출",
    },
    {
      key: "ARTICLE_9_2",
      meta: ARTICLE_META.ARTICLE_9_2,
      icon: CopyCheck,
      color: "red",
      borderColor: "border-red-300",
      bgColor: "bg-red-50",
      activeBg: "bg-red-600 text-white",
      textColor: "text-red-900",
      subDesc: "동일 지출 중복제출",
    },
  ];

  const handleChipClick = (key: string) => {
    if (!onSelectArticleFilter) return;
    if (selectedArticleFilter === key) {
      onSelectArticleFilter(null);
    } else {
      onSelectArticleFilter(key);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. 상단 핵심 지표 카드 (3.3 핵심 지표 카드) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 전체 제출 건수 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              전체 제출 내역
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalCount.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-slate-500">건</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              총 청구액: {totalAmount.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 정상 건수 (규정 준수) */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
              규정 준수 (정상)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                {normalCount.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-emerald-700">건</span>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {complianceRate}% 준수
              </span>
            </div>
            <p className="text-xs text-emerald-700/70 mt-1 font-medium">
              지급 예정액: {normalAmount.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 위반 건수 (규정 위반) */}
        <div
          className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-all hover:shadow-sm ${
            violationCount > 0
              ? "bg-rose-50/40 border-rose-200"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold tracking-wide uppercase ${
                violationCount > 0 ? "text-rose-700" : "text-slate-500"
              }`}
            >
              규정 위반 감지
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                violationCount > 0
                  ? "bg-rose-100 text-rose-600 animate-pulse"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  violationCount > 0 ? "text-rose-600" : "text-slate-700"
                }`}
              >
                {violationCount.toLocaleString()}
              </span>
              <span
                className={`text-sm font-semibold ${
                  violationCount > 0 ? "text-rose-600" : "text-slate-500"
                }`}
              >
                건
              </span>
              {violationCount > 0 && (
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  반려 검토 대상
                </span>
              )}
            </div>
            <p
              className={`text-xs mt-1 font-medium ${
                violationCount > 0 ? "text-rose-600/80" : "text-slate-400"
              }`}
            >
              위반 대상액: {violationAmount.toLocaleString()}원
            </p>
            {violationCount > 0 && onOpenRejectModal && (
              <button
                type="button"
                onClick={onOpenRejectModal}
                className="mt-3 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors w-fit"
              >
                <CopyCheck className="w-3.5 h-3.5" />
                <span>제출자별 반려 사유 복사</span>
              </button>
            )}
          </div>
        </div>

        {/* 업무 절감 지표 카드 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-5 border border-blue-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">
              정산 감사 공수 단축
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">
                즉시 검출
              </span>
            </div>
            <p className="text-xs text-blue-600/80 mt-1 font-medium">
              반나절(4시간) 소요 → 원클릭 1초 완료
            </p>
          </div>
        </div>
      </div>

      {/* 2. 조항별 위반 통계 칩 (3.3 조항별 위반 통계) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-100 text-slate-700">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              사내 규정(제5조~제9조) 조항별 위반 통계
            </h3>
            {selectedArticleFilter && (
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                선택 필터 적용 중
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            * 칩을 클릭하면 해당 조항 위반 건만 테이블에서 즉시 필터링됩니다.
          </p>
        </div>

        {/* 조항별 칩 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {articleConfig.map((item) => {
            const stat = articleStats[item.key] || { count: 0, amount: 0 };
            const isSelected = selectedArticleFilter === item.key;
            const hasViolation = stat.count > 0;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleChipClick(item.key)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-2 group ${
                  isSelected
                    ? "ring-2 ring-blue-500 shadow-sm border-blue-500 bg-blue-50/70"
                    : hasViolation
                    ? `${item.bgColor} ${item.borderColor} hover:shadow-xs`
                    : "bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      hasViolation
                        ? `${item.textColor} bg-white/80 border border-current/20`
                        : "text-slate-600 bg-white border border-slate-200"
                    }`}
                  >
                    {item.meta.no}
                  </span>
                  <Icon
                    className={`w-4 h-4 ${
                      hasViolation ? item.textColor : "text-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {item.meta.title}
                    </span>
                    <span
                      className={`text-sm font-black font-mono ${
                        hasViolation ? "text-rose-600" : "text-slate-400"
                      }`}
                    >
                      {stat.count}건
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {item.subDesc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedArticleFilter && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              현재{" "}
              <strong className="text-blue-600">
                {articleConfig.find((c) => c.key === selectedArticleFilter)?.meta.no}{" "}
                ({articleConfig.find((c) => c.key === selectedArticleFilter)?.meta.title})
              </strong>{" "}
              위반 건만 테이블에 표시되고 있습니다.
            </span>
            <button
              onClick={() => onSelectArticleFilter && onSelectArticleFilter(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              필터 해제 (전체 보기)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
