import React, { useState } from 'react';
import { MarketItem, GameState, InventoryItem, ItemType } from '../types.ts';
import { formatMoney, generateId, formatGameDateShort, formatDuration } from '../utils.ts';
import { Plane, Building, Ticket, TrendingUp, TrendingDown, Search, Clock, Car } from 'lucide-react';

interface MarketProps {
  marketItems: MarketItem[];
  setMarketItems: React.Dispatch<React.SetStateAction<MarketItem[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addLog: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
}

export const Market: React.FC<MarketProps> = ({ marketItems, setMarketItems, gameState, setGameState, setInventory, addLog }) => {
  const [activeType, setActiveType] = useState<ItemType>('flight');
  const [flightRouteType, setFlightRouteType] = useState<'all' | 'domestic' | 'international'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof MarketItem; direction: 'asc' | 'desc' }>({ key: 'departureDay', direction: 'asc' });
  
  // Search states for Flights
  const [departureSearch, setDepartureSearch] = useState('');
  const [arrivalSearch, setArrivalSearch] = useState('');

  // Search states for Hotels
  const [hotelDestSearch, setHotelDestSearch] = useState('');
  const [hotelProviderSearch, setHotelProviderSearch] = useState('');

  // Search states for Attractions
  const [attrDestSearch, setAttrDestSearch] = useState('');
  const [attrProviderSearch, setAttrProviderSearch] = useState('');

  // Search states for Rental Cars
  const [carDestSearch, setCarDestSearch] = useState('');
  const [carProviderSearch, setCarProviderSearch] = useState('');

  const handleBuy = (itemId: string, amount: number) => {
    const item = marketItems.find(i => i.id === itemId);
    if (!item) return;
    const cost = item.currentPrice * amount;
    
    if (gameState.money < cost) {
      addLog("자금이 부족합니다.", "error");
      return;
    }
    
    setGameState(prev => ({ ...prev, money: prev.money - cost }));
    setMarketItems(prev => prev.map(i => i.id === itemId ? { ...i, availableStock: i.availableStock - amount } : i));
    
    setInventory(prev => {
      const existing = prev.find(i => i.marketId === itemId);
      if (existing) {
        const newTotal = existing.stockOwned + amount;
        const newAvgPrice = ((existing.stockOwned * existing.averagePurchasePrice) + cost) / newTotal;
        return prev.map(i => i.marketId === itemId ? { ...i, stockOwned: newTotal, averagePurchasePrice: newAvgPrice } : i);
      } else {
        return [...prev, {
          id: generateId(),
          marketId: item.id,
          type: item.type,
          provider: item.provider,
          destination: item.destination,
          country: item.country,
          isDomestic: item.isDomestic,
          departureAirport: item.departureAirport,
          arrivalAirport: item.arrivalAirport,
          departureDay: item.departureDay,
          departureTime: item.departureTime,
          arrivalTime: item.arrivalTime,
          flightTime: item.flightTime,
          isReturn: item.isReturn,
          stockOwned: amount,
          averagePurchasePrice: item.currentPrice
        }];
      }
    });
    
    const typeName = item.type === 'flight' ? '항공권' : item.type === 'hotel' ? '호텔 객실' : item.type === 'attraction' ? '관광지 티켓' : '렌터카';
    addLog(`[구매] ${item.destination} ${typeName} ${amount}개 구매 완료 (-${formatMoney(cost)})`, "success");
  };

  let filteredItems = marketItems.filter(i => i.type === activeType);

