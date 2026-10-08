import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { HistoryGroup } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch review_analysis records
    const { data, error } = await supabase
      .from('review_analysis')
      .select('analyzed_on, sentiment')
      .order('analyzed_on', { ascending: false });

    if (error) {
      console.error('[Supabase History Query Error]:', error);
      return NextResponse.json(
        { error: error.message, fallbackMessage: '불러오지 못했습니다' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('[DEBUG /api/history] data is empty!');
      return NextResponse.json({ success: true, history: [] });
    }

    // Group by analyzed_on
    const groupMap: Record<string, { total: number; negative: number; nonAdTotal: number }> = {};

    for (const row of data) {
      const dateKey = row.analyzed_on ? String(row.analyzed_on).split('T')[0] : '날짜 미상';
      if (!groupMap[dateKey]) {
        groupMap[dateKey] = { total: 0, negative: 0, nonAdTotal: 0 };
      }
      groupMap[dateKey].total += 1;
      if (row.sentiment !== '광고') {
        groupMap[dateKey].nonAdTotal += 1;
        if (row.sentiment === '부정') {
          groupMap[dateKey].negative += 1;
        }
      }
    }

    const history: HistoryGroup[] = Object.entries(groupMap).map(([date, counts]) => {
      // Calculate negative ratio: if nonAdTotal > 0, negative / nonAdTotal * 100
      const denominator = counts.nonAdTotal > 0 ? counts.nonAdTotal : counts.total;
      const ratio = denominator > 0 ? (counts.negative / denominator) * 100 : 0;
      return {
        analyzed_on: date,
        total_count: counts.total,
        negative_count: counts.negative,
        negative_ratio: Math.round(ratio * 10) / 10
      };
    });

    // Sort newest date first
    history.sort((a, b) => b.analyzed_on.localeCompare(a.analyzed_on));

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('[History Route Error]:', error);
    return NextResponse.json(
      { error: error.message || '이력을 불러오지 못했습니다.', fallbackMessage: '불러오지 못했습니다' },
      { status: 500 }
    );
  }
}
