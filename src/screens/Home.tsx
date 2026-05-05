import { useAppStore } from '../store';
import { Play, List, Trash2 } from 'lucide-react';
import { formatOvers } from '../core/scoreUtils';

export default function Home({ onNewMatch }: { onNewMatch: () => void }) {
  const savedMatches = useAppStore(s => s.savedMatches);
  const deleteMatch = useAppStore(s => s.deleteMatch);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black italic tracking-tight text-white">
          <span className="text-orange-500">CRIC</span> SCORE + REC
        </h1>
        <button
          onClick={onNewMatch}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-full font-bold text-white shadow-[0_4px_20px_rgba(234,88,12,0.3)] transition-colors active:scale-95"
        >
          <Play size={20} fill="currentColor" />
          START NEW MATCH
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-zinc-500 uppercase tracking-widest text-[10px]">
          <List size={14} />
          Saved Matches
        </h2>
        
        {savedMatches.length === 0 ? (
          <div className="text-zinc-500 text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
            No matches saved yet. Start scoring!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedMatches.map(m => (
              <div key={m.id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col items-start relative hover:border-zinc-700 transition-colors shadow-lg">
                <button 
                  className="absolute top-6 right-6 text-zinc-500 hover:text-red-500 transition-colors"
                  onClick={() => deleteMatch(m.id)}
                >
                  <Trash2 size={18} />
                </button>
                <div className="text-[10px] text-zinc-500 mb-3 font-mono uppercase tracking-widest">
                  {new Date(m.date).toLocaleDateString()}
                </div>
                <div className="font-black text-2xl mb-1 text-zinc-100">{m.teamA.name} <span className="text-zinc-600 text-sm italic mx-1">VS</span> {m.teamB.name}</div>
                <div className="text-xs text-zinc-400 mb-6 font-bold uppercase tracking-widest">{m.overs} Overs • {m.mode === 'full' ? 'Full Match' : 'Single Innings'}</div>
                {m.result ? (
                  <div className="bg-zinc-950 px-4 py-3 rounded-xl text-xs font-bold w-full text-center text-orange-500 border border-zinc-800 uppercase tracking-widest">
                    {m.result.isDraw ? 'Match Drawn' : `${m.result.winnerId === m.teamA.id ? m.teamA.name : m.teamB.name} won by ${m.result.margin} ${m.result.marginType}`}
                  </div>
                ) : (
                  <div className="bg-zinc-950 px-4 py-3 rounded-xl text-xs font-bold w-full text-center text-zinc-500 border border-zinc-800 uppercase tracking-widest">
                    Match Incomplete
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
