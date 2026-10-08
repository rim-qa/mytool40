import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  BarChart3,
  MessageSquareText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function HomeDashboard() {
  const tools = [
    {
      id: 'expense',
      title: '경비 정산 검사기',
      subtitle: '법인카드 & 영수증 규정 자동 검증',
      href: '/expense',
      color: 'blue',
      badge: '규정 룰 엔진 v1.0',
      icon: ShieldCheck,
      description:
        '정산 CSV 파일을 업로드하면 사내 경비 규정(제5조~제9조)을 실시간 검증하여 위반 내역과 사유를 계산하고, 제출자별 반려 사유 안내문을 원클릭으로 생성합니다.',
      features: [
        '식대·교통비·접대비 한도 및 시간 규정 자동 검증',
        '간이영수증 3만원 초과 및 30일 경과 건 자동 적발',
        '제출자별 반려 안내문 자동 서식화 및 원클릭 클립보드 복사',
      ],
      ctaText: '경비 검사기 열기',
    },
    {
      id: 'sales',
      title: '지점 매출 관리판',
      subtitle: '오늘의원두 지점별 실시간 대시보드',
      href: '/sales',
      color: 'amber',
      badge: '공휴일 연계 분석',
      icon: BarChart3,
      description:
        '전국 5개 지점의 월별 매출, 객수, 객단가 추이를 한눈에 확인하고, 한국천문연구원 공휴일 데이터와 연계하여 영업일수 및 휴일 영향도를 다각도로 분석합니다.',
      features: [
        '전체 및 지점별 월별 매출액·객수·객단가 인터랙티브 차트',
        '공공데이터 특일 정보 연계 공휴일 상세 툴팁 & 배지',
        '지점장 간편 매출 입력(/submit) 및 관리자 수정 모드(/admin)',
      ],
      ctaText: '매출 관리판 열기',
    },
    {
      id: 'reviews',
      title: '리뷰 분석기',
      subtitle: '클린핏 미니 AI 리뷰 & 위해정보 분석',
      href: '/reviews',
      color: 'emerald',
      badge: 'Gemini AI 연동',
      icon: MessageSquareText,
      description:
        '고객 리뷰 엑셀/CSV를 업로드하여 단일 프롬프트 AI(Gemini)로 감성·불만 유형·안전 이슈를 분석하고, 한국소비자원 위해정보와 연계하여 누적 관리합니다.',
      features: [
        'Gemini 3.8 Flash 기반 정밀 감성 및 14개 유형 자동 분류',
        '한국소비자원 CISS 위해정보 연계 24시간 스마트 캐시',
        'Supabase 실시간 누적 이력 관리 및 부정 비율 추이 조회',
      ],
      ctaText: '리뷰 분석기 열기',
    },
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-200/40 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 히어로 영역 */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>단일 주소에서 모두 이용하는 스마트 워크스페이스</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            내 업무 도구함
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            필요한 업무 도구를 한곳에서 바로 실행하세요.
            <br className="hidden sm:inline" />
            상단 메뉴와 메인 카드를 통해 각 업무 도구로 즉시 이동할 수 있으며, 새로운 업무 기능도 계속 확장됩니다.
          </p>
        </section>

        {/* 세 도구 카드 그리드 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const colorClasses = {
              blue: {
                border: 'hover:border-blue-300',
                iconBg: 'bg-blue-600 text-white shadow-blue-500/25',
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
                btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
                checkColor: 'text-blue-600',
              },
              amber: {
                border: 'hover:border-amber-300',
                iconBg: 'bg-amber-700 text-white shadow-amber-600/25',
                badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
                btnBg: 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-600/20',
                checkColor: 'text-amber-700',
              },
              emerald: {
                border: 'hover:border-emerald-300',
                iconBg: 'bg-emerald-600 text-white shadow-emerald-500/25',
                badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
                checkColor: 'text-emerald-600',
              },
            }[tool.color] || {
              border: 'hover:border-blue-300',
              iconBg: 'bg-blue-600 text-white',
              badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
              btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
              checkColor: 'text-blue-600',
            };

            return (
              <div
                key={tool.id}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group ${colorClasses.border}`}
              >
                <div className="p-6 sm:p-7 space-y-4">
                  {/* 카드 헤더 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${colorClasses.iconBg} group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colorClasses.badgeBg}`}>
                      {tool.badge}
                    </span>
                  </div>

                  {/* 카드 제목 & 설명 */}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {tool.subtitle}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* 주요 기능 리스트 */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      주요 기능
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {tool.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${colorClasses.checkColor}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 카드 액션 버튼 */}
                <div className="p-6 sm:p-7 pt-0">
                  <Link
                    href={tool.href}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm ${colorClasses.btnBg}`}
                  >
                    <span>{tool.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        {/* 하단 안내 배너 */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                확장 가능한 단일 허브 아키텍처
              </p>
              <p className="text-slate-500 text-xs">
                상단 메뉴와 라우팅 구조가 모듈화되어 있어 향후 신규 도구를 메뉴 한 칸으로 언제든 손쉽게 추가할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-stretch sm:self-auto justify-center">
            <span>Route: /expense · /sales · /reviews</span>
          </div>
        </section>
      </div>
    </main>
  );
}
