import { ReviewInput, AnalyzedReview } from './types';

const SYSTEM_PROMPT = `당신은 생활가전 쇼핑몰 「하루살림」 무선 청소기 「클린핏 미니」 전문 리뷰 분석기입니다.
주어진 모든 리뷰 데이터를 분석하여 각 리뷰별 분석 결과를 JSON 배열 형태로 정확히 반환하세요.

[분석 기준표 원칙]
1. [감성] (sentiment) 판단 원칙:
- 절대 원본 별점 숫자를 기준으로 판단하지 말고, 오직 리뷰 텍스트의 문맥과 어조를 중심으로 판단합니다.
- '긍정', '부정', '중립', '광고' 중 정확히 하나로 분류합니다.
- [반어법 주의]: 비꼬거나 반어적인 표현은 반드시 '부정'으로 분류합니다. (예: "배송 정말 빠르네요^^ 주문하고 딱 12일 만에 왔어요", "소리 조용하네요~ 옆집에서 공사하는 줄" 등은 불만/비꼼이므로 반드시 '부정')
- [광고 제외]: 리뷰 본문에 체험단, 원고료, 무상제공, 할인링크 등 홍보성 문구가 포함된 리뷰는 반드시 '광고'로 분류합니다.
- [혼합 및 중립]: 긍정과 부정 내용이 혼합된 경우, 문맥상 비중이 더 크거나 감정이 더 강한 쪽을 따르고, 대등하게 병기된 경우 '중립'으로 분류합니다.

2. [유형] (categories) 분류 원칙:
- 리뷰에서 언급된 주요 주제/불만을 아래 14개 표준 유형 중에서 선택합니다:
  ['배터리', '흡입력', '소음', '무게·사용감', '디자인', '관리·청소', '구성품', '품질·불량', '배송', '포장', '고객센터', '가격', '설명서', '기타']
- 하나의 리뷰에서 복수의 주제를 언급한 경우 쉼표로 연결하여 모두 표기합니다 (예: "배터리, 흡입력").

3. [따로 뽑기]:
- 개선 요청 (improvement_request): "~면 좋겠어요", "~해 주세요", "~있으면 좋겠다", "~개선 바랍니다", "~했으면" 등 고객이 제품 또는 서비스에 요구하는 개선점, 바라는 점을 본문에서 정확히 추출합니다. 없으면 빈 문자열("")로 반환합니다.
- 안전 이슈 (is_safety_issue): 발열, 뜨거움(충전기/본체 과열), 탄 냄새, 연기, 감전, 스파크, 누전, 폭발 등 안전 위해와 관련된 내용이나 정황이 있으면 무조건 true로 지정합니다. 그렇지 않으면 false로 지정합니다.

[출력 형식]
반드시 다음 스키마를 만족하는 순수 JSON 배열만 출력하세요:
[
  {
    "review_no": 1,
    "sentiment": "긍정" | "부정" | "중립" | "광고",
    "categories": "흡입력",
    "improvement_request": "",
    "is_safety_issue": false
  }
]
- 원본 리뷰와 1:1로 대응되는 review_no를 반드시 유지해야 합니다.
- 임의의 데이터나 가짜 내용을 생성하지 마십시오.`;

interface GeminiApiRawItem {
  review_no: number;
  sentiment: '긍정' | '부정' | '중립' | '광고';
  categories: string;
  improvement_request?: string;
  is_safety_issue?: boolean;
}

export async function analyzeReviewsWithGemini(
  reviews: ReviewInput[]
): Promise<{
  analyzedReviews: AnalyzedReview[];
  modelUsed: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  const promptContent = `다음은 분석해야 할 「클린핏 미니」 전체 리뷰 목록 (${reviews.length}건)입니다.
전체 리뷰를 분할 없이 단 한 번에 분석하여 기준표에 맞춘 JSON 배열로 응답해 주세요.

리뷰 데이터:
${JSON.stringify(reviews, null, 2)}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          { text: promptContent }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const primaryModel = 'gemini-3.8-flash';
  const fallbackModel = 'gemini-3.5-flash-lite';

  let selectedModel = primaryModel;
  let responseData: any = null;

  // Primary attempt: gemini-3.8-flash
  const primaryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent`;
  
  let response = await fetch(primaryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(requestBody)
  });

  // PRD: 트래픽 과부하(HTTP 503 Service Unavailable) 발생 시, gemini-3.5-flash-lite 모델로 1회에 한하여 재전송(Fallback) 실행
  if (response.status === 503) {
    console.warn(`[Gemini API] ${primaryModel} returned 503 Service Unavailable. Falling back to ${fallbackModel}...`);
    selectedModel = fallbackModel;
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent`;
    
    response = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  responseData = await response.json();
  const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText || !rawText.trim()) {
    throw new Error('Gemini API returned an empty response');
  }

  let parsedItems: GeminiApiRawItem[];
  try {
    parsedItems = JSON.parse(rawText);
    if (!Array.isArray(parsedItems)) {
      throw new Error('Parsed response is not an array');
    }
  } catch (err) {
    throw new Error('Failed to parse Gemini response as JSON array');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Map back to original review inputs to construct full AnalyzedReview
  const reviewMap = new Map<number, ReviewInput>();
  reviews.forEach(r => reviewMap.set(r.review_no, r));

  const analyzedReviews: AnalyzedReview[] = parsedItems.map((item) => {
    const original = reviewMap.get(item.review_no);
    return {
      analyzed_on: todayStr,
      review_no: item.review_no,
      written_on: original?.written_on || '',
      rating: original?.rating ?? 0,
      review_text: original?.review_text || '',
      sentiment: item.sentiment || '중립',
      categories: item.categories || '기타',
      improvement_request: item.improvement_request || '',
      is_safety_issue: Boolean(item.is_safety_issue),
      model_used: selectedModel
    };
  });

  return {
    analyzedReviews,
    modelUsed: selectedModel
  };
}
