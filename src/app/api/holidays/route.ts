import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface HolidayItem {
  dateKind?: string;
  dateName: string;
  isHoliday: string;
  locdate: number | string;
  seq?: number;
}

// YYYYMMDD -> YYYY-MM-DD
function formatLocdate(locdate: number | string): string {
  const str = String(locdate);
  return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
}

async function fetchFromPublicApi(year: string, month: string): Promise<HolidayItem[]> {
  const apiKey = process.env.HOLIDAY_API_KEY || '';
  if (!apiKey) {
    console.warn('HOLIDAY_API_KEY is not defined.');
    return [];
  }

  // month: 2자리 문자열
  const solMonth = month.padStart(2, '0');
  const decodedKey = decodeURIComponent(apiKey);
  const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${encodeURIComponent(decodedKey)}&solYear=${year}&solMonth=${solMonth}&_type=json`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`공공데이터 API 호출 실패 (${year}-${month}):`, res.statusText);
      return [];
    }
    const data = await res.json();
    const items = data?.response?.body?.items?.item;

    if (!items) return [];
    if (Array.isArray(items)) {
      return items.filter((it: HolidayItem) => it.isHoliday === 'Y');
    }
    if (typeof items === 'object' && items.isHoliday === 'Y') {
      return [items];
    }
    return [];
  } catch (error) {
    console.error(`공공데이터 API 파싱 실패 (${year}-${month}):`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year') || '2026';
  const monthParam = searchParams.get('month'); // 예: '09' 또는 비어있음
  const monthsParam = searchParams.get('months'); // 예: '2026-03,2026-04,2026-05'

  // 대상 월 목록 계산
  let targetYearMonths: string[] = [];
  if (monthsParam) {
    targetYearMonths = monthsParam.split(',').map((m) => m.trim());
  } else if (monthParam) {
    targetYearMonths = [`${yearParam}-${monthParam.padStart(2, '0')}`];
  } else {
    // 기본적으로 2026년 1월 ~ 12월
    for (let m = 1; m <= 12; m++) {
      targetYearMonths.push(`${yearParam}-${String(m).padStart(2, '0')}`);
    }
  }

  try {
    // 1. Supabase holidays 테이블에서 기존 캐시 데이터 조회
    const { data: cachedHolidays, error: dbError } = await supabase
      .from('holidays')
      .select('*')
      .in('year_month', targetYearMonths);

    if (dbError) {
      console.error('Supabase holidays 조회 에러:', dbError);
    }

    const cachedByMonth: Record<string, any[]> = {};
    (cachedHolidays || []).forEach((h) => {
      if (!cachedByMonth[h.year_month]) {
        cachedByMonth[h.year_month] = [];
      }
      cachedByMonth[h.year_month].push(h);
    });

    // 2. 캐시가 없는 월 확인 및 공공데이터포털 API 호출 후 캐싱 저장
    for (const ym of targetYearMonths) {
      // 캐시가 비어있는 경우 (또는 확인된 적 없는 월)
      // 주의: 공휴일이 0개인 달도 있을 수 있으므로 캐시 테이블에 유무 판단
      if (cachedByMonth[ym] === undefined) {
        const [y, m] = ym.split('-');
        const apiItems = await fetchFromPublicApi(y, m);

        if (apiItems.length > 0) {
          const insertPayload = apiItems.map((item) => ({
            year_month: ym,
            holiday_date: formatLocdate(item.locdate),
            date_name: item.dateName,
            is_holiday: true,
          }));

          // DB에 upsert 캐싱 저장
          const { error: insertError } = await supabase
            .from('holidays')
            .upsert(insertPayload, { onConflict: 'holiday_date' });

          if (insertError) {
            console.error(`holidays 캐시 저장 에러 (${ym}):`, insertError);
          }

          cachedByMonth[ym] = insertPayload;
        } else {
          cachedByMonth[ym] = [];
        }
      }
    }

    // 3. 월별 총 공휴일 일수와 명칭 집계 결과 반환
    const result: Record<
      string,
      { count: number; names: string[]; details: { date: string; name: string }[] }
    > = {};

    for (const ym of targetYearMonths) {
      const list = cachedByMonth[ym] || [];
      // 중복 명칭 제거 (예: 추석이 3일이면 '추석' 1개로 표시하거나 날짜별 표기)
      const nameSet = Array.from(new Set(list.map((h: any) => h.date_name)));
      result[ym] = {
        count: list.length,
        names: nameSet as string[],
        details: list.map((h: any) => ({
          date: h.holiday_date,
          name: h.date_name,
        })),
      };
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Holidays route 에러:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류' },
      { status: 500 }
    );
  }
}
