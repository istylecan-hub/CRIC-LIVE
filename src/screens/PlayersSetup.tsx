import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Play } from 'lucide-react';
import { Player } from '../types';

export default function PlayersSetup() {
  const activeMatch = useAppStore(s => s.activeMatch);
  const updateMatch = useAppStore(s => s.updateMatch);
  
  if (!activeMatch) return null;

  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(Array(11).fill(''));
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(Array(11).fill(''));

  const validateTeamInfo = (players: string[], prefix: string) => {
    return players
      .map((name, i) => name.trim() ? name.trim() : `${prefix} Player ${i+1}`)
      .map(name => ({ id: uuidv4(), name }));
  };

  const handleStart = () => {
    const pA = validateTeamInfo(teamAPlayers, activeMatch.teamA.name);
    const pB = validateTeamInfo(teamBPlayers, activeMatch.teamB.name);
    
    // We update the active match with players.
    // The screen flow logic in App.tsx will navigate to 'Recording' because lack of openers will trigger an inline modal there.
    const updatedMatch = { ...activeMatch };
    updatedMatch.teamA.players = pA;
    updatedMatch.teamB.players = pB;
    updateMatch(updatedMatch);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center gap-4 p-6 border-b border-zinc-800 bg-zinc-950">
        <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-100">Players Roster</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex gap-8">
        
        {/* Team A */}
        <div className="flex-1 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-lg">
          <h3 className="text-xl font-black mb-6 text-orange-500 uppercase tracking-widest">{activeMatch.teamA.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamAPlayers.map((p, i) => (
              <input 
                key={i}
                type="text"
                value={p}
                placeholder={`Player ${i+1}`}
                min={2}
                onChange={e => {
                  const n = [...teamAPlayers];
                  n[i] = e.target.value;
                  setTeamAPlayers(n);
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 font-medium text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
              />
            ))}
          </div>
        </div>

        {/* Team B */}
        <div className="flex-1 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-lg">
          <h3 className="text-xl font-black mb-6 text-orange-500 uppercase tracking-widest">{activeMatch.teamB.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamBPlayers.map((p, i) => (
              <input 
                key={i}
                type="text"
                value={p}
                placeholder={`Player ${i+1}`}
                onChange={e => {
                  const n = [...teamBPlayers];
                  n[i] = e.target.value;
                  setTeamBPlayers(n);
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 font-medium text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
              />
            ))}
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end">
        <button 
          onClick={handleStart}
          className="flex items-center gap-2 bg-orange-600 px-8 py-3 rounded-full font-black tracking-widest hover:bg-orange-500 transition-colors shadow-[0_4px_20px_rgba(234,88,12,0.3)] active:scale-95 text-white"
        >
          <Play size={20} fill="currentColor"/> START MATCH
        </button>
      </div>

    </div>
  );
}
