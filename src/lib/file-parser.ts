import * as XLSX from 'xlsx';
import { ReviewInput } from './types';

export async function parseReviewFile(file: File): Promise<ReviewInput[]> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Read workbook (supports .xlsx, .xls, .csv)
  // For CSV, XLSX uses codepage, utf-8
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    raw: false,
    codepage: 65001 // UTF-8
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('파일에 시트가 존재하지 않습니다.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('파일에 데이터 행이 없습니다.');
  }

  const reviews: ReviewInput[] = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];

    // Find review_no / 번호
    let reviewNo = idx + 1;
    for (const key of Object.keys(row)) {
      const lower = key.trim().toLowerCase();
      if (lower === '번호' || lower === 'review_no' || lower === 'no' || lower === 'id') {
        const val = parseInt(String(row[key]).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(val)) reviewNo = val;
        break;
      }
    }

    // Find written_on / 작성일
    let writtenOn = '';
    for (const key of Object.keys(row)) {
      const lower = key.trim().toLowerCase();
      if (lower === '작성일' || lower === 'written_on' || lower === 'date' || lower === '등록일') {
        writtenOn = String(row[key]).trim();
        break;
      }
    }

    // Find rating / 별점
    let rating = 0;
    for (const key of Object.keys(row)) {
      const lower = key.trim().toLowerCase();
      if (lower === '별점' || lower === 'rating' || lower === 'score' || lower === '평점') {
        const val = parseFloat(String(row[key]));
        if (!isNaN(val)) rating = val;
        break;
      }
    }

    // Find review_text / 리뷰
    let reviewText = '';
    for (const key of Object.keys(row)) {
      const lower = key.trim().toLowerCase();
      if (lower === '리뷰' || lower === 'review' || lower === 'review_text' || lower === '내용' || lower === '리뷰내용') {
        reviewText = String(row[key]).trim();
        break;
      }
    }

    // If reviewText wasn't found under known keys, check if there's any non-empty long string
    if (!reviewText) {
      for (const val of Object.values(row)) {
        if (typeof val === 'string' && val.trim().length > 3) {
          reviewText = val.trim();
          break;
        }
      }
    }

    if (reviewText) {
      reviews.push({
        review_no: reviewNo,
        written_on: writtenOn,
        rating,
        review_text: reviewText
      });
    }
  }

  if (reviews.length === 0) {
    throw new Error('유효한 리뷰 텍스트를 파싱하지 못했습니다. 열 제목(번호, 작성일, 별점, 리뷰)을 확인해 주세요.');
  }

  return reviews;
}
