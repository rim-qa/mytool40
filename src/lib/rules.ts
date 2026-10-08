import { ExpenseItem, Violation, AuditedExpenseItem } from "./types";
import { POLICY_CONSTANTS, ARTICLE_META } from "@/constants/policyRules";

/**
 * 제5조 (식대) 검증
 * - 1인당 1회 12,000원 한도 초과 여부
 */
export function validateArticle5(item: ExpenseItem): Violation | null {
  if (!item.category.includes("식대")) return null;

  const participants = Math.max(1, item.participants || 1);
  const perPerson = Math.round(item.amount / participants);

  if (perPerson > POLICY_CONSTANTS.MEAL_LIMIT_PER_PERSON) {
    const excess = perPerson - POLICY_CONSTANTS.MEAL_LIMIT_PER_PERSON;
    return {
      type: "ARTICLE_5",
      article: ARTICLE_META.ARTICLE_5.no,
      articleNo: "제5조",
      reason: `1인당 식대 한도(${POLICY_CONSTANTS.MEAL_LIMIT_PER_PERSON.toLocaleString()}원) 초과 [1인당 ${perPerson.toLocaleString()}원 / 초과금: ${excess.toLocaleString()}원]`,
      severity: "violation",
    };
  }

  return null;
}

/**
 * 제6조 (교통비) 검증
 * - 택시비는 22:00 이후 퇴근 또는 업무상 외부 이동(메모 기재 필수) 시에만 인정
 * - 22:00 이전 퇴근 택시비는 불가
 */
export function validateArticle6(item: ExpenseItem): Violation | null {
  const isTaxi =
    item.category.includes("택시") ||
    item.merchant.toLowerCase().includes("카카오t") ||
    item.merchant.toLowerCase().includes("택시");

  if (!isTaxi) return null;

  // 사용시각 검사 (HH:mm)
  if (item.time) {
    const parts = item.time.split(":");
    const hour = parseInt(parts[0], 10);
    const minute = parts[1] ? parseInt(parts[1], 10) : 0;

    // 22:00 이전인지 확인 (hour < 22)
    if (hour < POLICY_CONSTANTS.NIGHT_TAXI_START_HOUR) {
      const memo = (item.memo || "").trim();

      // 업무상 외부 이동 예외 키워드 (고객사, 현장, 미팅, 외근, 방문 등)
      const businessTripKeywords = ["고객사", "현장", "미팅", "외근", "방문", "업무", "이동"];
      const isBusinessTrip = businessTripKeywords.some((kw) => memo.includes(kw));

      // 단순 퇴근이거나 메모가 없는 경우 위반
      const isGoingHome = memo.includes("퇴근");

      if (isGoingHome || (!isBusinessTrip && memo === "")) {
        return {
          type: "ARTICLE_6",
          article: ARTICLE_META.ARTICLE_6.no,
          articleNo: "제6조",
          reason: `오후 10시(22:00) 이전 퇴근 택시비 사용 불가 [사용시각: ${item.time}, 사유: ${memo || "미기재"}]`,
          severity: "violation",
        };
      }
    }
  }

  return null;
}

/**
 * 제7조 (증빙) 검증
 * - 1건 30,000원 이상 지출 시 간이영수증 불가 (적격증빙 필요)
 */
export function validateArticle7(item: ExpenseItem): Violation | null {
  const isSimplifiedReceipt = item.proof.includes("간이");

  if (isSimplifiedReceipt && item.amount >= POLICY_CONSTANTS.RECEIPT_QUALIFIED_MIN_AMOUNT) {
    return {
      type: "ARTICLE_7",
      article: ARTICLE_META.ARTICLE_7.no,
      articleNo: "제7조",
      reason: `30,000원 이상 지출 시 간이영수증 인정 불가 [지출금액: ${item.amount.toLocaleString()}원 / 적격증빙 필요]`,
      severity: "violation",
    };
  }

  return null;
}

