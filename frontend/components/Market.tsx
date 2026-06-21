import React, { useState } from 'react';
import { Company, MarketType } from '../types';
import { formatCurrency } from '../constants';
import { Card, Badge } from './ui';
import { TrendingUp, TrendingDown, Activity, Building2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface MarketProps {
  companies: Company[];
  cash: number;
  onBuy: (companyId: string, amount: number) => void;
  onSell: (companyId: string, amount: number) => void;
}

export const Market: React.FC<MarketProps> = ({ companies, cash, onBuy, onSell }) => {
  const [marketView, setMarketView] = useState<MarketType>('KOSDAQ');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(companies[0]);
  const [tradeAmount, setTradeAmount] = useState<number>(10);

  const filteredCompanies = companies.filter(c => c.marketType === marketView);

  const handleTabChange = (view: MarketType) => {
    setMarketView(view);
    const firstInView = companies.find(c => c.marketType === view);
    setSelectedCompany(firstInView || null);
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
  };

  const currentSelectedCompany = selectedCompany ? companies.find(c => c.id === selectedCompany.id) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Company List */}
      <div className="lg:col-span-1 flex flex-col h-full overflow-hidden">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 shrink-0"><Activity className="text-blue-400"/> 서울 거래소</h2>
        
        {/* Market Tabs */}
        <div className="flex gap-2 mb-4 shrink-0">
          <button 
            onClick={() => handleTabChange('KOSDAQ')} 
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${marketView === 'KOSDAQ' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            KOSDAQ
          </button>
          <button 
            onClick={() => handleTabChange('KOSPI')} 
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${marketView === 'KOSPI' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            KOSPI
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
          {filteredCompanies.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              현재 이 시장에 상장된 기업이 없습니다.
            </div>
          ) : (
            filteredCompanies.map(c => {
              const isOwned = (c.playerShares / c.totalShares) >= 0.51;
              const priceChange = c.history.length > 1 ? c.stockPrice - c.history[c.history.length - 2] : 0;
              const isUp = priceChange >= 0;

              return (
                <Card 
                  key={c.id} 
                  className={`cursor-pointer transition-all hover:border-blue-500 ${currentSelectedCompany?.id === c.id ? 'border-blue-500 bg-slate-800' : ''}`}
                >
                  <div onClick={() => handleCompanySelect(c)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-3 items-center">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-md object-cover border border-slate-600" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center border border-slate-600">
                            <Building2 size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-lg">{c.name}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="info">{c.sector}</Badge>
                            <Badge variant="warning">발행주: {c.totalShares.toLocaleString()}주</Badge>
                          </div>
                        </div>
                      </div>
                      {isOwned && <Badge variant="success">계열사</Badge>}
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className="text-sm text-slate-400">주가</p>
                        <p className="font-mono text-lg">{formatCurrency(c.stockPrice)}</p>
                      </div>
                      <div className={`flex items-center ${isUp ? 'text-red-400' : 'text-blue-400'}`}>
                        {isUp ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                        <span className="text-sm">{Math.abs(priceChange / (c.stockPrice - priceChange) * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Trading Desk */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
        {currentSelectedCompany ? (
          <>
            <Card className="flex-1 flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  {currentSelectedCompany.imageUrl && (
                    <img src={currentSelectedCompany.imageUrl} alt={currentSelectedCompany.name} className="w-16 h-16 rounded-lg object-cover border border-slate-600 shadow-md" />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold">{currentSelectedCompany.name}</h2>
                      <Badge variant={currentSelectedCompany.marketType === 'KOSPI' ? 'warning' : 'info'}>
                        {currentSelectedCompany.marketType}
                      </Badge>
                    </div>
                    <p className="text-slate-400">{currentSelectedCompany.sector} 섹터</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">현재가</p>
                  <p className="text-3xl font-mono font-bold text-chaebol-gold">{formatCurrency(currentSelectedCompany.stockPrice)}</p>
                </div>
              </div>
              
              {/* Mini Chart */}
              <div className="h-48 w-full mb-6 bg-slate-900/50 rounded-lg p-2 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentSelectedCompany.history.map((p, i) => ({ index: i, price: p }))}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="price" stroke={currentSelectedCompany.marketType === 'KOSPI' ? '#a855f7' : '#3b82f6'} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <p className="text-sm text-slate-400">보유 주식</p>
                  <p className="text-xl font-mono">{currentSelectedCompany.playerShares.toLocaleString()} / {currentSelectedCompany.totalShares.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">지분율: {((currentSelectedCompany.playerShares / currentSelectedCompany.totalShares) * 100).toFixed(2)}%</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg">
                  <p className="text-sm text-slate-400">시가총액</p>
                  <p className="text-xl font-mono">{formatCurrency(currentSelectedCompany.stockPrice * currentSelectedCompany.totalShares)}</p>
                </div>
              </div>

              <div className="mt-auto bg-slate-800 p-4 rounded-lg border border-slate-700 shrink-0">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm font-medium w-24">수량:</label>
                  <input 
                    type="range" 
                    min="1" 
                    max={currentSelectedCompany.totalShares} 
                    value={tradeAmount} 
                    onChange={(e) => setTradeAmount(Number(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <input 
                    type="number" 
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Number(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    className="flex-1 py-3 text-lg px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => onBuy(currentSelectedCompany.id, tradeAmount)}
                    disabled={cash < currentSelectedCompany.stockPrice * tradeAmount}
                  >
                    매수 ({formatCurrency(currentSelectedCompany.stockPrice * tradeAmount)})
                  </button>
                  <button 
                    className="flex-1 py-3 text-lg px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => onSell(currentSelectedCompany.id, tradeAmount)}
                    disabled={currentSelectedCompany.playerShares < tradeAmount}
                  >
                    매도 ({formatCurrency(currentSelectedCompany.stockPrice * tradeAmount)})
                  </button>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center text-slate-500 min-h-[500px]">
            기업을 선택하여 상세 정보를 확인하고 거래하세요.
          </Card>
        )}
      </div>
    </div>
  );
};
