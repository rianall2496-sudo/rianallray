import React, { useState, useEffect, useRef } from 'react';
import { GameState, LogEntry, Branch, ActionOutcome, Subordinate, MapBase } from '../types.ts';
import { RANKS, getUnitName, XP_REQUIREMENTS, PRODUCTION_UNLOCK_RANK_INDEX, EQUIPMENT_CATALOG, TRAINING_CATALOG, BADGE_REQUIREMENTS, COMBAT_ZONES, MOS_LIST, CIVIL_SUPPORT_MISSIONS, generateCommandTree, getTroopsForRole, MEDALS, getPlayerRoleName, RD_PROJECTS, generateSpecialApplicant, generateMercenary, getRankIcon, KOREA_MAP_BASES } from '../constants.ts';
import { performAction } from '../services/geminiService.ts';
import { Shield, Anchor, Plane, Crosshair, Users, Zap, Star, TrendingUp, AlertTriangle, Hammer, Clock, Globe, PlusCircle, HeartHandshake, Rocket, ShieldAlert, Briefcase, Map as MapIcon, X } from 'lucide-react';

interface DashboardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const getTargetTroops = (rank: number, role?: string) => {
  switch(rank) {
    case 9: return 36;
    case 10: return 72;
    case 11: return 144;
    case 12: return role === 'MAJOR_CMD' ? 288 : 144;
    case 13: return 576;
    case 14: return 2304;
    case 15: return role === 'BG_CMD' ? 9216 : 2304;
    case 16: return 10000;
    case 17: return 40000;
    case 18: return 160000;
    case 19: return 640000;
    default: return 36;
  }
};

const syncTroopsRecursively = (subs: Subordinate[], fillRatio: number): Subordinate[] => {
  return subs.map(sub => {
    let updatedSub = { ...sub };
    const roleMax = getTroopsForRole(updatedSub.role);
    updatedSub.troops = Math.floor(roleMax * fillRatio);

    if (fillRatio <= 0) updatedSub.status = '전멸';
    else if (fillRatio < 0.4) updatedSub.status = '위독';
    else if (fillRatio < 0.8) updatedSub.status = '부상';
    else updatedSub.status = '양호';

    if (updatedSub.subordinates) {
      updatedSub.subordinates = syncTroopsRecursively(updatedSub.subordinates, fillRatio);
    }
    return updatedSub;
  });
};

const SubordinateNode: React.FC<{ sub: Subordinate }> = ({ sub }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = sub.subordinates && sub.subordinates.length > 0;

  const nextRankXp = sub.rankIndex < RANKS.length - 1 ? XP_REQUIREMENTS[sub.rankIndex + 1] : sub.xp;
  const xpProgress = Math.min(100, (sub.xp / nextRankXp) * 100);
  const combatPower = (sub.rankIndex + 1) * 50 + Math.floor(sub.xp / 10);

  const statusColor = sub.status === '양호' ? 'text-green-400' : sub.status === '부상' ? 'text-yellow-400' : 'text-red-500';

  return (
    <div className="ml-3 border-l-2 border-gray-600 pl-3 mt-2">
      <div 
        onClick={() => hasChildren && setIsOpen(!isOpen)} 
        className={`flex flex-col p-3 rounded ${hasChildren ? 'cursor-pointer hover:bg-gray-700' : ''} bg-gray-800 border border-gray-600 shadow-sm`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <span className="text-gray-400 text-xs w-4 text-center">{isOpen ? '▼' : '▶'}</span>
            ) : (
              <span className="w-4 text-gray-600 text-xs text-center">•</span>
            )}
            <span className="text-sm font-bold text-white">
              [{sub.role}] <span className="text-yellow-500">{getRankIcon(sub.rankIndex)}</span> {RANKS[sub.rankIndex]} {sub.name}
            </span>
          </div>
          <span className="text-xs text-red-400 font-bold">전투력: {combatPower.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-300 mb-2 pl-6">
          <span>병력: {sub.troops.toLocaleString()}명</span>
          <span>상태: <span className={`font-bold ${statusColor}`}>{sub.status}</span></span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-2 relative overflow-hidden">
          <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }}></div>
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className="mt-2">
          {sub.subordinates!.map(child => <SubordinateNode key={child.id} sub={child} />)}
        </div>
      )}
    </div>
  );
};

const SubordinateTree: React.FC<{ subordinates: Subordinate[] }> = ({ subordinates }) => {
  return (
    <div className="space-y-2">
      {subordinates.map(sub => <SubordinateNode key={sub.id} sub={sub} />)}
    </div>
  );
};

const mergeTrees = (oldSubs: Subordinate[], newSubs: Subordinate[]): Subordinate[] => {
  return newSubs.map(newSub => {
    const oldSub = oldSubs.find(o => o.role === newSub.role);
    if (oldSub) {
      return {
        ...newSub,
        id: oldSub.id,
        name: oldSub.name,
        rankIndex: Math.max(oldSub.rankIndex, newSub.rankIndex),
        xp: Math.max(oldSub.xp, newSub.xp),
        subordinates: newSub.subordinates ? mergeTrees(oldSub.subordinates || [], newSub.subordinates) : undefined
      };
    }
    return newSub;
  });
};

