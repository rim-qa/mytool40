// ==========================================
// 37_경비정산검사기 Types
// ==========================================
export interface ExpenseItem {
  id: number;
  submitter: string;      // 제출자
  department: string;     // 부서
  date: string;           // 사용일 (YYYY-MM-DD)
  time: string;           // 사용시각 (HH:mm)
  category: string;       // 항목 (식대, 택시, 회의비, 소모품 등)
  merchant: string;       // 가맹점
  amount: number;         // 금액
  participants: number;   // 인원
  proof: string;          // 증빙 (법인카드, 간이영수증, 세금계산서 등)
  approvalNo?: string;    // 품의번호
  submissionDate?: string;// 제출일
  memo?: string;          // 메모
  raw?: Record<string, string>;
}

export type ArticleType =
  | "ARTICLE_5"   // 식대 한도
  | "ARTICLE_6"   // 택시/교통비 심야/업무 규정
  | "ARTICLE_7"   // 증빙 기준
  | "ARTICLE_8"   // 접대비 사전품의
  | "ARTICLE_9_1" // 30일 이내 제출
  | "ARTICLE_9_2";// 중복 제출

export interface Violation {
  type: ArticleType;
  article: string;       // 예: "제5조 (식대)"
  articleNo: string;     // 예: "제5조"
  reason: string;        // 상세 사유
  severity: "violation" | "warning";
}

export interface AuditedExpenseItem extends ExpenseItem {
  isViolation: boolean;
  violations: Violation[];
  perPersonAmount?: number;
  duplicateWithId?: number; // 중복 지출 대상 번호
}

export interface ParseResult {
  data: ExpenseItem[];
  fileName?: string;
  totalCount: number;
  totalAmount: number;
  errors?: string[];
}

export interface PolicyRule {
  article: string;
  title: string;
  condition: string;
  limit: string;
  exceptions: string;
}

// ==========================================
// 38_지점매출관리판 Types
// ==========================================
export interface SaleRecord {
  id: string | number;
  월: string;
  지점: string;
  매출액: number;
  객수: number;
  비고?: string;
  created_at?: string;
}

export interface HolidayData {
  count: number;
  names: string[];
  details: { date: string; name: string }[];
}

// ==========================================
// 39_리뷰분석기 Types
// ==========================================
export interface ReviewInput {
  review_no: number;
  written_on: string;
  rating: number;
  review_text: string;
}

export interface AnalyzedReview {
  id?: number;
  analyzed_on: string;
  review_no: number;
  written_on: string;
  rating: number;
  review_text: string;
  sentiment: '긍정' | '부정' | '중립' | '광고';
  categories: string; // comma-separated categories or single category
  improvement_request: string;
  is_safety_issue: boolean;
  model_used: string;
}

export interface ConsumerSafetyRank {
  rank: number;
  injuryReason: string;
  count: number;
}

export interface ConsumerSafetyData {
  totalVacuumAccidents: number;
  topReasons: ConsumerSafetyRank[];
  source: string;
  updatedAt: string;
}

export interface HistoryGroup {
  analyzed_on: string;
  total_count: number;
  negative_count: number;
  negative_ratio: number; // percentage formatted or number
}
