"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { parseExpenseCsvFile, parseExpenseCsvString } from "@/lib/parser";
import { ParseResult } from "@/lib/types";
import { SAMPLE_CSV_CONTENT } from "@/constants/sampleCsv";

interface FileUploaderProps {
  onParsed: (result: ParseResult) => void;
  currentResult: ParseResult | null;
  onReset: () => void;
}

export default function FileUploader({
  onParsed,
  currentResult,
  onReset,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setErrorMessage("CSV 파일(.csv)만 업로드 가능합니다.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const result = await parseExpenseCsvFile(file);
      if (result.data.length === 0) {
        setErrorMessage("CSV 파일에 유효한 경비 데이터가 없습니다.");
        return;
      }
      onParsed(result);
    } catch (err: any) {
      setErrorMessage("파일을 파싱하는 중 오류가 발생했습니다: " + (err?.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
      // 같은 파일 재선택을 위해 리셋
      e.target.value = "";
    }
  };

  const handleLoadSample = () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const result = parseExpenseCsvString(SAMPLE_CSV_CONTENT, "9월_경비내역.csv");
      onParsed(result);
    } catch (err: any) {
      setErrorMessage("샘플 데이터를 로드하는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all">
      {currentResult ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm sm:text-base">
                  {currentResult.fileName || "업로드된 파일"}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  로드 완료
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                총 {currentResult.totalCount.toLocaleString()}건 / 합계{" "}
                {currentResult.totalAmount.toLocaleString()}원
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              다른 파일 선택
            </button>
            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              title="데이터 초기화"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50/60 scale-[0.99]"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="font-medium text-slate-700 text-sm sm:text-base text-center">
              경비 내역 CSV 파일을 드래그하여 놓거나{" "}
              <span className="text-blue-600 font-semibold underline underline-offset-2">
                파일 찾아보기
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5 text-center">
              지원 형식: .csv (클라이언트 브라우저에서 안전하게 파싱되며 외부로 전송되지 않습니다)
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>권장 컬럼: 번호, 제출자, 부서, 사용일, 사용시각, 항목, 가맹점, 금액, 인원, 증빙, 메모</span>
            </div>
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1 shrink-0"
            >
              ✨ 9월 경비내역 샘플 불러오기
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
