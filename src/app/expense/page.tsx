"use client";

import React, { useState, useMemo } from "react";
import FileUploader from "@/components/FileUploader";
import ExpenseTable from "@/components/ExpenseTable";
import SummaryCards from "@/components/SummaryCards";
import RejectCopyModal from "@/components/RejectCopyModal";
import { ParseResult, AuditedExpenseItem } from "@/lib/types";
import { auditExpenses } from "@/lib/rules";
import { ShieldCheck, FileSpreadsheet } from "lucide-react";

export default function Home() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedArticleFilter, setSelectedArticleFilter] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // 룰 엔진 실행 (Client-side Pure Function)
  const auditedItems: AuditedExpenseItem[] = useMemo(() => {
    if (!parseResult || !parseResult.data) return [];
    return auditExpenses(parseResult.data);
  }, [parseResult]);

  const handleParsed = (result: ParseResult) => {
    setParseResult(result);
    setSelectedArticleFilter(null);
  };

  const handleReset = () => {
    setParseResult(null);
    setSelectedArticleFilter(null);
    setIsRejectModalOpen(false);
  };

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* 상단 헤더 */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              경비 정산 검사기
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              룰 엔진 &amp; 원클릭 반려 복사 완비
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            CSV 파일을 업로드하면 사내 경비 규정(제5조~제9조)을 자동 검증하여 위반 내역과 사유를 즉시 계산하고, 제출자별 반려 안내문을 한 번에 생성합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero-Persistence (브라우저 메모리 안전 검사)</span>
        </div>
      </header>

      {/* CSV 업로더 영역 */}
      <section>
        <FileUploader
          onParsed={handleParsed}
          currentResult={parseResult}
          onReset={handleReset}
        />
      </section>

      {/* 데이터 로드 시 요약 카드 & 테이블 뷰 */}
      {parseResult && auditedItems.length > 0 ? (
        <section className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* 3.3 대시보드 요약 (핵심 지표 카드 및 조항별 통계 칩) */}
          <SummaryCards
            items={auditedItems}
            selectedArticleFilter={selectedArticleFilter}
            onSelectArticleFilter={setSelectedArticleFilter}
            onOpenRejectModal={() => setIsRejectModalOpen(true)}
          />

          {/* 3.4 반응형 테이블 뷰 ("위반 건만 보기" 토글 및 필터/정렬 연동) */}
          <ExpenseTable
            items={auditedItems}
            articleFilter={selectedArticleFilter}
            onClearArticleFilter={() => setSelectedArticleFilter(null)}
            onOpenRejectModal={() => setIsRejectModalOpen(true)}
            fileName={parseResult?.fileName}
          />

          {/* 3.4 제출자별 반려 사유 클립보드 원클릭 복사 모달 */}
          <RejectCopyModal
            isOpen={isRejectModalOpen}
            onClose={() => setIsRejectModalOpen(false)}
            items={auditedItems}
          />
        </section>
      ) : (
        <section className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-600">등록된 경비 데이터가 없습니다</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            위 영역에 CSV 파일을 업로드하거나 &apos;✨ 9월 경비내역 샘플 불러오기&apos;를 클릭하여 요약 대시보드 및 감사 결과를 확인하세요.
          </p>
        </section>
      )}

      {/* 푸터 */}
      <footer className="mt-auto pt-6 text-center text-xs text-slate-400 border-t border-slate-200">
        한결인테리어 경비 정산 감사 시스템 &bull; 제5조(식대) &bull; 제6조(교통비) &bull; 제7조(증빙) &bull; 제8조(접대비) &bull; 제9조(제출/중복)
      </footer>
    </main>
  );
}
