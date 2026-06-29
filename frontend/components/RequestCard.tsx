import React from 'react';
import { TravelRequest } from '../types.ts';
import { formatMoney } from '../utils.ts';
import { Plane, Star, AlertCircle } from 'lucide-react';

interface RequestCardProps {
  request: TravelRequest;
  onAccept: (req: TravelRequest) => void;
  disabled: boolean;
  playerCharm: number;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onAccept, disabled, playerCharm }) => {
  const isVip = request.type === 'vip';
  const successChance = Math.min(95, Math.max(10, 50 + (playerCharm - request.requiredCharm) * 2));
  
  let chanceColor = 'text-green-600';
  if (successChance < 50) chanceColor = 'text-red-600';
  else if (successChance < 80) chanceColor = 'text-yellow-600';

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${isVip ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white'} hover:shadow-md flex flex-col justify-between h-full`}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {isVip && <Star className="w-4 h-4 text-purple-600 fill-purple-600" />}
            {request.title}
          </h3>
          <div className="flex">
            {[...Array(request.difficulty)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-slate-600 mb-4">
          <div className="flex justify-between">
            <span>예상 수익:</span>
            <span className="font-bold text-green-600">{formatMoney(request.reward)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>성공 확률:</span>
            <span className={`font-bold ${chanceColor}`}>{successChance}%</span>
          </div>
          {playerCharm < request.requiredCharm && (
            <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
              <AlertCircle className="w-3 h-3" />
              매력이 부족하여 실패 확률이 높습니다.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onAccept(request)}
        disabled={disabled}
        className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors
          ${disabled 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : isVip 
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
          }`}
      >
        <Plane className="w-4 h-4" />
        의뢰 수락 (체력 -1)
      </button>
    </div>
  );
};
