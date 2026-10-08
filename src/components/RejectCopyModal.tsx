"use client";

import React, { useState, useMemo } from "react";
import { AuditedExpenseItem } from "@/lib/types";
import {
  X,
  Copy,
  Check,
  Send,
  User,
  AlertTriangle,
  FileText,
  Layers,
  Sparkles,
} from "lucide-react";

interface RejectCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AuditedExpenseItem[];
}

interface SubmitterGroup {
  submitter: string;
  department: string;
  items: AuditedExpenseItem[];
  totalAmount: number;
  violationCount: number;
}

export default function RejectCopyModal({
  isOpen,
  onClose,
  items,
}: RejectCopyModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSubmitter, setSelectedSubmitter] = useState<string>("ALL");

  // 위반 건을 제출자별로 그룹화
  const submitterGroups: SubmitterGroup[] = useMemo(() => {
    const violationItems = items.filter((item) => item.isViolation);
    const map = new Map<string, SubmitterGroup>();

    violationItems.forEach((item) => {
      const key = item.submitter;
      if (!map.has(key)) {
        map.set(key, {
          submitter: item.submitter,
          department: item.department || "소속 미기재",
          items: [],
          totalAmount: 0,
          violationCount: 0,
        });
      }
      const group = map.get(key)!;
      group.items.push(item);
      group.totalAmount += item.amount;
      group.violationCount += item.violations.length;
    });

    return Array.from(map.values()).sort((a, b) =>
      b.items.length - a.items.length || a.submitter.localeCompare(b.submitter)
    );
  }, [items]);

  // 특정 제출자용 안내 텍스트 생성
  const generateSubmitterMessage = (group: SubmitterGroup): string => {
    const lines: string[] = [
      `[경비 정산 반려 및 확인 요청]`,
      `수신: ${group.submitter} 님 (${group.department})`,
      ``,
      `안녕하세요. 경영지원팀입니다.`,
      `제출해 주신 경비 내역 중 사내 경비 규정(제5조~제9조)에 부합하지 않는 내역이 확인되어 안내드립니다.`,
      `아래 내역을 확인하시어 수정 후 재제출하시거나 소명 부탁드립니다.`,
      ``,
      `■ 반려 및 검토 대상 내역 (총 ${group.items.length}건 / ${group.totalAmount.toLocaleString()}원):`,
    ];

    group.items.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. [No.${item.id}] ${item.date}${item.time ? ` ${item.time}` : ""} | ${item.category} | ${item.merchant}`
      );
      lines.push(`   - 청구 금액: ${item.amount.toLocaleString()}원 (${item.participants}명 / 증빙: ${item.proof})`);
      if (item.memo) {
        lines.push(`   - 제출 메모: ${item.memo}`);
      }
      lines.push(`   - [반려 사유]:`);
      item.violations.forEach((v) => {
        lines.push(`     • [${v.articleNo}] ${v.reason}`);
      });
      lines.push(``);
    });

    lines.push(`※ 사내 경비 규정 확인 후 회계 담당자에게 문의 바랍니다.`);
    lines.push(`감사합니다. (경영지원팀 배상)`);

    return lines.join("\n");
  };

  // 전체 제출자 일괄 안내 텍스트 생성
  const generateAllSubmittersMessage = (): string => {
    if (submitterGroups.length === 0) return "위반된 경비 내역이 없습니다.";

    const header = [
      `========================================`,
      `[경비 정산 규정 위반 검토 대상 일괄 통보 내역]`,
      `총 위반 제출자: ${submitterGroups.length}명`,
      `발행 일시: ${new Date().toLocaleDateString("ko-KR")}`,
      `========================================`,
      ``,
    ].join("\n");

    const bodies = submitterGroups.map((g) => generateSubmitterMessage(g));
    return header + bodies.join("\n\n----------------------------------------\n\n");
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      alert("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.");
    }
  };

  if (!isOpen) return null;

  const currentPreviewText =
    selectedSubmitter === "ALL"
      ? generateAllSubmittersMessage()
      : (() => {
          const group = submitterGroups.find((g) => g.submitter === selectedSubmitter);
          return group ? generateSubmitterMessage(group) : "";
        })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  제출자별 반려 사유 클립보드 원클릭 복사
                </h2>
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                  {submitterGroups.length}명 위반 감지
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                사내 메신저(Slack, 잔디 등)나 이메일에 바로 붙여넣을 수 있도록 서식화된 메시지를 제공합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        {submitterGroups.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Check className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <h3 className="text-base font-bold text-slate-700">위반된 경비 내역이 없습니다!</h3>
            <p className="text-xs text-slate-500 mt-1">모든 내역이 사내 규정(제5조~제9조)을 준수하고 있습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[420px]">
            {/* 좌측: 제출자 선택 탭 목록 */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto max-h-48 md:max-h-none flex md:flex-col gap-1.5 shrink-0">
              <button
                onClick={() => setSelectedSubmitter("ALL")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all shrink-0 md:shrink ${
                  selectedSubmitter === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>전체 일괄 모아보기</span>
                </div>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${
                    selectedSubmitter === "ALL"
                      ? "bg-slate-800 text-slate-200"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {submitterGroups.length}명
                </span>
              </button>

              <div className="hidden md:block my-2 border-t border-slate-200" />
              <div className="hidden md:block px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                제출자별 개별 선택
              </div>

              {submitterGroups.map((group) => {
                const isSelected = selectedSubmitter === group.submitter;
                return (
                  <button
                    key={group.submitter}
                    onClick={() => setSelectedSubmitter(group.submitter)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all shrink-0 md:shrink ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 bg-white border border-slate-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <div className="truncate">
                        <span className="font-bold">{group.submitter}</span>
                        <span className={`text-[10px] ml-1 opacity-80`}>
                          ({group.department})
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ml-1.5 ${
                        isSelected
                          ? "bg-blue-700 text-white"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {group.items.length}건
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 우측: 텍스트 미리보기 및 복사 영역 */}
            <div className="flex-1 flex flex-col p-4 sm:p-5 bg-white overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-800">
                    {selectedSubmitter === "ALL"
                      ? "전체 제출자 종합 반려 안내문"
                      : `${selectedSubmitter} 님 전송용 반려 안내문`}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Slack, 잔디, 메일 서식 자동 최적화)
                  </span>
                </div>

                {/* 복사 버튼 */}
                <button
                  onClick={() =>
                    copyToClipboard(currentPreviewText, selectedSubmitter)
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    copiedKey === selectedSubmitter
                      ? "bg-emerald-600 text-white scale-102"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copiedKey === selectedSubmitter ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>복사 완료! (붙여넣기 가능)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>
                        {selectedSubmitter === "ALL"
                          ? "전체 내용 일괄 복사"
                          : `${selectedSubmitter} 님 사유 복사`}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* 텍스트 박스 */}
              <div className="flex-1 relative rounded-xl border border-slate-200 bg-slate-900 overflow-hidden flex flex-col">
                <div className="p-2.5 bg-slate-800 border-b border-slate-700 text-slate-400 text-[11px] flex items-center justify-between">
                  <span className="font-mono">클립보드 복사 텍스트 프리뷰</span>
                  <span className="text-[10px] text-slate-400">
                    Ctrl + V로 즉시 전송 가능
                  </span>
                </div>
                <textarea
                  readOnly
                  value={currentPreviewText}
                  className="w-full flex-1 p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-blue-600 selection:text-white"
                  rows={14}
                />
              </div>

              {/* 하단 팁 */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  제출자가 왜 반려되었는지(조항 번호, 한도 초과 금액, 중복 대상 등)를 명확하게 알 수 있도록 생성됩니다.
                </span>
                <span className="font-semibold text-slate-600">
                  총 {submitterGroups.reduce((acc, g) => acc + g.items.length, 0)}건 위반 내역
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 모달 푸터 */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            * 복사한 텍스트를 사내 메신저나 결재 시스템에 그대로 붙여넣으시면 됩니다.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
