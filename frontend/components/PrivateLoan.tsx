import React, { useState } from 'react';
import { GameState } from '../types';
import { formatCurrency } from '../constants';
import { Card, Button } from './ui';
import { TrendingUp, Lock } from 'lucide-react';

interface PrivateLoanProps {
  state: GameState;
  onManagePrivateLoan: (amount: number, isDeposit: boolean) => void;
}

export const PrivateLoan: React.FC<PrivateLoanProps> = ({ state, onManagePrivateLoan }) => {
  const [privateLoanAmount, setPrivateLoanAmount] = useState<number>(100000000);
  const [privateLoanAction, setPrivateLoanAction] = useState<'deposit' | 'withdraw'>('deposit');

  const ownsPrivateLoanCo = state.companies.some(c => (c.name === '착한사채' || c.name === '누구나사채') && c.isAcquired);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 shrink-0"><TrendingUp className="text-red-500"/> 사채기업 (VIP)</h2>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        <div className="flex flex-col items-center justify-center min-h-full py-8">
          {!ownsPrivateLoanCo ? (
            <div className="text-center space-y-4 max-w-md">
              <Lock size={64} className="mx-auto text-slate-600" />
              <h2 className="text-2xl font-bold text-slate-400">사채기업 모드 잠김</h2>
              <p className="text-slate-500">
                주식 시장에서 <strong className="text-red-400">착한사채</strong> 또는 <strong className="text-red-400">누구나사채</strong>의 지분을 51% 이상 확보하여 경영권을 인수해야 활성화됩니다.
              </p>
            </div>
          ) : (
            <Card className="w-full max-w-2xl border-red-900/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <TrendingUp className="text-red-500" size={28} />
                <div>
                  <h3 className="text-2xl font-bold text-white">사채업 자금 운용</h3>
                  <p className="text-sm text-slate-400">보유 현금을 사채 자금으로 납입하여 타 회원들에게 대출해주고 매월 7%~10%의 막대한 이자 수익을 올리세요.</p>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center mb-8">
                <p className="text-sm text-slate-400 mb-2">현재 운용 중인 사채 자금</p>
                <p className="text-4xl font-mono font-black text-red-400">{formatCurrency(state.privateLoanFund)}</p>
                <p className="text-xs text-slate-500 mt-2">매월 30일마다 이자 수익이 정산되어 현금으로 입금됩니다.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 w-fit mx-auto">
                  <button 
                    onClick={() => setPrivateLoanAction('deposit')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${privateLoanAction === 'deposit' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    자금 납입
                  </button>
                  <button 
                    onClick={() => setPrivateLoanAction('withdraw')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${privateLoanAction === 'withdraw' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    자금 회수
                  </button>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <label className="block text-sm font-medium text-slate-400 mb-4">
                    {privateLoanAction === 'deposit' ? '납입할 금액 설정 (보유 현금에서 차감)' : '회수할 금액 설정 (운용 자금에서 차감)'}
                  </label>
                  <div className="flex items-center gap-4 mb-6">
                    <input 
                      type="range" 
                      min="0" 
                      max={privateLoanAction === 'deposit' ? state.cash : state.privateLoanFund} 
                      step="1000000"
                      value={privateLoanAmount} 
                      onChange={(e) => setPrivateLoanAmount(Number(e.target.value))}
                      className={`flex-1 ${privateLoanAction === 'deposit' ? 'accent-red-500' : 'accent-blue-500'}`}
                    />
                    <span className="font-mono font-bold text-xl w-40 text-right">{formatCurrency(privateLoanAmount)}</span>
                  </div>
                  
                  <Button 
                    variant={privateLoanAction === 'deposit' ? 'danger' : 'primary'} 
                    className="w-full py-4 text-lg shadow-lg"
                    onClick={() => {
                      onManagePrivateLoan(privateLoanAmount, privateLoanAction === 'deposit');
                      setPrivateLoanAmount(0);
                    }}
                    disabled={privateLoanAmount <= 0 || (privateLoanAction === 'deposit' ? state.cash < privateLoanAmount : state.privateLoanFund < privateLoanAmount)}
                  >
                    {privateLoanAction === 'deposit' ? '사채 자금 납입하기' : '사채 자금 회수하기'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
