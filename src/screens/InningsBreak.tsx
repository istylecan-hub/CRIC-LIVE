import { useAppStore } from '../store';
import { createEmptyInnings } from '../store';
import { Play } from 'lucide-react';

export default function InningsBreak() {
  const activeMatch = useAppStore(s => s.activeMatch);
  const updateMatch = useAppStore(s => s.updateMatch);
  
  if (!activeMatch) return null;
  
  const currentInnings = activeMatch.innings[0]; // first innings
  const battingTeam = activeMatch.teamA.id === currentInnings.battingTeamId ? activeMatch.teamA : activeMatch.teamB;

  const handleStartSecondInnings = () => {
    const updated = { ...activeMatch };
    
    // Create second innings
    const nextBattingTeamId = currentInnings.bowlingTeamId;
    const nextBowlingTeamId = currentInnings.battingTeamId;
    
    updated.innings.push(createEmptyInnings(nextBattingTeamId, nextBowlingTeamId));
    updated.currentInningsIndex = 1;
    
    updateMatch(updated);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] items-center justify-center p-6 text-zinc-100">
      <div className="bg-zinc-900/50 p-10 rounded-3xl border border-zinc-800 max-w-lg w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h2 className="text-3xl font-black italic tracking-widest text-zinc-100 mb-2 uppercase">End of Innings</h2>
        <div className="h-1 w-20 bg-orange-600 mx-auto mb-10 rounded-full"></div>
        
        <div className="mb-10">
           <div className="text-zinc-500 font-bold tracking-widest text-[10px] uppercase mb-4">Target Set By {battingTeam.name}</div>
           <div className="text-8xl font-mono font-black text-white tracking-tighter">{currentInnings.totalRuns + 1}</div>
        </div>

        <button 
          onClick={handleStartSecondInnings}
          className="flex items-center justify-center gap-3 bg-white text-[#0a0a0a] w-full px-8 py-5 rounded-full font-black text-lg tracking-widest hover:bg-zinc-200 transition-colors shadow-[0_4px_20px_rgba(255,255,255,0.1)] active:scale-95"
        >
          <Play size={20} fill="currentColor"/> START 2ND INNINGS
        </button>
      </div>
    </div>
  );
}
