"use client";

import React, { useState, useMemo } from "react";
import { AuditedExpenseItem } from "@/lib/types";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Receipt,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Download,
  RotateCcw,
} from "lucide-react";
import { exportAuditedExpensesToCsv } from "@/lib/exportCsv";

interface ExpenseTableProps {
  items: AuditedExpenseItem[];
  articleFilter?: string | null;
  onClearArticleFilter?: () => void;
  onOpenRejectModal?: () => void;
  fileName?: string;
}

type SortField = "id" | "date" | "amount" | "submitter" | "status";
type SortDirection = "asc" | "desc";

export default function ExpenseTable({
  items,
  articleFilter,
  onClearArticleFilter,
  onOpenRejectModal,
  fileName,
}: ExpenseTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [onlyViolations, setOnlyViolations] = useState(false);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [copiedRowId, setCopiedRowId] = useState<number | null>(null);

  // 모든 필터(위반, 카테고리, 검색, 조항) 일괄 초기화
  const handleResetAllFilters = () => {
    setOnlyViolations(false);
    setSelectedCategory("ALL");
    setSearchQuery("");
    if (onClearArticleFilter) {
      onClearArticleFilter();
    }
  };

  // 위반 건만 보기 버튼 클릭 핸들러
  // 1회 클릭 시: 위반 건만 보기 ON
  // 2회 클릭 시(이미 켜진 상태): 전체 필터 초기화하여 전체 목록(25건)으로 복구!
  const handleToggleViolations = () => {
    if (!onlyViolations) {
      setOnlyViolations(true);
    } else {
      handleResetAllFilters();
    }
  };

  const isAnyFilterActive =
    onlyViolations ||
    selectedCategory !== "ALL" ||
    searchQuery.trim() !== "" ||
    Boolean(articleFilter);

  // 유니크 카테고리 목록
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [items]);

  // 통계
  const violationCount = useMemo(() => {
    return items.filter((i) => i.isViolation).length;
  }, [items]);

  // 정렬 및 필터링
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 조항별 필터 (SummaryCards 칩 클릭 연동)
    if (articleFilter) {
      result = result.filter((item) =>
        item.violations.some((v) => v.type === articleFilter)
      );
    }

    // 위반 건만 보기 필터
    if (onlyViolations) {
      result = result.filter((item) => item.isViolation);
    }

    // 카테고리 필터
    if (selectedCategory !== "ALL") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // 검색어 필터 (제출자, 부서, 가맹점, 항목, 메모, 위반사유)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.submitter.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.merchant.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.memo && item.memo.toLowerCase().includes(q)) ||
          (item.approvalNo && item.approvalNo.toLowerCase().includes(q)) ||
          item.violations.some((v) =>
            v.reason.toLowerCase().includes(q) ||
            v.article.toLowerCase().includes(q)
          )
      );
    }

    // 정렬
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "id") {
        cmp = a.id - b.id;
      } else if (sortField === "date") {
        const dateA = `${a.date} ${a.time || "00:00"}`;
        const dateB = `${b.date} ${b.time || "00:00"}`;
        cmp = dateA.localeCompare(dateB);
      } else if (sortField === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortField === "submitter") {
        cmp = a.submitter.localeCompare(b.submitter);
      } else if (sortField === "status") {
        cmp = (a.isViolation ? 1 : 0) - (b.isViolation ? 1 : 0);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, searchQuery, selectedCategory, onlyViolations, articleFilter, sortField, sortDirection]);

  // 필터링 결과 합계
  const filteredTotalAmount = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, cur) => acc + cur.amount, 0);
  }, [filteredAndSortedItems]);

  const handleCopyRow = async (item: AuditedExpenseItem) => {
    const reasons = item.violations.map((v) => `• [${v.articleNo}] ${v.reason}`).join("\n");
    const text = `[경비 정산 반려 안내]\n수신: ${item.submitter} 님 (${item.department})\n\n- 내역: No.${item.id} (${item.date}) ${item.category} [${item.merchant}] ${item.amount.toLocaleString()}원\n- 반려 사유:\n${reasons}\n\n확인 후 수정하시거나 경영지원팀으로 소명 바랍니다.`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedRowId(item.id);
      setTimeout(() => setCopiedRowId(null), 2000);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "식대":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "택시":
      case "교통비":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "접대비":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "소모품":
      case "자재":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "회의비":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getProofBadge = (proof: string) => {
    if (proof.includes("간이")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          <Receipt className="w-3 h-3" />
          {proof}
        </span>
      );
    }
    if (proof.includes("세금")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <FileCheck className="w-3 h-3" />
          {proof}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
        <CreditCard className="w-3 h-3" />
        {proof}
      </span>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* 툴바 (검색, 필터, 위반 토글, CSV 다운로드) */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col gap-3.5">
        {/* 상단 1행: 검색, 위반 토글, 반려 복사 모달, CSV 다운로드 버튼들 */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* 검색창 */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="제출자, 부서, 가맹점, 위반사유 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* 위반 건만 보기 필터 버튼 (2회 클릭 시 전체 초기화) */}
            <button
              type="button"
              onClick={handleToggleViolations}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 border ${
                onlyViolations
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-sm shadow-rose-500/20 ring-2 ring-rose-400/40"
                  : "bg-white text-rose-600 border-rose-300 hover:bg-rose-50"
              }`}
              title={
                onlyViolations
                  ? "클릭하면 위반 필터가 해제되고 전체 목록으로 초기화됩니다"
                  : "클릭하면 규정 위반 건만 필터링하여 표시합니다"
              }
            >
              {onlyViolations ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>위반 건 필터 중 ({violationCount}건)</span>
                  <span className="text-[10px] bg-rose-700/80 px-1 py-0.2 rounded text-rose-100 font-normal ml-0.5">
                    (클릭 시 초기화)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>위반 건만 보기 ({violationCount}건)</span>
                </>
              )}
            </button>

            {/* 전체 필터 초기화 버튼 */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1 transition-colors shrink-0"
                title="모든 검색어, 카테고리, 위반 필터를 해제하고 전체 목록으로 초기화합니다"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>필터 초기화</span>
              </button>
            )}

            {/* 제출자별 반려 사유 일괄 복사 모달 버튼 */}
            {violationCount > 0 && onOpenRejectModal && (
              <button
                type="button"
                onClick={onOpenRejectModal}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>제출자별 반려 사유 복사</span>
              </button>
            )}
          </div>

          {/* CSV 다운로드 버튼 영역 (요구사항 2) */}
          <div className="flex items-center gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
            <button
              type="button"
              onClick={() => exportAuditedExpensesToCsv(items, fileName || "경비정산")}
              className="px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              title="검사 상태 및 위반 사유가 포함된 전체 목록을 CSV 파일로 다운로드합니다 (엑셀 한글 호환 UTF-8 BOM)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>전체 목록 CSV 다운로드 ({items.length}건)</span>
            </button>

            {isAnyFilterActive && filteredAndSortedItems.length !== items.length && (
              <button
                type="button"
                onClick={() =>
                  exportAuditedExpensesToCsv(
                    filteredAndSortedItems,
                    `${fileName || "경비정산"}_필터결과`
                  )
                }
                className="px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors"
                title="현재 화면에 필터링된 결과만 CSV로 다운로드합니다"
              >
                <Download className="w-3 h-3" />
                <span>필터 목록 CSV ({filteredAndSortedItems.length}건)</span>
              </button>
            )}
          </div>
        </div>

        {/* 하단 2행: 카테고리 칩 필터 및 건수/금액 요약 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium shrink-0 mr-1">항목별:</span>
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 요약 카운트 */}
          <div className="flex items-center justify-end gap-3 text-xs sm:text-sm text-slate-500 font-medium shrink-0">
            <span>
              표시: <strong className="text-slate-800">{filteredAndSortedItems.length}</strong> / {items.length}건
            </span>
            <span className="text-slate-300">|</span>
            <span>
              소계: <strong className="text-blue-600 font-semibold">{filteredTotalAmount.toLocaleString()}원</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 테이블 뷰 */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <th
                onClick={() => handleSort("id")}
                className="py-3 px-3 sm:px-4 cursor-pointer hover:bg-slate-100/70 transition-colors whitespace-nowrap text-center w-12"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>번호</span>
                  {getSortIcon("id")}
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="py-3 px-3 sm:px-4 cursor-pointer hover:bg-slate-100/70 transition-colors whitespace-nowrap text-center w-28"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>검사 상태</span>
                  {getSortIcon("status")}
                </div>
              </th>
              <th
                onClick={() => handleSort("date")}
                className="py-3 px-3 sm:px-4 cursor-pointer hover:bg-slate-100/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>사용일시</span>
                  {getSortIcon("date")}
                </div>
              </th>
              <th
                onClick={() => handleSort("submitter")}
                className="py-3 px-3 sm:px-4 cursor-pointer hover:bg-slate-100/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>제출자(부서)</span>
                  {getSortIcon("submitter")}
                </div>
              </th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">항목</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">가맹점</th>
              <th
                onClick={() => handleSort("amount")}
                className="py-3 px-3 sm:px-4 cursor-pointer hover:bg-slate-100/70 transition-colors whitespace-nowrap text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>금액</span>
                  {getSortIcon("amount")}
                </div>
              </th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap text-center">인원</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">증빙</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap min-w-[200px]">위반 사유 및 메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  {onlyViolations ? "위반된 경비 내역이 없습니다. (모든 내역 정상)" : "일치하는 경비 내역이 없습니다."}
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const perPerson =
                  item.participants > 1 ? Math.round(item.amount / item.participants) : null;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.isViolation
                        ? "bg-rose-50/50 hover:bg-rose-50 border-l-4 border-l-rose-500"
                        : "hover:bg-slate-50/80 border-l-4 border-l-transparent text-slate-700"
                    }`}
                  >
                    {/* 번호 */}
                    <td className="py-3.5 px-3 sm:px-4 text-center font-mono text-slate-500 text-xs">
                      {item.id}
                    </td>

                    {/* 상태 (규정 검사 결과) */}
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap text-center">
                      {item.isViolation ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                            <AlertTriangle className="w-3 h-3" />
                            위반 ({item.violations.length})
                          </span>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {item.violations.map((v, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200"
                              >
                                {v.articleNo}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          정상
                        </span>
                      )}
                    </td>

                    {/* 사용일시 */}
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{item.date}</div>
                      {item.time && (
                        <div className="text-xs text-slate-400 font-mono">{item.time}</div>
                      )}
                    </td>

                    {/* 제출자 */}
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.submitter}</div>
                      <div className="text-xs text-slate-500">{item.department}</div>
                    </td>

                    {/* 항목 */}
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* 가맹점 */}
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap font-medium text-slate-800">
                      {item.merchant}
                    </td>

                    {/* 금액 */}
                    <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono">
                        {item.amount.toLocaleString()}원
                      </div>
                      {perPerson && (
                        <div className="text-[11px] text-slate-400">
                          (1인당 {perPerson.toLocaleString()}원)
                        </div>
                      )}
                    </td>

                    {/* 인원 */}
                    <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap text-slate-600 font-medium">
                      {item.participants}명
                    </td>

                    {/* 증빙 */}
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      {getProofBadge(item.proof)}
                    </td>

                    {/* 위반 사유 및 메모 */}
                    <td className="py-3.5 px-3 sm:px-4 text-xs">
                      {item.isViolation ? (
                        <div className="space-y-1.5">
                          {item.violations.map((v, i) => (
                            <div
                              key={i}
                              className="p-1.5 rounded-md bg-rose-100/70 border border-rose-200 text-rose-800 font-medium text-xs leading-relaxed"
                            >
                              <span className="font-bold mr-1 text-rose-900">[{v.articleNo}]</span>
                              {v.reason}
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1 gap-2">
                            {item.memo ? (
                              <div className="text-slate-500 text-[11px] truncate">
                                메모: {item.memo}
                              </div>
                            ) : (
                              <div />
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyRow(item)}
                              title="해당 건 반려 사유 복사"
                              className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors shrink-0 ml-auto"
                            >
                              {copiedRowId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">복사됨</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>사유 복사</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-600">
                          {item.memo ? (
                            <span>{item.memo}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                          {item.approvalNo && (
                            <span className="ml-1 text-[11px] text-indigo-600 font-mono">
                              ({item.approvalNo})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 테이블 하단 푸터 */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>사내 규정 감사: 제5조(식대), 제6조(교통비), 제7조(증빙), 제8조(접대비), 제9조(기한/중복)</span>
        </div>
        <div className="font-semibold text-slate-700">
          위반 {violationCount}건 / 정상 {items.length - violationCount}건
        </div>
      </div>
    </div>
  );
}
