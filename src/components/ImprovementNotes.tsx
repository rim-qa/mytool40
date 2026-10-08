import React, { useState, useEffect } from 'react';
import { PenTool, Save, Check, Info } from 'lucide-react';

export const ImprovementNotes: React.FC = () => {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load from local storage if available
    try {
      const saved1 = localStorage.getItem('cleanfit_action_note_1') || '';
      const saved2 = localStorage.getItem('cleanfit_action_note_2') || '';
      const saved3 = localStorage.getItem('cleanfit_action_note_3') || '';
      setLine1(saved1);
      setLine2(saved2);
      setLine3(saved3);
    } catch (e) {
      // LocalStorage not available or blocked
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('cleanfit_action_note_1', line1);
      localStorage.setItem('cleanfit_action_note_2', line2);
      localStorage.setItem('cleanfit_action_note_3', line3);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-indigo-600" />
            「우리가 고칠 점」 결론 3줄 (직접 입력)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            회의 및 보고용 핵심 개선 과제를 담당자가 직접 작성하는 공간입니다 (AI 자동생성 미적용).
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-xs transition-colors"
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>저장됨</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>작성 내용 저장</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            1
          </span>
          <input
            type="text"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="첫 번째 개선점 (예: 충전기 어댑터 발열 관련 부품 안전 검증 및 공지)"
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            2
          </span>
          <input
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="두 번째 개선점 (예: 배터리 강모드 사용시간(8분) 상세페이지 크기 확대 및 명시)"
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            3
          </span>
          <input
            type="text"
            value={line3}
            onChange={(e) => setLine3(e.target.value)}
            placeholder="세 번째 개선점 (예: 충전 거치대 기본 번들 패키지 출시 또는 프로모션 진행)"
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span>PRD 지침에 따라 AI 임의 요약 없이 사용자가 직접 검토하고 기입합니다.</span>
      </div>
    </div>
  );
};
