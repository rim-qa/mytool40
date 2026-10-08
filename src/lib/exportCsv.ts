import { AuditedExpenseItem } from "./types";

/**
 * 경비 정산 감사 결과를 CSV 파일로 내보내기 (UTF-8 BOM 포함으로 엑셀 한글 깨짐 방지)
 */
export function exportAuditedExpensesToCsv(
  items: AuditedExpenseItem[],
  baseFileName = "경비정산_검사결과"
) {
  if (!items || items.length === 0) {
    alert("다운로드할 경비 내역이 없습니다.");
    return;
  }

  const headers = [
    "번호",
    "검사상태",
    "위반조항",
    "위반상세사유",
    "사용일",
    "사용시각",
    "제출자",
    "부서",
    "항목",
    "가맹점",
    "금액",
    "인원",
    "1인당금액",
    "증빙",
    "품의번호",
    "제출일",
    "메모",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = items.map((item) => {
    const status = item.isViolation ? "위반" : "정상";
    const articles = item.violations.map((v) => v.articleNo).join(", ");
    const reasons = item.violations
      .map((v) => `[${v.articleNo}] ${v.reason}`)
      .join(" / ");
    const perPerson = Math.round(item.amount / Math.max(1, item.participants || 1));

    return [
      item.id,
      status,
      articles || "-",
      reasons || "-",
      item.date,
      item.time || "",
      item.submitter,
      item.department,
      item.category,
      item.merchant,
      item.amount,
      item.participants,
      perPerson,
      item.proof,
      item.approvalNo || "",
      item.submissionDate || "",
      item.memo || "",
    ]
      .map(escapeCsv)
      .join(",");
  });

  // UTF-8 BOM (\uFEFF) 추가하여 엑셀에서 바로 열어도 한글이 깨지지 않도록 처리
  const csvContent =
    "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanBaseName = baseFileName.replace(/\.csv$/i, "");
  const downloadFileName = `${cleanBaseName}_검사결과_${dateStr}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", downloadFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
