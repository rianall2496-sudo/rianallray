import React, { useState } from 'react';
import { Branch } from '../types.ts';
import { Shield, Anchor, Plane } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string, branch: Branch) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const handleStart = () => {
    if (name.trim() && selectedBranch) {
      onStart(name, selectedBranch);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-military-dark text-gray-200 p-8">
      <div className="max-w-md w-full bg-military-panel p-8 rounded-lg shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-bold text-center mb-2 text-military-accent tracking-wider">SUPREME COMMANDER</h1>
        <p className="text-center text-gray-400 mb-8">Path to Glory</p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">지휘관 성명 (Commander Name)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-military-accent"
            placeholder="홍길동"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-2 text-gray-300">병과 선택 (Select Branch)</label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedBranch(Branch.ARMY)}
              className={`flex flex-col items-center p-4 rounded border transition-colors ${
                selectedBranch === Branch.ARMY ? 'bg-military-army border-military-accent' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <Shield className="w-8 h-8 mb-2 text-green-400" />
              <span className="text-sm font-bold">육군</span>
            </button>
            <button
              onClick={() => setSelectedBranch(Branch.NAVY)}
              className={`flex flex-col items-center p-4 rounded border transition-colors ${
                selectedBranch === Branch.NAVY ? 'bg-military-navy border-military-accent' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <Anchor className="w-8 h-8 mb-2 text-blue-400" />
              <span className="text-sm font-bold">해군</span>
            </button>
            <button
              onClick={() => setSelectedBranch(Branch.AIR_FORCE)}
              className={`flex flex-col items-center p-4 rounded border transition-colors ${
                selectedBranch === Branch.AIR_FORCE ? 'bg-military-airforce border-military-accent' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <Plane className="w-8 h-8 mb-2 text-sky-400" />
              <span className="text-sm font-bold">공군</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!name.trim() || !selectedBranch}
          className="w-full bg-military-accent text-gray-900 font-bold py-3 rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          임무 시작 (START MISSION)
        </button>
      </div>
    </div>
  );
};