/**
 * 제8조 (접대비) 검증
 * - 접대비 300,000원 초과 시 사전 품의 필수 (품의번호 기재)
 */
export function validateArticle8(item: ExpenseItem): Violation | null {
  if (!item.category.includes("접대비")) return null;

  if (item.amount > POLICY_CONSTANTS.ENTERTAINMENT_APPROVAL_THRESHOLD) {
    const hasApprovalNo = item.approvalNo && item.approvalNo.trim().length > 0;
    if (!hasApprovalNo) {
      return {
        type: "ARTICLE_8",
        article: ARTICLE_META.ARTICLE_8.no,
        articleNo: "제8조",
        reason: `300,000원 초과 접대비 사전 품의번호 누락 [금액: ${item.amount.toLocaleString()}원]`,
        severity: "violation",
      };
    }
  }

  return null;
}

/**
 * 제9조 제1항 (제출 기한) 검증
 * - 사용일로부터 30일 이내 제출
 */
export function validateArticle9_1(item: ExpenseItem): Violation | null {
  if (!item.date || !item.submissionDate) return null;

  try {
    const useDate = new Date(item.date);
    const submitDate = new Date(item.submissionDate);

    // 유효한 날짜인지 검증
    if (isNaN(useDate.getTime()) || isNaN(submitDate.getTime())) return null;

    const diffMs = submitDate.getTime() - useDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > POLICY_CONSTANTS.SUBMISSION_DEADLINE_DAYS) {
      return {
        type: "ARTICLE_9_1",
        article: ARTICLE_META.ARTICLE_9_1.no,
        articleNo: "제9조",
        reason: `사용일로부터 30일 초과 제출 [경과일수: ${diffDays}일 / 사용일: ${item.date}, 제출일: ${item.submissionDate}]`,
        severity: "violation",
      };
    }
  } catch {
    // 날짜 파싱 오류 시 스킵
  }

  return null;
}

/**
 * 전체 경비 내역에 대해 제5조~제9조 일괄 감사 실행
 * (제9조 제2항 중복 제출 감지 포함)
 */
export function auditExpenses(items: ExpenseItem[]): AuditedExpenseItem[] {
  // 중복 감지용 맵 (키: 사용일_가맹점_금액)
  const seenMap = new Map<string, ExpenseItem>();

  return items.map((item) => {
    const violations: Violation[] = [];

    // 개별 단건 룰 검증
    const v5 = validateArticle5(item);
    if (v5) violations.push(v5);

    const v6 = validateArticle6(item);
    if (v6) violations.push(v6);

    const v7 = validateArticle7(item);
    if (v7) violations.push(v7);

    const v8 = validateArticle8(item);
    if (v8) violations.push(v8);

    const v9_1 = validateArticle9_1(item);
    if (v9_1) violations.push(v9_1);

    // 제9조 제2항: 중복 제출 감지 (동일 사용일, 가맹점, 금액)
    let duplicateWithId: number | undefined;
    const dupKey = `${item.date.trim()}_${item.merchant.trim()}_${item.amount}`;

    if (seenMap.has(dupKey)) {
      const originalItem = seenMap.get(dupKey)!;
      duplicateWithId = originalItem.id;
      violations.push({
        type: "ARTICLE_9_2",
        article: ARTICLE_META.ARTICLE_9_2.no,
        articleNo: "제9조",
        reason: `동일 지출 중복 제출 의심 [최초 등록: ${originalItem.id}번 건과 사용일·가맹점·금액 일치]`,
        severity: "violation",
      });
    } else {
      seenMap.set(dupKey, item);
    }

    const participants = Math.max(1, item.participants || 1);
    const perPersonAmount = Math.round(item.amount / participants);

    return {
      ...item,
      perPersonAmount,
      isViolation: violations.length > 0,
      violations,
      duplicateWithId,
    };
  });
}
