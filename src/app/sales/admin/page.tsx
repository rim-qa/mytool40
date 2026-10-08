'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Plus,
  Edit2,
  Trash2,
  Coffee,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Calendar,
  Store,
  DollarSign,
  Users,
  FileText,
  LogOut,
  RefreshCw,
} from 'lucide-react';

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

export default function AdminPage() {
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // 데이터 상태
  const [salesList, setSalesList] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 필터 상태
  const [filterMonth, setFilterMonth] = useState<string>('전체');
  const [filterBranch, setFilterBranch] = useState<string>('전체');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 수정 모달 상태
  const [editRecord, setEditRecord] = useState<SaleRecord | null>(null);
  const [editSalesInput, setEditSalesInput] = useState<string>('');
  const [editCustomersInput, setEditCustomersInput] = useState<string>('');
  const [editMemo, setEditMemo] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // 신규 등록 모달 상태
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMonth, setNewMonth] = useState<string>('2026-09');
  const [newBranch, setNewBranch] = useState<string>('');
  const [newSalesInput, setNewSalesInput] = useState<string>('');
  const [newCustomersInput, setNewCustomersInput] = useState<string>('');
  const [newMemo, setNewMemo] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [addError, setAddError] = useState<string>('');

  // 삭제 확인 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<SaleRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // 알림 토스트 상태
  const [toastMessage, setToastMessage] = useState<string>('');

  // 세션 스토리지에서 인증 여부 확인
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('admin_authenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 인증되면 데이터 조회
  useEffect(() => {
    if (isAuthenticated) {
      loadSalesData();
    }
  }, [isAuthenticated]);

  // 토스트 타이머
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 데이터 불러오기
  const loadSalesData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('월', { ascending: false })
        .order('지점', { ascending: true });

      if (error) {
        console.error('데이터 조회 실패:', error);
      } else if (data) {
        setSalesList(data as SaleRecord[]);
      }
    } catch (err) {
      console.error('데이터 불러오기 예외:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // PIN 확인 핸들러
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('PIN 번호를 입력해 주세요.');
      return;
    }

    setIsVerifying(true);
    setPinError('');

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        setPinInput('');
      } else {
        setPinError(data.message || '비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setPinError('서버 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  // 월 고유 목록
  const monthOptions = useMemo(() => {
    const set = new Set(salesList.map((s) => s.월));
    return Array.from(set).sort().reverse();
  }, [salesList]);

  // 필터링된 데이터
  const filteredSales = useMemo(() => {
    return salesList.filter((item) => {
      const matchMonth = filterMonth === '전체' || item.월 === filterMonth;
      const matchBranch = filterBranch === '전체' || item.지점 === filterBranch;
      const matchSearch =
        searchTerm === '' ||
        item.지점.includes(searchTerm) ||
        (item.비고 && item.비고.includes(searchTerm)) ||
        item.월.includes(searchTerm);
      return matchMonth && matchBranch && matchSearch;
    });
  }, [salesList, filterMonth, filterBranch, searchTerm]);

  // CSV 원클릭 내보내기 (한글 깨짐 방지 UTF-8 with BOM)
  const handleExportCsv = () => {
    if (salesList.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = ['월', '지점', '매출액(원)', '객수(명)', '객단가(원)', '비고', '등록일시'];
    const rows = salesList.map((item) => {
      const unitPrice = item.객수 > 0 ? Math.round(Number(item.매출액) / Number(item.객수)) : 0;
      return [
        `"${item.월}"`,
        `"${item.지점}"`,
        Number(item.매출액),
        Number(item.객수),
        unitPrice,
        `"${(item.비고 || '').replace(/"/g, '""')}"`,
        `"${item.created_at || ''}"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = url;
    link.setAttribute('download', `오늘의원두_지점매출_전체데이터_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage('전체 데이터 CSV 다운로드가 완료되었습니다.');
  };

  // 수정 모달 열기
  const handleOpenEdit = (record: SaleRecord) => {
    setEditRecord(record);
    setEditSalesInput(Number(record.매출액).toLocaleString('ko-KR'));
    setEditCustomersInput(Number(record.객수).toLocaleString('ko-KR'));
    setEditMemo(record.비고 || '');
  };

  // 수정 저장
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    const rawSales = parseInt(editSalesInput.replace(/,/g, ''), 10);
    const rawCustomers = parseInt(editCustomersInput.replace(/,/g, ''), 10);

    if (isNaN(rawSales) || rawSales < 0) {
      alert('매출액을 정확히 입력해 주세요.');
      return;
    }
    if (isNaN(rawCustomers) || rawCustomers < 0) {
      alert('객수를 정확히 입력해 주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          매출액: rawSales,
          객수: rawCustomers,
          비고: editMemo.trim(),
        })
        .eq('id', editRecord.id);

      if (error) {
        console.error('수정 실패:', error);
        alert(`수정 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setToastMessage(`${editRecord.월} ${editRecord.지점} 데이터가 성공적으로 수정되었습니다.`);
        setEditRecord(null);
        await loadSalesData();
      }
    } catch (err: any) {
      console.error('수정 예외:', err);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 삭제 확정
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('sales').delete().eq('id', deleteTarget.id);

      if (error) {
        console.error('삭제 실패:', error);
        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setToastMessage(`${deleteTarget.월} ${deleteTarget.지점} 데이터가 삭제되었습니다.`);
        setDeleteTarget(null);
        await loadSalesData();
      }
    } catch (err) {
      console.error('삭제 예외:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 신규 수동 등록
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newMonth) {
      setAddError('월을 선택해 주세요.');
      return;
    }
    if (!newBranch) {
      setAddError('지점을 선택해 주세요.');
      return;
    }

    const rawSales = parseInt(newSalesInput.replace(/,/g, ''), 10);
    const rawCustomers = parseInt(newCustomersInput.replace(/,/g, ''), 10);

    if (isNaN(rawSales) || rawSales <= 0) {
      setAddError('매출액을 입력해 주세요.');
      return;
    }
    if (isNaN(rawCustomers) || rawCustomers <= 0) {
      setAddError('객수를 입력해 주세요.');
      return;
    }

    setIsAdding(true);
    try {
      // 중복 체크
      const { data: exist } = await supabase
        .from('sales')
        .select('id')
        .eq('월', newMonth)
        .eq('지점', newBranch)
        .maybeSingle();

      if (exist) {
        setAddError(`${newMonth} ${newBranch} 데이터가 이미 존재합니다. 목록에서 수정을 진행해 주세요.`);
        setIsAdding(false);
        return;
      }

      const { error } = await supabase.from('sales').insert([
        {
          월: newMonth,
          지점: newBranch,
          매출액: rawSales,
          객수: rawCustomers,
          비고: newMemo.trim(),
        },
      ]);

      if (error) {
        setAddError(`등록 실패: ${error.message}`);
      } else {
        setToastMessage(`${newMonth} ${newBranch} 데이터가 신규 추가되었습니다.`);
        setShowAddModal(false);
        setNewSalesInput('');
        setNewCustomersInput('');
        setNewMemo('');
        setNewBranch('');
        await loadSalesData();
      }
    } catch (err: any) {
      setAddError('데이터 등록 중 예외가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 미인증 시 PIN 모달 화면 표시
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-800 text-amber-50 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
            본사 영업관리팀 전용
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
            관리자 인증 (PIN)
          </h1>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            영업관리 권한을 확인하기 위해 지정된 비밀번호(PIN)를 입력해 주세요.
          </p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                placeholder="PIN 번호 입력"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                className="w-full h-13 text-center text-2xl font-bold tracking-[0.3em] rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition"
                autoFocus
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying || !pinInput}
              className="w-full h-12 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> 확인 중...
                </>
              ) : (
                '인증하고 관리판 열기'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
            <Link
              href="/sales"
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. 상단 관리자 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-50 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  본사 영업관리팀
                </span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  인증됨
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                지점 매출 통합 관리 및 수정
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href="/sales"
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 대시보드
            </Link>
            <button
              onClick={handleLogout}
              title="관리자 로그아웃"
              className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition font-medium flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> 로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 2. 관리자 툴바: 신규 등록, 엑셀 다운로드, 새로고침 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* 신규 월 데이터 수동 추가 버튼 */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>신규 월 데이터 수동 추가</span>
            </button>

            {/* 전체 데이터 Excel/CSV 다운로드 버튼 */}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>전체 데이터 CSV 다운로드</span>
            </button>

            <button
              onClick={loadSalesData}
              disabled={isLoading}
              className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              title="데이터 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-700' : ''}`} />
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span>
              총 등록 건수: <strong className="text-slate-900">{salesList.length}</strong>건
            </span>
            <span>|</span>
            <span>
              필터 건수: <strong className="text-amber-800">{filteredSales.length}</strong>건
            </span>
          </div>
        </div>

        {/* 3. 검색 및 필터 바 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="지점명, 비고, 대상 월 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-700"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-700"
            >
              <option value="전체">모든 월</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-700"
            >
              <option value="전체">모든 지점</option>
              {BRANCH_LIST.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. 데이터 수정 및 관리 테이블 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">월</th>
                  <th className="py-3.5 px-4">지점</th>
                  <th className="py-3.5 px-4 text-right">매출액 (원)</th>
                  <th className="py-3.5 px-4 text-right">객수 (명)</th>
                  <th className="py-3.5 px-4 text-right">객단가 (원)</th>
                  <th className="py-3.5 px-4">비고</th>
                  <th className="py-3.5 px-4 text-center">관리 (수정/삭제)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-700" />
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((item) => {
                    const unitPrice =
                      item.객수 > 0 ? Math.round(Number(item.매출액) / Number(item.객수)) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition duration-150">
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
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.비고}>
                          {item.비고 ? (
                            <span className="inline-block bg-amber-50 border border-amber-200/60 text-amber-900 px-2 py-0.5 rounded text-xs font-medium">
                              {item.비고}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1.5">
                            {/* 수정 버튼 */}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              수정
                            </button>
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      조건에 일치하는 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 5. 수정 모달 */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-700" />
                지점 매출 데이터 수정
              </h3>
              <button
                onClick={() => setEditRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs flex justify-between font-medium">
              <span>
                대상 월: <strong>{editRecord.월}</strong>
              </span>
              <span>
                지점: <strong className="text-amber-800">{editRecord.지점}</strong>
              </span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  매출액 (원)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editSalesInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setEditSalesInput(raw ? Number(raw).toLocaleString('ko-KR') : '');
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  객수 (명)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editCustomersInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setEditCustomersInput(raw ? Number(raw).toLocaleString('ko-KR') : '');
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  비고
                </label>
                <textarea
                  rows={3}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  placeholder="단축영업, 도로공사 등 특이사항"
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-xs resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setEditRecord(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-xl text-xs transition shadow flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> 저장 중...
                    </>
                  ) : (
                    '수정 내용 저장'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. 신규 수동 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-700" />
                신규 월 매출 데이터 수동 추가
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  대상 월
                </label>
                <input
                  type="text"
                  placeholder="예: 2026-10"
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  지점 선택
                </label>
                <select
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-sm bg-white"
                  required
                >
                  <option value="">지점을 선택하세요</option>
                  {BRANCH_LIST.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  매출액 (원)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 50,000,000"
                  value={newSalesInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setNewSalesInput(raw ? Number(raw).toLocaleString('ko-KR') : '');
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  객수 (명)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 6,000"
                  value={newCustomersInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setNewCustomersInput(raw ? Number(raw).toLocaleString('ko-KR') : '');
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  비고 (선택)
                </label>
                <textarea
                  rows={2}
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  placeholder="특이사항 작성"
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-700 outline-none text-xs resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  disabled={isAdding}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-xl text-xs transition shadow flex items-center justify-center"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> 추가 중...
                    </>
                  ) : (
                    '신규 데이터 등록'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              데이터를 정말 삭제하시겠습니까?
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              <span className="font-bold text-slate-900">{deleteTarget.월} {deleteTarget.지점}</span> 매출 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition shadow flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> 삭제 중...
                  </>
                ) : (
                  '삭제하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
