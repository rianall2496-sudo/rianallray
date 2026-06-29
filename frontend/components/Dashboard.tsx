import React from 'react';
import { GameState, Review } from '../types.ts';
import { AGENCY_STAGES, STAT_DESCRIPTIONS, EMPLOYEE_ROLES, EMPLOYEE_LEVELS } from '../constants.ts';
import { generateId, formatGameDateShort } from '../utils.ts';
import { StatBar } from './StatBar.tsx';
import { Users, TrendingUp, Brain, Heart, Award, Star, Building2, Megaphone, UserPlus, MessageSquare } from 'lucide-react';

interface DashboardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  reviews: Review[];
  onUpgradeAgency: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ gameState, setGameState, addLog, reviews, onUpgradeAgency }) => {
  const currentStageInfo = AGENCY_STAGES[gameState.stage];
  const nextStageInfo = AGENCY_STAGES[gameState.stage + 1];

  const upgradeAgency = () => {
    if (!nextStageInfo) return;
    // App.tsx에서 처리하도록 콜백 호출
    onUpgradeAgency();
  };

  const hireEmployee = () => {
    const role = EMPLOYEE_ROLES[Math.floor(Math.random() * EMPLOYEE_ROLES.length)];
    const newEmployee = {
      id: generateId(),
      name: `직원${Math.floor(Math.random() * 1000)}`,
      role,
      level: 0,
      levelName: EMPLOYEE_LEVELS[0],
      salary: 2000000,
      bonus: 5
    };
    // 테스트를 위해 비용 차감 제거
    setGameState(prev => ({
      ...prev,
      employees: [...prev.employees, newEmployee]
    }));
    addLog(`[채용] ${newEmployee.name} (${role}) 채용 완료! (테스트: 무료)`, "success");
  };

  const buyMarketing = () => {
    // 테스트를 위해 비용 차감 제거
    setGameState(prev => ({
      ...prev,
      marketingBuff: 3 // 3 days buff
    }));
    addLog(`[마케팅] 대대적인 광고 캠페인을 시작합니다! 3일간 의뢰가 증가합니다. (테스트: 무료)`, "success");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
      {/* Left Column: Agency & HR & Marketing */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <img src={currentStageInfo.imagePlaceholder} alt="Agency" className="w-full h-40 object-cover" />
          <div className="p-6">
            <h2 className="font-bold text-2xl mb-2">{currentStageInfo.name}</h2>
            <p className="text-slate-600 mb-4">{currentStageInfo.description}</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-3 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium">직원 수: {gameState.employees.length + 1}명</span>
              </div>
              {gameState.marketingBuff > 0 && (
                <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <Megaphone className="w-5 h-5 text-orange-600" />
                  <span className="font-bold">마케팅 진행 중 ({gameState.marketingBuff}일 남음)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* HR Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600"/> 인사 관리</h3>
            <button onClick={hireEmployee} className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors mb-4">
              신규 직원 채용 (테스트: 무료)
            </button>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {gameState.employees.length === 0 ? <p className="text-sm text-slate-400 text-center py-2">고용된 직원이 없습니다.</p> : 
                gameState.employees.map(emp => (
                  <div key={emp.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                    <div>
                      <span className="font-bold">{emp.name}</span> <span className="text-slate-500 text-xs">{emp.levelName}</span>
                      <p className="text-xs text-indigo-600">{emp.role}</p>
                    </div>
                    <span className="text-slate-500">급여: 2,000,000원</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Marketing Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-orange-600"/> 마케팅</h3>
            <p className="text-sm text-slate-600 mb-4">광고를 통해 3일간 고객 의뢰 수와 VIP 등장 확률을 대폭 증가시킵니다.</p>
            <button onClick={buyMarketing} disabled={gameState.marketingBuff > 0} className="w-full py-2 bg-orange-50 text-orange-700 rounded-lg font-bold hover:bg-orange-100 transition-colors disabled:opacity-50">
              {gameState.marketingBuff > 0 ? '캠페인 진행 중' : `광고 캠페인 시작 (테스트: 무료)`}
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-green-600"/> 고객 후기</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {reviews.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">아직 등록된 후기가 없습니다.</p> : 
              reviews.map(rev => (
                <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{rev.customerName}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">"{rev.comment}"</p>
                  <p className="text-xs text-slate-400 mt-1">{formatGameDateShort(rev.day)}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Right Column: Stats & Upgrades */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            대표 능력치
          </h2>
          
          <StatBar icon={<Brain className="w-5 h-5 text-purple-500" />} label="지력" value={gameState.stats.intelligence} colorClass="bg-purple-500" description={STAT_DESCRIPTIONS.intelligence} />
          <StatBar icon={<Heart className="w-5 h-5 text-red-500" />} label="체력" value={gameState.stats.stamina} colorClass="bg-red-500" description={STAT_DESCRIPTIONS.stamina} />
          <StatBar icon={<Award className="w-5 h-5 text-yellow-500" />} label="매력" value={gameState.stats.charm} colorClass="bg-yellow-500" description={STAT_DESCRIPTIONS.charm} />
          <StatBar icon={<Star className="w-5 h-5 text-blue-500" />} label="명성" value={gameState.stats.reputation} maxValue={20000} colorClass="bg-blue-500" description={STAT_DESCRIPTIONS.reputation} />
        </div>

        {/* Agency Upgrade */}
        {nextStageInfo && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-6 text-white">
            <h2 className="font-bold text-xl mb-2 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              여행사 확장
            </h2>
            <p className="text-blue-100 mb-6">다음 단계: {nextStageInfo.name}</p>
            
            <div className="space-y-3 mb-6 bg-white/10 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span>필요 자금:</span>
                <span className="font-bold text-green-300">무시 (테스트)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>필요 명성:</span>
                <span className="font-bold text-green-300">무시 (테스트)</span>
              </div>
            </div>

            <button
              onClick={upgradeAgency}
              className="w-full py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              확장하기 (테스트: 무료)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
