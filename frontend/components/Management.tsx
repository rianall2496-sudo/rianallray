import React from 'react';
import { Company, District } from '../types';
import { formatCurrency } from '../constants';
import { Card, Button, Badge } from './ui';
import { Users, Megaphone, FlaskConical, Briefcase, Crown, UserPlus, UserMinus, ArrowUpCircle, User, Building2 } from 'lucide-react';

interface ManagementProps {
  companies: Company[];
  districts: District[];
  cash: number;
  currentUser: string;
  onInvest: (companyId: string, type: 'HR' | 'Marketing' | 'R&D', amount?: number) => void;
  onBoardAction: (companyId: string, memberId: string, action: 'appoint' | 'fire' | 'promote') => void;
  onSellBuilding: (districtId: string, buildingId: string) => void;
}

export const Management: React.FC<ManagementProps> = ({ companies, districts, cash, currentUser, onInvest, onBoardAction, onSellBuilding }) => {
  const ownedCompanies = companies.filter(c => c.isAcquired);
  const boardCompanies = companies.filter(c => !c.isAcquired && c.playerShares > 0);
  const isGroupChairman = ownedCompanies.length >= 3;

  if (ownedCompanies.length === 0 && boardCompanies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <Briefcase size={64} className="text-slate-600" />
        <h2 className="text-2xl font-bold text-slate-400">아직 경영 중이거나 임원으로 재직 중인 회사가 없습니다</h2>
        <p className="text-slate-500 max-w-md">
          주식 시장에서 기업의 지분을 매수하여 임원진에 합류하거나, 51% 이상 확보하여 경영권을 인수하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-2 custom-scrollbar">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="text-chaebol-gold"/> 기업 경영</h2>
        {isGroupChairman && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-2 rounded-full shadow-lg shadow-yellow-900/50 animate-pulse">
            <Crown size={20} />
            <span className="font-bold">그룹 회장 모드 활성화됨</span>
          </div>
        )}
      </div>
      
      {ownedCompanies.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {ownedCompanies.map(company => {
            const mktCost = company.marketingLevel * 2000000;
            const rdCost = company.rdLevel * 5000000;
            const maxEmp = company.marketType === 'KOSPI' ? 2000 : 500;

            const playerSharePercent = (company.playerShares / company.totalShares) * 100;

            const boardCounts = {
              '이사': company.board.filter(m => m.title === '이사').length,
              '부장': company.board.filter(m => m.title === '부장').length,
              '과장': company.board.filter(m => m.title === '과장').length,
              '대리': company.board.filter(m => m.title === '대리').length,
            };

            const companyBuildings = districts.flatMap(d => 
              d.buildings.filter(b => b.companyId === company.id).map(b => ({ district: d, building: b }))
            );

            const ceo = company.board.find(m => m.id === company.ceoId);

            return (
              <Card key={company.id} className="flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-chaebol-gold">{company.name}</h3>
                    <p className="text-sm text-slate-400">{company.sector} 부문</p>
                  </div>
                  <Badge variant="success">경영 중</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900 p-3 rounded-lg text-center">
                    <Users className="mx-auto mb-2 text-blue-400" size={20}/>
                    <p className="text-xs text-slate-400">직원 수</p>
                    <p className="font-bold">{company.employees} <span className="text-xs text-slate-500">/ {maxEmp}</span></p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg text-center">
                    <Megaphone className="mx-auto mb-2 text-pink-400" size={20}/>
                    <p className="text-xs text-slate-400">마케팅 레벨</p>
                    <p className="font-bold">{company.marketingLevel}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg text-center">
                    <FlaskConical className="mx-auto mb-2 text-green-400" size={20}/>
                    <p className="text-xs text-slate-400">R&D 레벨</p>
                    <p className="font-bold">{company.rdLevel}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-semibold">대규모 채용</p>
                        <p className="text-xs text-slate-400">기본 수익 증가 (1명당 5만원)</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[10, 20, 30, 50].map(amt => (
                        <Button 
                          key={amt}
                          variant="secondary" 
                          onClick={() => onInvest(company.id, 'HR', amt)}
                          disabled={cash < amt * 50000 || company.employees + amt > maxEmp}
                          className="flex-1 text-xs py-2 px-0"
                        >
                          +{amt}명
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
                    <div>
                      <p className="font-semibold">마케팅 캠페인</p>
                      <p className="text-xs text-slate-400">일시적인 주가 상승 효과</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={() => onInvest(company.id, 'Marketing')}
                      disabled={cash < mktCost}
                    >
                      실행 ({formatCurrency(mktCost)})
                    </Button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
                    <div>
                      <p className="font-semibold">R&D 투자</p>
                      <p className="text-xs text-slate-400">장기적인 기업 가치 및 수익 성장</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={() => onInvest(company.id, 'R&D')}
                      disabled={cash < rdCost}
                    >
                      투자 ({formatCurrency(rdCost)})
                    </Button>
                  </div>
                </div>

                {/* 부동산 매각 시스템 */}
                <div className="mt-6 border-t border-slate-700 pt-4">
                  <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Building2 size={16} /> 소유 부동산 매각 (자본금 확보)
                  </h4>
                  <div className="bg-slate-900 rounded-lg border border-slate-700 p-2 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {companyBuildings.length === 0 ? (
                      <p className="text-center text-slate-500 text-xs py-2">소유한 건물이 없습니다.</p>
                    ) : (
                      companyBuildings.map(({ district, building }) => {
                        let refund = 0;
                        if (building.type === '사무실 빌딩') refund = 500000000 * 0.8;
                        if (building.type === '마케팅 센터') refund = 1000000000 * 0.8;
                        if (building.type === '연구소') refund = 2000000000 * 0.8;
                        if (building.type === '물류 센터') refund = 3000000000 * 0.8;
                        if (building.type === '복합 타워') refund = 5000000000 * 0.8;
                        if (building.type === '본사 빌딩') refund = 10000000000 * 0.8;

                        return (
                          <div key={building.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700/50">
                            <div>
                              <p className="text-xs font-bold text-blue-200">{district.name} <span className="text-slate-400 font-normal">{building.type}</span></p>
                              <p className="text-[10px] text-slate-500">매각 시 {formatCurrency(refund)} 회수 (80%)</p>
                            </div>
                            <button 
                              onClick={() => onSellBuilding(district.id, building.id)}
                              className="bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white text-xs px-3 py-1.5 rounded transition-colors border border-red-700/50"
                            >
                              매각
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 이사회 및 임원진 구성 */}
                <div className="mt-6 border-t border-slate-700 pt-4">
                  <h4 className="text-sm font-bold text-slate-400 mb-3">타 회원 (주주 및 임원진)</h4>
                  
                  {/* 대표이사 전용 UI 박스 */}
                  {ceo && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-yellow-900/40 to-slate-900 border border-yellow-700/50 rounded-lg flex justify-between items-center shadow-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Crown size={18} className="text-yellow-400" />
                          <span className="font-bold text-yellow-400">현재 대표이사: {ceo.name}</span>
                        </div>
                        <p className="text-xs text-slate-400">보유 지분: {((ceo.shares / company.totalShares) * 100).toFixed(1)}% | 매월 실적에 따른 배당금 수령 중</p>
                      </div>
                      {isGroupChairman && (
                        <Button variant="danger" className="text-xs py-2 px-4" onClick={() => onBoardAction(company.id, ceo.id, 'fire')}>
                          해임하기
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                    
                    <div className="flex justify-between items-center p-3 bg-blue-900/30 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        <Badge variant="success">{isGroupChairman ? '그룹 회장' : '최대 주주'}</Badge>
                        <span className="font-bold text-blue-100">{currentUser} (나)</span>
                      </div>
                      <span className="text-sm font-mono text-blue-300">{playerSharePercent.toFixed(1)}%</span>
                    </div>

                    <div className="p-2 space-y-2">
                      {company.board.map((member) => {
                        const isCEO = member.id === company.ceoId;
                        const memberSharePercent = (member.shares / company.totalShares) * 100;

                        let canPromote = false;
                        if (member.title === '부장' && boardCounts['이사'] < 2) canPromote = true;
                        if (member.title === '과장' && boardCounts['부장'] < 2) canPromote = true;
                        if (member.title === '대리' && boardCounts['과장'] < 2) canPromote = true;

                        return (
                          <div key={member.id} className={`flex flex-col sm:flex-row sm:items-center justify-between text-xs p-2 rounded border ${isCEO ? 'bg-yellow-900/20 border-yellow-700/50' : 'bg-slate-800 border-slate-700/50'}`}>
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <span className={`w-12 font-bold text-center rounded px-1 py-0.5 ${isCEO ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                {member.title}
                              </span>
                              <span className={`font-medium ${isCEO ? 'text-yellow-400' : 'text-slate-200'}`}>{member.name}</span>
                              <span className="font-mono text-slate-500 ml-2">지분: {memberSharePercent.toFixed(1)}%</span>
                            </div>
                            
                            {isGroupChairman && (
                              <div className="flex gap-1">
                                {!isCEO && !company.ceoId && (
                                  <button 
                                    onClick={() => onBoardAction(company.id, member.id, 'appoint')}
                                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    <UserPlus size={12} /> 임명
                                  </button>
                                )}
                                {isCEO && (
                                  <button 
                                    onClick={() => onBoardAction(company.id, member.id, 'fire')}
                                    className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    <UserMinus size={12} /> 해임
                                  </button>
                                )}
                                {!isCEO && member.title !== '이사' && (
                                  <button 
                                    onClick={() => onBoardAction(company.id, member.id, 'promote')}
                                    disabled={!canPromote}
                                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${canPromote ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                    title={!canPromote ? '상위 직급의 정원(TO)이 가득 차서 승진할 수 없습니다.' : '승진시키기'}
                                  >
                                    <ArrowUpCircle size={12} /> 승진
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-slate-400">
          경영 중인 계열사가 없습니다. 지분 51%를 확보하여 기업을 인수하세요.
        </div>
      )}

      {boardCompanies.length > 0 && (
        <div className="mt-8 border-t border-slate-700 pt-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-300">
            <User size={20} className="text-blue-400" /> 외부 기업 임원 재직 현황
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardCompanies.map(company => {
              const allShares = [company.playerShares, ...company.board.map(b => b.shares)].sort((a, b) => b - a);
              const rank = allShares.indexOf(company.playerShares);
              
              let title = '대리';
              if (rank === 0) title = '최대주주';
              else if (rank <= 2) title = '이사';
              else if (rank <= 4) title = '부장';
              else if (rank <= 6) title = '과장';

              const baseDiv = company.stockPrice * company.playerShares * 0.01;
              const titleBonus = rank === 0 ? 1.5 : rank <= 2 ? 1.2 : rank <= 4 ? 1.1 : 1.0;
              const expectedDividend = Math.floor(baseDiv * titleBonus);

              return (
                <Card key={company.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-blue-300">{company.name}</h4>
                    <Badge variant="info">{title}</Badge>
                  </div>
                  <div className="text-sm text-slate-400 space-y-2">
                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                      <span>보유 지분</span>
                      <span className="font-mono text-slate-200">{((company.playerShares / company.totalShares) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                      <span>예상 월 배당금</span>
                      <span className="font-mono text-green-400 font-bold">{formatCurrency(expectedDividend)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
