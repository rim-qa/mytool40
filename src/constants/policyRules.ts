export const POLICY_CONSTANTS = {
  // 제5조: 식대 1인당 1회 한도 12,000원
  MEAL_LIMIT_PER_PERSON: 12000,

  // 제6조: 심야 퇴근 택시비 인정 기준 시각 (22:00 이후)
  NIGHT_TAXI_START_HOUR: 22,

  // 제7조: 간이영수증 한도 (30,000원 미만만 허용, 30,000원 이상은 적격증빙 필수)
  RECEIPT_QUALIFIED_MIN_AMOUNT: 30000,

  // 제8조: 사전 품의 대상 접대비 한도 (1건 300,000원 초과)
  ENTERTAINMENT_APPROVAL_THRESHOLD: 300000,

  // 제9조 제1항: 경비 청구 제출 기한 (사용일로부터 30일 이내)
  SUBMISSION_DEADLINE_DAYS: 30,
};

export const ARTICLE_META = {
  ARTICLE_5: {
    no: "제5조",
    title: "식대 규정",
    desc: "1인 12,000원 한도 초과",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  ARTICLE_6: {
    no: "제6조",
    title: "교통비 규정",
    desc: "22:00 이전 퇴근 택시",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  ARTICLE_7: {
    no: "제7조",
    title: "증빙 규정",
    desc: "3만원 이상 간이영수증",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
  },
  ARTICLE_8: {
    no: "제8조",
    title: "접대비 규정",
    desc: "30만원 초과 사전품의 누락",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  },
  ARTICLE_9_1: {
    no: "제9조 ①",
    title: "제출 기한",
    desc: "30일 초과 지연 제출",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
  },
  ARTICLE_9_2: {
    no: "제9조 ②",
    title: "중복 제출",
    desc: "동일 일자/가맹점/금액 중복",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
  },
};
