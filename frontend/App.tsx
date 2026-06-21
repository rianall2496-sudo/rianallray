import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TabType, LogEntry, BuildingType, MarketType, Company, BoardMember, ChatMessage, Sector, DepositType } from './types';
import { INITIAL_STATE, formatCurrency, getGameTimeInfo, generateNewBoardMember, generateBoard } from './constants';
import { Dashboard } from './components/Dashboard';
import { Market } from './components/Market';
import { Management } from './components/Management';
import { RealEstate } from './components/RealEstate';
import { NewsView } from './components/NewsView';
import { Bank } from './components/Bank';
import { PrivateLoan } from './components/PrivateLoan';
import { Admin } from './components/Admin';
import { Login } from './components/Login';
import { LayoutDashboard, LineChart, Briefcase, Map, Bell, Database, RotateCcw, Newspaper, Clock, User, LogOut, Building2, ShieldAlert, Landmark, AlertTriangle, PiggyBank, TrendingUp, Settings } from 'lucide-react';
import { Button } from './components/ui';

// DB 키를 변경하여 기존 유저의 로컬 스토리지를 초기화하고 이미지 URL 기능을 적용함
const DB_KEY = 'seoul_tycoon_db_v47';

const loadGameState = (): GameState => {
  try {
    const savedState = localStorage.getItem(DB_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error("DB Load Error:", error);
  }
  return INITIAL_STATE;
};

interface SellPromptData {
  districtId: string;
  buildingId: string;
  districtName: string;
  buildingType: string;
  companyName: string;
  refund: number;
}

interface DepositCancelPromptData {
  accountId: string;
  name: string;
  principal: number;
}

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(loadGameState);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [acquisitionPrompt, setAcquisitionPrompt] = useState<Company | null>(null);
  const [sellPrompt, setSellPrompt] = useState<SellPromptData | null>(null);
  const [depositCancelPrompt, setDepositCancelPrompt] = useState<DepositCancelPromptData | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.logs]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, { id: Date.now(), tick: prev.tick, message, type }].slice(-50)
    }));
  }, []);

  // Core Game Loop (Tick System)
  useEffect(() => {
    const tickRate = 2000; 
    
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.currentUser) return prev;

        const newTick = prev.tick + 1;
        const timeInfo = getGameTimeInfo(newTick);
        const prevTimeInfo = getGameTimeInfo(prev.tick);

        const isNewDay = timeInfo.day > prevTimeInfo.day;
        const isNewHour = Math.floor(newTick / 5) > Math.floor(prev.tick / 5);
        const isNewsTick = newTick % 30 === 0; 

        let hourlyRevenue = 0;
        let annualDividendIncome = 0;
        let maturedDepositIncome = 0;
        let privateLoanIncome = 0;
        const newLogs = [...prev.logs];
        const currentNews = [...prev.news];
        const newChatMessages = [...prev.chatMessages];
        let newPendingDefense = prev.pendingDefense;
        let newActiveTheme = prev.activeTheme;
        let newBaseRate = prev.baseInterestRate;
        let newDeposits = [...prev.deposits];
        let currentCash = prev.cash;
        let currentPrivateLoanFund = prev.privateLoanFund;
        
        // Calculate global buffs from real estate
        let officeCount = 0, marketingCount = 0, labCount = 0, complexCount = 0, hqCount = 0, logisticsCount = 0;
        
        prev.districts.forEach(d => {
          d.buildings.filter(b => b.ownerType === 'Player').forEach(b => {
            if (b.type === '사무실 빌딩') officeCount++;
            if (b.type === '마케팅 센터') marketingCount++;
            if (b.type === '연구소') labCount++;
            if (b.type === '복합 타워') complexCount++;
            if (b.type === '본사 빌딩') hqCount++;
            if (b.type === '물류 센터') logisticsCount++;
          });
        });

        const globalRevenueMultiplier = 1.0 + (officeCount * 0.05) + (complexCount * 0.10) + (logisticsCount * 0.15) + (hqCount * 0.30);
        const globalMktBuff = marketingCount + complexCount;
        const globalRDBuff = labCount + complexCount;

        let oldKospiCap = 0;
        let newKospiCap = 0;
        let oldKosdaqCap = 0;
        let newKosdaqCap = 0;

        // --- 일일 이벤트 처리 (테마주, 금리 변동, 예금 이자, 연말 배당) ---
        if (isNewDay) {
          if (newActiveTheme) {
            newActiveTheme.remainingDays -= 1;
            if (newActiveTheme.remainingDays <= 0) {
              newLogs.push({ id: Date.now(), tick: newTick, message: `[테마 종료] ${newActiveTheme.sector} 섹터의 테마 영향력이 소멸되었습니다.`, type: 'info' });
              newActiveTheme = null;
            }
          }

          if (timeInfo.day % 60 === 0) {
            const sectors: Sector[] = ['전자', '중공업', '자동차', '운송', '에너지', '제약', '금융', '식품', '유통', '통신', '미디어', '건설'];
            const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
            const isBoom = Math.random() > 0.3; 
            newActiveTheme = { sector: randomSector, type: isBoom ? 'boom' : 'bust', remainingDays: 15 };
            
            currentNews.push({ id: Date.now() + 1, tick: newTick, message: `[테마] ${randomSector} 섹터 ${isBoom ? '초강세! 관련주 15일간 급등 예상' : '악재 겹치며 15일간 투자심리 위축'}`, type: isBoom ? 'good' : 'bad' });
            newLogs.push({ id: Date.now() + 2, tick: newTick, message: `[테마주] ${randomSector} 섹터에 ${isBoom ? '호황' : '불황'} 테마가 형성되었습니다. (15일 지속)`, type: isBoom ? 'success' : 'danger' });
          }

          if (timeInfo.day % 15 === 0 && prev.marketHistory.length > 0) {
            const oldKospi = prev.marketHistory[0].kospi;
            const currentKospi = prev.kospiIndex;
            const marketTrend = currentKospi / oldKospi; 
            
            let rateChange = (marketTrend - 1) * 5; 
            rateChange += (Math.random() - 0.5) * 0.5; 
            
            newBaseRate = prev.baseInterestRate + rateChange;
            newBaseRate = Math.max(1.0, Math.min(7.0, newBaseRate)); 
            
            if (Math.abs(newBaseRate - prev.baseInterestRate) > 0.2) {
              const isUp = newBaseRate > prev.baseInterestRate;
              currentNews.push({ id: Date.now() + 3, tick: newTick, message: `[금융] 한국은행, 기준금리 ${newBaseRate.toFixed(2)}%로 ${isUp ? '인상' : '인하'} 단행`, type: 'urgent' });
              newLogs.push({ id: Date.now() + 4, tick: newTick, message: `[은행] 기준금리가 ${newBaseRate.toFixed(2)}%로 변경되었습니다.`, type: 'info' });
            }
          }

          newDeposits = newDeposits.map(dep => {
            let dailyRate = 0;
            let currentAppliedRate = dep.appliedRate;

            if (dep.type === 'general') {
              currentAppliedRate = newBaseRate;
              dailyRate = currentAppliedRate / 100 / 365;
            } else if (dep.type === 'installment') {
              dailyRate = currentAppliedRate / 100 / 365;
            } else if (dep.type === 'theme') {
              if (newActiveTheme && newActiveTheme.sector === dep.themeSector) {
                currentAppliedRate = newActiveTheme.type === 'boom' ? 25.0 : -15.0;
              } else {
                currentAppliedRate = 2.0; 
              }
              dailyRate = currentAppliedRate / 100 / 365;
            }

            const dailyInterest = (dep.principal + dep.interestEarned) * dailyRate;
            return { ...dep, interestEarned: dep.interestEarned + dailyInterest, appliedRate: currentAppliedRate };
          });

          const maturedDeposits = newDeposits.filter(dep => dep.maturityDay !== null && timeInfo.day >= dep.maturityDay);
          if (maturedDeposits.length > 0) {
            maturedDeposits.forEach(dep => {
              const totalReturn = dep.principal + dep.interestEarned;
              maturedDepositIncome += totalReturn;
              newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[은행] ${dep.name} 만기 도래! 원금과 이자 총 ${formatCurrency(totalReturn)}이 입금되었습니다.`, type: 'success' });
            });
            newDeposits = newDeposits.filter(dep => dep.maturityDay === null || timeInfo.day < dep.maturityDay);
          }

          if (timeInfo.day > 1 && timeInfo.day % 365 === 0) {
            prev.companies.forEach(c => {
              if (c.playerShares > 0) {
                const div = Math.floor(c.stockPrice * 0.02 * c.playerShares);
                annualDividendIncome += div;
              }
            });
            if (annualDividendIncome > 0) {
              newLogs.push({ id: Date.now() + 5, tick: newTick, message: `[결산] 연말 주주 배당금으로 총 ${formatCurrency(annualDividendIncome)}이 입금되었습니다.`, type: 'success' });
              currentNews.push({ id: Date.now() + 6, tick: newTick, message: `[배당] 상장사 연말 결산 배당금 일제히 지급 완료`, type: 'info' });
            }
          }
        }

        // --- 뉴스 이벤트 생성 로직 ---
        let goodNewsCompanyId: string | null = null;
        let badNewsCompanyId: string | null = null;

        if (isNewsTick) {
          const shuffled = [...prev.companies].sort(() => 0.5 - Math.random());
          const goodComp = shuffled[0];
          const badComp = shuffled[1];

          goodNewsCompanyId = goodComp.id;
          badNewsCompanyId = badComp.id;

          const goodMsgs = ['어닝 서프라이즈 달성!', '신제품 글로벌 흥행!', '대규모 투자 유치 성공!', '정부 지원 사업 선정!', '혁신 기술 특허 취득!'];
          const badMsgs = ['실적 쇼크... 영업이익 적자 전환', '경영진 배임 의혹 제기', '핵심 부품 공급 차질', '경쟁사 신제품에 밀려 점유율 하락', '대규모 리콜 사태 발생'];

          const goodMsg = goodMsgs[Math.floor(Math.random() * goodMsgs.length)];
          const badMsg = badMsgs[Math.floor(Math.random() * badMsgs.length)];

          currentNews.push({ id: Date.now() + 7, tick: newTick, message: `[급등] ${goodComp.name}, ${goodMsg}`, type: 'good' });
          currentNews.push({ id: Date.now() + 8, tick: newTick, message: `[폭락] ${badComp.name}, ${badMsg}`, type: 'bad' });
        }

        // --- 타 회원(NPC) 채팅 시뮬레이션 ---
        if (Math.random() < 0.05) { 
          const randomUser = prev.connectedUsers[Math.floor(Math.random() * prev.connectedUsers.length)];
          const chatMsgs = [
            '주식 시장 오늘 장난 아니네요.', 
            '부동산 강남 땅값 너무 비싸요 ㅠㅠ', 
            '누리반도체 풀매수 갑니다!', 
            '다들 수익률 어떠신가요?', 
            '대표이사 자리 뺏겼습니다... 하아',
            '유상증자 방어하느라 현금 다 썼네요.',
            '건물 지을 돈이 없어요 대출 안되나요?',
            '오늘 뉴스 보셨어요? 대박이네',
            '액면분할 가즈아아아!!',
            '연말 배당금 달달하네요 ㅎㅎ',
            '은행 대출 이자 너무 비싼거 아님?',
            '테마주 펀드 수익률 미쳤네요 ㅋㅋㅋ',
            '금리 또 올랐네... 대출 갚아야겠다',
            '사채 이자율 10% 실화냐 ㄷㄷ'
          ];
          const text = chatMsgs[Math.floor(Math.random() * chatMsgs.length)];
          newChatMessages.push({
            id: Date.now() + Math.random(),
            sender: randomUser,
            text,
            timestamp: timeInfo.timeStr
          });
        }

        // Update Companies
        let updatedCompanies = prev.companies.map(c => {
          const baseVolatility = 0.015; 
          let randomSwing = (Math.random() - 0.5) * baseVolatility;
          
          if (c.id === goodNewsCompanyId) {
            randomSwing += (Math.random() * 0.1 + 0.1);
          } else if (c.id === badNewsCompanyId) {
            randomSwing -= (Math.random() * 0.1 + 0.1);
          }

          if (newActiveTheme && c.sector === newActiveTheme.sector) {
            randomSwing += newActiveTheme.type === 'boom' ? 0.02 : -0.02;
          }

          const mktDrift = ((c.marketingLevel + globalMktBuff) * 0.0002);
          const rdDrift = ((c.rdLevel + globalRDBuff) * 0.0001);
          const drift = mktDrift + rdDrift;
          
          const changePercent = 1 + randomSwing + drift;
          let newPrice = Math.floor(c.stockPrice * changePercent);
          newPrice = Math.max(1000, newPrice);

          let newTotalShares = c.totalShares;
          let newCapCount = c.capitalIncreaseCount;
          let currentPlayerShares = c.playerShares;
          let updatedBoard = [...c.board];
          
          if (newPrice >= 1000000) {
            newPrice = Math.floor(newPrice / 10);
            newTotalShares *= 10;
            currentPlayerShares *= 10;
            updatedBoard = updatedBoard.map(b => ({ ...b, shares: b.shares * 10 }));
            
            currentNews.push({ id: Date.now() + Math.random(), tick: newTick, message: `[액면분할] ${c.name}, 주가 100만원 돌파로 10:1 액면분할 실시! 국민주 등극`, type: 'urgent' });
            newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[액면분할] ${c.name}이(가) 10:1 액면분할을 실시하여 보유 주식 수가 10배 증가했습니다.`, type: 'info' });
          }

          if (newPrice >= 400000 + (newCapCount * 200000) && newTotalShares < 10000) {
            let newShares = Math.floor(newTotalShares * (0.1 + Math.random() * 0.09));
            if (newTotalShares + newShares > 10000) {
              newShares = 10000 - newTotalShares;
            }
            
            if (newShares > 0) {
              newTotalShares += newShares;
              newCapCount += 1;
              
              currentNews.push({ id: Date.now() + Math.random(), tick: newTick, message: `[유상증자] ${c.name}, 주가 호조로 ${newShares}주 대규모 유상증자 단행!`, type: 'urgent' });
              newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[유상증자] ${c.name}이(가) ${newShares}주의 신주를 발행했습니다.`, type: 'warning' });

              if (c.isAcquired && !newPendingDefense) {
                const ceo = updatedBoard.find(b => b.id === c.ceoId);
                newPendingDefense = {
                  companyId: c.id,
                  companyName: c.name,
                  newShares: newShares,
                  cost: newShares * newPrice,
                  ceoId: ceo ? ceo.id : null,
                  ceoName: ceo ? ceo.name : null
                };
              }
            }
          }

          if (c.marketType === 'KOSPI') {
            oldKospiCap += c.stockPrice * c.totalShares;
            newKospiCap += newPrice * newTotalShares;
          } else {
            oldKosdaqCap += c.stockPrice * c.totalShares;
            newKosdaqCap += newPrice * newTotalShares;
          }

          let newMarketType: MarketType = newPrice >= 100000 ? 'KOSPI' : 'KOSDAQ';
          
          if (c.marketType === 'KOSDAQ' && newMarketType === 'KOSPI') {
            newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[상장] ${c.name}이(가) 주가 10만 원을 돌파하여 코스피(KOSPI)로 이전 상장되었습니다!`, type: 'success' });
            currentNews.push({ id: Date.now() + Math.random(), tick: newTick, message: `[경사] ${c.name}, 코스피(KOSPI) 이전 상장 성공!`, type: 'good' });
          } else if (c.marketType === 'KOSPI' && newMarketType === 'KOSDAQ') {
            newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[강등] ${c.name}의 주가가 10만 원 미만으로 하락하여 코스닥(KOSDAQ)으로 강등되었습니다.`, type: 'warning' });
          }

          if (c.isAcquired && isNewHour) {
            const baseRev = c.employees * 2000;
            const rdBonus = c.rdLevel * 10000;
            hourlyRevenue += ((baseRev + rdBonus) * globalRevenueMultiplier) / 24;
          }

          let isStillAcquired = c.isAcquired;
          let currentCeoId = c.ceoId;

          if (isNewDay) {
            let unowned = newTotalShares - currentPlayerShares - updatedBoard.reduce((sum, b) => sum + b.shares, 0);
            const numTraders = Math.floor(Math.random() * 3) + 1; 
            
            for (let i = 0; i < numTraders; i++) {
              const traderIndex = Math.floor(Math.random() * updatedBoard.length);
              const trader = updatedBoard[traderIndex];
              
              const isBuying = Math.random() > 0.4; 
              const tradeAmount = Math.floor(Math.random() * 30) + 5; 

              if (isBuying && unowned >= tradeAmount) {
                updatedBoard[traderIndex] = { ...trader, shares: trader.shares + tradeAmount };
                unowned -= tradeAmount;
                
                if (updatedBoard[traderIndex].shares >= newTotalShares * 0.51 && isStillAcquired) {
                  isStillAcquired = false;
                  currentCeoId = null;
                  updatedBoard[traderIndex].title = '독립 회장';
                  newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[경고] ${c.name}의 타 회원 '${trader.name}'님이 지분 51%를 매집하여 회사를 장악했습니다! 경영권을 상실했습니다.`, type: 'danger' });
                  currentNews.push({ id: Date.now() + Math.random(), tick: newTick, message: `[충격] ${c.name}, 타 회원 적대적 M&A 성공... 경영권 교체`, type: 'urgent' });
                }
              } else if (!isBuying && trader.shares >= tradeAmount) {
                updatedBoard[traderIndex] = { ...trader, shares: trader.shares - tradeAmount };
                unowned += tradeAmount;
              }
            }

            if (timeInfo.day % 30 === 0 && isStillAcquired && currentCeoId) {
              const ceoIndex = updatedBoard.findIndex(b => b.id === currentCeoId);
              if (ceoIndex !== -1) {
                const oldPrice = c.history[0] || c.stockPrice;
                if (newPrice > oldPrice) {
                  const shareGain = Math.floor(newTotalShares * (Math.random() * 0.01 + 0.01));
                  updatedBoard[ceoIndex] = { ...updatedBoard[ceoIndex], shares: updatedBoard[ceoIndex].shares + shareGain };
                  
                  unowned = newTotalShares - currentPlayerShares - updatedBoard.reduce((sum, b) => sum + b.shares, 0);
                  if (unowned < 0) {
                    currentPlayerShares = Math.max(0, currentPlayerShares + unowned);
                  }

                  if (updatedBoard[ceoIndex].shares >= newTotalShares * 0.51) {
                    isStillAcquired = false;
                    currentCeoId = null;
                    updatedBoard[ceoIndex].title = '독립 회장';
                    newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[반란] ${c.name}의 ${updatedBoard[ceoIndex].name} 대표이사가 지분 51%를 확보하여 그룹에서 독립했습니다!`, type: 'danger' });
                  } else {
                    newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[배당] ${c.name} 실적 호조로 ${updatedBoard[ceoIndex].name} 대표이사가 배당금을 받아 지분을 늘렸습니다.`, type: 'warning' });
                  }
                }
              }
            }

            const rankOrder: Record<string, number> = { '대표이사': 1, '독립 회장': 1, '이사': 2, '부장': 3, '과장': 4, '대리': 5 };
            updatedBoard.sort((a, b) => {
              if (rankOrder[a.title] !== rankOrder[b.title]) {
                return rankOrder[a.title] - rankOrder[b.title];
              }
              return b.shares - a.shares;
            });
          }

          const newHistory = [...c.history, newPrice].slice(-40);

          return { 
            ...c, 
            stockPrice: newPrice, 
            totalShares: newTotalShares,
            capitalIncreaseCount: newCapCount,
            history: newHistory, 
            marketType: newMarketType,
            board: updatedBoard,
            isAcquired: isStillAcquired,
            ceoId: currentCeoId,
            playerShares: currentPlayerShares
          };
        });

        // --- 사채기업 모드 (매월 30일 정산 및 즉각 회수) ---
        const ownsPrivateLoanCo = updatedCompanies.some(c => (c.name === '착한사채' || c.name === '누구나사채') && c.isAcquired);
        
        if (!ownsPrivateLoanCo && currentPrivateLoanFund > 0) {
          currentCash += currentPrivateLoanFund;
          newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[사채업 중단] 사채 회사의 경영권을 상실하여 운용 자금 ${formatCurrency(currentPrivateLoanFund)}이 전액 회수되었습니다.`, type: 'warning' });
          currentPrivateLoanFund = 0;
        }

        if (isNewDay && timeInfo.day % 30 === 0) {
          if (ownsPrivateLoanCo && currentPrivateLoanFund > 0) {
            const interestRate = 0.07 + Math.random() * 0.03; // 7% ~ 10%
            privateLoanIncome = Math.floor(currentPrivateLoanFund * interestRate);
            newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[사채 수익] 사채업 이자놀이로 ${formatCurrency(privateLoanIncome)}의 수익이 발생했습니다. (월 수익률: ${(interestRate*100).toFixed(1)}%)`, type: 'success' });
          }
        }

        const kospiMultiplier = oldKospiCap > 0 ? newKospiCap / oldKospiCap : 1;
        const kosdaqMultiplier = oldKosdaqCap > 0 ? newKosdaqCap / oldKosdaqCap : 1;
        
        const newKospiIndex = prev.kospiIndex * kospiMultiplier;
        const newKosdaqIndex = prev.kosdaqIndex * kosdaqMultiplier;

        // --- 부동산 NPC 건설 및 임대료 정산 로직 ---
        let newDistricts = [...prev.districts];
        let monthlyRent = 0;
        let monthlyDividend = 0;
        
        if (isNewDay) {
          if (Math.random() < 0.5) {
            const availableDistricts = newDistricts.filter(d => d.buildings.length < 5);
            if (availableDistricts.length > 0) {
              const targetIdx = Math.floor(Math.random() * availableDistricts.length);
              const targetDistrict = availableDistricts[targetIdx];
              
              const bTypes: BuildingType[] = ['사무실 빌딩', '마케팅 센터', '연구소', '물류 센터', '복합 타워', '본사 빌딩'];
              const randomType = bTypes[Math.floor(Math.random() * bTypes.length)];
              
              const updatedDistrict = {
                ...targetDistrict,
                buildings: [...targetDistrict.buildings, { id: Date.now().toString() + Math.random().toString(), ownerType: 'NPC' as const, type: randomType }]
              };

              if (targetDistrict.owner === 'Player') {
                const fee = targetDistrict.landPrice * 0.10;
                hourlyRevenue += fee;
                newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[임대 수익] 내 소유의 ${targetDistrict.name}에 타 회원이 건물을 건설하여 수수료 ${formatCurrency(fee)}가 입금되었습니다.`, type: 'success' });
              }

              newDistricts = newDistricts.map(d => d.id === updatedDistrict.id ? updatedDistrict : d);
            }
          }

          if (timeInfo.day % 30 === 0) {
            let monthlyRentExpense = 0;
            let monthlyRentIncome = 0;

            newDistricts.forEach(d => {
              if (d.owner === 'NPC') {
                const playerBldgs = d.buildings.filter(b => b.ownerType === 'Player').length;
                monthlyRentExpense += (d.landPrice * 0.02) * playerBldgs;
              } else if (d.owner === 'Player') {
                const npcBldgs = d.buildings.filter(b => b.ownerType === 'NPC').length;
                monthlyRentIncome += (d.landPrice * 0.02) * npcBldgs;
              }
            });

            if (monthlyRentExpense > 0) {
              monthlyRent -= monthlyRentExpense;
              newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[지출] 타인 소유 부지의 월 임대료 ${formatCurrency(monthlyRentExpense)}이(가) 출금되었습니다.`, type: 'warning' });
            }
            if (monthlyRentIncome > 0) {
              monthlyRent += monthlyRentIncome;
              newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[수익] 내 소유 부지의 월 임대료 ${formatCurrency(monthlyRentIncome)}이(가) 입금되었습니다.`, type: 'success' });
            }

            updatedCompanies.forEach(c => {
              if (c.playerShares > 0 && !c.isAcquired) {
                const allShares = [c.playerShares, ...c.board.map(b => b.shares)].sort((a, b) => b - a);
                const rank = allShares.indexOf(c.playerShares);
                let title = '대리';
                if (rank === 0) title = '최대주주';
                else if (rank <= 2) title = '이사';
                else if (rank <= 4) title = '부장';
                else if (rank <= 6) title = '과장';

                const baseDiv = c.stockPrice * c.playerShares * 0.01;
                const titleBonus = rank === 0 ? 1.5 : rank <= 2 ? 1.2 : rank <= 4 ? 1.1 : 1.0;
                const dividend = Math.floor(baseDiv * titleBonus);

                if (dividend > 0) {
                  monthlyDividend += dividend;
                  newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[배당] ${c.name}의 ${title} 자격으로 월 배당금 ${formatCurrency(dividend)}이 입금되었습니다.`, type: 'success' });
                }
              }
            });
          }
        }

        // --- 은행 대출 자동 상환 및 파산 로직 ---
        currentCash = currentCash + hourlyRevenue + monthlyRent + monthlyDividend + annualDividendIncome + maturedDepositIncome + privateLoanIncome;
        let currentLoan = prev.loanAmount;
        let isRestricted = prev.isRestricted;

        if (isNewDay && currentLoan > 0 && prev.loanDueDate !== null && timeInfo.day > prev.loanDueDate) {
          newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[은행] 대출금 상환일이 지났습니다. 자동 상환을 시도합니다.`, type: 'warning' });

          if (currentCash >= currentLoan) {
            currentCash -= currentLoan;
            newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[은행] 현금에서 대출금 ${formatCurrency(currentLoan)}이 자동 상환되었습니다.`, type: 'success' });
            currentLoan = 0;
            isRestricted = false;
          } else {
            if (currentCash > 0) {
              currentLoan -= currentCash;
              newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[은행] 보유 현금 ${formatCurrency(currentCash)}이 대출 상환에 사용되었습니다. 남은 빚: ${formatCurrency(currentLoan)}`, type: 'warning' });
              currentCash = 0;
            }

            // 주식 강제 매각
            for (let i = 0; i < updatedCompanies.length; i++) {
              if (currentLoan <= 0) break;
              let comp = updatedCompanies[i];
              if (comp.playerShares > 0) {
                const stockValue = comp.stockPrice * comp.playerShares;
                if (stockValue >= currentLoan) {
                  const sharesToSell = Math.ceil(currentLoan / comp.stockPrice);
                  const revenue = sharesToSell * comp.stockPrice;
                  comp.playerShares -= sharesToSell;
                  currentCash += (revenue - currentLoan);
                  currentLoan = 0;
                  newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[은행] 대출 상환을 위해 ${comp.name} 주식 ${sharesToSell}주가 자동 매각되었습니다.`, type: 'warning' });
                } else {
                  const revenue = comp.stockPrice * comp.playerShares;
                  currentLoan -= revenue;
                  newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[은행] 대출 상환을 위해 ${comp.name} 주식 ${comp.playerShares}주가 전량 자동 매각되었습니다.`, type: 'warning' });
                  comp.playerShares = 0;
                }

                if (comp.isAcquired && (comp.playerShares / comp.totalShares) < 0.51) {
                  comp.isAcquired = false;
                  comp.ceoId = null;
                  newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[경고] 지분 강제 매각으로 ${comp.name}의 경영권을 상실했습니다.`, type: 'danger' });
                }
              }
            }

            if (currentLoan > 0) {
              isRestricted = true;
              newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[파산 위기] 모든 자산을 매각해도 대출금을 갚지 못했습니다. 금융 거래가 제한됩니다!`, type: 'danger' });
            } else {
              isRestricted = false;
              newLogs.push({ id: Date.now() + Math.random(), tick: newTick, message: `[은행] 대출금이 모두 상환되었습니다.`, type: 'success' });
            }
          }
        }

        // --- 타 회원(NPC) 자산 계산 및 랭킹 추출 ---
        const npcNetWorths: Record<string, number> = {};
        updatedCompanies.forEach(c => {
          c.board.forEach(b => {
            if (!npcNetWorths[b.name]) npcNetWorths[b.name] = 0;
            npcNetWorths[b.name] += b.shares * c.stockPrice;
          });
        });

        const sortedNpcs = Object.entries(npcNetWorths).sort((a, b) => b[1] - a[1]);
        const top1 = sortedNpcs[0] || ['-', 0];
        const top2 = sortedNpcs[1] || ['-', 0];
        const top3 = sortedNpcs[2] || ['-', 0];

        const stockValue = updatedCompanies.reduce((acc, c) => acc + (c.stockPrice * c.playerShares), 0);
        const realEstateValue = newDistricts.reduce((acc, d) => {
          let val = 0;
          if (d.owner === 'Player') val += d.landPrice;
          d.buildings.filter(b => b.ownerType === 'Player').forEach(b => {
            if (b.type === '사무실 빌딩') val += 500000000;
            if (b.type === '마케팅 센터') val += 1000000000;
            if (b.type === '연구소') val += 2000000000;
            if (b.type === '물류 센터') val += 3000000000;
            if (b.type === '복합 타워') val += 5000000000;
            if (b.type === '본사 빌딩') val += 10000000000;
          });
          return acc + val;
        }, 0);
        
        const currentNetWorth = currentCash + stockValue + realEstateValue + newDeposits.reduce((acc, d) => acc + d.principal + d.interestEarned, 0) + currentPrivateLoanFund;
        
        // --- 차트 업데이트 주기를 1틱(2초) 단위로 변경하여 실시간성 강화 ---
        const newNetWorthHistory = [...prev.netWorthHistory, { 
          tick: newTick, 
          value: currentNetWorth,
          top1Name: top1[0], top1Value: top1[1],
          top2Name: top2[0], top2Value: top2[1],
          top3Name: top3[0], top3Value: top3[1],
        }].slice(-60); // 60틱(120초) 분량 저장
        
        const newMarketHistory = [...prev.marketHistory, { 
          tick: newTick, 
          kospi: newKospiIndex, 
          kosdaq: newKosdaqIndex 
        }].slice(-60);

        return {
          ...prev,
          tick: newTick,
          day: timeInfo.day,
          cash: currentCash,
          companies: updatedCompanies,
          districts: newDistricts,
          netWorthHistory: newNetWorthHistory,
          logs: newLogs.slice(-50),
          news: currentNews.slice(-100),
          kospiIndex: newKospiIndex,
          kosdaqIndex: newKosdaqIndex,
          marketHistory: newMarketHistory,
          pendingDefense: newPendingDefense,
          chatMessages: newChatMessages.slice(-100),
          activeTheme: newActiveTheme,
          loanAmount: currentLoan,
          loanDueDate: currentLoan > 0 ? prev.loanDueDate : null,
          isRestricted,
          baseInterestRate: newBaseRate,
          deposits: newDeposits,
          privateLoanFund: currentPrivateLoanFund
        };
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, []);

  // --- 유상증자 방어권 처리 로직 ---
  const handleDefenseResponse = (accept: boolean) => {
    if (!state.pendingDefense) return;
    const defenseData = state.pendingDefense;

    setState(prev => {
      const company = prev.companies.find(c => c.id === defenseData.companyId);
      if (!company) return { ...prev, pendingDefense: null };

      const newLogs = [...prev.logs];
      let newCash = prev.cash;
      let newPlayerShares = company.playerShares;
      let newBoard = [...company.board];
      let isAcquired = company.isAcquired;
      let newCeoId = company.ceoId;

      if (accept) {
        if (prev.cash >= defenseData.cost) {
          newCash -= defenseData.cost;
          newPlayerShares += defenseData.newShares;
          newLogs.push({ id: Date.now(), tick: prev.tick, message: `[방어 성공] ${company.name} 유상증자 물량을 전량 매수하여 경영권을 방어했습니다!`, type: 'success' });
        } else {
          newLogs.push({ id: Date.now(), tick: prev.tick, message: `[방어 실패] 자금이 부족하여 방어권을 행사하지 못했습니다.`, type: 'danger' });
          accept = false; // 강제 실패 처리
        }
      }

      if (!accept) {
        if (defenseData.ceoId) {
          const ceoIndex = newBoard.findIndex(b => b.id === defenseData.ceoId);
          if (ceoIndex !== -1) {
            newBoard[ceoIndex] = { ...newBoard[ceoIndex], shares: newBoard[ceoIndex].shares + defenseData.newShares };
            newLogs.push({ id: Date.now() + 1, tick: prev.tick, message: `[경고] ${defenseData.ceoName} 대표이사가 유상증자 물량을 모두 매집했습니다!`, type: 'warning' });

            if (newBoard[ceoIndex].shares >= company.totalShares * 0.51) {
              isAcquired = false;
              newCeoId = null;
              newBoard[ceoIndex].title = '독립 회장';
              newLogs.push({ id: Date.now() + 2, tick: prev.tick, message: `[반란] ${defenseData.ceoName} 대표이사가 지분 51%를 확보하여 회사를 장악했습니다! 경영권 상실.`, type: 'danger' });
            }
          }
        } else {
          newLogs.push({ id: Date.now() + 1, tick: prev.tick, message: `[알림] ${company.name} 유상증자 물량이 시장에 풀렸습니다.`, type: 'info' });
        }
      }

      return {
        ...prev,
        cash: newCash,
        companies: prev.companies.map(c => c.id === company.id ? { ...c, playerShares: newPlayerShares, board: newBoard, isAcquired, ceoId: newCeoId } : c),
        logs: newLogs.slice(-50),
        pendingDefense: null
      };
    });
  };

  // Actions
  const handleLogin = (username: string) => {
    setState(prev => ({
      ...prev,
      currentUser: username,
      logs: [...prev.logs, { id: Date.now(), tick: prev.tick, message: `${username}님, 서울 코포레이션에 오신 것을 환영합니다.`, type: 'success' }].slice(-50)
    }));
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      setState(prev => ({ ...prev, currentUser: null }));
    }
  };

  const handleSendMessage = (text: string) => {
    if (!state.currentUser) return;
    const timeInfo = getGameTimeInfo(state.tick);
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: state.currentUser,
      text,
      timestamp: timeInfo.timeStr
    };
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage].slice(-100)
    }));
  };

  const handleSetGroupName = (name: string) => {
    setState(prev => ({ ...prev, groupName: name }));
    addLog(`그룹 이름이 '${name} 그룹'으로 명명되었습니다.`, 'success');
  };

  // --- 은행 관련 핸들러 ---
  const handleUpdateBankSettings = (maxLoan: number, interestRate: number) => {
    setState(prev => ({
      ...prev,
      maxLoanAmount: maxLoan,
      baseInterestRate: interestRate,
      logs: [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[관리자] 은행 설정이 변경되었습니다. (최대 대출: ${formatCurrency(maxLoan)}, 기준금리: ${interestRate}%)`, type: 'warning' as const }].slice(-50)
    }));
  };

  const handleCreateCompany = (name: string, sector: Sector, basePrice: number, totalShares: number, imageUrl?: string) => {
    setState(prev => {
      const newCompany: Company = {
        id: `c_${Date.now()}`,
        name,
        sector,
        marketType: basePrice >= 100000 ? 'KOSPI' : 'KOSDAQ',
        stockPrice: basePrice,
        totalShares,
        playerShares: 0,
        isAcquired: false,
        employees: Math.floor(Math.random() * 100) + 50,
        marketingLevel: 1,
        rdLevel: 1,
        baseValue: basePrice,
        history: Array(40).fill(basePrice),
        board: generateBoard(totalShares),
        ceoId: null,
        capitalIncreaseCount: 0,
        imageUrl: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined
      };

      return {
        ...prev,
        companies: [...prev.companies, newCompany],
        logs: [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[관리자] 신규 상장사 '${name}'이(가) 시장에 추가되었습니다.`, type: 'success' as const }].slice(-50),
        news: [...prev.news, { id: Date.now(), tick: prev.tick, message: `[IPO] 신규 기업 '${name}' 코스닥 상장!`, type: 'good' as const }].slice(-100)
      };
    });
  };

  const handleBorrowLoan = (amount: number) => {
    setState(prev => {
      if (prev.loanAmount > 0) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `이미 진행 중인 대출이 있습니다. 먼저 상환해주세요.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }
      
      const loanInterestRate = prev.baseInterestRate + 2.0;
      const interest = amount * (loanInterestRate / 100);
      const received = amount - interest;
      const dueDate = prev.day + 7;
      
      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[은행] ${formatCurrency(amount)} 대출 완료. 선이자 ${loanInterestRate.toFixed(2)}%(${formatCurrency(interest)}) 제외 후 ${formatCurrency(received)} 입금됨. (만기: ${dueDate}일차)`, type: 'success' as const }].slice(-50);
      
      return {
        ...prev,
        cash: prev.cash + received,
        loanAmount: amount,
        loanDueDate: dueDate,
        logs: newLogs
      };
    });
  };

  const handlePartialRepay = (amount: number) => {
    setState(prev => {
      if (prev.loanAmount === 0 || amount <= 0) return prev;
      if (prev.cash < amount) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `보유 현금이 부족하여 상환할 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      const newLoanAmount = prev.loanAmount - amount;
      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[은행] 대출금 ${formatCurrency(amount)} 부분 상환 완료. 남은 빚: ${formatCurrency(newLoanAmount)}`, type: 'success' as const }].slice(-50);

      return {
        ...prev,
        cash: prev.cash - amount,
        loanAmount: newLoanAmount,
        loanDueDate: newLoanAmount <= 0 ? null : prev.loanDueDate,
        isRestricted: newLoanAmount <= 0 ? false : prev.isRestricted,
        logs: newLogs
      };
    });
  };

  const handleOpenDeposit = (type: DepositType, amount: number, duration?: number) => {
    setState(prev => {
      if (type === 'general' && prev.deposits.some(d => d.type === 'general')) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `이미 파킹통장에 가입되어 있습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }
      if (type === 'installment' && prev.deposits.some(d => d.type === 'installment')) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `이미 정기예금에 가입되어 있습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      if (prev.cash < amount) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `보유 현금이 부족하여 예금에 가입할 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      let name = '';
      let appliedRate = prev.baseInterestRate;
      let maturityDay = null;
      let themeSector = undefined;

      if (type === 'general') {
        name = '파킹통장 (자유입출금)';
      } else if (type === 'installment') {
        name = `정기예금 (${duration}일 만기)`;
        appliedRate = prev.baseInterestRate + 2.0;
        maturityDay = prev.day + (duration || 30);
      } else if (type === 'theme') {
        if (!prev.activeTheme) return prev;
        name = `${prev.activeTheme.sector} 테마주 특별 펀드`;
        appliedRate = prev.activeTheme.type === 'boom' ? 25.0 : -15.0;
        maturityDay = prev.day + prev.activeTheme.remainingDays;
        themeSector = prev.activeTheme.sector;
      }

      const newDeposit: DepositAccount = {
        id: `dep_${Date.now()}`,
        type,
        name,
        principal: amount,
        interestEarned: 0,
        appliedRate,
        joinDay: prev.day,
        maturityDay,
        themeSector
      };

      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[은행] ${name} 상품에 ${formatCurrency(amount)} 가입 완료.`, type: 'success' as const }].slice(-50);

      return {
        ...prev,
        cash: prev.cash - amount,
        deposits: [...prev.deposits, newDeposit],
        logs: newLogs
      };
    });
  };

  const handleCloseDepositClick = (accountId: string) => {
    const deposit = state.deposits.find(d => d.id === accountId);
    if (!deposit) return;

    if ((deposit.type === 'installment' || deposit.type === 'theme') && deposit.maturityDay && state.day < deposit.maturityDay) {
      setDepositCancelPrompt({
        accountId: deposit.id,
        name: deposit.name,
        principal: deposit.principal
      });
    } else {
      executeCloseDeposit(accountId, false);
    }
  };

  const executeCloseDeposit = (accountId: string, isEarlyCancel: boolean) => {
    setState(prev => {
      const deposit = prev.deposits.find(d => d.id === accountId);
      if (!deposit) return prev;

      let returnAmount = deposit.principal + deposit.interestEarned;
      let message = `[은행] ${deposit.name} 해지 완료. 총 ${formatCurrency(returnAmount)} 입금됨.`;
      let logType: 'success' | 'warning' = 'success';

      if (isEarlyCancel) {
        returnAmount = deposit.principal; // 이자 포기
        message = `[은행] ${deposit.name} 중도 해지. 원금 ${formatCurrency(returnAmount)}만 반환되었습니다.`;
        logType = 'warning';
      }

      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message, type: logType }].slice(-50);

      return {
        ...prev,
        cash: prev.cash + returnAmount,
        deposits: prev.deposits.filter(d => d.id !== accountId),
        logs: newLogs
      };
    });
  };

  const confirmCloseDeposit = (accept: boolean) => {
    if (accept && depositCancelPrompt) {
      executeCloseDeposit(depositCancelPrompt.accountId, true);
    }
    setDepositCancelPrompt(null);
  };

  // --- 사채기업 모드 핸들러 ---
  const handleManagePrivateLoan = (amount: number, isDeposit: boolean) => {
    setState(prev => {
      if (isDeposit) {
        if (prev.cash < amount) {
          const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `보유 현금이 부족하여 사채 자금을 납입할 수 없습니다.`, type: 'warning' as const }].slice(-50);
          return { ...prev, logs: newLogs };
        }
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[사채] 운용 자금 ${formatCurrency(amount)} 납입 완료.`, type: 'success' as const }].slice(-50);
        return {
          ...prev,
          cash: prev.cash - amount,
          privateLoanFund: prev.privateLoanFund + amount,
          logs: newLogs
        };
      } else {
        if (prev.privateLoanFund < amount) {
          const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `회수할 사채 자금이 부족합니다.`, type: 'warning' as const }].slice(-50);
          return { ...prev, logs: newLogs };
        }
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[사채] 운용 자금 ${formatCurrency(amount)} 회수 완료.`, type: 'success' as const }].slice(-50);
        return {
          ...prev,
          cash: prev.cash + amount,
          privateLoanFund: prev.privateLoanFund - amount,
          logs: newLogs
        };
      }
    });
  };

  const handleBuyStock = (companyId: string, amount: number) => {
    if (state.isRestricted) {
      addLog(`[금융 제약] 연체로 인해 금융 거래가 정지된 상태입니다. 빚을 먼저 갚으세요!`, 'danger');
      return;
    }

    let triggeredCompany: Company | null = null;

    setState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company) return prev;
      
      const cost = company.stockPrice * amount;
      if (prev.cash < cost) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `자금이 부족하여 ${company.name} 주식을 매수할 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }
      if (company.playerShares + amount > company.totalShares) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `발행된 총 주식 수보다 많이 매수할 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      const newShares = company.playerShares + amount;
      const canAcquire = (newShares / company.totalShares) >= 0.51;
      
      if (!company.isAcquired && canAcquire) {
        triggeredCompany = { ...company, playerShares: newShares };
      }

      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `${company.name} 주식 ${amount}주를 ${formatCurrency(cost)}에 매수했습니다.`, type: 'info' as const }].slice(-50);

      return {
        ...prev,
        cash: prev.cash - cost,
        companies: prev.companies.map(c => 
          c.id === companyId ? { ...c, playerShares: newShares } : c
        ),
        logs: newLogs
      };
    });

    if (triggeredCompany) {
      setAcquisitionPrompt(triggeredCompany);
    }
  };

  const handleAcquire = (companyId: string, accept: boolean) => {
    setAcquisitionPrompt(null);
    setState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company) return prev;

      const newLogs = [...prev.logs];
      if (accept) {
        newLogs.push({ id: Date.now(), tick: prev.tick, message: `적대적 M&A 성공: 이제 ${company.name}의 경영권을 확보했습니다!`, type: 'success' });
      } else {
        newLogs.push({ id: Date.now(), tick: prev.tick, message: `${company.name} 지분 51%를 달성했으나 경영권 인수를 보류했습니다.`, type: 'info' });
      }

      return {
        ...prev,
        companies: prev.companies.map(c => c.id === companyId ? { ...c, isAcquired: accept } : c),
        logs: newLogs.slice(-50)
      };
    });
  };

  const handleSellStock = (companyId: string, amount: number) => {
    setState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company || company.playerShares < amount) return prev;
      
      const revenue = company.stockPrice * amount;
      const newShares = company.playerShares - amount;
      const canAcquire = (newShares / company.totalShares) >= 0.51;
      
      let willAcquire = company.isAcquired;
      let lostAcquisition = false;

      if (willAcquire && !canAcquire) {
        willAcquire = false;
        lostAcquisition = true;
      }

      const newLogs = [...prev.logs];
      newLogs.push({ id: Date.now(), tick: prev.tick, message: `${company.name} 주식 ${amount}주를 ${formatCurrency(revenue)}에 매도했습니다.`, type: 'info' });
      
      if (lostAcquisition) {
        newLogs.push({ id: Date.now() + 1, tick: prev.tick, message: `경영권 상실: 지분율 하락으로 더 이상 ${company.name}의 경영권을 행사할 수 없습니다.`, type: 'danger' });
      }

      const updatedCompanies = prev.companies.map(c => 
        c.id === companyId ? { ...c, playerShares: newShares, isAcquired: willAcquire, ceoId: willAcquire ? c.ceoId : null } : c
      );

      let newPrivateLoanFund = prev.privateLoanFund;
      let finalCash = prev.cash + revenue;

      if (lostAcquisition && (company.name === '착한사채' || company.name === '누구나사채')) {
        const ownsPrivateLoanCo = updatedCompanies.some(c => (c.name === '착한사채' || c.name === '누구나사채') && c.isAcquired);
        if (!ownsPrivateLoanCo && newPrivateLoanFund > 0) {
          finalCash += newPrivateLoanFund;
          newLogs.push({ id: Date.now() + 2, tick: prev.tick, message: `[사채업 중단] 사채 회사의 경영권을 상실하여 운용 자금 ${formatCurrency(newPrivateLoanFund)}이 전액 회수되었습니다.`, type: 'warning' });
          newPrivateLoanFund = 0;
        }
      }

      return {
        ...prev,
        cash: finalCash,
        companies: updatedCompanies,
        privateLoanFund: newPrivateLoanFund,
        logs: newLogs.slice(-50)
      };
    });
  };

  const handleInvest = (companyId: string, type: 'HR' | 'Marketing' | 'R&D', amount: number = 1) => {
    if (state.isRestricted) {
      addLog(`[금융 제약] 연체로 인해 금융 거래가 정지된 상태입니다. 빚을 먼저 갚으세요!`, 'danger');
      return;
    }

    setState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company) return prev;

      let cost = 0;
      let updates = {};
      let typeName = '';

      if (type === 'HR') {
        const maxEmp = company.marketType === 'KOSPI' ? 2000 : 500;
        if (company.employees + amount > maxEmp) {
          const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `${company.marketType} 상장사의 최대 직원 수(${maxEmp}명)를 초과할 수 없습니다.`, type: 'warning' as const }].slice(-50);
          return { ...prev, logs: newLogs };
        }
        cost = amount * 50000;
        updates = { employees: company.employees + amount };
        typeName = `신규 채용(${amount}명)`;
      } else if (type === 'Marketing') {
        cost = company.marketingLevel * 2000000;
        updates = { marketingLevel: company.marketingLevel + 1 };
        typeName = '마케팅';
      } else if (type === 'R&D') {
        cost = company.rdLevel * 5000000;
        updates = { rdLevel: company.rdLevel + 1 };
        typeName = 'R&D';
      }

      if (prev.cash < cost) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `자금이 부족하여 ${company.name}의 ${typeName}에 투자할 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `${company.name}의 ${typeName}에 ${formatCurrency(cost)}를 투자했습니다.`, type: 'success' as const }].slice(-50);

      return {
        ...prev,
        cash: prev.cash - cost,
        companies: prev.companies.map(c => c.id === companyId ? { ...c, ...updates } : c),
        logs: newLogs
      };
    });
  };

  const handleBoardAction = (companyId: string, memberId: string, action: 'appoint' | 'fire' | 'promote') => {
    setState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company) return prev;

      let newBoard = [...company.board];
      let newCeoId = company.ceoId;
      const newLogs = [...prev.logs];

      const memberIndex = newBoard.findIndex(m => m.id === memberId);
      if (memberIndex === -1) return prev;
      const member = newBoard[memberIndex];

      const counts = {
        '이사': newBoard.filter(m => m.title === '이사').length,
        '부장': newBoard.filter(m => m.title === '부장').length,
        '과장': newBoard.filter(m => m.title === '과장').length,
        '대리': newBoard.filter(m => m.title === '대리').length,
      };

      if (action === 'appoint') {
        newBoard[memberIndex] = { ...member, title: '대표이사' };
        newCeoId = member.id;
        newLogs.push({ id: Date.now(), tick: prev.tick, message: `[인사] ${company.name}의 새로운 대표이사로 타 회원 ${member.name}님이 임명되었습니다.`, type: 'success' });
      } 
      else if (action === 'fire') {
        newBoard.splice(memberIndex, 1);
        if (member.id === newCeoId) newCeoId = null;
        newLogs.push({ id: Date.now(), tick: prev.tick, message: `[인사] ${company.name}의 타 회원 ${member.name} ${member.title}이(가) 해임(퇴사)되었습니다.`, type: 'warning' });
      }
      else if (action === 'promote') {
        if (member.title === '부장' && counts['이사'] < 2) {
          newBoard[memberIndex] = { ...member, title: '이사' };
          newLogs.push({ id: Date.now(), tick: prev.tick, message: `[인사] ${company.name}의 타 회원 ${member.name}님이 이사로 승진했습니다.`, type: 'success' });
        } else if (member.title === '과장' && counts['부장'] < 2) {
          newBoard[memberIndex] = { ...member, title: '부장' };
          newLogs.push({ id: Date.now(), tick: prev.tick, message: `[인사] ${company.name}의 타 회원 ${member.name}님이 부장으로 승진했습니다.`, type: 'success' });
        } else if (member.title === '대리' && counts['과장'] < 2) {
          newBoard[memberIndex] = { ...member, title: '과장' };
          newLogs.push({ id: Date.now(), tick: prev.tick, message: `[인사] ${company.name}의 타 회원 ${member.name}님이 과장으로 승진했습니다.`, type: 'success' });
        } else {
          newLogs.push({ id: Date.now(), tick: prev.tick, message: `[인사] 해당 직급의 정원(TO)이 꽉 차서 승진할 수 없습니다.`, type: 'warning' });
          return prev;
        }
      }

      const currentDaeriCount = newBoard.filter(m => m.title === '대리').length;
      if (currentDaeriCount < 4 && newBoard.length < 10) {
        newBoard.push(generateNewBoardMember());
        newLogs.push({ id: Date.now() + 1, tick: prev.tick, message: `[인사] ${company.name}에 새로운 타 회원(대리)이 합류했습니다.`, type: 'info' });
      }

      const rankOrder: Record<string, number> = { '대표이사': 1, '독립 회장': 1, '이사': 2, '부장': 3, '과장': 4, '대리': 5 };
      newBoard.sort((a, b) => {
        if (rankOrder[a.title] !== rankOrder[b.title]) {
          return rankOrder[a.title] - rankOrder[b.title];
        }
        return b.shares - a.shares;
      });

      return {
        ...prev,
        companies: prev.companies.map(c => c.id === companyId ? { ...c, board: newBoard, ceoId: newCeoId } : c),
        logs: newLogs.slice(-50)
      };
    });
  };

  const handleBuyLand = (districtId: string) => {
    if (state.isRestricted) {
      addLog(`[금융 제약] 연체로 인해 금융 거래가 정지된 상태입니다. 빚을 먼저 갚으세요!`, 'danger');
      return;
    }

    setState(prev => {
      const district = prev.districts.find(d => d.id === districtId);
      if (!district || district.owner !== 'None') return prev;

      if (prev.cash < district.landPrice) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `자금이 부족하여 ${district.name}의 부지를 매입할 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `${district.name}의 부지를 ${formatCurrency(district.landPrice)}에 매입했습니다.`, type: 'success' as const }].slice(-50);

      return {
        ...prev,
        cash: prev.cash - district.landPrice,
        districts: prev.districts.map(d => d.id === districtId ? { ...d, owner: 'Player' } : d),
        logs: newLogs
      };
    });
  };

  const handleRentLand = (districtId: string) => {
    if (state.isRestricted) {
      addLog(`[금융 제약] 연체로 인해 금융 거래가 정지된 상태입니다. 빚을 먼저 갚으세요!`, 'danger');
      return;
    }

    setState(prev => {
      const district = prev.districts.find(d => d.id === districtId);
      if (!district || district.owner !== 'NPC' || district.isRented) return prev;

      const fee = district.landPrice * 0.10; // 대여 수수료 10%
      if (prev.cash < fee) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `자금이 부족하여 ${district.name} 부지를 임대할 수 없습니다. (필요 수수료: ${formatCurrency(fee)})`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `${district.name} 부지를 임대했습니다. (수수료: ${formatCurrency(fee)}, 월 임대료: ${formatCurrency(district.landPrice * 0.02)})`, type: 'success' as const }].slice(-50);

      return {
        ...prev,
        cash: prev.cash - fee,
        districts: prev.districts.map(d => d.id === districtId ? { ...d, isRented: true } : d),
        logs: newLogs
      };
    });
  };

  const handleBuild = (districtId: string, type: BuildingType, companyId: string) => {
    if (state.isRestricted) {
      addLog(`[금융 제약] 연체로 인해 금융 거래가 정지된 상태입니다. 빚을 먼저 갚으세요!`, 'danger');
      return;
    }

    setState(prev => {
      const company = prev.companies.find(c => c.id === companyId);
      if (!company || !company.isAcquired) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `건물을 건설할 유효한 계열사가 선택되지 않았습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      const district = prev.districts.find(d => d.id === districtId);
      if (!district || district.owner === 'None') return prev;

      if (district.buildings.length >= 20) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `해당 지역구의 건설 한도(20개)가 초과되어 더 이상 건물을 지을 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      let baseCost = 0;
      if (type === '사무실 빌딩') baseCost = 500000000;
      if (type === '마케팅 센터') baseCost = 1000000000;
      if (type === '연구소') baseCost = 2000000000;
      if (type === '물류 센터') baseCost = 3000000000;
      if (type === '복합 타워') baseCost = 5000000000;
      if (type === '본사 빌딩') baseCost = 10000000000;

      const isNpcLand = district.owner === 'NPC';
      const landFee = isNpcLand ? district.landPrice * 0.10 : 0;
      const totalCost = baseCost + landFee;

      if (prev.cash < totalCost) {
        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `자금이 부족하여 ${type}을(를) 건설할 수 없습니다.`, type: 'warning' as const }].slice(-50);
        return { ...prev, logs: newLogs };
      }

      const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[${company.name}] ${district.name}에 ${type}을(를) 건설했습니다.${isNpcLand ? ` (대여 수수료 ${formatCurrency(landFee)} 포함)` : ''}`, type: 'success' as const }].slice(-50);

      return {
        ...prev,
        cash: prev.cash - totalCost,
        districts: prev.districts.map(d => d.id === districtId ? { 
          ...d, 
          buildings: [...d.buildings, { id: Date.now().toString() + Math.random().toString(), ownerType: 'Player', type, companyId: company.id, companyName: company.name }] 
        } : d),
        logs: newLogs
      };
    });
  };

  const handleSellBuildingClick = (districtId: string, buildingId: string) => {
    const district = state.districts.find(d => d.id === districtId);
    if (!district) return;
    const building = district.buildings.find(b => b.id === buildingId);
    if (!building) return;

    let refund = 0;
    if (building.type === '사무실 빌딩') refund = 500000000 * 0.8;
    if (building.type === '마케팅 센터') refund = 1000000000 * 0.8;
    if (building.type === '연구소') refund = 2000000000 * 0.8;
    if (building.type === '물류 센터') refund = 3000000000 * 0.8;
    if (building.type === '복합 타워') refund = 5000000000 * 0.8;
    if (building.type === '본사 빌딩') refund = 10000000000 * 0.8;

    setSellPrompt({
      districtId,
      buildingId,
      districtName: district.name,
      buildingType: building.type,
      companyName: building.companyName || '',
      refund
    });
  };

  const confirmSellBuilding = (accept: boolean) => {
    if (!sellPrompt) return;
    
    if (accept) {
      setState(prev => {
        const district = prev.districts.find(d => d.id === sellPrompt.districtId);
        if (!district) return prev;
        const building = district.buildings.find(b => b.id === sellPrompt.buildingId);
        if (!building || building.ownerType !== 'Player') return prev;

        const newLogs = [...prev.logs, { id: Date.now(), tick: prev.tick, message: `[${sellPrompt.companyName}] ${sellPrompt.districtName}의 ${sellPrompt.buildingType}을(를) 매각하여 ${formatCurrency(sellPrompt.refund)}를 회수했습니다.`, type: 'info' as const }].slice(-50);

        return {
          ...prev,
          cash: prev.cash + sellPrompt.refund,
          districts: prev.districts.map(d => d.id === sellPrompt.districtId ? { ...d, buildings: d.buildings.filter(b => b.id !== sellPrompt.buildingId) } : d),
          logs: newLogs
        };
      });
    }
    setSellPrompt(null);
  };

  const handleResetDB = () => {
    if (window.confirm('정말 게임을 초기화하시겠습니까? 모든 데이터(DB)가 삭제됩니다.')) {
      localStorage.removeItem(DB_KEY);
      setState(INITIAL_STATE);
    }
  };

  // Render Helpers
  const NavButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
        activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (!state.currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const tabTitles: Record<TabType, string> = {
    dashboard: '대시보드',
    market: '주식 시장',
    management: '기업 경영',
    realestate: '부동산',
    news: '오늘의 뉴스',
    bank: '머니은행',
    privateloan: '사채기업 (VIP)',
    admin: '수퍼관리자 모드'
  };

  const prevKospi = state.marketHistory.length > 1 ? state.marketHistory[state.marketHistory.length - 2].kospi : state.kospiIndex;
  const prevKosdaq = state.marketHistory.length > 1 ? state.marketHistory[state.marketHistory.length - 2].kosdaq : state.kosdaqIndex;
  const timeInfo = getGameTimeInfo(state.tick);

  return (
    <div className="flex h-screen bg-chaebol-900 text-slate-200 overflow-hidden relative">
      
      {/* 금융 제약 경고 배너 */}
      {state.isRestricted && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle size={20} />
          대출 연체로 인해 금융 거래가 정지되었습니다! 머니은행에서 빚을 상환하세요.
        </div>
      )}

      {/* 예금 중도 해지 모달 (Modal) */}
      {depositCancelPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/50 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <PiggyBank className="text-red-400" size={32} />
              <h3 className="text-2xl font-bold text-white">예금 중도 해지</h3>
            </div>
            <p className="mb-6 text-slate-300 leading-relaxed">
              <strong className="text-blue-400">{depositCancelPrompt.name}</strong> 상품을 만기 전에 해지하시겠습니까?<br/><br/>
              중도 해지 시 누적된 이자는 모두 소멸되며, 원금 <strong className="text-green-400">{formatCurrency(depositCancelPrompt.principal)}</strong>만 반환됩니다.
            </p>
            <div className="flex gap-4">
              <Button variant="danger" className="flex-1 py-3 text-lg" onClick={() => confirmCloseDeposit(true)}>
                해지하기
              </Button>
              <Button variant="secondary" className="flex-1 py-3 text-lg" onClick={() => confirmCloseDeposit(false)}>
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 유상증자 방어권 모달 (Modal) */}
      {state.pendingDefense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/50 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-red-400" size={32} />
              <h3 className="text-2xl font-bold text-white">유상증자 방어권 행사</h3>
            </div>
            <p className="mb-4 text-slate-300 leading-relaxed">
              <strong className="text-blue-400 text-lg">{state.pendingDefense.companyName}</strong>이(가) 주가 호조로 <strong className="text-yellow-400">{state.pendingDefense.newShares}주</strong>의 유상증자를 단행했습니다.<br/><br/>
              {state.pendingDefense.ceoName ? (
                <span className="text-red-300">현재 대표이사인 <strong>{state.pendingDefense.ceoName}</strong>이(가) 이 주식을 매집하여 경영권을 빼앗으려 합니다!</span>
              ) : (
                <span className="text-slate-400">시장에 풀린 신주를 매수하여 지분율을 방어하시겠습니까?</span>
              )}
            </p>
            <div className="bg-slate-900 p-4 rounded-lg mb-6 border border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">방어권 행사 비용</span>
                <span className="font-mono font-bold text-xl text-chaebol-gold">{formatCurrency(state.pendingDefense.cost)}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="success" className="flex-1 py-3 text-lg" onClick={() => handleDefenseResponse(true)}>
                방어 (매수)
              </Button>
              <Button variant="danger" className="flex-1 py-3 text-lg" onClick={() => handleDefenseResponse(false)}>
                포기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 경영권 인수 모달 (Modal) */}
      {acquisitionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl border border-blue-500/50 max-w-md w-full shadow-[0_0_40px_rgba(59,130,246,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="text-chaebol-gold" size={32} />
              <h3 className="text-2xl font-bold text-white">경영권 인수 제안</h3>
            </div>
            <p className="mb-6 text-slate-300 leading-relaxed">
              축하합니다! <strong className="text-blue-400 text-lg">{acquisitionPrompt.name}</strong>의 지분율 51%를 달성하여 최대 주주가 되었습니다.<br/><br/>
              경영권을 인수하여 회사를 직접 경영하시겠습니까?
            </p>
            <div className="flex gap-4">
              <Button variant="success" className="flex-1 py-3 text-lg" onClick={() => handleAcquire(acquisitionPrompt.id, true)}>
                인수하기
              </Button>
              <Button variant="secondary" className="flex-1 py-3 text-lg" onClick={() => handleAcquire(acquisitionPrompt.id, false)}>
                보류하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 부동산 매각 모달 (Modal) */}
      {sellPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/50 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="text-red-400" size={32} />
              <h3 className="text-2xl font-bold text-white">부동산 매각 확인</h3>
            </div>
            <p className="mb-6 text-slate-300 leading-relaxed">
              <strong className="text-blue-400">{sellPrompt.districtName}</strong>에 위치한 <strong className="text-yellow-400">{sellPrompt.buildingType}</strong>을(를) 매각하시겠습니까?<br/><br/>
              매각 시 건설 비용의 80%인 <strong className="text-green-400">{formatCurrency(sellPrompt.refund)}</strong>를 즉시 회수합니다.
            </p>
            <div className="flex gap-4">
              <Button variant="danger" className="flex-1 py-3 text-lg" onClick={() => confirmSellBuilding(true)}>
                매각하기
              </Button>
              <Button variant="secondary" className="flex-1 py-3 text-lg" onClick={() => confirmSellBuilding(false)}>
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-chaebol-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-chaebol-gold tracking-tighter">
            서울 코포레이션
          </h1>
          <p className="text-xs text-slate-400 mt-1 tracking-widest uppercase">타이쿤</p>
          
          {/* 로그인 유저 정보 */}
          <div className="mt-4 flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
            <User size={14} className="text-blue-400" />
            <span className="text-sm font-bold text-slate-200 truncate">{state.currentUser}</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavButton id="dashboard" icon={LayoutDashboard} label="대시보드" />
          <NavButton id="market" icon={LineChart} label="주식 시장" />
          <NavButton id="management" icon={Briefcase} label="기업 경영" />
          <NavButton id="realestate" icon={Map} label="부동산" />
          <NavButton id="news" icon={Newspaper} label="오늘의 뉴스" />
          <NavButton id="bank" icon={Landmark} label="머니은행" />
          <NavButton id="privateloan" icon={TrendingUp} label="사채기업 (VIP)" />
          {state.currentUser === '수퍼관리자' && (
            <div className="pt-4 mt-4 border-t border-slate-700">
              <NavButton id="admin" icon={Settings} label="관리자 모드" />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50 space-y-4">
          {/* 실시간 시계 UI */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 shadow-inner">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Clock size={16} />
              <span className="text-xs font-bold tracking-wider">GAME TIME</span>
            </div>
            <div className="text-lg font-mono font-bold text-slate-200">
              {timeInfo.dateStr}
            </div>
            <div className="text-3xl font-mono font-black text-chaebol-gold tracking-widest">
              {timeInfo.timeStr}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">보유 현금</span>
              <span className="font-mono font-bold text-green-400">{formatCurrency(state.cash)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors py-2 border border-slate-700 rounded hover:bg-slate-700"
            >
              <LogOut size={14} />
              로그아웃
            </button>
            <button 
              onClick={handleResetDB}
              className="flex-1 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors py-2 border border-slate-700 rounded hover:border-red-900 hover:bg-red-900/20"
            >
              <RotateCcw size={14} />
              초기화
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-chaebol-800 border-b border-slate-700 flex items-center px-6 justify-between shrink-0">
          <h2 className="text-xl font-semibold">{tabTitles[activeTab]}</h2>
          <div className="flex items-center gap-6">
            
            {/* Market Indices */}
            <div className="flex items-center gap-6 mr-4 border-r border-slate-700 pr-6">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold">KOSPI</span>
                <div className={`flex items-center gap-1 ${state.kospiIndex >= prevKospi ? 'text-red-400' : 'text-blue-400'}`}>
                  {state.kospiIndex >= prevKospi ? '▲' : '▼'}
                  <span className="font-mono font-bold text-lg">{state.kospiIndex.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold">KOSDAQ</span>
                <div className={`flex items-center gap-1 ${state.kosdaqIndex >= prevKosdaq ? 'text-red-400' : 'text-blue-400'}`}>
                  {state.kosdaqIndex >= prevKosdaq ? '▲' : '▼'}
                  <span className="font-mono font-bold text-lg">{state.kosdaqIndex.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700" title="데이터가 로컬 DB에 자동 저장 중입니다.">
              <Database size={14} className="text-blue-400" />
              <span className="text-slate-400 hidden md:inline">DB 연동됨</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              시장 개장
            </div>
          </div>
        </header>

        {/* Marquee News Bar */}
        <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center overflow-hidden relative shrink-0">
          <div className="absolute left-0 bg-slate-900 z-10 px-4 h-full flex items-center font-bold text-blue-400 border-r border-slate-700 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
            BREAKING
          </div>
          <div className="flex-1 overflow-hidden relative h-full">
            <div className="animate-marquee whitespace-nowrap flex gap-16 absolute h-full items-center w-max">
              {state.news.slice(-15).reverse().map(n => (
                <span key={n.id} className={`
                  ${n.type === 'good' ? 'text-red-400' : ''}
                  ${n.type === 'bad' ? 'text-blue-400' : ''}
                  ${n.type === 'info' ? 'text-slate-300' : ''}
                  ${n.type === 'urgent' ? 'text-yellow-400 font-bold' : ''}
                `}>
                  {n.message}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {activeTab === 'dashboard' && <Dashboard state={state} onSendMessage={handleSendMessage} onSetGroupName={handleSetGroupName} />}
          {activeTab === 'market' && <Market companies={state.companies} cash={state.cash} onBuy={handleBuyStock} onSell={handleSellStock} />}
          {activeTab === 'management' && <Management companies={state.companies} districts={state.districts} cash={state.cash} currentUser={state.currentUser!} onInvest={handleInvest} onBoardAction={handleBoardAction} onSellBuilding={handleSellBuildingClick} />}
          {activeTab === 'realestate' && <RealEstate districts={state.districts} companies={state.companies} cash={state.cash} onBuyLand={handleBuyLand} onRentLand={handleRentLand} onBuild={handleBuild} />}
          {activeTab === 'news' && <NewsView news={state.news} />}
          {activeTab === 'bank' && <Bank state={state} onBorrow={handleBorrowLoan} onPartialRepay={handlePartialRepay} onOpenDeposit={handleOpenDeposit} onCloseDeposit={handleCloseDepositClick} />}
          {activeTab === 'privateloan' && <PrivateLoan state={state} onManagePrivateLoan={handleManagePrivateLoan} />}
          {activeTab === 'admin' && state.currentUser === '수퍼관리자' && <Admin state={state} onUpdateBankSettings={handleUpdateBankSettings} onCreateCompany={handleCreateCompany} />}
        </div>

        {/* Event Log Footer */}
        <footer className="h-48 bg-slate-950 border-t border-slate-800 p-4 flex flex-col shrink-0">
          <h3 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
            <Bell size={14} /> 실시간 피드
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
            {state.logs.map(log => (
              <div key={log.id} className="text-sm flex gap-3 font-mono">
                <span className="text-slate-600 shrink-0">[{getGameTimeInfo(log.tick).fullStr}]</span>
                <span className={`
                  ${log.type === 'info' ? 'text-slate-300' : ''}
                  ${log.type === 'success' ? 'text-green-400' : ''}
                  ${log.type === 'warning' ? 'text-yellow-400' : ''}
                  ${log.type === 'danger' ? 'text-red-400' : ''}
                `}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </footer>
      </main>
      
      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
      `}} />
    </div>
  );
};

export default App;
