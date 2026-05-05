import { useState } from 'react';
import { useAppStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { MatchFormat, MatchMode } from '../types';

export default function MatchSetup({ onBack }: { onBack: () => void }) {
  const startMatch = useAppStore(s => s.startMatch);

  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [overs, setOvers] = useState<MatchFormat>(10);
  const [mode, setMode] = useState<MatchMode>('full');
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  const teamAId = 'team-a-' + uuidv4().slice(0, 8);
  const teamBId = 'team-b-' + uuidv4().slice(0, 8);

  const handleNext = () => {
    if (!teamAName.trim() || !teamBName.trim()) return;
    
    startMatch({
      teamA: { id: teamAId, name: teamAName.trim(), players: [] },
      teamB: { id: teamBId, name: teamBName.trim(), players: [] },
      overs,
      mode,
      toss: {
        winnerTeamId: tossWinner === 'A' ? teamAId : teamBId,
        choice: tossDecision
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center gap-4 p-6 border-b border-zinc-800 bg-zinc-950">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-100">Match Setup</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-3xl mx-auto w-full">
        
        {/* Teams */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">First Team Name</label>
            <input 
              type="text" 
              value={teamAName} 
              onChange={e => setTeamAName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg font-bold text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Second Team Name</label>
            <input 
              type="text" 
              value={teamBName} 
              onChange={e => setTeamBName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg font-bold text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Format */}
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Match Mode</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setMode('full')}
                className={`flex-1 py-3 px-4 border rounded-lg font-bold text-sm tracking-wide transition-colors ${mode === 'full' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
              >
                Full Match
              </button>
              <button 
                onClick={() => setMode('single')}
                className={`flex-1 py-3 px-4 border rounded-lg font-bold text-sm tracking-wide transition-colors ${mode === 'single' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
              >
                Single Innings
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Overs</label>
            <select 
              value={overs} 
              onChange={e => setOvers(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg font-bold text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors appearance-none"
            >
              <option value={5}>5 Overs</option>
              <option value={10}>10 Overs</option>
              <option value={15}>15 Overs</option>
              <option value={20}>20 Overs</option>
              <option value={50}>50 Overs</option>
            </select>
          </div>
        </div>

        {/* Toss */}
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-8">
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Toss Won By</label>
          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setTossWinner('A')}
              className={`flex-1 py-3 px-4 border rounded-lg font-bold text-lg transition-colors ${tossWinner === 'A' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
              {teamAName || 'Team A'}
            </button>
            <button 
              onClick={() => setTossWinner('B')}
              className={`flex-1 py-3 px-4 border rounded-lg font-bold text-lg transition-colors ${tossWinner === 'B' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
              {teamBName || 'Team B'}
            </button>
          </div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Decision</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setTossDecision('bat')}
              className={`flex-1 py-3 px-4 border rounded-lg font-bold text-sm tracking-wide transition-colors ${tossDecision === 'bat' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
              Batting
            </button>
            <button 
              onClick={() => setTossDecision('bowl')}
              className={`flex-1 py-3 px-4 border rounded-lg font-bold text-sm tracking-wide transition-colors ${tossDecision === 'bowl' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
              Bowling
            </button>
          </div>
        </div>

        <button 
          onClick={handleNext}
          className="w-full flex justify-center items-center gap-2 bg-zinc-100 text-[#0a0a0a] py-4 rounded-full font-black text-lg hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
        >
          NEXT: SELECT PLAYERS <ChevronRight size={20} className="stroke-[3]" />
        </button>
      </div>

    </div>
  );
}
