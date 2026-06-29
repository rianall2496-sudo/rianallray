import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, MarketItem, InventoryItem, TravelRequest, LogEntry, Review, GameEvent } from './types.ts';
import { INITIAL_MONEY, INITIAL_STATS, DESTINATIONS, AIRLINES, HOTELS, ATTRACTIONS, RENTAL_CARS, CUSTOMER_TYPES, RANDOM_EVENTS, AGENCY_STAGES } from './constants.ts';
import { formatMoney, generateId, formatGameDateFull, formatGameDateShort, calculateArrivalTime, getGameTime } from './utils.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { Market } from './components/Market.tsx';
import { Inventory } from './components/Inventory.tsx';
import { Requests } from './components/Requests.tsx';
import { 
  Building2, Wallet, Calendar, Battery, ArrowRight, Coffee, 
  LayoutDashboard, Plane, Briefcase, Users, Trash2, AlertTriangle, Star,
  FileText, X, PlaneTakeoff, PlaneLanding, Play, Pause, FastForward
} from 'lucide-react';

const TICK_RATE = 1000; // Update every second

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: INITIAL_MONEY,
    day: 1,
    stage: 1,
    stats: { ...INITIAL_STATS },
    currentStamina: 3 + Math.floor(INITIAL_STATS.stamina / 10),
    employees: [],
    marketingBuff: 0
  });

  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'market' | 'inventory' | 'requests'>('dashboard');
  const [tickerText, setTickerText] = useState<React.ReactNode[]>([]);
  
  // Real-time Progression States
  const [dayProgress, setDayProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [realTime, setRealTime] = useState(new Date());
  
  // Refs for stable callbacks
  const gameStateRef = useRef(gameState);
  const activeEventRef = useRef(activeEvent);
  
  // Log Panel States
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isLogOpenRef = useRef(isLogOpen);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { activeEventRef.current = activeEvent; }, [activeEvent]);

  useEffect(() => {
    isLogOpenRef.current = isLogOpen;
    if (isLogOpen) {
      setUnreadCount(0);
    }
  }, [isLogOpen]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: generateId(), message, type, timestamp: new Date() }]);
    if (!isLogOpenRef.current) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (isLogOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLogOpen]);

  // Generate Ticker Messages
  useEffect(() => {
    const unlockedDestinations = DESTINATIONS.filter(d => d.stage <= gameState.stage);
    const unlockedAirlines = AIRLINES.slice(0, gameState.stage * 10);
    const messages: { time: string, text: string, isDeparture: boolean }[] = [];
    
    for(let i=0; i<25; i++) {
      const dest = unlockedDestinations[Math.floor(Math.random() * unlockedDestinations.length)];
      const airline = unlockedAirlines[Math.floor(Math.random() * unlockedAirlines.length)] || AIRLINES[0];
      const isDeparture = Math.random() > 0.5;
      const hour = String(Math.floor(Math.random() * 16) + 6).padStart(2, '0'); // 06 to 21
      const minute = String(Math.floor(Math.random() * 6) * 10).padStart(2, '0');
      const time = `${hour}:${minute}`;
      const homeAirport = dest.isDomestic ? "김포(GMP)" : "인천(ICN)";

      if (isDeparture) {
        messages.push({ time, text: `${airline} ${time} ${homeAirport} ➔ ${dest.airport} 이륙`, isDeparture });
      } else {
        messages.push({ time, text: `${airline} ${time} ${dest.airport} ➔ ${homeAirport} 도착`, isDeparture });
      }
    }
    
    messages.sort((a, b) => a.time.localeCompare(b.time));
    
    const formattedElements = messages.map((msg, idx) => (
      <span key={idx} className="inline-flex items-center mx-6">
        {msg.isDeparture ? (
          <PlaneTakeoff className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
        ) : (
          <PlaneLanding className="w-3.5 h-3.5 text-green-400 mr-1.5" />
        )}
        <span className={msg.isDeparture ? 'text-blue-100' : 'text-green-100'}>
          {msg.text}
        </span>
        <span className="mx-6 text-slate-600">✦</span>
      </span>
    ));

    setTickerText(formattedElements);
  }, [gameState.day, gameState.stage]);

  // Generate market items ensuring every destination has at least 1 flight, hotel, and attraction
  const generateMarketItemsForDay = useCallback((targetDay: number, stage: number, event: GameEvent | null, specificDestinations?: typeof DESTINATIONS) => {
    const newItems: MarketItem[] = [];
    const destsToUse = specificDestinations || DESTINATIONS.filter(d => d.stage <= stage);
    const unlockedAirlines = AIRLINES.slice(0, stage * 10);
    const unlockedHotels = HOTELS.slice(0, stage * 4);
    const unlockedAttractions = ATTRACTIONS.slice(0, stage * 4);

    for (const dest of destsToUse) {
      let priceMod = 1;
      if (event && (!event.targetDestination || event.targetDestination === dest.name)) {
        priceMod = event.priceMultiplier;
      }

      const departureAirport = dest.isDomestic ? "김포(GMP)" : "인천(ICN)";
      const arrivalAirport = dest.airport;

      // Outbound Flight (출국편)
      const outAirline = unlockedAirlines[Math.floor(Math.random() * unlockedAirlines.length)] || AIRLINES[0];
      const outSeats = 50 + Math.floor(Math.random() * 150);
      const outHour = String(Math.floor(Math.random() * 14) + 6).padStart(2, '0'); // 06~19
      const outMin = String(Math.floor(Math.random() * 6) * 10).padStart(2, '0');
      const outTime = `${outHour}:${outMin}`;
      const outArrTime = calculateArrivalTime(outTime, dest.flightTime);

      newItems.push({
        id: generateId(), type: 'flight', provider: outAirline, destination: dest.name, country: dest.country, isDomestic: dest.isDomestic, departureDay: targetDay,
        departureAirport, arrivalAirport, departureTime: outTime, arrivalTime: outArrTime, flightTime: dest.flightTime, isReturn: false,
        basePrice: dest.basePrice, currentPrice: Math.floor(dest.basePrice * (0.9 + Math.random() * 0.2) * priceMod),
        totalStock: outSeats, availableStock: Math.floor(outSeats * (0.5 + Math.random() * 0.5))
      });

      // Return Flight (귀국편)
      const retAirline = unlockedAirlines[Math.floor(Math.random() * unlockedAirlines.length)] || AIRLINES[0];
      const retSeats = 50 + Math.floor(Math.random() * 150);
      const retHour = String(Math.floor(Math.random() * 14) + 8).padStart(2, '0'); // 08~21
      const retMin = String(Math.floor(Math.random() * 6) * 10).padStart(2, '0');
      const retTime = `${retHour}:${retMin}`;
      const retArrTime = calculateArrivalTime(retTime, dest.flightTime);

      newItems.push({
        id: generateId(), type: 'flight', provider: retAirline, destination: dest.name, country: dest.country, isDomestic: dest.isDomestic, departureDay: targetDay,
        departureAirport: arrivalAirport, arrivalAirport: departureAirport, departureTime: retTime, arrivalTime: retArrTime, flightTime: dest.flightTime, isReturn: true,
        basePrice: dest.basePrice, currentPrice: Math.floor(dest.basePrice * (0.9 + Math.random() * 0.2) * priceMod),
        totalStock: retSeats, availableStock: Math.floor(retSeats * (0.5 + Math.random() * 0.5))
      });

      // Hotel (Price per night)
      const hotel = unlockedHotels[Math.floor(Math.random() * unlockedHotels.length)] || HOTELS[0];
      const hotelRooms = 20 + Math.floor(Math.random() * 50);
      const hotelBasePrice = dest.basePrice * 0.4;
      newItems.push({
        id: generateId(), type: 'hotel', provider: hotel, destination: dest.name, country: dest.country, isDomestic: dest.isDomestic, departureDay: targetDay,
        basePrice: hotelBasePrice, currentPrice: Math.floor(hotelBasePrice * (0.9 + Math.random() * 0.2) * priceMod),
        totalStock: hotelRooms, availableStock: Math.floor(hotelRooms * (0.5 + Math.random() * 0.5))
      });

      // Attraction
      const attr = unlockedAttractions[Math.floor(Math.random() * unlockedAttractions.length)] || ATTRACTIONS[0];
      const attrTickets = 100 + Math.floor(Math.random() * 200);
      const attrBasePrice = dest.basePrice * 0.2;
      newItems.push({
        id: generateId(), type: 'attraction', provider: attr, destination: dest.name, country: dest.country, isDomestic: dest.isDomestic, departureDay: targetDay,
        basePrice: attrBasePrice, currentPrice: Math.floor(attrBasePrice * (0.9 + Math.random() * 0.2) * priceMod),
        totalStock: attrTickets, availableStock: Math.floor(attrTickets * (0.5 + Math.random() * 0.5))
      });

      // Rental Car
      const rental = RENTAL_CARS[Math.floor(Math.random() * RENTAL_CARS.length)];
      const rentalCars = 10 + Math.floor(Math.random() * 30);
      const rentalBasePrice = dest.basePrice * 0.15;
      newItems.push({
        id: generateId(), type: 'rental_car', provider: rental, destination: dest.name, country: dest.country, isDomestic: dest.isDomestic, departureDay: targetDay,
        basePrice: rentalBasePrice, currentPrice: Math.floor(rentalBasePrice * (0.9 + Math.random() * 0.2) * priceMod),
        totalStock: rentalCars, availableStock: Math.floor(rentalCars * (0.5 + Math.random() * 0.5))
      });
    }
    return newItems;
  }, []);

  // Initial Setup
  useEffect(() => {
    if (gameState.day === 1 && marketItems.length === 0) {
      let initialItems: MarketItem[] = [];
      // Generate up to day 21 to cover max duration (14 days) + max departure delay (5 days)
      for (let d = 2; d <= 21; d++) {
        initialItems = [...initialItems, ...generateMarketItemsForDay(d, gameState.stage, null)];
      }
      setMarketItems(initialItems);
      addLog("월드투어 타이쿤에 오신 것을 환영합니다! 항공권, 호텔, 관광지를 확보하여 패키지를 구성하세요.", 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgradeAgency = () => {
    const nextStage = gameState.stage + 1;
    if (!AGENCY_STAGES[nextStage]) return;

    setGameState(prev => ({ ...prev, stage: nextStage }));
    addLog(`축하합니다! [${AGENCY_STAGES[nextStage].name}](으)로 승급했습니다! (테스트: 조건 무시)`, 'success');

    // Inject new items for the newly unlocked destinations immediately
    const newlyUnlockedDestinations = DESTINATIONS.filter(d => d.stage === nextStage);
    let newItems: MarketItem[] = [];
    for (let d = gameState.day + 1; d <= gameState.day + 20; d++) {
      newItems = [...newItems, ...generateMarketItemsForDay(d, nextStage, activeEvent, newlyUnlockedDestinations)];
    }
    setMarketItems(prev => [...prev, ...newItems]);
  };

  const handleNextDay = useCallback(() => {
    const state = gameStateRef.current;
    const currentEvent = activeEventRef.current;
    const nextDay = state.day + 1;
    
    // Calculate Costs
    const baseCost = state.stage * 500000;
    const salaryCost = state.employees.reduce((sum, emp) => sum + emp.salary, 0);
    const dailyCost = baseCost + salaryCost;
    
    // Event Logic
    let newEvent = currentEvent;
    if (newEvent) {
      newEvent.duration -= 1;
      if (newEvent.duration <= 0) {
        addLog(`[이벤트 종료] ${newEvent.name} 이벤트가 종료되었습니다.`, 'info');
        newEvent = null;
      }
    }
    if (!newEvent && Math.random() < 0.15) { // 15% chance for new event
      const baseEvent = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      const targetDest = Math.random() > 0.5 ? DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)].name : undefined;
      newEvent = { ...baseEvent, id: generateId(), duration: Math.floor(Math.random() * 3) + 2, targetDestination: targetDest };
      addLog(`[이벤트 발생] ${newEvent.name}! ${newEvent.description}`, newEvent.type === 'negative' ? 'error' : 'success');
    }
    setActiveEvent(newEvent);

    // Expire old data
    setMarketItems(prev => prev.filter(f => f.departureDay >= nextDay));
    
    setInventory(prev => {
      const expired = prev.filter(i => i.departureDay < nextDay);
      if (expired.length > 0) {
        const lostValue = expired.reduce((sum, i) => sum + (i.stockOwned * i.averagePurchasePrice), 0);
        addLog(`[손실] 일정이 지난 자산이 폐기되었습니다. 손실액: ${formatMoney(lostValue)}`, "error");
      }
      return prev.filter(i => i.departureDay >= nextDay);
    });

    setRequests(prev => prev.filter(r => r.departureDay >= nextDay));

    // Generate new market items for the future day (nextDay + 20) to keep the window full
    const newItems = generateMarketItemsForDay(nextDay + 20, state.stage, newEvent);

    // Fluctuate existing prices
    setMarketItems(prev => {
      const updated = prev.map(item => {
        const daysUntilDeparture = item.departureDay - nextDay;
        const fluctuation = 1 + (Math.random() * 0.1 - 0.03);
        let newPrice = Math.floor(item.currentPrice * fluctuation);
        if (daysUntilDeparture === 1 && Math.random() > 0.5) newPrice = Math.floor(newPrice * 1.2); 
        return { ...item, currentPrice: newPrice };
      });
      return [...updated, ...newItems];
    });

    // Generate new requests
    const newRequests: TravelRequest[] = [];
    let baseNumRequests = 5 + state.stage * 3; // Increased requests
    
    // Marketing Buff
    if (state.marketingBuff > 0) {
      baseNumRequests = Math.floor(baseNumRequests * 1.5);
    }
    
    // Event Buff
    if (newEvent) {
      baseNumRequests = Math.floor(baseNumRequests * newEvent.demandMultiplier);
    }

    const unlockedDestinations = DESTINATIONS.filter(d => d.stage <= state.stage);

    for(let i=0; i<baseNumRequests; i++) {
      const dest = unlockedDestinations[Math.floor(Math.random() * unlockedDestinations.length)];
      const customerType = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
      
      let isVip = customerType.isVip;
      if (isVip && state.stats.reputation < 1000 && state.marketingBuff === 0) continue;

      const requiredSeats = Array.isArray(customerType.seats) 
        ? customerType.seats[Math.floor(Math.random() * customerType.seats.length)]
        : customerType.seats;

      const departureDay = nextDay + Math.floor(Math.random() * 5) + 1;
      const duration = Math.floor(Math.random() * (dest.maxDuration - dest.minDuration + 1)) + dest.minDuration;
      const isRoundTrip = Math.random() > 0.2; // 80% chance for round trip
      const returnDay = departureDay + duration;
      
      let totalBaseCost = dest.basePrice; // Outbound Flight
      if (isRoundTrip) totalBaseCost += dest.basePrice; // Return Flight
      if (customerType.wantsHotel) totalBaseCost += (dest.basePrice * 0.4) * duration * 0.5; // Hotel (half room per person per night)
      if (customerType.wantsAttraction) totalBaseCost += dest.basePrice * 0.2; // Attraction
      if (customerType.wantsRentalCar) totalBaseCost += (dest.basePrice * 0.15) * duration * 0.25; // Rental Car (1 car per 4 people)

      const budgetPerPerson = Math.floor(totalBaseCost * customerType.budgetMultiplier * (1.1 + Math.random() * 0.4));
      
      const departureAirport = dest.isDomestic ? "김포(GMP)" : "인천(ICN)";

      newRequests.push({
        id: generateId(),
        customerType: customerType.name,
        destination: dest.name,
        isDomestic: dest.isDomestic,
        departureAirport,
        arrivalAirport: dest.airport,
        duration,
        departureDay,
        isRoundTrip,
        returnDay: isRoundTrip ? returnDay : undefined,
        requiredSeats,
        requiresHotel: customerType.wantsHotel,
        requiresAttraction: customerType.wantsAttraction,
        requiresRentalCar: customerType.wantsRentalCar,
        budgetPerPerson,
        reward: budgetPerPerson * requiredSeats,
        requiredCharm: customerType.charmReq,
        type: isVip ? 'vip' : 'normal'
      });
    }

    setRequests(prev => [...prev, ...newRequests]);

    // Employee Buffs
    let extraStamina = 0;
    state.employees.forEach(emp => {
      if (emp.role === "예약 전문가") extraStamina += 1;
    });

    setGameState(prev => ({
      ...prev,
      day: nextDay,
      money: prev.money - dailyCost,
      currentStamina: 3 + Math.floor(prev.stats.stamina / 10) + extraStamina,
      marketingBuff: Math.max(0, prev.marketingBuff - 1)
    }));

    setDayProgress(0);
    addLog(`--- ${formatGameDateFull(nextDay)} 영업 시작 --- (유지비: -${formatMoney(dailyCost)})`, 'info');
  }, [addLog, generateMarketItemsForDay]);

  // Real-time Game Loop & NPC Buying Logic
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const now = new Date();
      setRealTime(now);
      
      // Calculate progress based on real time (00:00 to 23:59 maps to 0 to 100)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const totalSecondsInDay = 24 * 60 * 60;
      const currentSeconds = (hours * 60 * 60) + (minutes * 60) + seconds;
      
      const progress = (currentSeconds / totalSecondsInDay) * 100;
      setDayProgress(progress);

      // NPC Buying Logic (Simulate market demand)
      setMarketItems(prev => prev.map(item => {
        if (item.availableStock <= 0) return item;
        
        // NPC 구매 10% 확률로 허용 (매진 가능성)
        if (Math.random() < 0.10) {
          const buyAmount = Math.floor(Math.random() * 3) + 1; // NPCs buy 1-3 items
          return { ...item, availableStock: Math.max(0, item.availableStock - buyAmount) };
        }
        return item;
      }));

    }, TICK_RATE);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Check for real date change to trigger next game day
  useEffect(() => {
    const checkDateChange = setInterval(() => {
      const now = new Date();
      // If it's exactly midnight (or very close to it), trigger next day
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 2) {
        handleNextDay();
      }
    }, 1000);
    return () => clearInterval(checkDateChange);
  }, [handleNextDay]);

  let extraStamina = 0;
  gameState.employees.forEach(emp => { if (emp.role === "예약 전문가") extraStamina += 1; });
  const maxStamina = 3 + Math.floor(gameState.stats.stamina / 10) + extraStamina;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">World Tour Tycoon</h1>
              <p className="text-xs text-slate-500 font-medium">글로벌 여행사 시뮬레이션</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Date & Progress */}
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 relative overflow-hidden min-w-[180px]">
              <div 
                className="absolute left-0 bottom-0 h-1 bg-blue-500 transition-all duration-100 ease-linear"
                style={{ width: `${dayProgress}%` }}
              />
              <Calendar className="w-5 h-5 text-slate-500 z-10" />
              <div className="z-10">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">진행 일자</p>
                <p className="font-bold text-slate-800 leading-none">
                  {formatGameDateFull(gameState.day)} <span className="text-blue-600 ml-1">{realTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>
            </div>

            {/* Time Controls */}
            <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-xl">
              <button 
                onClick={() => setIsPaused(!isPaused)} 
                className={`p-2 rounded-lg transition-colors ${isPaused ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
                title={isPaused ? "재생" : "일시정지"}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleNextDay} 
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-300 hover:text-slate-800 transition-colors" 
                title="다음 날로 건너뛰기"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
              <Wallet className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">보유 자금</p>
                <p className="font-bold text-green-700 leading-none">{formatMoney(gameState.money)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
              <Battery className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">오늘의 체력</p>
                <p className="font-bold text-blue-700 leading-none">{gameState.currentStamina} / {maxStamina}</p>
              </div>
            </div>
            
            {/* Cheat Button for Testing */}
            <button
              onClick={() => {
                setGameState(prev => ({
                  ...prev,
                  money: prev.money + 1000000000, // 1B KRW
                  currentStamina: 99
                }));
                addLog("테스트 지원: 자금 10억, 체력 99 회복", "success");
              }}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm ml-2"
            >
              <Star className="w-4 h-4" />
              자금/체력 MAX
            </button>
          </div>
        </div>
      </header>

      {/* Flight Ticker */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 overflow-hidden flex items-center border-b border-slate-800 relative z-10">
        <div className="px-4 font-bold text-blue-400 shrink-0 border-r border-slate-700 bg-slate-900 flex items-center gap-2 z-20">
          <Plane className="w-3.5 h-3.5" /> 실시간 운항정보 ({formatGameDateShort(gameState.day)})
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-ticker inline-block whitespace-nowrap pl-4">
            {tickerText}
          </div>
        </div>
      </div>

      {/* Event Banner */}
      {activeEvent && (
        <div className={`w-full py-2 px-4 text-center font-bold text-sm shadow-sm z-10
          ${activeEvent.type === 'positive' ? 'bg-green-500 text-white' : activeEvent.type === 'negative' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          <AlertTriangle className="w-4 h-4 inline-block mr-2 mb-0.5" />
          [이벤트] {activeEvent.name} - {activeEvent.description} ({activeEvent.duration}일 남음)
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4 h-[calc(100vh-120px)]">
        {/* Tabs */}
        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
          {[
            { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
            { id: 'market', label: 'B2B 거래소', icon: Plane },
            { id: 'inventory', label: '보유 자산', icon: Briefcase },
            { id: 'requests', label: '고객 의뢰', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all
                ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
          {activeTab === 'dashboard' && <Dashboard gameState={gameState} setGameState={setGameState} addLog={addLog} reviews={reviews} onUpgradeAgency={handleUpgradeAgency} />}
          {activeTab === 'market' && <Market marketItems={marketItems} setMarketItems={setMarketItems} gameState={gameState} setGameState={setGameState} setInventory={setInventory} addLog={addLog} />}
          {activeTab === 'inventory' && <Inventory inventory={inventory} marketItems={marketItems} />}
          {activeTab === 'requests' && <Requests requests={requests} setRequests={setRequests} gameState={gameState} setGameState={setGameState} inventory={inventory} setInventory={setInventory} marketItems={marketItems} setMarketItems={setMarketItems} addLog={addLog} setReviews={setReviews} />}
        </div>
      </main>

      {/* Floating Log Button (FAB) */}
      {!isLogOpen && (
        <button
          onClick={() => setIsLogOpen(true)}
          className="fixed bottom-6 right-6 bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-full shadow-2xl z-50 transition-transform hover:scale-105 flex items-center justify-center"
        >
          <FileText className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Log Panel */}
      {isLogOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-80 z-50 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-3 bg-slate-800 text-white font-bold text-sm flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>업무 일지</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setLogs([])} className="text-slate-400 hover:text-white transition-colors" title="기록 지우기">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsLogOpen(false)} className="text-slate-400 hover:text-white transition-colors" title="닫기">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs custom-scrollbar bg-slate-50">
            {logs.length === 0 ? (
              <p className="text-center text-slate-400 py-4">기록된 업무 일지가 없습니다.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[10px]">
                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`font-medium leading-relaxed
                    ${log.type === 'error' ? 'text-red-600' : ''}
                    ${log.type === 'success' ? 'text-green-700' : ''}
                    ${log.type === 'warning' ? 'text-yellow-700' : ''}
                    ${log.type === 'info' ? 'text-slate-700' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
