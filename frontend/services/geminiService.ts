import { GoogleGenAI, Type } from '@google/genai';
import { GameState, ActionOutcome } from '../types.ts';
import { RANKS, getUnitName, MEDALS } from '../constants.ts';

const apiKey = (window as any).process?.env?.API_KEY || 'MOCK_KEY_FOR_UI_TESTING';
const ai = new GoogleGenAI({ apiKey: apiKey, vertexai: true });

const outcomeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Short title of the event" },
    description: { type: Type.STRING, description: "Detailed narrative description of what happened, mentioning subordinates if applicable." },
    statChanges: {
      type: Type.OBJECT,
      properties: {
        xp: { type: Type.INTEGER },
        intelligence: { type: Type.INTEGER },
        stamina: { type: Type.INTEGER },
        charisma: { type: Type.INTEGER },
        reputation: { type: Type.INTEGER },
        budget: { type: Type.INTEGER },
        troopsLost: { type: Type.INTEGER },
        specialTroopsLost: { type: Type.INTEGER },
        troopsGained: { type: Type.INTEGER },
        specialTroopsGained: { type: Type.INTEGER },
        mosGained: {
          type: Type.OBJECT,
          properties: {
            mos: { type: Type.STRING },
            count: { type: Type.INTEGER }
          }
        },
        rdGained: { type: Type.STRING },
        specialUnitGained: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            rankIndex: { type: Type.INTEGER },
            type: { type: Type.STRING },
            combatPower: { type: Type.INTEGER },
            cost: { type: Type.INTEGER }
          }
        },
        mercenaryGained: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            size: { type: Type.STRING },
            troops: { type: Type.INTEGER },
            combatPower: { type: Type.INTEGER },
            cost: { type: Type.INTEGER },
            remainingUses: { type: Type.INTEGER }
          }
        }
      }
    },
    subordinateStatChanges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          xp: { type: Type.INTEGER }
        }
      },
      description: "XP gained by participating subordinates"
    },
    missionSuccess: { type: Type.BOOLEAN, description: "True if the mission was successful" },
    awardedMedal: { type: Type.STRING, description: "ID of the medal awarded, if any (e.g., 'm_taegeuk')" },
    isCriticalEvent: { type: Type.BOOLEAN, description: "True if this was a major combat event" }
  },
  required: ["title", "description", "statChanges"]
};

const generatePromptContext = (state: GameState) => {
  const subsContext = state.subordinates.map(sub => `- ${sub.role}: ${RANKS[sub.rankIndex]} ${sub.name}`).join('\n');
  const mosContext = Object.entries(state.forces.mosBreakdown).map(([mos, count]) => `${mos}: ${count}명`).join(', ');
  return `
Current Status:
- Commander: ${state.playerName}
- Branch: ${state.branch}
- Rank: ${RANKS[state.rankIndex]}
- Command Size: ${getUnitName(state.forces.regularTroops)} (${state.forces.regularTroops} troops)
- Special Forces: ${state.forces.specialForces} troops
- MOS Breakdown: ${mosContext}
- Stats: INT ${state.stats.intelligence}, STA ${state.stats.stamina}, CHA ${state.stats.charisma}, REP ${state.stats.reputation}

Subordinates (NPCs):
${subsContext}
`;
};

