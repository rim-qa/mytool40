import { NextRequest, NextResponse } from 'next/server';
import { analyzeReviewsWithGemini } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { ReviewInput } from '@/lib/types';

export const maxDuration = 60; // Allow sufficient time for single prompt LLM execution

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reviews: ReviewInput[] = body?.reviews;

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: '분석할 리뷰 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // Call Gemini with 503 fallback
    const { analyzedReviews, modelUsed } = await analyzeReviewsWithGemini(reviews);

    // Save each row into Supabase review_analysis table
    let insertSuccess = true;
    let insertErrorMsg: string | null = null;

    try {
      // Chunk inserts in batches of 50 just in case
      const BATCH_SIZE = 50;
      for (let i = 0; i < analyzedReviews.length; i += BATCH_SIZE) {
        const batch = analyzedReviews.slice(i, i + BATCH_SIZE).map(item => ({
          analyzed_on: item.analyzed_on,
          review_no: item.review_no,
          written_on: item.written_on,
          rating: item.rating,
          review_text: item.review_text,
          sentiment: item.sentiment,
          categories: item.categories,
          improvement_request: item.improvement_request,
          is_safety_issue: item.is_safety_issue,
          model_used: item.model_used
        }));

        const { error } = await supabase
          .from('review_analysis')
          .insert(batch);

        if (error) {
          console.error('[Supabase Insert Error]:', error);
          insertSuccess = false;
          insertErrorMsg = error.message;
          break;
        }
      }
    } catch (dbErr: any) {
      console.error('[Database Exception]:', dbErr);
      insertSuccess = false;
      insertErrorMsg = dbErr.message;
    }

    return NextResponse.json({
      success: true,
      modelUsed,
      analyzedReviews,
      totalCount: analyzedReviews.length,
      savedToDatabase: insertSuccess,
      databaseError: insertErrorMsg
    });
  } catch (error: any) {
    console.error('[Analyze API Error]:', error);
    return NextResponse.json(
      {
        error: error.message || '리뷰 분석 처리 중 오류가 발생했습니다.',
        fallbackMessage: '불러오지 못했습니다'
      },
      { status: 500 }
    );
  }
}
