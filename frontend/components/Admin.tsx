import React, { useState } from 'react';
import { GameState, Sector } from '../types';
import { formatCurrency } from '../constants';
import { Card, Button } from './ui';
import { Settings, Landmark, Building, PlusCircle } from 'lucide-react';

interface AdminProps {
  state: GameState;
  onUpdateBankSettings: (maxLoan: number, interestRate: number) => void;
  onCreateCompany: (name: string, sector: Sector, basePrice: number, totalShares: number, imageUrl: string) => void;
}

export const Admin: React.FC<AdminProps> = ({ state, onUpdateBankSettings, onCreateCompany }) => {
  // 은행 설정 상태
  const [maxLoan, setMaxLoan] = useState<number>(state.maxLoanAmount);
  const [interestRate, setInterestRate] = useState<number>(state.baseInterestRate);

  // 신규 회사 상장 상태
  const [compName, setCompName] = useState('');
  const [compSector, setCompSector] = useState<Sector>('전자');
  const [compPrice, setCompPrice] = useState<number>(10000);
  const [compShares, setCompShares] = useState<number>(5000);
  const [compImageUrl, setCompImageUrl] = useState('');

  const sectors: Sector[] = ['전자', '중공업', '자동차', '운송', '에너지', '제약', '금융', '식품', '유통', '통신', '미디어', '건설'];

  const handleBankSubmit = () => {
    onUpdateBankSettings(maxLoan, interestRate);
  };

  const handleCompanySubmit = () => {
    if (!compName.trim()) {
      alert('회사 이름을 입력해주세요.');
      return;
    }
    if (compPrice < 1000) {
      alert('초기 주가는 최소 1,000원 이상이어야 합니다.');
      return;
    }
    if (compShares < 100 || compShares > 10000) {
      alert('발행 주식 수는 100주 ~ 10,000주 사이여야 합니다.');
      return;
    }

    onCreateCompany(compName.trim(), compSector, compPrice, compShares, compImageUrl.trim());
    
    // 폼 초기화
    setCompName('');
    setCompPrice(10000);
    setCompShares(5000);
    setCompImageUrl('');
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-400">
        <Settings className="text-red-400" /> 수퍼관리자 모드
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 은행 관리 패널 */}
        <Card className="border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
            <Landmark className="text-blue-400" />
            <h3 className="text-xl font-bold">은행 시스템 관리</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">대출금 상한선 설정</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1000000" 
                  max="100000000" 
                  step="1000000"
                  value={maxLoan} 
                  onChange={(e) => setMaxLoan(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <input 
                  type="number" 
                  value={maxLoan}
                  onChange={(e) => setMaxLoan(Number(e.target.value))}
                  className="w-32 bg-slate-900 border border-slate-700 rounded p-2 text-right font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">현재 설정: {formatCurrency(maxLoan)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">한국은행 기준금리 강제 설정 (%)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0.1" 
                  max="20.0" 
                  step="0.1"
                  value={interestRate} 
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="flex-1 accent-red-500"
                />
                <input 
                  type="number" 
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-center font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">현재 설정: {interestRate.toFixed(2)}% (게임 루프에 의해 다시 변동될 수 있습니다)</p>
            </div>

            <Button variant="danger" className="w-full py-3" onClick={handleBankSubmit}>
              은행 설정 적용하기
            </Button>
          </div>
        </Card>

        {/* 신규 상장사 추가 패널 */}
        <Card className="border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
            <Building className="text-green-400" />
            <h3 className="text-xl font-bold">신규 상장사(IPO) 추가</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">회사 이름</label>
              <input 
                type="text" 
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="예: 우주항공"
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">산업군 (섹터)</label>
              <select 
                value={compSector}
                onChange={(e) => setCompSector(e.target.value as Sector)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 focus:outline-none focus:border-blue-500"
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">초기 주가 (원)</label>
                <input 
                  type="number" 
                  value={compPrice}
                  onChange={(e) => setCompPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">발행 주식 수 (주)</label>
                <input 
                  type="number" 
                  value={compShares}
                  onChange={(e) => setCompShares(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">대표 이미지 URL (선택)</label>
              <input 
                type="text" 
                value={compImageUrl}
                onChange={(e) => setCompImageUrl(e.target.value)}
                placeholder="https://example.com/spaceship.jpg"
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-800 p-3 rounded border border-slate-700 text-sm text-slate-300">
              * 초기 주가가 10만 원 이상이면 KOSPI, 미만이면 KOSDAQ에 상장됩니다.<br/>
              * 상장 즉시 10명의 NPC 임원진이 지분을 나누어 가집니다.
            </div>

            <Button variant="success" className="w-full py-3 flex items-center justify-center gap-2" onClick={handleCompanySubmit}>
              <PlusCircle size={18} /> 주식 시장에 상장시키기
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};
