export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const getGameDate = (day: number): Date => {
  const date = new Date(2026, 5, 29); // 게임 시작일: 2026년 6월 29일 (Month is 0-indexed)
  date.setDate(date.getDate() + day - 1);
  return date;
};

export const formatGameDateFull = (day: number): string => {
  const date = getGameDate(day);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
};

export const formatGameDateShort = (day: number): string => {
  const date = getGameDate(day);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
};

export const getGameTime = (progress: number): string => {
  // Map 0-100 progress to 00:00 - 23:59
  const totalMinutes = Math.floor((progress / 100) * 1440);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const calculateArrivalTime = (departureTime: string, durationMins: number): string => {
  const [hours, mins] = departureTime.split(':').map(Number);
  const totalMins = hours * 60 + mins + durationMins;
  const newHours = Math.floor(totalMins / 60);
  const newMins = totalMins % 60;
  const days = Math.floor(newHours / 24);
  const finalHours = newHours % 24;
  const timeStr = `${String(finalHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  return days > 0 ? `${timeStr} (+${days}일)` : timeStr;
};

export const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}시간 ${m > 0 ? m + '분' : ''}` : `${m}분`;
};
