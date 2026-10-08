import type { Metadata } from 'next';
import './globals.css';
import GlobalNavbar from '@/components/GlobalNavbar';

export const metadata: Metadata = {
  title: '내 업무 도구함 | 통합 업무 솔루션',
  description: '경비 정산 검사기, 지점 매출 관리판, 리뷰 분석기를 한 곳에서 사용하는 통합 업무 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <GlobalNavbar />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
