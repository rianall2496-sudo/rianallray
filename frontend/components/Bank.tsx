import React, { useState } from 'react';
import { GameState, DepositType } from '../types';
import { formatCurrency } from '../constants';
import { Card, Button, Badge } from './ui';
import { Landmark, AlertTriangle, CheckCircle2, CreditCard, PiggyBank, Wallet } from 'lucide-react';

interface BankProps {
  state: GameState;
  onBorrow: (amount: number) => void;
  onPartialRepay: (amount: number) => void;
  onOpenDeposit: (type: DepositType, amount: number, duration?: number) => void;
  onCloseDeposit: (accountId: string) => void;
}

export const Bank: React.FC<BankProps> = ({ state, onBorrow, onPartialRepay, onOpenDeposit, onCloseDeposit }) => {
  const [activeTab, setActiveTab] = useState<'loan' | 'deposit'>('loan');
  
  // 대출 관련 상태
  const [borrowAmount, setBorrowAmount] = useState<number>(1000000);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  
  // 관리자가 설정한 최대 대출 한도 적용
  const MAX_LOAN = state.maxLoanAmount;
  
  // 대출 금리: 한국은행 기준금리 + 2.0% (가산금리)
  const loanInterestRate = state.baseInterestRate + 2.0;
  const interest = borrowAmount * (loanInterestRate / 100);
  const receivedAmount = borrowAmount - interest;

  // 예금 관련 상태
  const [depositAmount, setDepositAmount] = useState<number>(10000000);
  const [installmentDuration, setInstallmentDuration] = useState<number>(30);

  const hasGeneralDeposit = state.deposits.some(d => d.type === 'general');
  const hasInstallmentDeposit = state.deposits.some(d => d.type === 'installment');

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-end shrink-0">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Landmark className="text-blue-400"/> 머니은행</h2>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button 
            onClick={() => setActiveTab('loan')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'loan' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            대출 서비스
          </button>
          <button 
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'deposit' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            예금 / 펀드
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {activeTab === 'loan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 대출 신청 패널 */}
            <Card className="flex flex-col border-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-4">
                <CreditCard className="text-blue-400" />
                <h3 className="text-xl font-bold">신용 대출 신청</h3>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                    <li>최대 대출 한도: <strong className="text-white">{formatCurrency(MAX_LOAN)}</strong></li>
                    <li>대출 기간: <strong className="text-white">7일</strong> (게임 내 시간)</li>
                    <li>대출 이자: <strong className="text-red-400">선이자 {loanInterestRate.toFixed(2)}% (변동)</strong> 차감 후 지급</li>
                    <li>미상환 시: 현금 차감 ➔ 주식 강제 매각 ➔ <strong className="text-red-500">금융 거래 정지</strong></li>
                  </ul>
                </div>

                {state.loanAmount > 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 bg-slate-900/50 border border-slate-700 rounded-lg text-center p-4">
                    <AlertTriangle className="text-yellow-500 mb-2" size={32} />
                    <p className="text-slate-300">이미 진행 중인 대출이 있습니다.</p>
                    <p className="text-sm text-slate-500 mt-1">기존 대출을 전액 상환해야 추가 대출이 가능합니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">대출 희망 금액</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="100000" 
                          max={MAX_LOAN} 
                          step="100000"
                          value={borrowAmount} 
                          onChange={(e) => setBorrowAmount(Number(e.target.value))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className="font-mono font-bold text-lg w-32 text-right">{formatCurrency(borrowAmount)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">신청 금액</span>
                        <span className="font-mono">{formatCurrency(borrowAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">선이자 ({loanInterestRate.toFixed(2)}%)</span>
                        <span className="font-mono text-red-400">-{formatCurrency(interest)}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-lg">
                        <span className="text-white">실 수령액</span>
                        <span className="font-mono text-green-400">{formatCurrency(receivedAmount)}</span>
                      </div>
                    </div>

                    <Button 
                      variant="primary" 
                      className="w-full py-4 text-lg shadow-lg"
                      onClick={() => onBorrow(borrowAmount)}
                    >
                      대출 실행하기
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* 대출 현황 및 상환 패널 */}
            <Card className="flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-4">
                <Landmark className="text-chaebol-gold" />
                <h3 className="text-xl font-bold">나의 대출 현황</h3>
              </div>

              <div className="flex-1 flex flex-col">
                {state.loanAmount === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <CheckCircle2 className="text-green-500 mb-4" size={48} />
                    <p className="text-lg font-bold text-slate-300">현재 이용 중인 대출이 없습니다.</p>
                    <p className="text-sm text-slate-500 mt-2">건전한 재무 상태를 유지하고 있습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
                      <p className="text-sm text-slate-400 mb-2">상환해야 할 총 금액</p>
                      <p className="text-4xl font-mono font-black text-red-400">{formatCurrency(state.loanAmount)}</p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">만기일</span>
                        <span className="font-bold text-white">{state.loanDueDate}일차</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">남은 기간</span>
                        <span className={`font-bold ${state.loanDueDate! - state.day <= 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {Math.max(0, state.loanDueDate! - state.day)}일
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">현재 보유 현금</span>
                        <span className="font-mono text-green-400">{formatCurrency(state.cash)}</span>
                      </div>
                    </div>

                    {state.isRestricted && (
                      <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-center">
                        <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
                        <p className="font-bold text-red-200">금융 거래 정지 상태입니다!</p>
                        <p className="text-xs text-red-300 mt-1">대출금을 상환해야 주식 매수 및 부동산 거래가 가능합니다.</p>
                      </div>
                    )}

                    <div className="space-y-2 border-t border-slate-700 pt-4">
                      <label className="block text-sm font-medium text-slate-400">부분 상환 금액 설정</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" 
                          max={Math.min(state.cash, state.loanAmount)} 
                          step="100000"
                          value={repayAmount} 
                          onChange={(e) => setRepayAmount(Number(e.target.value))}
                          className="flex-1 accent-green-500"
                        />
                        <span className="font-mono font-bold text-lg w-32 text-right text-green-400">{formatCurrency(repayAmount)}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="success" 
                          className="flex-1 py-3"
                          onClick={() => {
                            onPartialRepay(repayAmount);
                            setRepayAmount(0);
                          }}
                          disabled={repayAmount <= 0 || state.cash < repayAmount}
                        >
                          부분 상환
                        </Button>
                        <Button 
                          variant="primary" 
                          className="flex-1 py-3"
                          onClick={() => onPartialRepay(state.loanAmount)}
                          disabled={state.cash < state.loanAmount}
                        >
                          전액 상환
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 예금 상품 가입 패널 */}
            <Card className="flex flex-col border-green-900/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-2">
                  <PiggyBank className="text-green-400" />
                  <h3 className="text-xl font-bold">예금 상품 가입</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">현재 한국은행 기준금리</p>
                  <p className="text-xl font-mono font-bold text-blue-400">{state.baseInterestRate.toFixed(2)}%</p>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">가입 금액 설정</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1000000" 
                      max={Math.max(1000000, state.cash)} 
                      step="1000000"
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="flex-1 accent-green-500"
                    />
                    <span className="font-mono font-bold text-lg w-32 text-right">{formatCurrency(depositAmount)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* 파킹통장 */}
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 hover:border-green-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-green-300">파킹통장 (일반예금)</h4>
                        <p className="text-xs text-slate-400">자유로운 입출금, 매일 이자 지급</p>
                      </div>
                      <Badge variant="info">연 {state.baseInterestRate.toFixed(2)}% (변동)</Badge>
                    </div>
                    <Button variant="secondary" className="w-full mt-2 text-sm" onClick={() => onOpenDeposit('general', depositAmount)} disabled={hasGeneralDeposit || state.cash < depositAmount}>
                      {hasGeneralDeposit ? '이미 가입됨' : '가입하기'}
                    </Button>
                  </div>

                  {/* 정기예금 */}
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 hover:border-green-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-green-300">정기예금 (적금식)</h4>
                        <p className="text-xs text-slate-400">만기 시까지 자금 묶임, 우대 금리 제공</p>
                      </div>
                      <Badge variant="success">연 {(state.baseInterestRate + 2.0).toFixed(2)}% (고정)</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <select 
                        value={installmentDuration} 
                        onChange={(e) => setInstallmentDuration(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 text-sm focus:outline-none"
                      >
                        <option value={30}>30일 만기</option>
                        <option value={60}>60일 만기</option>
                      </select>
                      <Button variant="secondary" className="flex-1 text-sm" onClick={() => onOpenDeposit('installment', depositAmount, installmentDuration)} disabled={hasInstallmentDeposit || state.cash < depositAmount}>
                        {hasInstallmentDeposit ? '이미 가입됨' : '가입하기'}
                      </Button>
                    </div>
                  </div>

                  {/* 테마주 펀드 */}
                  <div className={`p-4 rounded-lg border transition-colors ${state.activeTheme ? 'bg-slate-900 border-yellow-700/50 hover:border-yellow-500' : 'bg-slate-900/50 border-slate-800 opacity-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-yellow-400">테마주 특별 펀드</h4>
                        <p className="text-xs text-slate-400">
                          {state.activeTheme ? `${state.activeTheme.sector} 섹터 테마 연동 (하이리스크)` : '현재 진행 중인 테마가 없습니다.'}
                        </p>
                      </div>
                      {state.activeTheme && (
                        <Badge variant={state.activeTheme.type === 'boom' ? 'success' : 'warning'}>
                          연 {state.activeTheme.type === 'boom' ? '25.00' : '-15.00'}%
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full mt-2 text-sm" 
                      onClick={() => onOpenDeposit('theme', depositAmount)} 
                      disabled={!state.activeTheme || state.cash < depositAmount}
                    >
                      {state.activeTheme ? '가입하기' : '가입 불가'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* 내 계좌 현황 패널 */}
            <Card className="flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-4">
                <Wallet className="text-green-400" />
                <h3 className="text-xl font-bold">내 계좌 현황</h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {state.deposits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <p className="text-slate-400">가입된 예금 상품이 없습니다.</p>
                  </div>
                ) : (
                  state.deposits.map(dep => (
                    <div key={dep.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-blue-200">{dep.name}</h4>
                          <p className="text-xs text-slate-400">가입일: {dep.joinDay}일차 {dep.maturityDay ? `| 만기일: ${dep.maturityDay}일차` : ''}</p>
                        </div>
                        <Badge variant={dep.appliedRate > 0 ? 'success' : 'warning'}>연 {dep.appliedRate.toFixed(2)}%</Badge>
                      </div>
                      
                      <div className="space-y-1 mb-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">납입 원금</span>
                          <span className="font-mono">{formatCurrency(dep.principal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">누적 이자</span>
                          <span className={`font-mono ${dep.interestEarned >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {dep.interestEarned >= 0 ? '+' : ''}{formatCurrency(dep.interestEarned)}
                          </span>
                        </div>
                        <div className="border-t border-slate-700 pt-1 flex justify-between font-bold">
                          <span className="text-slate-300">총 예상 수령액</span>
                          <span className="font-mono text-blue-400">{formatCurrency(dep.principal + dep.interestEarned)}</span>
                        </div>
                      </div>

                      <Button 
                        variant={dep.type === 'general' ? 'primary' : 'danger'} 
                        className="w-full text-xs py-2"
                        onClick={() => onCloseDeposit(dep.id)}
                      >
                        {dep.type === 'general' ? '출금 및 해지' : '중도 해지 (이자 포기)'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
