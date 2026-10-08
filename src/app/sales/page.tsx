'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Coffee,
  Store,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  RefreshCw,
  Filter,
  BarChart2,
  LineChart as LineChartIcon,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

const BRANCH_LIST = ['용산역점', '삼각지점', '이태원점', '효창공원점', '한남점'];

interface SaleRecord {
  id: string | number;
  월: string;
  지점: string;
  매출액: number;
  객수: number;
  비고?: string;
  created_at?: string;
}

interface HolidayData {
  count: number;
  names: string[];
  details: { date: string; name: string }[];
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [holidays, setHolidays] = useState<Record<string, HolidayData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 필터 및 차트 형태 상태
  const [selectedBranch, setSelectedBranch] = useState<string>('전체');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 데이터 로드 (매출 데이터 & 공휴일 API)
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      // 1. Supabase에서 매출 데이터 전체 조회 (월 기준 오름차순)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('월', { ascending: true });

      if (salesError) {
        console.error('매출 데이터 조회 에러:', salesError);
      } else if (salesData) {
        setSales(salesData as SaleRecord[]);
      }

      // 2. 공공데이터 공휴일 API 호출 (우리 API Route)
      try {
        const holidayRes = await fetch('/api/holidays?year=2026');
        const holidayJson = await holidayRes.json();
        if (holidayJson.success && holidayJson.data) {
          setHolidays(holidayJson.data);
        }
      } catch (hErr) {
        console.error('공휴일 API 조회 실패:', hErr);
      }
    } catch (err) {
      console.error('대시보드 데이터 조회 실패:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 월 목록 고유값 (정렬)
  const uniqueMonths = useMemo(() => {
    const months = Array.from(new Set(sales.map((s) => s.월)));
    return months.sort();
  }, [sales]);

  // 가장 최근 월과 직전 월
  const latestMonth = uniqueMonths.length > 0 ? uniqueMonths[uniqueMonths.length - 1] : '2026-09';
  const prevMonth = uniqueMonths.length > 1 ? uniqueMonths[uniqueMonths.length - 2] : null;

  // 필터링된 데이터
  const filteredSales = useMemo(() => {
    if (selectedBranch === '전체') return sales;
    return sales.filter((s) => s.지점 === selectedBranch);
  }, [sales, selectedBranch]);

  // KPI 요약 데이터 계산
  const kpiData = useMemo(() => {
    const currentMonthSales = filteredSales.filter((s) => s.월 === latestMonth);
    const prevMonthSales = prevMonth ? filteredSales.filter((s) => s.월 === prevMonth) : [];

    const totalSalesCurrent = currentMonthSales.reduce((acc, cur) => acc + Number(cur.매출액), 0);
    const totalCustomersCurrent = currentMonthSales.reduce((acc, cur) => acc + Number(cur.객수), 0);
    const avgTicketCurrent =
      totalCustomersCurrent > 0 ? Math.round(totalSalesCurrent / totalCustomersCurrent) : 0;

    const totalSalesPrev = prevMonthSales.reduce((acc, cur) => acc + Number(cur.매출액), 0);
    const totalCustomersPrev = prevMonthSales.reduce((acc, cur) => acc + Number(cur.객수), 0);

    let salesGrowthRate = 0;
    if (totalSalesPrev > 0) {
      salesGrowthRate = ((totalSalesCurrent - totalSalesPrev) / totalSalesPrev) * 100;
    }

    const currentHolidayInfo = holidays[latestMonth] || { count: 0, names: [] };

    return {
      latestMonth,
      totalSalesCurrent,
      totalCustomersCurrent,
      avgTicketCurrent,
      salesGrowthRate,
      salesDiff: totalSalesCurrent - totalSalesPrev,
      holidayCount: currentHolidayInfo.count,
      holidayNames: currentHolidayInfo.names,
    };
  }, [filteredSales, latestMonth, prevMonth, holidays]);

  // 차트용 월별 데이터 집계
  const chartData = useMemo(() => {
    return uniqueMonths.map((month) => {
      const monthRecords = filteredSales.filter((s) => s.월 === month);
      const totalAmount = monthRecords.reduce((acc, cur) => acc + Number(cur.매출액), 0);
      const totalCust = monthRecords.reduce((acc, cur) => acc + Number(cur.객수), 0);
      const avgPrice = totalCust > 0 ? Math.round(totalAmount / totalCust) : 0;

      const holidayInfo = holidays[month] || { count: 0, names: [] };
      const holidayNameText = holidayInfo.names && holidayInfo.names.length > 0 
        ? holidayInfo.names.join(', ') 
        : '공휴일 없음';

      // 포맷된 월 라벨 (예: '2026-09' -> '9월' 또는 '26년 9월')
      const [y, m] = month.split('-');
      const formattedLabel = `${parseInt(m, 10)}월`;

      return {
        month,
        formattedLabel,
        매출액: totalAmount,
        매출액백만: Math.round(totalAmount / 1000000), // 백만원 단위
        객수: totalCust,
        객단가: avgPrice,
        공휴일수: holidayInfo.count,
        공휴일명칭: holidayNameText,
        지점수: monthRecords.length,
      };
    });
  }, [uniqueMonths, filteredSales, holidays]);

  // 커스텀 공휴일 연계 툴팁 (핵심 요구사항)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2.5">
            <span className="font-bold text-sm text-amber-400">
              {item.month} ({item.formattedLabel})
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedBranch === '전체' ? '5개 지점 합계' : selectedBranch}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">매출액</span>
              <span className="font-bold text-white text-sm">
                {Number(item.매출액).toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">총 객수</span>
              <span className="font-semibold text-slate-200">
                {Number(item.객수).toLocaleString('ko-KR')}명
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">평균 객단가</span>
              <span className="font-semibold text-amber-300">
                {Number(item.객단가).toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>

          {/* 공휴일 정보 카드 (핵심) */}
          <div className="mt-3 pt-2.5 border-t border-slate-700/70 bg-slate-800/80 -mx-2 -mb-2 p-2.5 rounded-lg">
            <div className="flex items-center justify-between text-rose-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                공휴일 정보
              </span>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px]">
                총 {item.공휴일수}일
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-normal leading-tight">
              {item.공휴일수 > 0 ? item.공휴일명칭 : '해당 월 법정 공휴일 없음'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* 1. 상단 내비게이션 바 */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-50 flex items-center justify-center shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                  오늘의원두
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">|</span>
                <span className="text-xs text-slate-500 hidden sm:inline">대표이사 & 영업관리팀</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                지점 매출 통합 대시보드
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              title="데이터 새로고침"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-700' : ''}`} />
            </button>

            {/* 지점장 등록 바로가기 버튼 */}
            <Link
              href="/sales/submit"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>지점 매출 입력</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 2. 지점 선택 필터 & 컨트롤 바 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 flex items-center mr-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
              지점 필터:
            </span>
            <button
              onClick={() => setSelectedBranch('전체')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0 ${
                selectedBranch === '전체'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              전체 지점 합계
            </button>
            {BRANCH_LIST.map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0 ${
                  selectedBranch === branch
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between md:justify-end space-x-3 text-xs">
            <span className="text-slate-400">차트 형태:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`inline-flex items-center px-2.5 py-1 rounded-lg font-medium transition ${
                  chartType === 'bar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 mr-1" /> 막대 차트
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`inline-flex items-center px-2.5 py-1 rounded-lg font-medium transition ${
                  chartType === 'line' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5 mr-1" /> 꺾은선 차트
              </button>
            </div>
          </div>
        </div>

        {/* 3. 상단 KPI 요약 카드 (당월 기준) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 카드 1: 당월 전체 매출 합계 & 전월대비 증감 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">
                {kpiData.latestMonth} 총 매출액 ({selectedBranch})
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpiData.totalSalesCurrent.toLocaleString('ko-KR')}
              <span className="text-sm font-semibold text-slate-500 ml-1">원</span>
            </div>
            <div className="mt-3 flex items-center text-xs">
              {prevMonth ? (
                <>
                  <span
                    className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                      kpiData.salesGrowthRate >= 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}
                  >
                    {kpiData.salesGrowthRate >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(kpiData.salesGrowthRate).toFixed(1)}%
                  </span>
                  <span className="text-slate-400">
                    전월 대비 {kpiData.salesDiff >= 0 ? '+' : ''}
                    {(kpiData.salesDiff / 10000).toLocaleString('ko-KR')}만원
                  </span>
                </>
              ) : (
                <span className="text-slate-400">전월 데이터 없음</span>
              )}
            </div>
          </div>

          {/* 카드 2: 당월 총 객수 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">당월 총 방문 객수</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpiData.totalCustomersCurrent.toLocaleString('ko-KR')}
              <span className="text-sm font-semibold text-slate-500 ml-1">명</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {kpiData.latestMonth}월 등록 기준 총 고객 수
            </p>
          </div>

          {/* 카드 3: 당월 객단가 (매출액 ÷ 객수) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">당월 평균 객단가</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpiData.avgTicketCurrent.toLocaleString('ko-KR')}
              <span className="text-sm font-semibold text-slate-500 ml-1">원 / 명</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              총 매출액 ÷ 총 고객 수
            </p>
          </div>

          {/* 카드 4: 당월 공휴일 일수 배지 (핵심 요구사항) */}
          <div className="bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 rounded-2xl p-5 border border-rose-200/80 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between text-rose-800 mb-2">
              <span className="text-xs font-bold flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-rose-600" />
                {kpiData.latestMonth} 공휴일 배지
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
              총 {kpiData.holidayCount}일
            </div>
            <div className="mt-3 text-xs text-slate-600 truncate font-medium" title={kpiData.holidayNames?.join(', ')}>
              {kpiData.holidayNames && kpiData.holidayNames.length > 0 ? (
                <>
                  <span className="text-rose-700 font-semibold">
                    {kpiData.holidayNames.join(', ')}
                  </span>
                  <span className="text-slate-400 ml-1">포함</span>
                </>
              ) : (
                <span className="text-slate-400">법정 공휴일 없음</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. 매출 차트 영역 (Recharts & 공휴일 툴팁) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">
                  월별 매출 추이 및 공휴일 연계 분석
                </h2>
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded">
                  {selectedBranch}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                차트 막대나 선에 마우스를 올리면 <strong>[매출액 / 객수 / 공휴일 수 및 공휴일 명칭]</strong>이 표시됩니다.
              </p>
            </div>
          </div>

          <div className="w-full h-[360px] sm:h-[400px]">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="formattedLabel"
                      tickLine={false}
                      stroke="#94a3b8"
                      fontSize={12}
                      fontWeight={500}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 10000000).toFixed(0)}천만`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    />
                    <Bar
                      name="매출액 (원)"
                      dataKey="매출액"
                      fill="#92400e"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={56}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.month === latestMonth
                              ? '#78350f'
                              : entry.공휴일수 >= 3
                              ? '#b45309'
                              : '#d97706'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="formattedLabel"
                      tickLine={false}
                      stroke="#94a3b8"
                      fontSize={12}
                      fontWeight={500}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 10000000).toFixed(0)}천만`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    />
                    <Line
                      name="매출액 (원)"
                      type="monotone"
                      dataKey="매출액"
                      stroke="#78350f"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#78350f', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#b45309' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                데이터를 불러오는 중입니다...
              </div>
            )}
          </div>
        </div>

        {/* 5. 월별 상세 내역 표 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <FileSpreadsheet className="w-4 h-4 text-amber-700 mr-2" />
                월별 상세 매출 및 공휴일 내역 표
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                등록된 전체 매출 내역과 공휴일, 객단가 및 특이사항(비고)을 한눈에 조회합니다.
              </p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full self-start sm:self-auto">
              총 {filteredSales.length}건
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">월</th>
                  <th className="py-3.5 px-4">지점</th>
                  <th className="py-3.5 px-4 text-right">매출액 (원)</th>
                  <th className="py-3.5 px-4 text-right">객수 (명)</th>
                  <th className="py-3.5 px-4 text-right">객단가 (원)</th>
                  <th className="py-3.5 px-4 text-center">공휴일 수</th>
                  <th className="py-3.5 px-4">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length > 0 ? (
                  filteredSales.map((item) => {
                    const monthHolidays = holidays[item.월];
                    const holidayCount = monthHolidays ? monthHolidays.count : 0;
                    const holidayNames = monthHolidays?.names ? monthHolidays.names.join(', ') : '-';
                    const unitPrice =
                      item.객수 > 0 ? Math.round(Number(item.매출액) / Number(item.객수)) : 0;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-amber-50/30 transition duration-150"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                          {item.월}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium text-xs bg-slate-100 text-slate-800">
                            {item.지점}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {Number(item.매출액).toLocaleString('ko-KR')}원
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 whitespace-nowrap">
                          {Number(item.객수).toLocaleString('ko-KR')}명
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-amber-900 whitespace-nowrap">
                          {unitPrice.toLocaleString('ko-KR')}원
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {holidayCount > 0 ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60"
                              title={holidayNames}
                            >
                              {holidayCount}일 ({holidayNames})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.비고}>
                          {item.비고 ? (
                            <span className="inline-block bg-amber-50 border border-amber-200/60 text-amber-900 px-2 py-0.5 rounded text-xs font-medium">
                              {item.비고}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      등록된 매출 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-slate-400">
        카페 프랜차이즈 「오늘의원두」 통합 매출 관리 대시보드 | Powered by Next.js & Supabase
      </footer>
    </div>
  );
}
