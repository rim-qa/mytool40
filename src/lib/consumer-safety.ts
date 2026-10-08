import { ConsumerSafetyData, ConsumerSafetyRank } from './types';

// In-memory 24-hour cache
interface CacheEntry {
  data: ConsumerSafetyData;
  cachedAt: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchConsumerSafetyStats(): Promise<ConsumerSafetyData> {
  // Check in-memory cache first
  const now = Date.now();
  if (memoryCache && (now - memoryCache.cachedAt) < CACHE_DURATION_MS) {
    return memoryCache.data;
  }

  const rawKey = process.env.CONSUMER_SAFETY_API_KEY;
  if (!rawKey) {
    throw new Error('CONSUMER_SAFETY_API_KEY is not defined in environment variables');
  }

  // The key may already be encoded or plain text; ensure it is properly encoded for query string
  // If rawKey contains '%', it's already encoded; otherwise encode it.
  const serviceKey = rawKey.includes('%') ? rawKey : encodeURIComponent(rawKey);

  const allItems: Array<{ itemMinor?: string; injuryReason?: string }> = [];

  // PRD: 1,000 items x 3 pages (total 3,000) using only 4 params: serviceKey, pageNo, numOfRows, apiFormat=json
  for (let page = 1; page <= 3; page++) {
    const url = `https://apis.data.go.kr/B551919/open-api/harm/reception?serviceKey=${serviceKey}&pageNo=${page}&numOfRows=1000&apiFormat=json`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Next.js cache 24h
    });

    if (!response.ok) {
      throw new Error(`Consumer Safety API HTTP error: ${response.status}`);
    }

    const json = await response.json();
    const items = json?.response?.body?.items?.item;

    if (Array.isArray(items)) {
      allItems.push(...items);
    } else if (items && typeof items === 'object') {
      allItems.push(items);
    }
  }

  // Filter items where itemMinor === "가정용 진공청소기"
  const vacuumItems = allItems.filter(item => item?.itemMinor === '가정용 진공청소기');
  
  // Aggregate counts by injuryReason
  const reasonMap: Record<string, number> = {};
  for (const item of vacuumItems) {
    const reason = (item.injuryReason || '기타/미상').trim();
    reasonMap[reason] = (reasonMap[reason] || 0) + 1;
  }

  // Sort descending by count and take top 1~3
  const sortedReasons = Object.entries(reasonMap)
    .sort((a, b) => b[1] - a[1]);

  const topReasons: ConsumerSafetyRank[] = sortedReasons.slice(0, 3).map(([reason, count], idx) => ({
    rank: idx + 1,
    injuryReason: reason,
    count
  }));

  const resultData: ConsumerSafetyData = {
    totalVacuumAccidents: vacuumItems.length,
    topReasons,
    source: '한국소비자원 소비자위해감시시스템 (CISS)',
    updatedAt: new Date().toISOString()
  };

  memoryCache = {
    data: resultData,
    cachedAt: now
  };

  return resultData;
}
