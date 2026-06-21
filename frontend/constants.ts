import { GameState, Company, District, BoardMember } from './types';

export const INITIAL_CASH = 10000000000; // 100억 원

const NPC_FIRST_NAMES = ['민수', '서연', '지훈', '지우', '현우', '민지', '성민', '서아', '도윤', '하은', '건우', '수아', '우진', '지아', '선우'];
const NPC_LAST_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];

const generateRandomName = () => {
  const last = NPC_LAST_NAMES[Math.floor(Math.random() * NPC_LAST_NAMES.length)];
  const first = NPC_FIRST_NAMES[Math.floor(Math.random() * NPC_FIRST_NAMES.length)];
  return last + first;
};

// 10명의 임원진 생성 (이사 2, 부장 2, 과장 2, 대리 4) - 지분율 차등 분배
export const generateBoard = (totalShares: number): BoardMember[] => {
  const titles = ['이사', '이사', '부장', '부장', '과장', '과장', '대리', '대리', '대리', '대리'];
  const shareRatios = [0.15, 0.12, 0.08, 0.06, 0.04, 0.03, 0.01, 0.01, 0.005, 0.005]; // 총 51%의 지분을 NPC들이 나눠가짐
  
  return titles.map((title, index) => ({
    id: `npc_${Math.random().toString(36).substr(2, 9)}`,
    name: generateRandomName(),
    title: title,
    shares: Math.floor(totalShares * shareRatios[index])
  }));
};

const createCompany = (id: string, name: string, sector: any, basePrice: number, totalShares: number, employees: number, marketingLevel: number, rdLevel: number, imageUrl?: string): Company => {
  // 새 게임을 시작할 때마다 초기 주가에 -10% ~ +10%의 랜덤 변동성을 부여하여 매번 다른 상황 연출
  const initialPrice = Math.floor(basePrice * (0.9 + Math.random() * 0.2));
  
  return {
    id, name, sector, marketType: initialPrice >= 100000 ? 'KOSPI' : 'KOSDAQ', 
    stockPrice: initialPrice, totalShares, playerShares: 0, isAcquired: false,
    employees, marketingLevel, rdLevel, baseValue: basePrice, history: Array(40).fill(initialPrice),
    board: generateBoard(totalShares),
    ceoId: null,
    capitalIncreaseCount: 0,
    imageUrl
  };
};

const INITIAL_COMPANIES: Company[] = [
  createCompany('c1', '라이안전자', '전자', 45000, 2000, 120, 2, 3),
  createCompany('c2', '누리반도체', '전자', 82000, 1500, 80, 1, 4),
  createCompany('c3', '한빛디스플레이', '전자', 34000, 3000, 150, 2, 2),
  createCompany('c4', '대성중공업', '중공업', 56000, 4000, 300, 1, 2),
  createCompany('c5', '금강조선', '중공업', 28000, 5000, 450, 1, 1),
  createCompany('c6', '태양제철', '중공업', 71000, 2500, 200, 1, 2),
  createCompany('c7', '미래자동차', '자동차', 95000, 1000, 180, 3, 4),
  createCompany('c8', '스피드모터스', '자동차', 41000, 2200, 110, 2, 2),
  createCompany('c9', '바로항공', '운송', 63000, 1800, 250, 3, 1),
  createCompany('c10', '한결해운', '운송', 15000, 5000, 140, 1, 1),
  createCompany('c11', '빠른물류', '운송', 38000, 2800, 320, 2, 1),
  createCompany('c12', '초록정유', '에너지', 88000, 1200, 90, 1, 2),
  createCompany('c13', '블루가스', '에너지', 52000, 2000, 130, 2, 1),
  createCompany('c14', '그린전력', '에너지', 47000, 2500, 160, 1, 3),
  createCompany('c15', '하늘바이오', '제약', 92000, 800, 60, 1, 5),
  createCompany('c16', '생명제약', '제약', 67000, 1500, 110, 2, 3),
  createCompany('c17', '튼튼헬스케어', '제약', 29000, 3500, 85, 3, 2),
  createCompany('c18', '황금은행', '금융', 75000, 4000, 500, 2, 1),
  createCompany('c19', '든든증권', '금융', 58000, 3000, 220, 3, 1),
  createCompany('c20', '안심보험', '금융', 42000, 3500, 310, 2, 1),
  createCompany('c21', '행복식품', '식품', 21000, 4500, 280, 4, 1),
  createCompany('c22', '풍년식품', '식품', 18000, 5000, 350, 3, 1),
  createCompany('c23', '바다수산', '식품', 12000, 5000, 190, 2, 1),
  createCompany('c24', '스마일유통', '유통', 33000, 4000, 420, 4, 1),
  createCompany('c25', '알뜰마트', '유통', 25000, 5000, 600, 3, 1),
  createCompany('c26', '톡톡통신', '통신', 61000, 2500, 180, 4, 3),
  createCompany('c27', '연결모바일', '통신', 49000, 3000, 150, 3, 2),
  createCompany('c28', '드림엔터', '미디어', 85000, 1000, 70, 5, 1),
  createCompany('c29', '플레이게임즈', '미디어', 73000, 1200, 120, 4, 3),
  createCompany('c30', '튼튼건설', '건설', 31000, 4000, 380, 2, 1),
  // 신규 사채 회사 2개 추가
  createCompany('c31', '착한사채', '금융', 48000, 5000, 50, 1, 1),
  createCompany('c32', '누구나사채', '금융', 55000, 5000, 60, 2, 1)
];

