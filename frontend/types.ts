export type Sector = '전자' | '중공업' | '자동차' | '운송' | '에너지' | '제약' | '금융' | '식품' | '유통' | '통신' | '미디어' | '건설';

export type MarketType = 'KOSDAQ' | 'KOSPI';

export interface BoardMember {
  id: string;
  name: string;
  title: string;
  shares: number;
}

export interface Company {
  id: string;
  name: string;
  sector: Sector;
  marketType: MarketType;
  stockPrice: number;
  totalShares: number;
  playerShares: number;
  isAcquired: boolean;
  employees: number;
  marketingLevel: number;
  rdLevel: number;
  baseValue: number;
  history: number[];
  board: BoardMember[];
  ceoId: string | null;
  capitalIncreaseCount: number;
  imageUrl?: string;
}

export type BuildingType = '사무실 빌딩' | '마케팅 센터' | '연구소' | '복합 타워' | '본사 빌딩' | '물류 센터';

export interface DistrictBuilding {
  id: string;
  ownerType: 'Player' | 'NPC';
  type: BuildingType;
  companyId?: string;
  companyName?: string;
}

export interface District {
  id: string;
  name: string;
  landPrice: number;
  owner: 'Player' | 'NPC' | 'None';
  isRented: boolean;
  buildings: DistrictBuilding[];
}

export interface LogEntry {
  id: number;
  tick: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface NewsItem {
  id: number;
  tick: number;
  message: string;
  type: 'good' | 'bad' | 'info' | 'urgent';
}

export interface DefenseData {
  companyId: string;
  companyName: string;
  newShares: number;
  cost: number;
  ceoId: string | null;
  ceoName: string | null;
}

export interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface ThemeEvent {
  sector: Sector;
  type: 'boom' | 'bust';
  remainingDays: number;
}

export type DepositType = 'general' | 'installment' | 'theme';

export interface DepositAccount {
  id: string;
  type: DepositType;
  name: string;
  principal: number;
  interestEarned: number;
  appliedRate: number;
  joinDay: number;
  maturityDay: number | null;
  themeSector?: Sector;
}

export interface GameState {
  currentUser: string | null;
  groupName: string | null;
  cash: number;
  tick: number;
  day: number;
  companies: Company[];
  districts: District[];
  logs: LogEntry[];
  news: NewsItem[];
  netWorthHistory: { 
    tick: number; 
    value: number;
    top1Name?: string;
    top1Value?: number;
    top2Name?: string;
    top2Value?: number;
    top3Name?: string;
    top3Value?: number;
  }[];
  kospiIndex: number;
  kosdaqIndex: number;
  marketHistory: { tick: number; kospi: number; kosdaq: number }[];
  pendingDefense: DefenseData | null;
  chatMessages: ChatMessage[];
  connectedUsers: string[];
  activeTheme: ThemeEvent | null;
  loanAmount: number;
  loanDueDate: number | null;
  isRestricted: boolean;
  baseInterestRate: number;
  maxLoanAmount: number;
  deposits: DepositAccount[];
  privateLoanFund: number;
}

export type TabType = 'dashboard' | 'market' | 'management' | 'realestate' | 'news' | 'bank' | 'privateloan' | 'admin';
