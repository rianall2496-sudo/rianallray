import React, { useState } from 'react';
import { District, BuildingType, Company } from '../types';
import { formatCurrency } from '../constants';
import { Card, Button, Badge } from './ui';
import { Map, Building2, Hammer, MapPin, Info, AlertCircle } from 'lucide-react';

interface RealEstateProps {
  districts: District[];
  companies: Company[];
  cash: number;
  onBuyLand: (districtId: string) => void;
  onBuild: (districtId: string, type: BuildingType, companyId: string) => void;
}

const DISTRICT_COORDS: Record<string, { x: number; y: number }> = {
  'd1': { x: 65, y: 70 }, 'd2': { x: 55, y: 75 }, 'd3': { x: 48, y: 55 }, 'd4': { x: 38, y: 58 },
  'd5': { x: 75, y: 65 }, 'd6': { x: 62, y: 52 }, 'd7': { x: 35, y: 45 }, 'd8': { x: 48, y: 35 },
  'd9': { x: 50, y: 45 }, 'd10': { x: 72, y: 50 }, 'd11': { x: 42, y: 68 }, 'd12': { x: 30, y: 62 },
  'd13': { x: 85, y: 48 }, 'd14': { x: 20, y: 60 }, 'd15': { x: 38, y: 35 }, 'd16': { x: 62, y: 38 },
  'd17': { x: 55, y: 28 }, 'd18': { x: 30, y: 25 }, 'd19': { x: 12, y: 50 }, 'd20': { x: 20, y: 72 },
  'd21': { x: 40, y: 82 }, 'd22': { x: 28, y: 85 }, 'd23': { x: 68, y: 15 }, 'd24': { x: 58, y: 10 },
  'd25': { x: 48, y: 18 }, 'd26': { x: 75, y: 30 },
};