  // Apply search filters based on active type
  if (activeType === 'flight') {
    if (flightRouteType === 'domestic') filteredItems = filteredItems.filter(i => i.isDomestic);
    if (flightRouteType === 'international') filteredItems = filteredItems.filter(i => !i.isDomestic);

    if (departureSearch.trim()) {
      filteredItems = filteredItems.filter(i => 
        i.departureAirport?.toLowerCase().includes(departureSearch.trim().toLowerCase())
      );
    }
    if (arrivalSearch.trim()) {
      const term = arrivalSearch.trim().toLowerCase();
      filteredItems = filteredItems.filter(i => 
        i.arrivalAirport?.toLowerCase().includes(term) || 
        i.destination.toLowerCase().includes(term) ||
        i.country?.toLowerCase().includes(term)
      );
    }
  } else if (activeType === 'hotel') {
    if (hotelDestSearch.trim()) {
      const term = hotelDestSearch.trim().toLowerCase();
      filteredItems = filteredItems.filter(i => 
        i.destination.toLowerCase().includes(term) ||
        i.country?.toLowerCase().includes(term)
      );
    }
    if (hotelProviderSearch.trim()) {
      filteredItems = filteredItems.filter(i => 
        i.provider.toLowerCase().includes(hotelProviderSearch.trim().toLowerCase())
      );
    }
  } else if (activeType === 'attraction') {
    if (attrDestSearch.trim()) {
      const term = attrDestSearch.trim().toLowerCase();
      filteredItems = filteredItems.filter(i => 
        i.destination.toLowerCase().includes(term) ||
        i.country?.toLowerCase().includes(term)
      );
    }
    if (attrProviderSearch.trim()) {
      filteredItems = filteredItems.filter(i => 
        i.provider.toLowerCase().includes(attrProviderSearch.trim().toLowerCase())
      );
    }
  } else if (activeType === 'rental_car') {
    if (carDestSearch.trim()) {
      const term = carDestSearch.trim().toLowerCase();
      filteredItems = filteredItems.filter(i => 
        i.destination.toLowerCase().includes(term) ||
        i.country?.toLowerCase().includes(term)
      );
    }
    if (carProviderSearch.trim()) {
      filteredItems = filteredItems.filter(i => 
        i.provider.toLowerCase().includes(carProviderSearch.trim().toLowerCase())
      );
    }
  }

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof MarketItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plane className="w-6 h-6 text-blue-600" />
          B2B 거래소
        </h2>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setActiveType('flight')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'flight' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><Plane className="w-4 h-4"/> 항공권</button>
          <button onClick={() => setActiveType('hotel')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'hotel' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><Building className="w-4 h-4"/> 호텔</button>
          <button onClick={() => setActiveType('attraction')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'attraction' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}><Ticket className="w-4 h-4"/> 관광지</button>
          <button onClick={() => setActiveType('rental_car')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'rental_car' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}><Car className="w-4 h-4"/> 렌터카</button>
        </div>
      </div>

      {/* Search Bar for Flights */}
      {activeType === 'flight' && (
        <div className="flex flex-col gap-3 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex gap-2">
            <button onClick={() => setFlightRouteType('all')} className={`px-3 py-1 rounded-md text-xs font-bold ${flightRouteType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>전체 노선</button>
            <button onClick={() => setFlightRouteType('domestic')} className={`px-3 py-1 rounded-md text-xs font-bold ${flightRouteType === 'domestic' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>국내선</button>
            <button onClick={() => setFlightRouteType('international')} className={`px-3 py-1 rounded-md text-xs font-bold ${flightRouteType === 'international' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>국제선</button>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">출발지 검색</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="예: 인천, 김포"
                  value={departureSearch}
                  onChange={(e) => setDepartureSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">도착지 검색</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="예: 미국, 도쿄, 나리타, 제주"
                  value={arrivalSearch}
                  onChange={(e) => setArrivalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar for Hotels */}
      {activeType === 'hotel' && (
        <div className="flex gap-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">목적지/국가 검색</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="예: 일본, 파리, 제주"
                value={hotelDestSearch}
                onChange={(e) => setHotelDestSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">호텔명 검색</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="예: 힐튼, 메리어트"
                value={hotelProviderSearch}
                onChange={(e) => setHotelProviderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar for Attractions */}
      {activeType === 'attraction' && (
        <div className="flex gap-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">목적지/국가 검색</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="예: 미국, 오사카"
                value={attrDestSearch}
                onChange={(e) => setAttrDestSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">관광지명 검색</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="예: 디즈니랜드, 루브르"
                value={attrProviderSearch}
                onChange={(e) => setAttrProviderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar for Rental Cars */}
      {activeType === 'rental_car' && (
        <div className="flex gap-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">목적지/국가 검색</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="예: 제주, 미국"
                value={carDestSearch}
                onChange={(e) => setCarDestSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">렌터카 업체 검색</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="예: 허츠, 롯데렌터카"
                value={carProviderSearch}
                onChange={(e) => setCarProviderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('departureDay')}>일정</th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('provider')}>제공자({activeType === 'flight' ? '항공사' : activeType === 'hotel' ? '호텔' : activeType === 'attraction' ? '관광지' : '렌터카'})</th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('destination')}>목적지/노선</th>
              {activeType === 'flight' && <th className="p-4">비행 시간</th>}
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('availableStock')}>잔여 수량</th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('currentPrice')}>현재가</th>
              <th className="p-4">구매</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedItems.length === 0 ? (
              <tr><td colSpan={activeType === 'flight' ? 7 : 6} className="p-8 text-center text-slate-500">검색 결과 또는 거래 가능한 상품이 없습니다.</td></tr>
            ) : (
              sortedItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium">{formatGameDateShort(item.departureDay)}</td>
                  <td className="p-4">{item.provider}</td>
                  <td className="p-4 font-bold text-slate-900">
                    {item.type === 'flight' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{item.isReturn ? '[귀국편]' : '[출국편]'} [{item.country}] {item.destination}</span>
                        <div className="flex items-center gap-1 text-sm font-bold">
                          <span>{item.departureAirport}</span>
                          <Plane className="w-3 h-3 text-slate-400" />
                          <span>{item.arrivalAirport}</span>
                        </div>
                      </div>
                    ) : (
                      `[${item.country}] ${item.destination}`
                    )}
                  </td>
                  {activeType === 'flight' && (
                    <td className="p-4">
                      <div className="flex flex-col text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{item.departureTime} ➔ {item.arrivalTime}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDuration(item.flightTime || 0)}</span>
                      </div>
                    </td>
                  )}
                  <td className="p-4">{item.availableStock}개</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">{formatMoney(item.currentPrice)}</span>
                      {item.currentPrice > item.basePrice ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-green-500" />}
                    </div>
                  </td>
                  <td className="p-4">
                    <BuyAction item={item} onBuy={handleBuy} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BuyAction: React.FC<{ item: MarketItem, onBuy: (id: string, amount: number) => void }> = ({ item, onBuy }) => {
  const [amount, setAmount] = useState(1);
  
  if (item.availableStock <= 0) return <span className="text-slate-400">매진</span>;

  return (
    <div className="flex items-center gap-2">
      <input 
        type="number" 
        min="1" 
        max={item.availableStock} 
        value={amount} 
        onChange={e => setAmount(Math.min(item.availableStock, Math.max(1, Number(e.target.value))))} 
        className="w-16 border border-slate-300 rounded-lg p-1.5 text-center focus:outline-none focus:border-blue-500" 
      />
      <button 
        onClick={() => onBuy(item.id, amount)} 
        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        구매
      </button>
    </div>
  );
};