export const Dashboard: React.FC<DashboardProps> = ({ gameState, setGameState }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showMissionMenu, setShowMissionMenu] = useState(false);
  const [showRecruitMenu, setShowRecruitMenu] = useState(false);
  const [showCivilMenu, setShowCivilMenu] = useState(false);
  const [showRDMenu, setShowRDMenu] = useState(false);
  const [showSpecialMenu, setShowSpecialMenu] = useState(false);
  const [showMercenaryMenu, setShowMercenaryMenu] = useState(false);
  const [showMapMenu, setShowMapMenu] = useState(false);
  const [useSpecialForces, setUseSpecialForces] = useState(false);
  const [selectedMercenaryId, setSelectedMercenaryId] = useState<string>('');
  const [selectedMapBase, setSelectedMapBase] = useState<MapBase | null>(null);
  const [tick, setTick] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], title: string, message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      turn: gameState.turn,
      type,
      title,
      message,
      timestamp: new Date()
    };
    setLogs(prev => [...prev, newLog]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (gameState.turn === 1 && logs.length === 0) {
      addLog('INFO', '부임 완료', `${getRankIcon(gameState.rankIndex)} ${RANKS[gameState.rankIndex]} ${gameState.playerName}, 지휘소에 오신 것을 환영합니다. 부대 육성을 시작하십시오.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer for active training
  useEffect(() => {
    if (!gameState.activeTraining) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [gameState.activeTraining]);

  // Check training completion
  useEffect(() => {
    if (gameState.activeTraining && !isProcessing) {
      const elapsed = Date.now() - gameState.activeTraining.startTime;
      if (elapsed >= gameState.activeTraining.durationMs) {
        handleTrainingComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, gameState.activeTraining, isProcessing]);

  // Handle Organization Updates based on Rank
  const updateOrganization = (rankIndex: number, role?: string) => {
    const newSubs = generateCommandTree(rankIndex, role);
    
    if (newSubs.length > 0) {
      setGameState(prev => {
        const targetTroops = getTargetTroops(rankIndex, role);
        const addedTroops = Math.max(0, targetTroops - prev.forces.regularTroops);
        const mergedSubs = mergeTrees(prev.subordinates, newSubs);
        
        const newState = { ...prev, subordinates: mergedSubs };
        if (addedTroops > 0) {
          newState.forces.regularTroops += addedTroops;
          newState.forces.mosBreakdown['소총수'] = (newState.forces.mosBreakdown['소총수'] || 0) + addedTroops;
        }

        const fillRatio = targetTroops > 0 ? newState.forces.regularTroops / targetTroops : 0;
        newState.subordinates = syncTroopsRecursively(newState.subordinates, fillRatio);

        return newState;
      });
      addLog('INFO', '인사 이동', `진급에 따른 대규모 부대 개편 및 참모진 인사가 완료되었습니다.`);
    }
  };

  const checkPromotions = (currentState: GameState) => {
    let stateUpdated = false;
    const newState = { ...currentState };

    // Check Player Promotion
    const nextRankIndex = newState.rankIndex + 1;
    if (nextRankIndex < RANKS.length && newState.xp >= XP_REQUIREMENTS[nextRankIndex]) {
      newState.rankIndex = nextRankIndex;
      newState.currentRole = undefined; // Reset role on promotion
      addLog('PROMOTION', '지휘관 진급!', `축하합니다! ${getRankIcon(nextRankIndex)} ${RANKS[nextRankIndex]}(으)로 진급하셨습니다.`);
      stateUpdated = true;
      
      // Trigger organization update if not requiring role selection
      if (nextRankIndex !== 12 && nextRankIndex !== 15) {
        setTimeout(() => updateOrganization(nextRankIndex), 500);
      }
    }

    // Recursive Subordinate Promotions
    const checkSubsRecursively = (subs: Subordinate[]): Subordinate[] => {
      return subs.map(sub => {
        let updatedSub = { ...sub };
        const subNextRank = updatedSub.rankIndex + 1;
        if (subNextRank < RANKS.length && updatedSub.xp >= XP_REQUIREMENTS[subNextRank]) {
          addLog('PROMOTION', '참모/부하 진급', `[${updatedSub.role}] ${updatedSub.name}이(가) ${getRankIcon(subNextRank)} ${RANKS[subNextRank]}(으)로 진급했습니다.`);
          updatedSub.rankIndex = subNextRank;
          stateUpdated = true;
        }
        if (updatedSub.subordinates) {
          updatedSub.subordinates = checkSubsRecursively(updatedSub.subordinates);
        }
        return updatedSub;
      });
    };

    newState.subordinates = checkSubsRecursively(newState.subordinates);

    if (stateUpdated) {
      setGameState(newState);
    }
  };

  const applyOutcome = (outcome: ActionOutcome, completedTrainingId?: string, usedMercenaryId?: string) => {
    setGameState(prev => {
      const newState = { ...prev, forces: { ...prev.forces, mosBreakdown: { ...prev.forces.mosBreakdown } } };
      newState.turn += 1;
      
      if (completedTrainingId) {
        newState.trainingCounts = { ...newState.trainingCounts };
        newState.trainingCounts[completedTrainingId] = (newState.trainingCounts[completedTrainingId] || 0) + 1;
      }

      if (usedMercenaryId) {
        newState.mercenaries = newState.mercenaries.map(m => 
          m.id === usedMercenaryId ? { ...m, remainingUses: m.remainingUses - 1 } : m
        ).filter(m => m.remainingUses > 0);
      }

      if (outcome.missionSuccess) {
        newState.missionWins = (newState.missionWins || 0) + 1;
      }

      if (outcome.awardedMedal && !newState.medals.includes(outcome.awardedMedal)) {
        newState.medals = [...newState.medals, outcome.awardedMedal];
        const medalDef = MEDALS.find(m => m.id === outcome.awardedMedal);
        if (medalDef) {
          addLog('PROMOTION', '훈장 수여!', `${medalDef.icon} [${medalDef.name}]을(를) 수여받았습니다!`);
        }
      }

      if (outcome.statChanges) {
        newState.xp += outcome.statChanges.xp || 0;
        newState.stats.intelligence += outcome.statChanges.intelligence || 0;
        newState.stats.stamina += outcome.statChanges.stamina || 0;
        newState.stats.charisma += outcome.statChanges.charisma || 0;
        newState.stats.reputation += outcome.statChanges.reputation || 0;
        newState.resources.budget += outcome.statChanges.budget || 0;
        
        if (outcome.statChanges.rdGained) {
          newState.rdLevels = { ...newState.rdLevels };
          newState.rdLevels[outcome.statChanges.rdGained] = (newState.rdLevels[outcome.statChanges.rdGained] || 0) + 1;
        }

        if (outcome.statChanges.specialUnitGained) {
          newState.specialUnits = [...(newState.specialUnits || []), outcome.statChanges.specialUnitGained];
        }

        if (outcome.statChanges.mercenaryGained) {
          newState.mercenaries = [...(newState.mercenaries || []), outcome.statChanges.mercenaryGained];
          newState.availableMercenaries = [...newState.availableMercenaries.slice(1), generateMercenary()];
        }

        if (outcome.statChanges.specialTroopsGained) {
          newState.forces.specialForces += outcome.statChanges.specialTroopsGained;
          newState.specialApplicants = [...newState.specialApplicants.slice(1), generateSpecialApplicant()];
        }

        if (outcome.statChanges.mosGained) {
          const { mos, count } = outcome.statChanges.mosGained;
          newState.forces.mosBreakdown[mos] = (newState.forces.mosBreakdown[mos] || 0) + count;
          newState.forces.regularTroops += count;
        } else if (outcome.statChanges.troopsGained) {
          newState.forces.mosBreakdown['소총수'] = (newState.forces.mosBreakdown['소총수'] || 0) + outcome.statChanges.troopsGained;
          newState.forces.regularTroops += outcome.statChanges.troopsGained;
        }

        if (outcome.statChanges.specialTroopsLost) {
          newState.forces.specialForces = Math.max(0, newState.forces.specialForces - outcome.statChanges.specialTroopsLost);
        }

        if (outcome.statChanges.troopsLost) {
          let remainingLoss = Math.min(newState.forces.regularTroops, outcome.statChanges.troopsLost);
          const lossRatio = remainingLoss / Math.max(1, newState.forces.regularTroops);
          
          newState.forces.regularTroops -= remainingLoss;
          newState.forces.casualties += remainingLoss;

          const mosKeys = Object.keys(newState.forces.mosBreakdown);
          while (remainingLoss > 0 && mosKeys.length > 0) {
            const randomMos = mosKeys[Math.floor(Math.random() * mosKeys.length)];
            if (newState.forces.mosBreakdown[randomMos] > 0) {
              newState.forces.mosBreakdown[randomMos]--;
              remainingLoss--;
            } else {
              mosKeys.splice(mosKeys.indexOf(randomMos), 1);
            }
          }

          // Distribute casualties to subordinates
          const applyCasualtiesRecursively = (subs: Subordinate[]): Subordinate[] => {
            return subs.map(sub => {
              let updatedSub = { ...sub };
              const lost = Math.floor(updatedSub.troops * lossRatio);
              updatedSub.troops = Math.max(0, updatedSub.troops - lost);
              
              const maxTroops = getTroopsForRole(updatedSub.role);
              const ratio = updatedSub.troops / Math.max(1, maxTroops);
              
              if (ratio === 0) updatedSub.status = '전멸';
              else if (ratio < 0.4) updatedSub.status = '위독';
              else if (ratio < 0.8) updatedSub.status = '부상';
              else updatedSub.status = '양호';

              if (updatedSub.subordinates) {
                updatedSub.subordinates = applyCasualtiesRecursively(updatedSub.subordinates);
              }
              return updatedSub;
            });
          };
          newState.subordinates = applyCasualtiesRecursively(newState.subordinates);
        }
      }

      const maxTroops = getTargetTroops(newState.rankIndex, newState.currentRole);
      if (newState.forces.regularTroops > maxTroops) {
        newState.forces.regularTroops = maxTroops;
      }
      
      const fillRatio = maxTroops > 0 ? newState.forces.regularTroops / maxTroops : 0;
      newState.subordinates = syncTroopsRecursively(newState.subordinates, fillRatio);

      // Recursive XP Distribution
      const baseXP = (outcome.statChanges?.xp || 0) > 0 ? Math.floor((outcome.statChanges!.xp!) / 10) : 0;
      
      const applyXpRecursively = (subs: Subordinate[]): Subordinate[] => {
        return subs.map(sub => {
          const specificChange = outcome.subordinateStatChanges?.find(c => c.id === sub.id);
          const totalXpGain = (specificChange?.xp || 0) + baseXP;
          
          let updatedSub = { ...sub };
          if (totalXpGain > 0) {
            updatedSub.xp += totalXpGain;
          }
          
          if (updatedSub.subordinates) {
            updatedSub.subordinates = applyXpRecursively(updatedSub.subordinates);
          }
          return updatedSub;
        });
      };

      newState.subordinates = applyXpRecursively(newState.subordinates);
      
      return newState;
    });
  };

  const handleTrainingComplete = async () => {
    if (!gameState.activeTraining) return;
    const training = gameState.activeTraining;
    setIsProcessing(true);
    
    try {
      const outcome = await performAction(gameState, 'TRAIN_COMPLETE', training);
      
      const currentCount = gameState.trainingCounts[training.id] || 0;
      const newCount = currentCount + 1;
      const badgeDef = BADGE_REQUIREMENTS[training.id];
      
      if (badgeDef && newCount === badgeDef.threshold) {
        addLog('PROMOTION', '휘장 획득!', `자랑스러운 [${badgeDef.name} 휘장]을 수여받았습니다!`);
      }

      setGameState(prev => ({ ...prev, activeTraining: null }));
      applyOutcome(outcome, training.id);
      addLog('TRAINING', outcome.title, outcome.description);
    } catch (error) {
      addLog('EVENT', '통신 오류', '훈련 결과 보고 중 오류가 발생했습니다.');
      setGameState(prev => ({ ...prev, activeTraining: null }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMission = async (zone: any) => {
    setIsProcessing(true);
    setShowMissionMenu(false);
    
    const totalRdLevel = Object.values(gameState.rdLevels).reduce((a, b) => a + b, 0);
    const rdBonus = totalRdLevel * 2; // 2% per level
    
    const specialPower = gameState.specialUnits.reduce((acc, u) => acc + u.combatPower, 0);
    const specialBonus = useSpecialForces ? Math.min(80, Math.floor(specialPower / 20)) : 0;

    const activeMercenary = gameState.mercenaries.find(m => m.id === selectedMercenaryId);
    const mercenaryBonus = activeMercenary ? Math.min(50, Math.floor(activeMercenary.combatPower / 300)) : 0;

    const ratio = useSpecialForces 
      ? (gameState.forces.specialForces * 50) / zone.enemyTroops 
      : (gameState.forces.regularTroops + (activeMercenary ? activeMercenary.troops * 10 : 0)) / zone.enemyTroops;
    
    let baseWinProb = 10;
    if (ratio >= 1.5) baseWinProb = 80;
    else if (ratio >= 1.0) baseWinProb = 60;
    else if (ratio >= 0.5) baseWinProb = 30;

    const finalWinProb = Math.min(99, baseWinProb + rdBonus + specialBonus + mercenaryBonus);

    try {
      const outcome = await performAction(gameState, 'MISSION', { ...zone, winProb: finalWinProb, useSpecialForces, mercenary: activeMercenary });
      applyOutcome(outcome, undefined, activeMercenary?.id);
      addLog('COMBAT', outcome.title, outcome.description);
    } catch (error) {
      addLog('EVENT', '통신 오류', '작전 통제 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setUseSpecialForces(false);
      setSelectedMercenaryId('');
    }
  };

  const handleCivilSupport = async (mission: any) => {
    setIsProcessing(true);
    setShowCivilMenu(false);
    try {
      const outcome = await performAction(gameState, 'CIVIL_SUPPORT', mission);
      applyOutcome(outcome);
      addLog('CIVIL', outcome.title, outcome.description);
    } catch (error) {
      addLog('EVENT', '통신 오류', '대민 지원 지시 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecruit = async (mos: any) => {
    const multiplier = Math.max(1, gameState.rankIndex - 8);
    const totalCost = mos.cost * multiplier;
    const totalCount = mos.baseCount * multiplier;

    if (gameState.resources.budget < totalCost) {
      addLog('INFO', '예산 부족', '모병을 위한 예산이 부족합니다.');
      return;
    }
    setIsProcessing(true);
    setShowRecruitMenu(false);
    try {
      const outcome = await performAction(gameState, 'RECRUIT', { name: mos.name, cost: totalCost, count: totalCount });
      applyOutcome(outcome);
      addLog('INFO', outcome.title, outcome.description);
    } catch (error) {
      addLog('EVENT', '통신 오류', '모병 지시 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRD = async (project: any, cost: number) => {
    if (gameState.resources.budget < cost) {
      addLog('INFO', '예산 부족', 'R&D 투자를 위한 예산이 부족합니다.');
      return;
    }
    setIsProcessing(true);
    setShowRDMenu(false);
    try {
      const outcome = await performAction(gameState, 'R_AND_D', { id: project.id, name: project.name, cost });
      applyOutcome(outcome);
      addLog('RND', outcome.title, outcome.description);
    } catch (error) {
      addLog('EVENT', '통신 오류', 'R&D 지시 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecruitSpecial = async (applicant: any) => {
    if (gameState.resources.budget < applicant.cost) {
      addLog('INFO', '예산 부족', '특수부대 창설을 위한 예산이 부족합니다.');
      return;
    }
    setIsProcessing(true);
    setShowSpecialMenu(false);
    try {
      const outcome = await performAction(gameState, 'RECRUIT_SPECIAL', applicant);
      applyOutcome(outcome);
      addLog('INFO', outcome.title, outcome.description);
    } catch (error) {
      addLog('EVENT', '통신 오류', '특수부대 창설 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHireMercenary = async (mercenary: any) => {
    if (gameState.resources.budget < mercenary.cost) {
      addLog('INFO', '예산 부족', '용병 고용을 위한 예산이 부족합니다.');
      return;
    }
    setIsProcessing(true);
    setShowMercenaryMenu(false);
    try {
      const outcome = await performAction(gameState, 'HIRE_MERCENARY', mercenary);
      applyOutcome(outcome);
      addLog('INFO', outcome.title, outcome.description);
    } catch (error) {
      addLog('EVENT', '통신 오류', '용병 고용 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startTraining = (training: any) => {
    if (gameState.resources.budget < training.cost) {
      addLog('INFO', '예산 부족', '훈련 비용이 부족합니다.');
      return;
    }
    setGameState(prev => ({
      ...prev,
      resources: { ...prev.resources, budget: prev.resources.budget - training.cost },
      activeTraining: {
        id: training.id,
        name: training.name,
        durationMs: training.durationMs,
        startTime: Date.now(),
        baseXp: training.baseXp,
        cost: training.cost
      }
    }));
    setShowTrainingMenu(false);
    addLog('INFO', '훈련 시작', `${training.name}이(가) 시작되었습니다. (비용: ${training.cost.toLocaleString()}원)`);
  };

  useEffect(() => {
    checkPromotions(gameState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.xp, gameState.subordinates]);

  const handleProduce = (item: any) => {
    if (gameState.resources.budget >= item.cost) {
      setGameState(prev => {
        const existingItem = prev.equipment.find(e => e.id === item.id);
        let newEquipment = [...prev.equipment];
        if (existingItem) {
          newEquipment = newEquipment.map(e => e.id === item.id ? { ...e, count: e.count + 1 } : e);
        } else {
          newEquipment.push({ id: item.id, name: item.name, count: 1, type: item.type });
        }
        return {
          ...prev,
          resources: { ...prev.resources, budget: prev.resources.budget - item.cost },
          equipment: newEquipment
        };
      });
      addLog('PRODUCTION', '생산 완료', `${item.name} 배치가 완료되었습니다.`);
    } else {
      addLog('INFO', '예산 부족', `${item.name} 생산을 위한 예산이 부족합니다.`);
    }
  };

  const getBranchIcon = () => {
    switch (gameState.branch) {
      case Branch.ARMY: return <Shield className="w-6 h-6 text-green-400" />;
      case Branch.NAVY: return <Anchor className="w-6 h-6 text-blue-400" />;
      case Branch.AIR_FORCE: return <Plane className="w-6 h-6 text-sky-400" />;
      default: return null;
    }
  };

  // Role Selection Overlay for Major (12) and Brigadier General (15)
  if ((gameState.rankIndex === 12 || gameState.rankIndex === 15) && !gameState.currentRole) {
    const isMajor = gameState.rankIndex === 12;
    return (
      <div className="flex flex-col items-center justify-center h-full bg-military-dark text-gray-200 p-8 z-50 absolute inset-0">
        <div className="max-w-2xl w-full bg-military-panel p-8 rounded-lg shadow-2xl border border-yellow-600">
          <h1 className="text-3xl font-bold text-center mb-4 text-military-accent">
            {isMajor ? '소령 진급: 보직 선택' : '준장 진급: 보직 선택'}
          </h1>
          <p className="text-center text-gray-300 mb-8">
            지휘관님, {isMajor ? '소령' : '준장'}으로 진급하셨습니다. 앞으로의 군 생활을 결정할 보직을 선택하십시오.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => {
                const role = isMajor ? 'MAJOR_OPS' : 'BG_STAFF';
                setGameState(prev => ({ ...prev, currentRole: role }));
                updateOrganization(gameState.rankIndex, role);
              }}
              className="flex flex-col items-center p-6 bg-gray-800 border border-blue-500 rounded hover:bg-blue-900 transition-colors"
            >
              <HeartHandshake className="w-12 h-12 text-blue-400 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                {isMajor ? '작전참모 (Operations Officer)' : '작전참모장 (Chief of Staff)'}
              </h2>
              <p className="text-sm text-gray-400 text-center">
                {isMajor ? '대민 지원 및 천재지변 복구를 지휘하여 막대한 국방 예산을 확보합니다.' : '대민 지원 및 동맹군 파병 등 전략적 지원 작전을 총괄합니다.'}
              </p>
            </button>
            
            <button
              onClick={() => {
                const role = isMajor ? 'MAJOR_CMD' : 'BG_CMD';
                setGameState(prev => ({ ...prev, currentRole: role }));
                updateOrganization(gameState.rankIndex, role);
              }}
              className="flex flex-col items-center p-6 bg-gray-800 border border-red-500 rounded hover:bg-red-900 transition-colors"
            >
              <Crosshair className="w-12 h-12 text-red-400 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                {isMajor ? '중대 통솔 (2 Companies)' : '전투 준장 (여단장)'}
              </h2>
              <p className="text-sm text-gray-400 text-center">
                {isMajor ? '2개의 중대를 직접 이끌고 고강도 파병 작전에 투입되어 명성과 예산을 획득합니다.' : '4명의 연대장(대령)을 거느리고 대규모 전투 파병에 나섭니다.'}
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextRankXp = gameState.rankIndex < RANKS.length - 1 ? XP_REQUIREMENTS[gameState.rankIndex + 1] : gameState.xp;
  const xpProgress = Math.min(100, (gameState.xp / nextRankXp) * 100);

  const availableEquipment = gameState.branch ? EQUIPMENT_CATALOG[gameState.branch] : [];
  const availableTraining = gameState.branch ? TRAINING_CATALOG[gameState.branch].filter(t => gameState.rankIndex >= t.minRank) : [];
  const availableZones = COMBAT_ZONES.filter(z => gameState.rankIndex >= z.minRank);
  const canProduce = gameState.rankIndex >= PRODUCTION_UNLOCK_RANK_INDEX;
  const recruitMultiplier = Math.max(1, gameState.rankIndex - 8);
  const isStaffRole = gameState.currentRole === 'MAJOR_OPS' || gameState.currentRole === 'BG_STAFF';

  const maxTroops = getTargetTroops(gameState.rankIndex, gameState.currentRole);
  const isAtMaxTroops = gameState.forces.regularTroops >= maxTroops;
  const canDoMission = gameState.forces.regularTroops > 0 || gameState.forces.specialForces > 0;

  let trainingProgress = 0;
  if (gameState.activeTraining) {
    const elapsed = Date.now() - gameState.activeTraining.startTime;
    trainingProgress = Math.min(100, (elapsed / gameState.activeTraining.durationMs) * 100);
  }

  const earnedBadges = Object.entries(gameState.trainingCounts || {}).map(([trainingId, count]) => {
    const badgeDef = BADGE_REQUIREMENTS[trainingId];
    if (badgeDef && count >= badgeDef.threshold) {
      return badgeDef;
    }
    return null;
  }).filter(Boolean) as { id: string, name: string, icon: string, threshold: number }[];

  const opBadgesCount = Math.floor((gameState.missionWins || 0) / 10);

  const closeAllMenus = () => {
    setShowTrainingMenu(false);
    setShowMissionMenu(false);
    setShowRecruitMenu(false);
    setShowCivilMenu(false);
    setShowRDMenu(false);
    setShowSpecialMenu(false);
    setShowMercenaryMenu(false);
    setShowMapMenu(false);
  };

  return (
    <div className="flex h-full bg-military-dark text-gray-300 font-mono">
      
      {/* Left Sidebar - Commander & Subordinates */}
      <div className="w-96 bg-military-panel border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getBranchIcon()}
              <div>
                <h2 className="text-xl font-bold text-white">{gameState.playerName}</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-military-accent font-semibold">
                    <span className="text-yellow-500 mr-1">{getRankIcon(gameState.rankIndex)}</span>
                    {RANKS[gameState.rankIndex]} {getPlayerRoleName(gameState.rankIndex, gameState.currentRole)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: opBadgesCount }).map((_, i) => (
                      <span key={`op_${i}`} title="작전성공 휘장 (10회 승리)" className="text-sm">🎖️</span>
                    ))}
                    {earnedBadges.map(b => (
                      <span key={b.id} title={`${b.name} 휘장`} className="text-xs bg-gray-800 px-1.5 py-0.5 rounded border border-yellow-600 text-yellow-500 flex items-center gap-1 cursor-help">
                        <span>{b.icon}</span>
                        <span className="hidden md:inline">{b.name}</span>
                      </span>
                    ))}
                  </div>
                  {gameState.medals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {gameState.medals.map(mId => {
                        const mDef = MEDALS.find(m => m.id === mId);
                        return mDef ? <span key={mId} title={mDef.name} className="text-lg cursor-help">{mDef.icon}</span> : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>경험치 (XP)</span>
              <span>{gameState.xp} / {nextRankXp}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-military-accent h-2 rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wider">지휘관 능력치</h3>
          <div className="space-y-4">
            <StatRow icon={<Zap className="w-4 h-4 text-yellow-400"/>} label="지력 (INT)" value={gameState.stats.intelligence} />
            <StatRow icon={<TrendingUp className="w-4 h-4 text-red-400"/>} label="체력 (STA)" value={gameState.stats.stamina} />
            <StatRow icon={<Star className="w-4 h-4 text-purple-400"/>} label="매력 (CHA)" value={gameState.stats.charisma} />
            <StatRow icon={<Users className="w-4 h-4 text-blue-400"/>} label="명성 (REP)" value={gameState.stats.reputation} />
          </div>

          <h3 className="text-sm text-gray-400 mt-8 mb-4 uppercase tracking-wider">지휘부 조직도</h3>
          <div className="bg-gray-800 p-3 rounded border border-gray-700 max-h-[500px] overflow-y-auto">
            <SubordinateTree subordinates={gameState.subordinates} />
          </div>

          {gameState.specialUnits && gameState.specialUnits.length > 0 && (
            <div className="mt-4 bg-gray-800 p-4 rounded border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wider">특수부대 편성</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {gameState.specialUnits.map(unit => (
                  <div key={unit.id} className="flex flex-col text-sm bg-gray-900 px-3 py-2 rounded border border-gray-600">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-200 font-bold">
                        [{unit.type}] <span className="text-yellow-500">{getRankIcon(unit.rankIndex)}</span> {RANKS[unit.rankIndex]} {unit.name}
                      </span>
                      <span className="text-red-400 font-bold">전투력: {unit.combatPower}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState.mercenaries && gameState.mercenaries.length > 0 && (
            <div className="mt-4 bg-gray-800 p-4 rounded border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wider">계약된 용병 부대</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {gameState.mercenaries.map(merc => (
                  <div key={merc.id} className="flex flex-col text-sm bg-gray-900 px-3 py-2 rounded border border-gray-600">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-200 font-bold">{merc.name} ({merc.size})</span>
                      <span className="text-red-400 font-bold">전투력: {merc.combatPower}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>병력: {merc.troops}명</span>
                      <span className="text-yellow-400">남은 횟수: {merc.remainingUses}회</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState.equipment.length > 0 && (
            <div className="mt-4 bg-gray-800 p-4 rounded border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wider">보유 군수 물자</h3>
              <div className="space-y-2">
                {gameState.equipment.map(eq => (
                  <div key={eq.id} className="flex justify-between text-sm bg-gray-900 px-3 py-2 rounded border border-gray-600">
                    <span className="text-gray-200">{eq.name}</span>
                    <span className="text-military-accent font-bold">{eq.count} 대</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-sm text-gray-400 mt-8 mb-4 uppercase tracking-wider">부대 현황 (병과별)</h3>
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <div className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-2">
              {getUnitName(gameState.forces.regularTroops)} <span className="text-sm font-normal text-green-400 ml-2">총 {gameState.forces.regularTroops.toLocaleString()}명</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(gameState.forces.mosBreakdown).map(([mos, count]) => (
                <div key={mos} className="flex justify-between text-sm">
                  <span className="text-gray-400">{mos}:</span>
                  <span className="text-gray-200">{count.toLocaleString()} 명</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm mt-3 pt-2 border-t border-gray-600">
              <span className="text-gray-400">특수부대:</span>
              <span className="text-blue-400 font-bold">{gameState.forces.specialForces.toLocaleString()} 명</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">사상자:</span>
              <span className="text-red-400">{gameState.forces.casualties.toLocaleString()} 명</span>
            </div>
          </div>

          <h3 className="text-sm text-gray-400 mt-8 mb-4 uppercase tracking-wider">국방 예산</h3>
          <div className="bg-gray-800 p-4 rounded border border-gray-700 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">보유 예산:</span>
              <span className="text-yellow-400 font-bold">{gameState.resources.budget.toLocaleString()} 원</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-military-dark relative">
        
        {/* Action Panel */}
        <div className="p-6 border-b border-gray-700 bg-gray-900">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-military-accent" /> 작전 통제실 (Operations)
          </h2>
          
          {gameState.activeTraining ? (
            <div className="bg-gray-800 border border-blue-500 p-6 rounded-lg text-center">
              <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 animate-pulse" /> 훈련 진행 중: {gameState.activeTraining.name}
              </h3>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div className="bg-blue-500 h-4 rounded-full transition-all duration-200 ease-linear" style={{ width: `${trainingProgress}%` }}></div>
              </div>
            </div>
          ) : showTrainingMenu ? (
            <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">훈련 계획 수립</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm">취소</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableTraining.map(t => {
                  const count = gameState.trainingCounts[t.id] || 0;
                  const badgeDef = BADGE_REQUIREMENTS[t.id];
                  const hasBadge = badgeDef && count >= badgeDef.threshold;
                  
                  return (
                    <button
                      key={t.id}
                      onClick={() => startTraining(t)}
                      disabled={gameState.resources.budget < t.cost}
                      className="p-3 bg-gray-700 hover:bg-blue-600 rounded border border-gray-600 text-left transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-bold text-sm text-white mb-1 pr-6">{t.name}</div>
                      <div className="text-xs text-yellow-400 mt-1">비용: {t.cost.toLocaleString()} 원</div>
                      <div className="text-xs text-blue-400">예상 획득 XP: ~{t.baseXp}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        수료 횟수: {count}회 {hasBadge && <span className="text-yellow-500 ml-1">{badgeDef.icon}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : showMissionMenu ? (
            <div className="bg-gray-800 border border-red-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><Globe className="w-5 h-5"/> 파병 작전 지역 선택</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm">취소</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label className="flex items-center gap-2 text-yellow-400 font-bold bg-gray-900 p-3 rounded border border-yellow-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useSpecialForces} 
                    onChange={e => setUseSpecialForces(e.target.checked)} 
                    disabled={gameState.forces.specialForces === 0} 
                    className="w-4 h-4"
                  />
                  특수부대 투입 (가용: {gameState.forces.specialForces}명)
                </label>

                <div className="bg-gray-900 p-3 rounded border border-gray-600">
                  <label className="block text-xs text-gray-400 mb-1">용병 부대 지원 (선택)</label>
                  <select
                    value={selectedMercenaryId}
                    onChange={(e) => setSelectedMercenaryId(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded p-1.5 text-sm"
                  >
                    <option value="">지원 없음</option>
                    {gameState.mercenaries.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.size}) - 전투력: {m.combatPower} (남은 횟수: {m.remainingUses})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {availableZones.map(zone => {
                  const totalRdLevel = Object.values(gameState.rdLevels).reduce((a, b) => a + b, 0);
                  const rdBonus = totalRdLevel * 2;
                  const specialPower = gameState.specialUnits.reduce((acc, u) => acc + u.combatPower, 0);
                  const specialBonus = useSpecialForces ? Math.min(80, Math.floor(specialPower / 20)) : 0;

                  const activeMercenary = gameState.mercenaries.find(m => m.id === selectedMercenaryId);
                  const mercenaryBonus = activeMercenary ? Math.min(50, Math.floor(activeMercenary.combatPower / 300)) : 0;

                  const ratio = useSpecialForces 
                    ? (gameState.forces.specialForces * 50) / zone.enemyTroops 
                    : (gameState.forces.regularTroops + (activeMercenary ? activeMercenary.troops * 10 : 0)) / zone.enemyTroops;
                  
                  let baseWinProb = 10;
                  if (ratio >= 1.5) baseWinProb = 80;
                  else if (ratio >= 1.0) baseWinProb = 60;
                  else if (ratio >= 0.5) baseWinProb = 30;

                  const finalWinProb = Math.min(99, baseWinProb + rdBonus + specialBonus + mercenaryBonus);
                  const probColor = finalWinProb >= 70 ? 'text-green-400' : finalWinProb >= 40 ? 'text-yellow-400' : 'text-red-500';

                  return (
                    <button
                      key={zone.id}
                      onClick={() => handleMission(zone)}
                      disabled={useSpecialForces ? gameState.forces.specialForces === 0 : gameState.forces.regularTroops === 0}
                      className="p-4 bg-gray-700 hover:bg-red-900 rounded border border-gray-600 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white">{zone.name}</span>
                        <span className="text-xs text-red-400 font-bold">Level {zone.level}</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{zone.desc}</div>
                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-600">
                        <div className="text-xs">
                          <div className="text-gray-300">적 병력: {zone.enemyTroops.toLocaleString()}명 ({zone.enemyUnit})</div>
                          <div className="text-gray-300">투입 병력: {useSpecialForces ? gameState.forces.specialForces.toLocaleString() + '명 (특수)' : gameState.forces.regularTroops.toLocaleString() + '명'}{activeMercenary ? ` + ${activeMercenary.troops}명 (용병)` : ''}</div>
                          <div className={`font-bold mt-1 ${probColor}`}>예상 승률: {finalWinProb}%</div>
                        </div>
                        <div className="text-xs text-yellow-400 font-bold">보상: {zone.reward.toLocaleString()} 원</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : showCivilMenu ? (
            <div className="bg-gray-800 border border-blue-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><HeartHandshake className="w-5 h-5"/> 대민 지원 및 복구 작전</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm">취소</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CIVIL_SUPPORT_MISSIONS.map(mission => (
                  <button
                    key={mission.id}
                    onClick={() => handleCivilSupport(mission)}
                    className="p-4 bg-gray-700 hover:bg-blue-900 rounded border border-gray-600 text-left transition-colors"
                  >
                    <div className="font-bold text-white mb-1">{mission.name}</div>
                    <div className="text-xs text-gray-400 mb-2">{mission.desc}</div>
                    <div className="text-xs text-yellow-400 font-bold">예산 확보: {mission.reward.toLocaleString()} 원</div>
                  </button>
                ))}
              </div>
            </div>
          ) : showRecruitMenu ? (
            <div className="bg-gray-800 border border-green-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2"><PlusCircle className="w-5 h-5"/> 병과별 특기병 모병 (x{recruitMultiplier} 배율)</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm">취소</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MOS_LIST.map(mos => {
                  const totalCost = mos.cost * recruitMultiplier;
                  const totalCount = mos.baseCount * recruitMultiplier;
                  return (
                    <button
                      key={mos.id}
                      onClick={() => handleRecruit(mos)}
                      disabled={gameState.resources.budget < totalCost || isAtMaxTroops}
                      className="p-3 bg-gray-700 hover:bg-green-800 rounded border border-gray-600 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-bold text-sm text-white mb-1">{mos.name} ({totalCount}명)</div>
                      <div className="text-xs text-yellow-400">비용: {totalCost.toLocaleString()} 원</div>
                      {isAtMaxTroops && <div className="text-xs text-red-400 mt-1">병력 최대치 도달</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : showRDMenu ? (
            <div className="bg-gray-800 border border-purple-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><Rocket className="w-5 h-5"/> 군사시설 R&D 투자</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm">취소</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {RD_PROJECTS.map(rd => {
                  const level = gameState.rdLevels[rd.id] || 0;
                  const cost = rd.baseCost * (level + 1);
                  return (
                    <button
                      key={rd.id}
                      onClick={() => handleRD(rd, cost)}
                      disabled={gameState.resources.budget < cost}
                      className="p-4 bg-gray-700 hover:bg-purple-900 rounded border border-gray-600 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white">{rd.name}</span>
                        <span className="text-xs text-purple-400 font-bold">Lv.{level}</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{rd.desc}</div>
                      <div className="text-xs text-yellow-400 font-bold">투자 비용: {cost.toLocaleString()} 원</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : showSpecialMenu ? (
            <div className="bg-gray-800 border border-orange-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> 특수부대 창설 및 인재 영입</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm">취소</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {gameState.specialApplicants.map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleRecruitSpecial(app)}
                    disabled={gameState.resources.budget < app.cost}
                    className="p-4 bg-gray-700 hover:bg-orange-900 rounded border border-gray-600 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">
                        <span className="text-yellow-500">{getRankIcon(app.rankIndex)}</span> {RANKS[app.rankIndex]} {app.name}
                      </span>
                      <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded">{app.type}</span>
                    </div>
                    <div className="text-xs text-gray-300 mb-1">지력: {app.stats.intelligence} | 체력: {app.stats.stamina} | 매력: {app.stats.charisma}</div>
                    <div className="text-xs text-red-400 font-bold mb-2">전투력: {app.combatPower}</div>
                    <div className="text-xs text-yellow-400 font-bold">창설 비용: {app.cost.toLocaleString()} 원</div>
                  </button>
                ))}
              </div>
            </div>
          ) : showMercenaryMenu ? (
            <div className="bg-gray-800 border border-teal-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2"><Briefcase className="w-5 h-5"/> 민간용병(PMC) 고용</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm">취소</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gameState.availableMercenaries.map(merc => (
                  <button
                    key={merc.id}
                    onClick={() => handleHireMercenary(merc)}
                    disabled={gameState.resources.budget < merc.cost}
                    className="p-4 bg-gray-700 hover:bg-teal-900 rounded border border-gray-600 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{merc.name}</span>
                      <span className="text-xs bg-teal-600 text-white px-1.5 py-0.5 rounded">{merc.size}</span>
                    </div>
                    <div className="text-xs text-gray-300 mb-1">병력: {merc.troops}명 | 계약 횟수: {merc.remainingUses}회</div>
                    <div className="text-xs text-red-400 font-bold mb-2">전투력: {merc.combatPower}</div>
                    <div className="text-xs text-yellow-400 font-bold">고용 비용: {merc.cost.toLocaleString()} 원</div>
                  </button>
                ))}
              </div>
            </div>
          ) : showMapMenu ? (
            <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg flex flex-col h-[600px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><MapIcon className="w-5 h-5"/> 전투 작전 지도 (대한민국)</h3>
                <button onClick={closeAllMenus} className="text-gray-400 hover:text-white text-sm"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="relative flex-1 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
                   style={{ backgroundImage: 'linear-gradient(#2d3748 1px, transparent 1px), linear-gradient(90deg, #2d3748 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                
                {/* Simplified Korea Map SVG Outline */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 30 20 L 60 10 L 70 30 L 80 60 L 75 80 L 50 85 L 30 85 L 25 60 L 30 40 Z" fill="#4a5568" stroke="#718096" strokeWidth="0.5" />
                  <circle cx="25" cy="95" r="3" fill="#4a5568" stroke="#718096" strokeWidth="0.5" />
                </svg>

                {/* Player HQ Marker */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                  style={{ left: '45%', top: '45%' }}
                  onClick={() => setSelectedMapBase({
                    id: 'hq', name: '플레이어 지휘소', type: getPlayerRoleName(gameState.rankIndex, gameState.currentRole) as any,
                    x: 45, y: 45, troops: gameState.forces.regularTroops, commander: gameState.playerName, status: '대기'
                  })}
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-blue-300 bg-gray-900 px-1 rounded">지휘소</div>
                </div>

                {/* NPC Bases Markers */}
                {KOREA_MAP_BASES.map(base => (
                  <div 
                    key={base.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `${base.x}%`, top: `${base.y}%` }}
                    onClick={() => setSelectedMapBase(base)}
                  >
                    <div className={`w-3 h-3 rounded-sm border border-gray-900 ${base.type === '군단' ? 'bg-red-500 rotate-45' : base.type === '사단' ? 'bg-orange-500' : base.type === '여단' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[9px] text-gray-400">{base.name}</div>
                  </div>
                ))}

                {/* Selected Base Info Panel */}
                {selectedMapBase && (
                  <div className="absolute bottom-4 right-4 bg-gray-800 border border-gray-600 p-4 rounded shadow-lg w-64 z-20">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white text-sm">{selectedMapBase.name}</h4>
                      <button onClick={() => setSelectedMapBase(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="text-xs space-y-1 text-gray-300">
                      <p>분류: <span className="text-military-accent">{selectedMapBase.type}</span></p>
                      <p>지휘관: {selectedMapBase.commander}</p>
                      <p>병력: {selectedMapBase.troops.toLocaleString()}명</p>
                      <p>상태: <span className={selectedMapBase.status === '경계' ? 'text-yellow-400' : selectedMapBase.status === '작전중' ? 'text-red-400' : 'text-green-400'}>{selectedMapBase.status}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <ActionButton 
                onClick={() => setShowTrainingMenu(true)} 
                disabled={isProcessing}
                icon={<Zap className="w-5 h-5" />}
                label="훈련 (Train)"
                desc="부대 능력치 향상"
                color="bg-blue-600 hover:bg-blue-500"
              />
              
              {isStaffRole ? (
                <ActionButton 
                  onClick={() => setShowCivilMenu(true)} 
                  disabled={isProcessing || !canDoMission}
                  icon={<HeartHandshake className="w-5 h-5" />}
                  label="대민 지원 (Civil)"
                  desc={canDoMission ? "국방 예산 확보" : "병력 전멸 (지원 불가)"}
                  color={canDoMission ? "bg-indigo-600 hover:bg-indigo-500" : "bg-gray-600"}
                />
              ) : (
                <ActionButton 
                  onClick={() => setShowMissionMenu(true)} 
                  disabled={isProcessing || !canDoMission}
                  icon={<Crosshair className="w-5 h-5" />}
                  label="파병 작전 (Mission)"
                  desc={canDoMission ? "실전 경험 및 예산 획득" : "병력 전멸 (작전 불가)"}
                  color={canDoMission ? "bg-red-600 hover:bg-red-500" : "bg-gray-600"}
                />
              )}

              <ActionButton 
                onClick={() => setShowRecruitMenu(true)} 
                disabled={isProcessing}
                icon={<Users className="w-5 h-5" />}
                label="특기병 모병 (Recruit)"
                desc="병과별 병력 보충"
                color="bg-green-600 hover:bg-green-500"
              />

              <ActionButton 
                onClick={() => setShowRDMenu(true)} 
                disabled={isProcessing}
                icon={<Rocket className="w-5 h-5" />}
                label="군사시설 (R&D)"
                desc="무기 체계 연구 개발"
                color="bg-purple-600 hover:bg-purple-500"
              />

              <ActionButton 
                onClick={() => setShowSpecialMenu(true)} 
                disabled={isProcessing}
                icon={<ShieldAlert className="w-5 h-5" />}
                label="특수부대 (Special)"
                desc="정예 요원 영입 및 창설"
                color="bg-orange-600 hover:bg-orange-500"
              />

              <ActionButton 
                onClick={() => setShowMercenaryMenu(true)} 
                disabled={isProcessing}
                icon={<Briefcase className="w-5 h-5" />}
                label="용병 고용 (PMC)"
                desc="민간군사기업 계약"
                color="bg-teal-600 hover:bg-teal-500"
              />

              <ActionButton 
                onClick={() => setShowMapMenu(true)} 
                disabled={isProcessing}
                icon={<MapIcon className="w-5 h-5" />}
                label="작전 지도 (Map)"
                desc="전국 군부대 거점 확인"
                color="bg-gray-600 hover:bg-gray-500"
              />
            </div>
          )}
        </div>

        {/* Production Panel (Conditional) */}
        {canProduce && !gameState.activeTraining && !showMissionMenu && !showRecruitMenu && !showTrainingMenu && !showCivilMenu && !showRDMenu && !showSpecialMenu && !showMercenaryMenu && !showMapMenu && (
          <div className="p-6 border-b border-gray-700 bg-gray-800">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Hammer className="w-5 h-5 text-military-accent" /> 군수 공장 (Production)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {availableEquipment.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleProduce(item)}
                  disabled={gameState.resources.budget < item.cost || isProcessing}
                  className="flex flex-col items-center p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-sm font-bold text-gray-200 mb-1">{item.name}</span>
                  <span className="text-xs text-yellow-400">{item.cost.toLocaleString()} 원</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Event Log */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-military-accent" /> 상황 일지 (Event Log)
          </h2>
          <div className="flex-1 overflow-y-auto bg-black/50 rounded border border-gray-700 p-4 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className={`p-3 rounded border-l-4 ${getLogColor(log.type)} bg-gray-800/80`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-gray-200">[{log.title}]</span>
                  <span className="text-xs text-gray-500">Turn {log.turn}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{log.message}</p>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

const StatRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-gray-300">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <span className="font-bold text-white">{value}</span>
  </div>
);

const ActionButton = ({ onClick, disabled, icon, label, desc, color }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-start p-4 rounded text-white transition-all ${color} disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    <div className="flex items-center gap-2 mb-2 font-bold">
      {icon} {label}
    </div>
    <span className="text-xs text-gray-200 opacity-80">{desc}</span>
  </button>
);

const getLogColor = (type: LogEntry['type']) => {
  switch (type) {
    case 'COMBAT': return 'border-red-500';
    case 'EVENT': return 'border-yellow-500';
    case 'PROMOTION': return 'border-purple-500';
    case 'PRODUCTION': return 'border-blue-500';
    case 'TRAINING': return 'border-green-500';
    case 'CIVIL': return 'border-indigo-500';
    case 'RND': return 'border-purple-500';
    default: return 'border-gray-500';
  }
};
