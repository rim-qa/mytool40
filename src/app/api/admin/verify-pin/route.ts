import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    const serverPin = process.env.ADMIN_SECRET_PIN || '2026';

    if (String(pin).trim() === String(serverPin).trim()) {
      return NextResponse.json({ success: true, message: '인증되었습니다.' });
    } else {
      return NextResponse.json(
        { success: false, message: '비밀번호(PIN)가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
