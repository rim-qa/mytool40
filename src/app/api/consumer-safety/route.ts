import { NextResponse } from 'next/server';
import { fetchConsumerSafetyStats } from '@/lib/consumer-safety';

export const revalidate = 86400; // 24 hours (86,400 seconds)

export async function GET() {
  try {
    const stats = await fetchConsumerSafetyStats();
    return NextResponse.json(
      { success: true, ...stats },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
        }
      }
    );
  } catch (error: any) {
    console.error('[Consumer Safety API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '소비자원 위해 정보를 가져오지 못했습니다.',
        fallbackMessage: '불러오지 못했습니다'
      },
      { status: 500 }
    );
  }
}