const INITIAL_DISTRICTS: District[] = [
  { id: 'd1', name: '강남구', landPrice: 15000000000, owner: 'NPC', buildings: [] },
  { id: 'd2', name: '서초구', landPrice: 14000000000, owner: 'NPC', buildings: [] },
  { id: 'd3', name: '용산구', landPrice: 13000000000, owner: 'None', buildings: [] },
  { id: 'd4', name: '여의도(특구)', landPrice: 12000000000, owner: 'NPC', buildings: [] },
  { id: 'd5', name: '송파구', landPrice: 11000000000, owner: 'None', buildings: [] },
  { id: 'd6', name: '성동구', landPrice: 9000000000, owner: 'None', buildings: [] },
  { id: 'd7', name: '마포구', landPrice: 8500000000, owner: 'NPC', buildings: [] },
  { id: 'd8', name: '종로구', landPrice: 8000000000, owner: 'NPC', buildings: [] },
  { id: 'd9', name: '중구', landPrice: 8000000000, owner: 'None', buildings: [] },
  { id: 'd10', name: '광진구', landPrice: 7000000000, owner: 'None', buildings: [] },
  { id: 'd11', name: '동작구', landPrice: 6500000000, owner: 'None', buildings: [] },
  { id: 'd12', name: '영등포구', landPrice: 6000000000, owner: 'None', buildings: [] },
  { id: 'd13', name: '강동구', landPrice: 5500000000, owner: 'None', buildings: [] },
  { id: 'd14', name: '양천구', landPrice: 5000000000, owner: 'None', buildings: [] },
  { id: 'd15', name: '서대문구', landPrice: 4500000000, owner: 'None', buildings: [] },
  { id: 'd16', name: '동대문구', landPrice: 4000000000, owner: 'None', buildings: [] },
  { id: 'd17', name: '성북구', landPrice: 3500000000, owner: 'None', buildings: [] },
  { id: 'd18', name: '은평구', landPrice: 3000000000, owner: 'None', buildings: [] },
  { id: 'd19', name: '강서구', landPrice: 3000000000, owner: 'None', buildings: [] },
  { id: 'd20', name: '구로구', landPrice: 2500000000, owner: 'None', buildings: [] },
  { id: 'd21', name: '관악구', landPrice: 2000000000, owner: 'None', buildings: [] },
  { id: 'd22', name: '금천구', landPrice: 1800000000, owner: 'None', buildings: [] },
  { id: 'd23', name: '노원구', landPrice: 1500000000, owner: 'None', buildings: [] },
  { id: 'd24', name: '도봉구', landPrice: 1200000000, owner: 'None', buildings: [] },
  { id: 'd25', name: '강북구', landPrice: 1000000000, owner: 'None', buildings: [] },
  { id: 'd26', name: '중랑구', landPrice: 1000000000, owner: 'None', buildings: [] },
];

export const INITIAL_STATE: GameState = {
  currentUser: null,
  groupName: null,
  cash: INITIAL_CASH,
  tick: 0,
  day: 1,
  companies: INITIAL_COMPANIES,
  districts: INITIAL_DISTRICTS,
  logs: [{ id: 0, tick: 0, message: '자본금 ₩10,000,000,000으로 여정을 시작했습니다.', type: 'info' }],
  news: [{ id: 0, tick: 0, message: '[안전] 서울 증권거래소 개장. 전반적으로 안정적인 흐름 유지 중입니다.', type: 'info' }],
  netWorthHistory: [{ tick: 0, value: INITIAL_CASH, top1Name: '-', top1Value: 0, top2Name: '-', top2Value: 0, top3Name: '-', top3Value: 0 }],
  kospiIndex: 2750.00,
  kosdaqIndex: 850.00,
  marketHistory: [{ tick: 0, kospi: 2750.00, kosdaq: 850.00 }],
  pendingDefense: null,
  chatMessages: [
    { id: 1, sender: '시스템', text: '서울 코포레이션 로비에 오신 것을 환영합니다.', timestamp: '09:00', isSystem: true }
  ],
  connectedUsers: ['김민수', '이서연', '박지훈', '최지우', '정현우'],
  activeTheme: null,
  loanAmount: 0,
  loanDueDate: null,
  isRestricted: false,
  baseInterestRate: 3.5, // 초기 기준금리 3.5%
  maxLoanAmount: 4000000, // 초기 대출 상한선 400만원
  deposits: [],
  privateLoanFund: 0 // 사채 운용 자금 초기화
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
};

export const getGameTimeInfo = (tick: number) => {
  const dayOffset = Math.floor(tick / 120);
  const date = new Date(2026, 5, 21); // 2026.06.21 시작
  date.setDate(date.getDate() + dayOffset);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  const hour = Math.floor((tick % 120) / 5);
  const minute = ((tick % 120) % 5) * 12;
  
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return {
    dateStr: `${y}. ${m}. ${d}.`,
    timeStr,
    fullStr: `${y}. ${m}. ${d}. ${timeStr}`,
    day: dayOffset + 1
  };
};

export const generateNewBoardMember = (): BoardMember => {
  return {
    id: `npc_${Math.random().toString(36).substr(2, 9)}`,
    name: generateRandomName(),
    title: '대리',
    shares: 0
  };
};