export const RealEstate: React.FC<RealEstateProps> = ({ districts, companies, cash, onBuyLand, onBuild }) => {
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(districts[0].id);
  
  const acquiredCompanies = companies.filter(c => c.isAcquired);
  const [buildCompanyId, setBuildCompanyId] = useState<string>(acquiredCompanies[0]?.id || '');

  const selectedDistrict = districts.find(d => d.id === selectedDistrictId) || districts[0];

  const ownedCount = districts.filter(d => d.owner === 'Player').length;
  const builtCount = districts.reduce((sum, d) => sum + d.buildings.filter(b => b.ownerType === 'Player').length, 0);

  const hasCompany = acquiredCompanies.length > 0;
  const maxPlayerBuildings = acquiredCompanies.length * 5;
  
  const hasTransportCompany = acquiredCompanies.some(c => c.sector === '운송');

  const buildingOptions: { type: Exclude<BuildingType, '없음'>, cost: number, desc: string, req?: string }[] = [
    { type: '사무실 빌딩', cost: 500000000, desc: '전체 계열사 기본 수익 5% 증가' },
    { type: '마케팅 센터', cost: 1000000000, desc: '전체 계열사 마케팅 효과 증가 (주가 상승 견인)' },
    { type: '연구소', cost: 2000000000, desc: '전체 계열사 R&D 효율 증가 (장기적 주가 상승)' },
    { type: '물류 센터', cost: 3000000000, desc: '전체 계열사 수익 15% 대폭 증가 (운송 계열사 필요)', req: 'transport' },
    { type: '복합 타워', cost: 5000000000, desc: '수익 10% 증가 및 마케팅/R&D 동시 상승' },
    { type: '본사 빌딩', cost: 10000000000, desc: '그룹의 상징. 전체 계열사 수익 30% 폭증' },
  ];

  const availableBuildings = buildingOptions.filter(b => b.req !== 'transport' || hasTransportCompany);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      
      {/* Left: Interactive Map Area */}
      <div className="flex-1 flex flex-col h-full min-h-[400px]">
        <div className="flex justify-between items-end mb-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Map className="text-green-400"/> 서울특별시 개발 지도</h2>
            <p className="text-slate-400 mt-1 text-sm">지역을 선택하여 부지를 매입하거나 대여 수수료를 내고 건물을 건설하세요.</p>
          </div>
          <div className="flex gap-4 text-sm bg-slate-800 p-2 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500"></span> 매물</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> 타인 소유</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> 내 부지</div>
          </div>
        </div>

        <div className="relative flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-inner">
          
          {/* 웹 호스팅된 고화질 지도 이미지를 실시간으로 불러옵니다. */}
          {/* 본인의 이미지로 변경하려면 아래 URL을 './seoul_map.jpg' 로 변경하세요. */}
          <div 
            className="absolute inset-0 w-full h-full bg-no-repeat bg-center bg-cover opacity-60 mix-blend-luminosity"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop')" }}
          ></div>

          {/* Map Markers */}
          {districts.map(district => {
            const coords = DISTRICT_COORDS[district.id];
            if (!coords) return null;

            const isSelected = district.id === selectedDistrictId;
            let markerColor = 'bg-slate-500 border-slate-400'; 
            
            if (district.owner === 'NPC') {
              markerColor = 'bg-red-500 border-red-400'; 
            } else if (district.owner === 'Player') {
              markerColor = 'bg-green-500 border-green-400'; 
            }

            return (
              <div 
                key={district.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                onClick={() => setSelectedDistrictId(district.id)}
              >
                <div className={`
                  mb-1 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap transition-all duration-200
                  ${isSelected ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-slate-800/90 text-slate-200 group-hover:bg-slate-700'}
                `}>
                  {district.name}
                </div>
                
                <div className="relative flex items-center justify-center">
                  {isSelected && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-75 scale-150"></div>
                  )}
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 shadow-md transition-transform ${markerColor} ${isSelected ? 'scale-125 ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : 'group-hover:scale-110'}`}>
                    <span className="text-[10px] font-bold text-white">{district.buildings.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Details & Action Panel */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-2">
        
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 shrink-0">
          <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">부동산 자산 요약</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">보유 부지</p>
              <p className="text-xl font-mono font-bold text-blue-400">{ownedCount} <span className="text-sm text-slate-400">/ 26</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-500">내 건물 현황</p>
              <p className="text-xl font-mono font-bold text-green-400">{builtCount} <span className="text-sm text-slate-400">/ {maxPlayerBuildings}</span></p>
            </div>
          </div>
        </Card>

        <Card className="flex-1 flex flex-col border-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="text-blue-400" size={20} />
                <h3 className="text-2xl font-bold">{selectedDistrict.name}</h3>
              </div>
              <p className="text-sm text-slate-400">선택된 지역 정보</p>
            </div>
            {selectedDistrict.owner === 'Player' ? (
              <Badge variant="success">내 부지</Badge>
            ) : selectedDistrict.owner === 'NPC' ? (
              <Badge variant="warning">타인 소유</Badge>
            ) : (
              <Badge variant="info">매물</Badge>
            )}
          </div>

          <div className="space-y-6 flex-1">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <p className="text-sm text-slate-400 mb-1">공시지가</p>
              <p className="text-2xl font-mono font-bold text-chaebol-gold">{formatCurrency(selectedDistrict.landPrice)}</p>
            </div>

            {selectedDistrict.owner === 'None' && (
              <div className="flex flex-col gap-3 mt-auto">
                <div className="flex items-start gap-2 text-sm text-slate-400 bg-slate-900 p-3 rounded">
                  <Info size={16} className="shrink-0 mt-0.5 text-blue-400" />
                  <p>이 지역의 부지를 매입하면 건물을 건설할 수 있으며, 타 회원이 건물을 지을 때 대여 수수료와 매월 임대료를 받을 수 있습니다.</p>
                </div>
                <Button 
                  variant="primary" 
                  className="w-full py-4 text-lg shadow-lg shadow-blue-900/20"
                  onClick={() => onBuyLand(selectedDistrict.id)}
                  disabled={cash < selectedDistrict.landPrice}
                >
                  부지 매입하기
                </Button>
              </div>
            )}

            {selectedDistrict.owner !== 'None' && (
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-slate-400">지역구 건설 현황</p>
                    <span className="font-mono text-sm text-blue-400">{selectedDistrict.buildings.length} / 20</span>
                  </div>
                  
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                    {selectedDistrict.buildings.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-4">아직 건설된 건물이 없습니다.</p>
                    ) : (
                      selectedDistrict.buildings.map(b => (
                        <div key={b.id} className="flex justify-between items-center text-sm p-2 bg-slate-800 rounded">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className={b.ownerType === 'Player' ? 'text-green-400' : 'text-slate-400'} />
                            <span className={b.ownerType === 'Player' ? 'text-green-100 font-bold' : 'text-slate-300'}>
                              {b.companyName ? `[${b.companyName}] ` : ''}{b.type}
                            </span>
                          </div>
                          <Badge variant={b.ownerType === 'Player' ? 'success' : 'info'}>{b.ownerType === 'Player' ? '내 건물' : '타 회원'}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Hammer size={16} className="text-yellow-400"/> 건설 가능한 프로젝트
                  </p>
                  
                  {!hasCompany ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-red-900/50 rounded-lg text-center gap-3">
                      <AlertCircle className="text-red-500" size={32} />
                      <p className="text-sm text-slate-300">
                        건물을 건설하려면 주식 시장에서 <br/>
                        <span className="text-red-400 font-bold">최소 1개 이상의 기업 경영권(지분 51% 이상)</span>을<br/>
                        먼저 인수해야 합니다.
                      </p>
                    </div>
                  ) : builtCount >= maxPlayerBuildings ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-yellow-900/50 rounded-lg text-center gap-3">
                      <AlertCircle className="text-yellow-500" size={32} />
                      <p className="text-sm text-slate-300">
                        건설 한도 초과!<br/>
                        인수한 회사 1개당 5개의 건물만 지을 수 있습니다.<br/>
                        (현재 {builtCount} / {maxPlayerBuildings}개)
                      </p>
                    </div>
                  ) : selectedDistrict.buildings.length >= 20 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-red-900/50 rounded-lg text-center gap-3">
                      <AlertCircle className="text-red-500" size={32} />
                      <p className="text-sm text-slate-300">
                        이 지역구는 이미 20개의 건물이 들어서 있어<br/>
                        더 이상 건설할 수 없습니다.
                      </p>
                    </div>
                  ) : (
                    <>
                      {selectedDistrict.owner === 'NPC' && (
                        <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-700/50 mb-2">
                          * 타인 소유 부지이므로 건설 시 공시지가의 10%가 대여 수수료로 추가 청구되며, 매월 2%의 임대료가 발생합니다.
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block text-xs text-slate-400 mb-1">건설 주체 기업 선택</label>
                        <select 
                          value={buildCompanyId} 
                          onChange={(e) => setBuildCompanyId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                          {acquiredCompanies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {availableBuildings.map((b) => {
                        const landFee = selectedDistrict.owner === 'NPC' ? selectedDistrict.landPrice * 0.10 : 0;
                        const totalCost = b.cost + landFee;

                        return (
                          <div key={b.type} className="flex flex-col gap-2 bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-blue-100">{b.type}</p>
                              <div className="text-right">
                                <p className="font-mono text-sm text-chaebol-gold">{formatCurrency(totalCost)}</p>
                                {landFee > 0 && <p className="text-[10px] text-slate-400">(수수료 {formatCurrency(landFee)} 포함)</p>}
                              </div>
                            </div>
                            <p className="text-xs text-slate-400">{b.desc}</p>
                            <Button 
                              variant="secondary" 
                              onClick={() => onBuild(selectedDistrict.id, b.type, buildCompanyId || acquiredCompanies[0].id)}
                              disabled={cash < totalCost}
                              className="w-full mt-2 text-sm py-2"
                            >
                              건설 시작
                            </Button>
                          </div>
                        );
                      })}
                      
                      {!hasTransportCompany && (
                        <div className="text-center p-3 border border-dashed border-slate-700 rounded-lg text-slate-500 text-xs">
                          운송 계열사 경영권을 확보하면 '물류 센터'를 건설할 수 있습니다.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
