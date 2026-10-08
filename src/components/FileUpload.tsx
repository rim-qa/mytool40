import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { parseReviewFile } from '@/lib/file-parser';
import { ReviewInput } from '@/lib/types';

interface FileUploadProps {
  onAnalyze: (reviews: ReviewInput[], fileName: string) => Promise<void>;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onAnalyze, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [parsedReviews, setParsedReviews] = useState<ReviewInput[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMessage('');

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      setErrorMessage('CSV 또는 엑셀(.xlsx, .xls) 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      const reviews = await parseReviewFile(file);
      setParsedReviews(reviews);
      setFileName(file.name);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '파일을 읽는 중 오류가 발생했습니다.');
      setParsedReviews([]);
      setFileName('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleAnalyzeClick = () => {
    if (parsedReviews.length === 0 || isLoading) return;
    onAnalyze(parsedReviews, fileName);
  };

  // Calculate average rating of uploaded file
  const avgRating = parsedReviews.length > 0
    ? (parsedReviews.reduce((acc, cur) => acc + (cur.rating || 0), 0) / parsedReviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            리뷰 파일 업로드
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            CSV 또는 Excel 파일을 선택하거나 드래그하여 등록하세요. 분할 없이 한 번에 AI로 분석됩니다.
          </p>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              클릭하여 파일 선택 또는 여기로 드래그 & 드롭
            </p>
            <p className="text-xs text-slate-500 mt-1">
              지원 형식: .csv, .xlsx, .xls (열 제목: 번호, 작성일, 별점, 리뷰)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File Preview & Analyze Button */}
      {parsedReviews.length > 0 && !errorMessage && (
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {fileName}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                총 <span className="font-semibold text-indigo-700">{parsedReviews.length}건</span>의 리뷰 인식됨
                <span className="mx-2 text-slate-300">|</span>
                평균 별점: <span className="font-semibold text-amber-600">★ {avgRating}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleAnalyzeClick}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
              isLoading
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>단일 요청 분석 진행 중...</span>
              </>
            ) : (
              <>
                <span>AI 분석 시작 (단일 요청)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