export const performAction = async (
  state: GameState, 
  actionType: 'TRAIN_COMPLETE' | 'MISSION' | 'RECRUIT' | 'RANDOM_EVENT' | 'CIVIL_SUPPORT' | 'R_AND_D' | 'RECRUIT_SPECIAL' | 'HIRE_MERCENARY',
  extraData?: any
): Promise<ActionOutcome> => {
  
  if (apiKey === 'MOCK_KEY_FOR_UI_TESTING') {
    return mockPerformAction(state, actionType, extraData);
  }

  let prompt = generatePromptContext(state);

  switch (actionType) {
    case 'TRAIN_COMPLETE':
      prompt += `\nAction: The unit just completed a rigorous training exercise: [${extraData.name}]. Describe the training process, how the subordinates performed, and the outcome. The training should grant approximately ${extraData.baseXp} XP to the commander and subordinates.`;
      break;
    case 'MISSION':
      const isSuccess = Math.random() * 100 < extraData.winProb;
      const usedSpecial = extraData.useSpecialForces;
      const usedMercenary = extraData.mercenary;
      prompt += `\nAction: The commander deployed troops to a real-world combat zone: [${extraData.name} (Level ${extraData.level})]. 
      Enemy Troops: ${extraData.enemyTroops} (${extraData.enemyUnit}). 
      Player Troops Deployed: ${usedSpecial ? state.forces.specialForces + ' Special Forces' : state.forces.regularTroops + ' Regular Troops'}${usedMercenary ? ` + ${usedMercenary.troops} Mercenaries (${usedMercenary.name})` : ''}.
      Win Probability was ${extraData.winProb}%. 
      The mission MUST be a ${isSuccess ? 'SUCCESS' : 'FAILURE'}. 
      Describe the intense combat experience. Mention the subordinates' actions. 
      If SUCCESS, grant massive XP, reputation, and ${extraData.reward} Won. Set missionSuccess to true.
      If FAILURE, cause high troop loss, low XP, and 0 Won. Set missionSuccess to false.
      If it was a very difficult success, you may award a medal ID from this list: ${MEDALS.map(m => m.id).join(', ')}.`;
      break;
    case 'CIVIL_SUPPORT':
      prompt += `\nAction: The Operations Officer (작전참모) deployed troops for civil support: [${extraData.name}]. Describe the disaster recovery or support efforts. Increases reputation and grants ${extraData.reward} Won in defense budget.`;
      break;
    case 'RECRUIT':
      prompt += `\nAction: A targeted recruitment drive was held for a specific MOS (병과): [${extraData.name}]. Describe the influx of ${extraData.count} new ${extraData.name} specialists. Costs ${extraData.cost} Won.`;
      break;
    case 'R_AND_D':
      prompt += `\nAction: The commander invested ${extraData.cost} Won into Military R&D: [${extraData.name}]. Describe the successful development and deployment of this new technology.`;
      break;
    case 'RECRUIT_SPECIAL':
      prompt += `\nAction: The commander recruited a highly skilled Special Forces applicant: [${extraData.name} (${extraData.type})]. Describe the rigorous selection process and the formation of a new elite 12-man squad. Costs ${extraData.cost} Won.`;
      break;
    case 'HIRE_MERCENARY':
      prompt += `\nAction: The commander hired a private military company (PMC): [${extraData.name} (${extraData.size})]. Describe the contract signing and the arrival of these elite mercenaries. Costs ${extraData.cost} Won.`;
      break;
    case 'RANDOM_EVENT':
      prompt += `\nAction: A sudden, unexpected military crisis occurred. Describe the tense situation, how the commander and subordinates reacted. High risk of troop loss, high reward.`;
      break;
  }

  try {
    const apiCall = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: outcomeSchema,
        maxOutputTokens: 250,
        systemInstruction: "You are a military simulation game engine. Generate realistic, dramatic, and concise military event outcomes in Korean. Return ONLY valid JSON matching the schema. Keep descriptions under 2 sentences for maximum speed."
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('API Timeout')), 2500)
    );

    const response = await Promise.race([apiCall, timeoutPromise]);
    
    const resultText = response.text.trim();
    return JSON.parse(resultText) as ActionOutcome;
  } catch (error) {
    console.warn("Gemini API Error or Timeout, falling back to fast mock:", error);
    return mockPerformAction(state, actionType, extraData);
  }
};

