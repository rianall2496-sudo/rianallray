import React from 'react';
import { TravelRequest, GameState, InventoryItem, MarketItem, Review } from '../types.ts';
import { formatMoney, generateId, formatGameDateShort } from '../utils.ts';
import { DESTINATIONS } from '../constants.ts';
import { Users, Star, PlaneTakeoff, AlertCircle, Plane, Building, Ticket, ArrowRightLeft, ArrowRight, Car } from 'lucide-react';

interface RequestsProps {
  requests: TravelRequest[];
  setRequests: React.Dispatch<React.SetStateAction<TravelRequest[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  marketItems: MarketItem[];
  setMarketItems: React.Dispatch<React.SetStateAction<MarketItem[]>>;
  addLog: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
}

export const Requests: React.FC<RequestsProps> = ({ 
  requests, setRequests, gameState, setGameState, inventory, setInventory, marketItems, setMarketItems, addLog, setReviews 
}) => {

  const handleAcceptRequest = (req: TravelRequest) => {
    if (gameState.currentStamina <= 0) {
      addLog("체력이 부족합니다.", "warning");
      return;
    }

    let totalCostFromInventory = 0;
    let totalCostFromMarket = 0;
    
    const reqHotelRooms = Math.ceil(req.requiredSeats / 2) * req.duration;
    const reqRentalCars = Math.ceil(req.requiredSeats / 4) * req.duration;

    // Define required items
    const itemsNeeded: { type: 'flight' | 'hotel' | 'attraction' | 'rental_car', amount: number, depDay: number, depAir?: string, arrAir?: string }[] = [
      { type: 'flight', amount: req.requiredSeats, depDay: req.departureDay, depAir: req.departureAirport, arrAir: req.arrivalAirport },
    ];

    if (req.isRoundTrip && req.returnDay) {
      itemsNeeded.push({ type: 'flight', amount: req.requiredSeats, depDay: req.returnDay, depAir: req.arrivalAirport, arrAir: req.departureAirport });
    }

    if (req.requiresHotel) {
      itemsNeeded.push({ type: 'hotel', amount: reqHotelRooms, depDay: req.departureDay });
    }

    if (req.requiresAttraction) {
      itemsNeeded.push({ type: 'attraction', amount: req.requiredSeats, depDay: req.departureDay });
    }

    if (req.requiresRentalCar) {
      itemsNeeded.push({ type: 'rental_car', amount: reqRentalCars, depDay: req.departureDay });
    }

    const inventoryUpdates: { id: string, deduct: number }[] = [];
    const marketUpdates: { id: string, deduct: number, cost: number }[] = [];

    for (const need of itemsNeeded) {
      let amountNeeded = need.amount;
      
      // 1. Try Inventory
      const matchingInv = inventory.filter(i => {
        if (i.type !== need.type || i.destination !== req.destination || i.departureDay !== need.depDay || i.stockOwned <= 0) return false;
        if (need.type === 'flight') {
          return i.departureAirport === need.depAir && i.arrivalAirport === need.arrAir;
        }
        return true;
      });

      for (const inv of matchingInv) {
        if (amountNeeded <= 0) break;
        const take = Math.min(inv.stockOwned, amountNeeded);
        inventoryUpdates.push({ id: inv.id, deduct: take });
        totalCostFromInventory += take * inv.averagePurchasePrice;
        amountNeeded -= take;
      }

      // 2. Try Market
      if (amountNeeded > 0) {
        const matchingMarket = marketItems.filter(m => {
          if (m.type !== need.type || m.destination !== req.destination || m.departureDay !== need.depDay || m.availableStock <= 0) return false;
          if (need.type === 'flight') {
            return m.departureAirport === need.depAir && m.arrivalAirport === need.arrAir;
          }
          return true;
        }).sort((a, b) => a.currentPrice - b.currentPrice);
        
        for (const mkt of matchingMarket) {
          if (amountNeeded <= 0) break;
          const take = Math.min(mkt.availableStock, amountNeeded);
          marketUpdates.push({ id: mkt.id, deduct: take, cost: take * mkt.currentPrice });
          totalCostFromMarket += take * mkt.currentPrice;
          amountNeeded -= take;
        }

        if (amountNeeded > 0) {
          const typeName = need.type === 'flight' ? (need.depAir === req.departureAirport ? '출국 항공권' : '귀국 항공권') : need.type === 'hotel' ? '호텔' : need.type === 'attraction' ? '관광지' : '렌터카';
          addLog(`[실패] ${req.destination}행 ${typeName}이(가) 부족합니다.`, "error");
          return;
        }
      }
    }

    if (gameState.money < totalCostFromMarket) {
      addLog(`[실패] 시장에서 부족한 상품을 구매할 자금이 부족합니다.`, "error");
      return;
    }

    // Execute Transaction
    setGameState(prev => ({ ...prev, currentStamina: prev.currentStamina - 1 }));

    const successChance = Math.min(95, Math.max(10, 50 + (gameState.stats.charm - req.requiredCharm) * 2));
    const isSuccess = (Math.random() * 100) <= successChance;

    if (isSuccess) {
      // Apply inventory deductions
      setInventory(prev => prev.map(i => {
        const update = inventoryUpdates.find(u => u.id === i.id);
        return update ? { ...i, stockOwned: i.stockOwned - update.deduct } : i;
      }).filter(i => i.stockOwned > 0));
      
      // Apply market deductions & pay
      setMarketItems(prev => prev.map(m => {
        const update = marketUpdates.find(u => u.id === m.id);
        return update ? { ...m, availableStock: m.availableStock - update.deduct } : m;
      }));
      
      const totalCost = totalCostFromInventory + totalCostFromMarket;
      const intBonus = 1 + (gameState.stats.intelligence / 200);
      const finalReward = Math.floor(req.reward * intBonus);
      const profit = finalReward - totalCost;
      const repGain = req.requiredSeats * (req.type === 'vip' ? 10 : 2);

      setGameState(prev => ({
        ...prev,
        money: prev.money - totalCostFromMarket + finalReward,
        stats: { ...prev.stats, reputation: prev.stats.reputation + repGain }
      }));

      addLog(`[계약 성공] ${req.customerType} 고객의 ${req.destination} 여행! 수익: ${formatMoney(profit)}`, "success");
      
      // Generate Review
      if (Math.random() > 0.3) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
        setReviews(prev => [{ id: generateId(), customerName: req.customerType, rating, comment: "정말 완벽한 여행이었습니다! 추천합니다.", day: gameState.day }, ...prev].slice(0, 10));
      }

    } else {
      const repLoss = req.requiredSeats * 2;
      setGameState(prev => ({
        ...prev,
        stats: { ...prev.stats, reputation: Math.max(0, prev.stats.reputation - repLoss) }
      }));
      addLog(`[계약 실패] ${req.customerType} 고객이 제안을 거절했습니다. 명성 -${repLoss}`, "error");
      
      if (Math.random() > 0.5) {
        const rating = Math.floor(Math.random() * 2) + 1; // 1 or 2 stars
        setReviews(prev => [{ id: generateId(), customerName: req.customerType, rating, comment: "서비스가 너무 실망스럽네요.", day: gameState.day }, ...prev].slice(0, 10));
      }
    }

    setRequests(prev => prev.filter(r => r.id !== req.id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-green-600" />
          고객 의뢰
        </h2>
        <p className="text-sm text-slate-500">고객이 원하는 패키지 구성을 확인하고 수락하세요.</p>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2">
        {requests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <PlaneTakeoff className="w-16 h-16 mb-4 opacity-20" />
            <p>현재 대기 중인 의뢰가 없습니다.</p>
            <p className="text-sm">영업을 종료하고 다음 날을 맞이하세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {requests.map(req => {
              const isVip = req.type === 'vip';
              const destInfo = DESTINATIONS.find(d => d.name === req.destination);
              
              // Check inventory status for UI
              const outFlightInv = inventory.filter(i => i.type === 'flight' && i.departureAirport === req.departureAirport && i.arrivalAirport === req.arrivalAirport && i.departureDay === req.departureDay).reduce((sum, i) => sum + i.stockOwned, 0);
              const retFlightInv = req.isRoundTrip ? inventory.filter(i => i.type === 'flight' && i.departureAirport === req.arrivalAirport && i.arrivalAirport === req.departureAirport && i.departureDay === req.returnDay).reduce((sum, i) => sum + i.stockOwned, 0) : 0;
              
              const hotelInv = inventory.filter(i => i.type === 'hotel' && i.destination === req.destination && i.departureDay === req.departureDay).reduce((sum, i) => sum + i.stockOwned, 0);
              const attrInv = inventory.filter(i => i.type === 'attraction' && i.destination === req.destination && i.departureDay === req.departureDay).reduce((sum, i) => sum + i.stockOwned, 0);
              const carInv = inventory.filter(i => i.type === 'rental_car' && i.destination === req.destination && i.departureDay === req.departureDay).reduce((sum, i) => sum + i.stockOwned, 0);

              const reqHotelRooms = Math.ceil(req.requiredSeats / 2) * req.duration;
              const reqRentalCars = Math.ceil(req.requiredSeats / 4) * req.duration;

              return (
                <div key={req.id} className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-full
                  ${isVip ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white'} hover:shadow-md`}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        {isVip && <Star className="w-5 h-5 text-purple-600 fill-purple-600" />}
                        {req.isDomestic ? '[국내]' : '[국외]'} [{destInfo?.country}] {req.destination} 여행
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.isRoundTrip ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white'}`}>
                        {req.isRoundTrip ? '왕복' : '편도'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-600 mb-4 flex flex-col gap-1 bg-slate-100 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 font-bold">
                          <Plane className="w-3 h-3 text-blue-500" />
                          <span>출국: {req.departureAirport} <ArrowRight className="w-3 h-3 inline"/> {req.arrivalAirport}</span>
                        </div>
                        <span className="text-slate-500">{formatGameDateShort(req.departureDay)}</span>
                      </div>
                      {req.isRoundTrip && req.returnDay && (
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200">
                          <div className="flex items-center gap-1 font-bold">
                            <Plane className="w-3 h-3 text-indigo-500" />
                            <span>귀국: {req.arrivalAirport} <ArrowRight className="w-3 h-3 inline"/> {req.departureAirport}</span>
                          </div>
                          <span className="text-slate-500">{formatGameDateShort(req.returnDay)}</span>
                        </div>
                      )}
                      <div className="mt-1 text-slate-500">
                        체류 기간: {req.duration}박 {req.duration + 1}일
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600 mb-4 bg-white/50 p-3 rounded-xl">
                      <div className="flex justify-between">
                        <span>고객 유형:</span>
                        <span className="font-medium text-slate-900">{req.customerType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>인원:</span>
                        <span className="font-bold text-slate-900">{req.requiredSeats}명</span>
                      </div>
                      <div className="flex justify-between">
                        <span>예산 (총액):</span>
                        <span className="font-bold text-green-600">{formatMoney(req.reward)}</span>
                      </div>
                    </div>

                    <div className="mb-6 space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase">필요 구성 및 보유 현황</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1"><Plane className="w-4 h-4 text-blue-500"/> 출국 항공권</span>
                        <span className={outFlightInv >= req.requiredSeats ? 'text-blue-600 font-bold' : 'text-red-500'}>{outFlightInv} / {req.requiredSeats}</span>
                      </div>
                      {req.isRoundTrip && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1"><Plane className="w-4 h-4 text-indigo-500"/> 귀국 항공권</span>
                          <span className={retFlightInv >= req.requiredSeats ? 'text-indigo-600 font-bold' : 'text-red-500'}>{retFlightInv} / {req.requiredSeats}</span>
                        </div>
                      )}
                      {req.requiresHotel && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1"><Building className="w-4 h-4 text-indigo-500"/> 호텔 객실 ({req.duration}박)</span>
                          <span className={hotelInv >= reqHotelRooms ? 'text-indigo-600 font-bold' : 'text-red-500'}>{hotelInv} / {reqHotelRooms}</span>
                        </div>
                      )}
                      {req.requiresAttraction && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1"><Ticket className="w-4 h-4 text-orange-500"/> 관광지 티켓</span>
                          <span className={attrInv >= req.requiredSeats ? 'text-orange-600 font-bold' : 'text-red-500'}>{attrInv} / {req.requiredSeats}</span>
                        </div>
                      )}
                      {req.requiresRentalCar && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1"><Car className="w-4 h-4 text-teal-500"/> 렌터카 ({req.duration}일)</span>
                          <span className={carInv >= reqRentalCars ? 'text-teal-600 font-bold' : 'text-red-500'}>{carInv} / {reqRentalCars}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptRequest(req)}
                    disabled={gameState.currentStamina <= 0}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors
                      ${gameState.currentStamina <= 0 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : isVip 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm' 
                          : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                      }`}
                  >
                    의뢰 수락 (체력 -1)
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
