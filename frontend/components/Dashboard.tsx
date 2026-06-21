import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types';
import { formatCurrency, getGameTimeInfo } from '../constants';
import { Card, Badge, Button } from './ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wallet, TrendingUp, Building, Briefcase, MessageSquare, Crown, Edit2 } from 'lucide-react';

interface DashboardProps {
  state: GameState;
  onSendMessage: (text: string) => void;
  onSetGroupName?: (name: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onSendMessage, onSetGroupName }) => {
  const [chatInput, setChatInput] = useState('');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleGroupNameSubmit = () => {
    if (groupNameInput.trim() && onSetGroupName) {
      onSetGroupName(groupNameInput.trim());
      setIsEditingGroupName(false);
    }
  };

  // Calculate Net Worth
  const stockValue = state.companies.reduce((acc, c) => acc + (c.stockPrice * c.playerShares), 0);
  const realEstateValue = state.districts.reduce((acc, d) => {
    let val = 0;
    if (d.owner === 'Player') val += d.landPrice;
    d.buildings.filter(b => b.ownerType === 'Player').forEach(b => {
      if (b.type === '사무실 빌딩') val += 500000000;
      if (b.type === '마케팅 센터') val += 1000000000;
      if (b.type === '연구소') val += 2000000000;
      if (b.type === '물류 센터') val += 3000000000;
      if (b.type === '복합 타워') val += 5000000000;
      if (b.type === '본사 빌딩') val += 10000000000;
    });
    return acc + val;
  }, 0);
  
  const depositValue = state.deposits.reduce((acc, d) => acc + d.principal + d.interestEarned, 0);
  const netWorth = state.cash + stockValue + realEstateValue + depositValue - state.loanAmount + state.privateLoanFund;
  
  const acquiredCompaniesCount = state.companies.filter(c => c.isAcquired).length;
  const ownedLandCount = state.districts.filter(d => d.owner === 'Player').length;
  const builtCount = state.districts.reduce((sum, d) => sum + d.buildings.filter(b => b.ownerType === 'Player').length, 0);

  const isGroupChairman = acquiredCompaniesCount >= 3;

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full overflow-hidden">
      
      {/* Left: Main Dashboard Content */}
      <div className="flex-1 min-w-0 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
          <h2 className="text-2xl font-bold">경영 요약</h2>
          {isGroupChairman && (
            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-yellow-700/30">
              <Badge variant="warning">계열사 {acquiredCompaniesCount}개</Badge>
              {state.groupName && !isEditingGroupName ? (
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-chaebol-gold flex items-center gap-2">
                    <Crown size={20} />
                    {state.groupName} 그룹 회장 {state.currentUser}
                  </div>
                  <button 
                    onClick={() => {
                      setGroupNameInput(state.groupName || '');
                      setIsEditingGroupName(true);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="그룹 이름 수정"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    placeholder="그룹 이름 입력"
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-chaebol-gold w-32"
                    onKeyDown={(e) => e.key === 'Enter' && handleGroupNameSubmit()}
                  />
                  <Button variant="primary" className="py-1 px-3 text-sm" onClick={handleGroupNameSubmit}>
                    {state.groupName ? '수정' : '명명'}
                  </Button>
                  {state.groupName && (
                    <Button variant="secondary" className="py-1 px-3 text-sm" onClick={() => setIsEditingGroupName(false)}>
                      취소
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-chaebol-gold">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-lg shrink-0"><TrendingUp className="text-chaebol-gold" size={20} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 whitespace-nowrap">총 자산 (순자산)</p>
                <p className="text-lg font-bold font-mono truncate" title={formatCurrency(netWorth)}>{formatCurrency(netWorth)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-lg shrink-0"><Wallet className="text-green-500" size={20} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 whitespace-nowrap">유동 자산 (현금)</p>
                <p className="text-lg font-bold font-mono truncate" title={formatCurrency(state.cash)}>{formatCurrency(state.cash)}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-lg shrink-0"><Briefcase className="text-blue-500" size={20} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 whitespace-nowrap">계열사</p>
                <p className="text-lg font-bold font-mono truncate">{acquiredCompaniesCount} / {state.companies.length}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-lg shrink-0"><Building className="text-purple-500" size={20} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 whitespace-nowrap">부동산 (부지 / 건물)</p>
                <p className="text-lg font-bold font-mono truncate">{ownedLandCount}개 / {builtCount}채</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="h-80">
          <h3 className="text-lg font-semibold mb-4">자산 성장 추이 (랭킹)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={state.netWorthHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="tick" 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8'}} 
                tickFormatter={(value) => {
                  const info = getGameTimeInfo(value);
                  return `${info.dateStr.slice(6)} ${info.timeStr}`;
                }}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8'}} 
                tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`}
                width={80}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                formatter={(value: number, name: string, props: any) => {
                  if (name === '내 자산') return [formatCurrency(value), '내 자산'];
                  if (name === '1위') return [formatCurrency(value), `1위 (${props.payload.top1Name || '-'})`];
                  if (name === '2위') return [formatCurrency(value), `2위 (${props.payload.top2Name || '-'})`];
                  if (name === '3위') return [formatCurrency(value), `3위 (${props.payload.top3Name || '-'})`];
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => getGameTimeInfo(Number(label)).fullStr}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="value" name="내 자산" stroke="#fbbf24" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="top1Value" name="1위" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="top2Value" name="2위" stroke="#b45309" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="top3Value" name="3위" stroke="#475569" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Portfolio Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-1 2xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">주식 포트폴리오</h3>
              <div className="space-y-3">
                {state.companies.filter(c => c.playerShares > 0).length > 0 ? (
                  state.companies.filter(c => c.playerShares > 0).map(c => (
                    <div key={c.id} className="flex justify-between items-center">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-medium truncate" title={c.name}>{c.name}</p>
                        <p className="text-xs text-slate-400">{c.playerShares.toLocaleString()} 주</p>
                      </div>
                      <p className="font-mono shrink-0">{formatCurrency(c.playerShares * c.stockPrice)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">보유 중인 주식이 없습니다.</p>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">대출 현황</h3>
              {state.loanAmount > 0 ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">대출 잔액</span>
                    <span className="font-mono text-red-400 font-bold">{formatCurrency(state.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">만기일</span>
                    <span className="font-mono text-slate-200">{state.loanDueDate}일차</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">이용 중인 대출이 없습니다.</p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">부동산 보유 현황</h3>
              <div className="space-y-3">
                {state.districts.filter(d => d.owner === 'Player' || d.buildings.some(b => b.ownerType === 'Player')).length > 0 ? (
                  state.districts.filter(d => d.owner === 'Player' || d.buildings.some(b => b.ownerType === 'Player')).map(d => {
                    const myBuildings = d.buildings.filter(b => b.ownerType === 'Player');
                    return (
                      <div key={d.id} className="flex justify-between items-center">
                        <div className="min-w-0 flex-1 mr-4">
                          <p className="font-medium truncate" title={d.name}>
                            {d.name} {d.owner === 'Player' && <span className="text-xs text-green-400">(내 부지)</span>}
                          </p>
                          <p className="text-xs text-slate-400 truncate" title={myBuildings.length > 0 ? myBuildings.map(b => b.type).join(', ') : '건물 없음'}>
                            {myBuildings.length > 0 ? myBuildings.map(b => b.type).join(', ') : '건물 없음'}
                          </p>
                        </div>
                        <p className="font-mono shrink-0">{formatCurrency(d.owner === 'Player' ? d.landPrice : 0)}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-sm">보유 중인 부동산이 없습니다.</p>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">예금 현황</h3>
              <div className="space-y-3">
                {state.deposits.length > 0 ? (
                  state.deposits.map(dep => (
                    <div key={dep.id} className="flex justify-between items-center">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-medium truncate" title={dep.name}>{dep.name}</p>
                        <p className="text-xs text-slate-400">연 {dep.appliedRate.toFixed(2)}%</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-green-400 font-bold">{formatCurrency(dep.principal + dep.interestEarned)}</p>
                        <p className="text-[10px] text-slate-500">원금 {formatCurrency(dep.principal)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">가입된 예금 상품이 없습니다.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Right: Lobby Chat Panel */}
      <Card className="w-full xl:w-80 shrink-0 flex flex-col h-[500px] xl:h-full border-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-3">
          <MessageSquare className="text-blue-400" size={20} />
          <h3 className="text-lg font-bold">로비 채팅</h3>
        </div>
        
        <div className="mb-3">
          <p className="text-xs text-slate-400 mb-2">접속 중인 회원 ({state.connectedUsers.length + 1}명)</p>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
            <Badge variant="success">{state.currentUser} (나)</Badge>
            {state.connectedUsers.map(u => <Badge key={u} variant="info">{u}</Badge>)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
          {state.chatMessages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === state.currentUser ? 'items-end' : 'items-start'}`}>
              {!msg.isSystem && <span className="text-[10px] text-slate-500 mb-0.5 px-1">{msg.sender}</span>}
              <div className={`
                inline-block px-3 py-2 rounded-lg text-sm max-w-[90%] break-words
                ${msg.isSystem ? 'bg-slate-800 text-slate-400 w-full text-center text-xs' : 
                  msg.sender === state.currentUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'}
              `}>
                {msg.text}
              </div>
              {!msg.isSystem && <div className="text-[9px] text-slate-600 mt-0.5 px-1">{msg.timestamp}</div>}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 mt-auto">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            className="flex-1 min-w-0 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="메시지를 입력하세요..."
          />
          <Button variant="primary" className="px-4 py-2 text-sm whitespace-nowrap shrink-0" onClick={() => {}}>
            전송
          </Button>
        </form>
      </Card>

    </div>
  );
};
