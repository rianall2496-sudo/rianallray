export enum Branch {
  ARMY = '육군',
  NAVY = '해군',
  AIR_FORCE = '공군'
}

export interface Stats {
  intelligence: number; // 지력
  stamina: number;      // 체력
  charisma: number;     // 매력
  reputation: number;   // 명성
}

export interface Equipment {
  id: string;
  name: string;
  count: number;
  type: 'WEAPON' | 'VEHICLE' | 'AIRCRAFT' | 'SHIP';
}

export interface Subordinate {
  id: string;
  name: string;
  rankIndex: number;
  xp: number;
  role: string;
  troops: number;
  status: string;
  subordinates?: Subordinate[]; // Recursive organizational structure
}

export interface ActiveTraining {
  id: string;
  name: string;
  durationMs: number;
  startTime: number;
  baseXp: number;
  cost: number;
}

export interface SpecialApplicant {
  id: string;
  name: string;
  rankIndex: number;
  type: string;
  stats: Stats;
  combatPower: number;
  cost: number;
}

export interface MercenaryUnit {
  id: string;
  name: string;
  size: string; // '중대' | '대대'
  troops: number;
  combatPower: number;
  cost: number;
  remainingUses: number;
}

export interface MapBase {
  id: string;
  name: string;
  type: '군단' | '사단' | '여단' | '대대' | '중대' | '소대';
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  troops: number;
  commander: string;
  status: '경계' | '훈련중' | '작전중' | '대기';
}

export interface GameState {
  playerName: string;
  branch: Branch | null;
  rankIndex: number;
  xp: number;
  level: number;
  stats: Stats;
  resources: {
    budget: number;
    supplies: number;
  };
  forces: {
    regularTroops: number;
    specialForces: number;
    casualties: number;
    mosBreakdown: Record<string, number>; // 병과별 병력 수
  };
  equipment: Equipment[];
  subordinates: Subordinate[];
  activeTraining: ActiveTraining | null;
  trainingCounts: Record<string, number>;
  missionWins: number;
  medals: string[];
  rdLevels: Record<string, number>;
  specialApplicants: SpecialApplicant[];
  specialUnits: SpecialApplicant[]; // Recruited special forces teams
  availableMercenaries: MercenaryUnit[];
  mercenaries: MercenaryUnit[]; // Contracted mercenaries
  currentRole?: 'MAJOR_OPS' | 'MAJOR_CMD' | 'BG_STAFF' | 'BG_CMD'; // 소령/준장 보직
  turn: number;
}

export interface LogEntry {
  id: string;
  turn: number;
  type: 'INFO' | 'COMBAT' | 'EVENT' | 'PROMOTION' | 'PRODUCTION' | 'TRAINING' | 'CIVIL' | 'RND';
  title: string;
  message: string;
  timestamp: Date;
}

export interface ActionOutcome {
  title: string;
  description: string;
  statChanges: {
    xp?: number;
    intelligence?: number;
    stamina?: number;
    charisma?: number;
    reputation?: number;
    budget?: number;
    troopsLost?: number;
    specialTroopsLost?: number;
    troopsGained?: number;
    specialTroopsGained?: number;
    mosGained?: { mos: string; count: number };
    rdGained?: string; // ID of the R&D project upgraded
    specialUnitGained?: SpecialApplicant;
    mercenaryGained?: MercenaryUnit;
  };
  subordinateStatChanges?: {
    id: string;
    xp: number;
  }[];
  missionSuccess?: boolean;
  awardedMedal?: string;
  isCriticalEvent?: boolean;
}
