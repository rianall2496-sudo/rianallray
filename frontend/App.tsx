import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { GameState, Branch } from './types.ts';
import { STARTING_RANK_INDEX, generateCommandTree, generateSpecialApplicant, generateMercenary } from './constants.ts';

const initialGameState: GameState = {
  playerName: '',
  branch: null,
  rankIndex: STARTING_RANK_INDEX,
  xp: 0,
  level: 1,
  stats: {
    intelligence: 10,
    stamina: 10,
    charisma: 10,
    reputation: 0
  },
  resources: {
    budget: 500000000, // 5억 원
    supplies: 1000
  },
  forces: {
    regularTroops: 36, // 1 Platoon (3 Squads of 12)
    specialForces: 0,
    casualties: 0,
    mosBreakdown: {
      '소총수': 24,
      '의무병': 3,
      '통신병': 3,
      '공병': 3,
      '중화기병': 3
    }
  },
  equipment: [],
  subordinates: generateCommandTree(STARTING_RANK_INDEX),
  activeTraining: null,
  trainingCounts: {},
  missionWins: 0,
  medals: [],
  rdLevels: {},
  specialApplicants: [generateSpecialApplicant(), generateSpecialApplicant(), generateSpecialApplicant()],
  specialUnits: [],
  availableMercenaries: [generateMercenary(), generateMercenary()],
  mercenaries: [],
  turn: 1
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = (name: string, branch: Branch) => {
    setGameState(prev => ({
      ...prev,
      playerName: name,
      branch: branch
    }));
    setIsStarted(true);
  };

  return (
    <div className="h-full w-full">
      {!isStarted ? (
        <StartScreen onStart={handleStart} />
      ) : (
        <Dashboard gameState={gameState} setGameState={setGameState} />
      )}
    </div>
  );
}