const mockPerformAction = (state: GameState, actionType: string, extraData?: any): ActionOutcome => {
  return new Promise(resolve => {
    setTimeout(() => {
      const subChanges = state.subordinates.map(sub => ({ id: sub.id, xp: Math.floor(Math.random() * 50) + 20 }));
      
      switch (actionType) {
        case 'TRAIN_COMPLETE':
          resolve({
            title: `${extraData.name} 완료`,
            description: `부대원들이 강도 높은 ${extraData.name}을(를) 무사히 마쳤습니다. 훈련장 사용료 및 물자 비용으로 ${extraData.cost.toLocaleString()}원이 소모되었습니다.`,
            statChanges: { xp: extraData.baseXp, stamina: 3, intelligence: 2 },
            subordinateStatChanges: subChanges.map(s => ({...s, xp: extraData.baseXp}))
          });
          break;
        case 'MISSION':
          const level = extraData.level || 1;
          const isSuccess = Math.random() * 100 < extraData.winProb;
          const usedSpecial = extraData.useSpecialForces;
          const usedMercenary = extraData.mercenary;
          
          let loss = 0;
          if (usedSpecial) {
            loss = isSuccess ? Math.floor(Math.random() * 3) : Math.floor(state.forces.specialForces * 0.5);
          } else {
            loss = isSuccess ? Math.floor(Math.random() * (level * 5)) + level : Math.floor(state.forces.regularTroops * 0.3);
          }
          
          let desc = `적 ${extraData.enemyUnit} 규모의 병력을 상대로 치열한 교전 끝에 승리했습니다.`;
          if (usedMercenary) {
            desc = `용병 부대 ${usedMercenary.name}의 압도적인 화력 지원 덕분에 ` + desc;
          }

          if (isSuccess) {
            const awardMedal = extraData.winProb < 50 && Math.random() > 0.5 ? MEDALS[Math.floor(Math.random() * MEDALS.length)].id : undefined;
            resolve({
              title: `${extraData.name} 작전 성공`,
              description: desc + ` 국방 예산 ${extraData.reward.toLocaleString()}원을 확보했습니다.`,
              statChanges: { 
                xp: 200 * level, 
                reputation: 10 * level, 
                troopsLost: usedSpecial ? 0 : loss, 
                specialTroopsLost: usedSpecial ? loss : 0,
                budget: extraData.reward 
              },
              subordinateStatChanges: subChanges.map(s => ({...s, xp: s.xp * level})),
              missionSuccess: true,
              awardedMedal: awardMedal
            });
          } else {
            resolve({
              title: `${extraData.name} 작전 실패`,
              description: `압도적인 적의 화력에 밀려 작전에 실패하고 퇴각했습니다. 막대한 병력 손실이 발생했습니다.`,
              statChanges: { 
                xp: 50 * level, 
                reputation: -5 * level, 
                troopsLost: usedSpecial ? 0 : loss, 
                specialTroopsLost: usedSpecial ? loss : 0,
                budget: 0 
              },
              subordinateStatChanges: subChanges.map(s => ({...s, xp: s.xp})),
              missionSuccess: false
            });
          }
          break;
        case 'CIVIL_SUPPORT':
          resolve({
            title: `대민 지원: ${extraData.name}`,
            description: `작전참모의 지휘 아래 ${extraData.name}을(를) 성공적으로 완수했습니다. 국민들의 지지와 함께 특별 예산 ${extraData.reward.toLocaleString()}원을 배정받았습니다.`,
            statChanges: { xp: 100, reputation: 20, budget: extraData.reward },
            subordinateStatChanges: subChanges
          });
          break;
        case 'RECRUIT':
          resolve({
            title: `특기병 모집: ${extraData.name}`,
            description: `새로운 ${extraData.name} 특기병 ${extraData.count}명이 부대에 전입하여 전력이 보강되었습니다.`,
            statChanges: { 
              budget: -extraData.cost,
              mosGained: { mos: extraData.name, count: extraData.count }
            }
          });
          break;
        case 'R_AND_D':
          resolve({
            title: `군사시설 R&D: ${extraData.name}`,
            description: `막대한 예산을 투입하여 ${extraData.name} 기술을 성공적으로 확보했습니다. 향후 작전 성공률이 상승합니다.`,
            statChanges: { budget: -extraData.cost, rdGained: extraData.id }
          });
          break;
        case 'RECRUIT_SPECIAL':
          resolve({
            title: `특수부대 창설: ${extraData.type}`,
            description: `최정예 요원 ${extraData.name}을(를) 중심으로 12명 규모의 ${extraData.type} 팀이 창설되었습니다.`,
            statChanges: { budget: -extraData.cost, specialTroopsGained: 12, specialUnitGained: extraData }
          });
          break;
        case 'HIRE_MERCENARY':
          resolve({
            title: `용병 계약: ${extraData.name}`,
            description: `막대한 예산을 들여 최정예 민간군사기업(PMC) ${extraData.name} ${extraData.size}와 계약을 체결했습니다. 총 ${extraData.remainingUses}회 작전에 투입 가능합니다.`,
            statChanges: { budget: -extraData.cost, mercenaryGained: extraData }
          });
          break;
        case 'RANDOM_EVENT':
          resolve({
            title: "돌발 교전 발생!",
            description: "경계 작전 중 우발적인 총격전이 발생했습니다. 신속한 지휘로 적을 격퇴했습니다.",
            statChanges: { xp: 300, reputation: 15, charisma: 3, troopsLost: Math.floor(Math.random() * 10) + 2 },
            subordinateStatChanges: subChanges,
            isCriticalEvent: true
          });
          break;
        default:
          resolve({
            title: "대기",
            description: "특이 사항 없음.",
            statChanges: {}
          });
      }
    }, 500);
  });
};
