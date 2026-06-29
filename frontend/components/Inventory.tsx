import React, { useState } from 'react';
import { InventoryItem, MarketItem, ItemType } from '../types.ts';
import { formatMoney, formatGameDateShort, formatDuration } from '../utils.ts';
import { Briefcase, AlertCircle, Plane, Building, Ticket, Clock, Car } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  marketItems: MarketItem[];
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, marketItems }) => {
  const [activeType, setActiveType] = useState<ItemType>('flight');
  const filteredInventory = inventory.filter(i => i.type === activeType);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-600" />
          보유 자산
        </h2>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setActiveType('flight')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'flight' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><Plane className="w-4 h-4"/> 항공권</button>
          <button onClick={() => setActiveType('hotel')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'hotel' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><Building className="w-4 h-4"/> 호텔</button>
          <button onClick={() => setActiveType('attraction')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'attraction' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}><Ticket className="w-4 h-4"/> 관광지</button>
          <button onClick={() => setActiveType('rental_car')} className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${activeType === 'rental_car' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}><Car className="w-4 h-4"/> 렌터카</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4">일정</th>
              <th className="p-4">제공자</th>
              <th className="p-4">목적지/노선</th>
              {activeType === 'flight' && <th className="p-4">비행 시간</th>}
              <th className="p-4">보유 수량</th>
              <th className="p-4">평균 구매가</th>
              <th className="p-4">현재 시장가</th>
              <th className="p-4">예상 차익(1개당)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.length === 0 ? (
              <tr><td colSpan={activeType === 'flight' ? 8 : 7} className="p-8 text-center text-slate-500">보유 중인 자산이 없습니다. 시장에서 구매하세요.</td></tr>
            ) : (
              filteredInventory.map(inv => {
                const marketItem = marketItems.find(m => m.id === inv.marketId);
                const currentPrice = marketItem ? marketItem.currentPrice : 0;
                const margin = currentPrice - inv.averagePurchasePrice;
                
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium">{formatGameDateShort(inv.departureDay)}</td>
                    <td className="p-4">{inv.provider}</td>
                    <td className="p-4 font-bold text-slate-900">
                      {inv.type === 'flight' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">{inv.isReturn ? '[귀국편]' : '[출국편]'} [{inv.country}] {inv.destination}</span>
                          <div className="flex items-center gap-1 text-sm font-bold">
                            <span>{inv.departureAirport}</span>
                            <Plane className="w-3 h-3 text-slate-400" />
                            <span>{inv.arrivalAirport}</span>
                          </div>
                        </div>
                      ) : (
                        `[${inv.country}] ${inv.destination}`
                      )}
                    </td>
                    {activeType === 'flight' && (
                      <td className="p-4">
                        <div className="flex flex-col text-xs text-slate-600">
                          <span className="font-bold text-slate-800">{inv.departureTime} ➔ {inv.arrivalTime}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDuration(inv.flightTime || 0)}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4 font-bold text-indigo-600">{inv.stockOwned}개</td>
                    <td className="p-4">{formatMoney(inv.averagePurchasePrice)}</td>
                    <td className="p-4">
                      {marketItem ? formatMoney(currentPrice) : <span className="text-slate-400">시장 없음</span>}
                    </td>
                    <td className="p-4">
                      {marketItem ? (
                        <span className={`font-bold ${margin > 0 ? 'text-green-600' : margin < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          {margin > 0 ? '+' : ''}{formatMoney(margin)}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg flex items-start gap-2 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>일정이 지나면 보유한 자산은 모두 폐기되며 손실 처리됩니다. 일정 전에 고객 의뢰를 통해 판매하세요.</p>
      </div>
    </div>
  );
};
