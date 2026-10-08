import Papa from "papaparse";
import { ExpenseItem, ParseResult } from "./types";

/**
 * CSV 헤더 명칭 정규화 맵
 */
function normalizeHeaderName(header: string): string {
  const clean = header.replace(/^\uFEFF/, "").trim().toLowerCase();
  
  if (["번호", "no", "id", "순번"].includes(clean)) return "id";
  if (["제출자", "이름", "성명", "사용자", "submitter"].includes(clean)) return "submitter";
  if (["부서", "팀", "소속", "부서명", "department"].includes(clean)) return "department";
  if (["사용일", "사용일자", "일자", "날짜", "date"].includes(clean)) return "date";
  if (["사용시각", "사용시간", "시각", "시간", "time"].includes(clean)) return "time";
  if (["항목", "구분", "비용항목", "계정과목", "category"].includes(clean)) return "category";
  if (["가맹점", "사용처", "상호", "상호명", "가맹점명", "merchant"].includes(clean)) return "merchant";
  if (["금액", "사용금액", "지출금액", "금액(원)", "amount"].includes(clean)) return "amount";
  if (["인원", "인원수", "참석인원", "participants", "count"].includes(clean)) return "participants";
  if (["증빙", "증빙종류", "증빙구분", "결제수단", "proof"].includes(clean)) return "proof";
  if (["품의번호", "품의", "사전품의번호", "결재번호", "approvalno"].includes(clean)) return "approvalNo";
  if (["제출일", "제출일자", "신청일", "submissiondate"].includes(clean)) return "submissionDate";
  if (["메모", "비고", "사유", "적요", "내용", "memo", "note"].includes(clean)) return "memo";
  
  return clean;
}

/**
 * 숫자 문자열 파싱 (쉼표, 공백, 통화기호 등 제거)
 */
function parseNumeric(value: unknown, defaultValue = 0): number {
  if (typeof value === "number") return isNaN(value) ? defaultValue : value;
  if (!value) return defaultValue;
  const str = String(value).replace(/[^0-9.-]/g, "");
  const num = Number(str);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 원시 CSV 행 데이터를 ExpenseItem으로 변환
 */
export function transformRowToExpenseItem(
  row: Record<string, any>,
  index: number
): ExpenseItem | null {
  // 빈 행 필터링
  const values = Object.values(row).map((v) => (v ? String(v).trim() : ""));
  if (values.every((v) => v === "")) {
    return null;
  }

  // 매핑된 필드 객체 생성
  const normalized: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    const normKey = normalizeHeaderName(key);
    normalized[normKey] = typeof val === "string" ? val.trim() : val;
  }

  const id = parseNumeric(normalized.id, index + 1);
  const amount = parseNumeric(normalized.amount, 0);
  const participantsRaw = parseNumeric(normalized.participants, 1);
  const participants = participantsRaw > 0 ? participantsRaw : 1;

  return {
    id,
    submitter: normalized.submitter || "미기재",
    department: normalized.department || "미기재",
    date: normalized.date || "",
    time: normalized.time || "",
    category: normalized.category || "기타",
    merchant: normalized.merchant || "",
    amount,
    participants,
    proof: normalized.proof || "미기재",
    approvalNo: normalized.approvalNo || "",
    submissionDate: normalized.submissionDate || "",
    memo: normalized.memo || "",
    raw: row,
  };
}

/**
 * CSV 텍스트 문자열을 파싱하여 ExpenseItem 배열로 반환
 */
export function parseExpenseCsvString(
  csvContent: string,
  fileName?: string
): ParseResult {
  const parseResult = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  const errors: string[] = parseResult.errors.map((e) => e.message);
  const items: ExpenseItem[] = [];

  parseResult.data.forEach((row, idx) => {
    const item = transformRowToExpenseItem(row, idx);
    if (item) {
      items.push(item);
    }
  });

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    data: items,
    fileName,
    totalCount: items.length,
    totalAmount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * 브라우저 File 객체를 파싱 (클라이언트 사이드 비동기)
 */
export function parseExpenseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
      complete: (results) => {
        const errors = results.errors.map((e) => e.message);
        const items: ExpenseItem[] = [];

        results.data.forEach((row, idx) => {
          const item = transformRowToExpenseItem(row, idx);
          if (item) {
            items.push(item);
          }
        });

        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        resolve({
          data: items,
          fileName: file.name,
          totalCount: items.length,
          totalAmount,
          errors: errors.length > 0 ? errors : undefined,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
