'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  Coffee, 
  Store, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';

const BRANCH_LIST = ['용산역점', '삼각지점', '이태원점', '효창공원점', '한남점'];

// 월 목록 생성 (2026-01 ~ 2026-12)
const getMonthOptions = () => {
  const options = [];
  for (let m = 1; m <= 12; m++) {
    const monthStr = m < 10 ? `0${m}` : `${m}`;
    options.push(`2026-${monthStr}`);
  }
  return options;
};

// 기본 직전 달 계산 (10월 접속 시 2026-09)
const getDefaultPreviousMonth = () => {
  const now = new Date();
  // 2026년 기준 직전 달 로직
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (9월이면 8, 10월이면 9)
  
  if (month === 0) {
    return `${year - 1}-12`;
  }
  const prevMonth = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${prevMonth}`;
};

export default function SubmitPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [salesAmountInput, setSalesAmountInput] = useState<string>('');
  const [customerCountInput, setCustomerCountInput] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  // 상태 관리
  const [checkingExisting, setCheckingExisting] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [showAlreadyRegisteredModal, setShowAlreadyRegisteredModal] = useState<boolean>(false);
  
  // 확인 모달 및 성공 모달
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string>('');

  // 초기 직전 달 설정
  useEffect(() => {
    const defaultM = getDefaultPreviousMonth();
    setSelectedMonth(defaultM);
  }, []);

  // 월 또는 지점 변경 시 이미 등록된 데이터인지 확인
  useEffect(() => {
    if (!selectedMonth || !selectedBranch) {
      setExistingRecord(null);
      return;
    }

    let isMounted = true;
    const checkDuplicate = async () => {
      setCheckingExisting(true);
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .eq('월', selectedMonth)
          .eq('지점', selectedBranch)
          .maybeSingle();

        if (error) {
          console.error('기존 데이터 확인 오류:', error);
          return;
        }

        if (isMounted) {
          if (data) {
            setExistingRecord(data);
            setShowAlreadyRegisteredModal(true);
          } else {
            setExistingRecord(null);
          }
        }
      } catch (err) {
        console.error('조회 중 에러 발생:', err);
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    };

    checkDuplicate();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedBranch]);

  // 매출액 입력 핸들러 (숫자만, 천 단위 콤마)
  const handleSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setSalesAmountInput('');
      return;
    }
    const formatted = Number(rawValue).toLocaleString('ko-KR');
    setSalesAmountInput(formatted);
  };

  // 객수 입력 핸들러 (숫자만, 천 단위 콤마)
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setCustomerCountInput('');
      return;
    }
    const formatted = Number(rawValue).toLocaleString('ko-KR');
    setCustomerCountInput(formatted);
  };

  // 순수 숫자 값
  const rawSales = salesAmountInput ? parseInt(salesAmountInput.replace(/,/g, ''), 10) : 0;
  const rawCustomers = customerCountInput ? parseInt(customerCountInput.replace(/,/g, ''), 10) : 0;
  const avgTicket = rawCustomers > 0 ? Math.round(rawSales / rawCustomers) : 0;

  // 폼 제출 전 검증 및 확인 모달 띄우기
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMonth) {
      alert('매출 기준 월을 선택해 주세요.');
      return;
    }
    if (!selectedBranch) {
      alert('지점을 선택해 주세요.');
      return;
    }
    if (!rawSales || rawSales <= 0) {
      alert('매출액을 정확히 입력해 주세요.');
      return;
    }
    if (!rawCustomers || rawCustomers <= 0) {
      alert('객수를 정확히 입력해 주세요.');
      return;
    }

    if (existingRecord) {
      setShowAlreadyRegisteredModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  // 최종 저장 실행
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitErrorMessage('');

    try {
      // 1. 중복 재검증
      const { data: duplicateCheck } = await supabase
        .from('sales')
        .select('id')
        .eq('월', selectedMonth)
        .eq('지점', selectedBranch)
        .maybeSingle();

      if (duplicateCheck) {
        setShowConfirmModal(false);
        setExistingRecord(duplicateCheck);
        setShowAlreadyRegisteredModal(true);
        setIsSubmitting(false);
        return;
      }

      // 2. 신규 데이터 등록
      const { error: insertError } = await supabase
        .from('sales')
        .insert([
          {
            월: selectedMonth,
            지점: selectedBranch,
            매출액: rawSales,
            객수: rawCustomers,
            비고: memo.trim(),
          },
        ]);

      if (insertError) {
        console.error('등록 실패:', insertError);
        setSubmitErrorMessage(`등록 중 오류가 발생했습니다: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      }

      // 성공 처리
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('저장 예외:', err);
      setSubmitErrorMessage('예기치 못한 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 성공 후 새 입력 리셋
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSalesAmountInput('');
    setCustomerCountInput('');
    setMemo('');
    setSelectedBranch('');
    setExistingRecord(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/50 via-slate-50 to-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* 상단 헤더 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-700 text-amber-50 flex items-center justify-center shadow-sm">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-800 tracking-wide bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                  오늘의원두 가맹관리
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-1">지점장 월 매출 등록</h1>
              </div>
            </div>
            <Link
              href="/sales"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              대시보드 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-sm text-slate-600 mt-3 border-t border-slate-100 pt-3">
            각 지점의 월별 매출액과 객수를 정확히 입력해 주세요. 등록된 데이터는 본사 대시보드에 실시간 집계됩니다.
          </p>
        </div>

        {/* 메인 입력 폼 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
          <form onSubmit={handleSubmitClick} className="space-y-6">
            {/* 1. 매출 기준 월 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                <Calendar className="w-4 h-4 text-amber-700 mr-2" />
                매출 기준 월 <span className="text-rose-500 ml-1">*</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition"
              >
                {getMonthOptions().map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.split('-')[0]}년 {parseInt(opt.split('-')[1], 10)}월
                    {opt === getDefaultPreviousMonth() ? ' (직전 달)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1.5">
                기본값은 직전 달({getDefaultPreviousMonth()})로 자동 선택됩니다.
              </p>
            </div>

            {/* 2. 지점 선택 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                <Store className="w-4 h-4 text-amber-700 mr-2" />
                지점 선택 <span className="text-rose-500 ml-1">*</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition"
              >
                <option value="">지점을 선택해 주세요</option>
                {BRANCH_LIST.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>

              {checkingExisting && (
                <div className="flex items-center text-xs text-amber-700 mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  기존 등록 여부 확인 중...
                </div>
              )}

              {existingRecord && !checkingExisting && (
                <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
                  <Lock className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{selectedMonth} {selectedBranch}</span> 데이터가 이미 등록되어 있습니다.
                    <br />
                    수정이 필요한 경우 본사 영업관리팀으로 문의해 주세요.
                  </div>
                </div>
              )}
            </div>

            {/* 3. 매출액 입력 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                <DollarSign className="w-4 h-4 text-amber-700 mr-2" />
                총 매출액 (원) <span className="text-rose-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 54,320,000"
                  disabled={Boolean(existingRecord)}
                  value={salesAmountInput}
                  onChange={handleSalesChange}
                  className={`w-full h-12 pl-4 pr-12 rounded-xl border ${
                    existingRecord ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                  } border-slate-300 text-slate-900 font-semibold text-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  원
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">숫자만 입력 시 콤마(,)가 자동 표기됩니다.</p>
            </div>

            {/* 4. 객수 입력 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                <Users className="w-4 h-4 text-amber-700 mr-2" />
                총 방문 객수 (명) <span className="text-rose-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 6,820"
                  disabled={Boolean(existingRecord)}
                  value={customerCountInput}
                  onChange={handleCustomerChange}
                  className={`w-full h-12 pl-4 pr-12 rounded-xl border ${
                    existingRecord ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                  } border-slate-300 text-slate-900 font-semibold text-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  명
                </span>
              </div>
            </div>

            {/* 실시간 객단가 미리보기 카드 */}
            {rawSales > 0 && rawCustomers > 0 && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between text-amber-900">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-medium">예상 객단가 (매출액 ÷ 객수)</span>
                </div>
                <div className="font-bold text-base text-amber-800">
                  {avgTicket.toLocaleString('ko-KR')}원 / 명
                </div>
              </div>
            )}

            {/* 5. 비고란 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                <FileText className="w-4 h-4 text-amber-700 mr-2" />
                비고 <span className="text-slate-400 font-normal text-xs ml-1">(선택 사항)</span>
              </label>
              <textarea
                rows={3}
                disabled={Boolean(existingRecord)}
                placeholder="예: 추석 연휴 3일 단축 영업, 매장 앞 도로 공사 등 특이사항 기재"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className={`w-full p-3.5 rounded-xl border ${
                  existingRecord ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                } border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition resize-none`}
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={Boolean(existingRecord) || checkingExisting || !selectedBranch || rawSales <= 0 || rawCustomers <= 0}
              className={`w-full h-13 py-3.5 rounded-xl font-bold text-base transition flex items-center justify-center shadow-md ${
                existingRecord || !selectedBranch || rawSales <= 0 || rawCustomers <= 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-amber-800 hover:bg-amber-900 text-white active:scale-[0.99]'
              }`}
            >
              {existingRecord ? '이미 등록된 데이터가 있습니다 (잠김)' : '매출 데이터 제출하기'}
            </button>
          </form>
        </div>

        {/* 풋터 안내 */}
        <p className="text-center text-xs text-slate-400 mt-6">
          카페 프랜차이즈 「오늘의원두」 본사 영업관리 시스템
        </p>
      </div>

      {/* 이미 등록된 데이터 안내 모달 */}
      {showAlreadyRegisteredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              이미 등록된 데이터입니다
            </h3>
            <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
              <span className="font-semibold text-slate-800">{selectedMonth} {selectedBranch}</span> 데이터가 이미 등록되어 있습니다.
              <br /><br />
              지점장은 기존 데이터를 직접 수정할 수 없으며, 수정이 필요한 경우 <strong>본사 영업관리팀</strong>으로 문의해 주세요.
            </p>
            <button
              type="button"
              onClick={() => setShowAlreadyRegisteredModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 최종 제출 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              제출 내용 확인
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              입력하신 내용이 맞는지 다시 한번 확인해 주세요.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm mb-6 border border-slate-200/60">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">대상 월</span>
                <span className="font-bold text-slate-800">{selectedMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">지점명</span>
                <span className="font-bold text-amber-800">{selectedBranch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">매출액</span>
                <span className="font-bold text-slate-900 text-base">{salesAmountInput}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">객수</span>
                <span className="font-bold text-slate-900">{customerCountInput}명</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500 font-medium">예상 객단가</span>
                <span className="font-semibold text-amber-700">{avgTicket.toLocaleString('ko-KR')}원</span>
              </div>
              {memo.trim() && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-medium block mb-1">비고</span>
                  <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 text-xs whitespace-pre-wrap">
                    {memo}
                  </p>
                </div>
              )}
            </div>

            {submitErrorMessage && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {submitErrorMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-3 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center shadow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    등록 중...
                  </>
                ) : (
                  '최종 등록'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 성공 완료 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              성공적으로 등록되었습니다
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              <span className="font-semibold text-slate-800">{selectedMonth} {selectedBranch}</span> 매출 데이터가 안전하게 저장되었습니다.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSuccessClose}
                className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-xl text-sm transition shadow"
              >
                추가 등록하기
              </button>
              <Link
                href="/sales"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition block text-center"
              >
                대시보드로 이동
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
