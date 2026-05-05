import { Innings, Player, Team } from '../types';
import { formatOvers } from '../core/scoreUtils';

interface Props {
  innings: Innings;
  battingTeam: Team;
  bowlingTeam: Team;
}

export default function ScoreboardPane({ innings, battingTeam, bowlingTeam }: Props) {
  const strikerId = innings.currentStrikerId;
  const nonStrikerId = innings.currentNonStrikerId;
  const bowlerId = innings.currentBowlerId;

  const striker = strikerId ? innings.batsmen[strikerId] || { name: battingTeam.players.find(p=>p.id===strikerId)?.name, runs: 0, balls: 0 } : null;
  const nonStriker = nonStrikerId ? innings.batsmen[nonStrikerId] || { name: battingTeam.players.find(p=>p.id===nonStrikerId)?.name, runs: 0, balls: 0 } : null;
  const bowler = bowlerId ? innings.bowlers[bowlerId] || { name: bowlingTeam.players.find(p=>p.id===bowlerId)?.name, runs: 0, wickets: 0, balls: 0} : null;

  // Last 6 balls
  const lastBalls = innings.balls.slice(-6).map((b, i) => {
    if (b.isWicket) return <span key={i} className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white">W</span>;
    if (b.isWide) return <span key={i} className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">{b.runsBase + 1}Wd</span>;
    if (b.isNoBall) return <span key={i} className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">{b.runsBase + 1}Nb</span>;
    if (b.runsBase === 4 || b.runsBase === 6) return <span key={i} className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white">{b.runsBase}</span>;
    if (b.runsBase === 0) return <span key={i} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">•</span>;
    return <span key={i} className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">{b.runsBase}</span>;
  });

  return (
    <div className="flex flex-col h-full p-6 bg-zinc-900/30 border-b border-zinc-800">
      {/* Top row: Total Score */}
      <div className="flex justify-between mb-4">
        <div className="flex flex-col">
           <div className="flex items-center gap-2 mb-1">
             {battingTeam.logoDataUrl && <img src={battingTeam.logoDataUrl} alt="logo" className="w-5 h-5 object-contain rounded-sm" />}
             <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: battingTeam.color || '#71717a' }}>{battingTeam.name}</span>
           </div>
           <span className="text-3xl font-mono text-zinc-200 font-bold tracking-tighter">
             {innings.totalRuns}<span className="text-lg text-zinc-500 font-normal ml-1">/ {innings.totalWickets}</span>
           </span>
        </div>
        <div className="text-right flex flex-col items-end">
           <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: bowlingTeam.color || '#71717a' }}>OVERS</span>
             {bowlingTeam.logoDataUrl && <img src={bowlingTeam.logoDataUrl} alt="logo" className="w-5 h-5 object-contain rounded-sm" />}
           </div>
           <span className="text-3xl font-black font-mono leading-none text-zinc-200">{formatOvers(innings.totalBalls)}</span>
        </div>
      </div>

      {/* Players info grid */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Batsmen */}
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
           {battingTeam.color && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: battingTeam.color }}></div>}
           {striker && (
             <div className="flex justify-between items-center mb-2 pl-2">
               <span className="text-xs font-bold flex items-center gap-1" style={{ color: battingTeam.color || '#fb923c' }}>
                 ▶ {striker.name}
               </span>
               <span className="text-sm font-mono text-zinc-200">{striker.runs}<span className="text-zinc-500 text-[10px] ml-1">({striker.balls})</span></span>
             </div>
           )}
           {nonStriker && (
             <div className="flex justify-between items-center opacity-60 pl-2">
               <span className="text-xs text-zinc-400 flex items-center ml-3">
                 {nonStriker.name}
               </span>
               <span className="text-sm font-mono text-zinc-400">{nonStriker.runs}<span className="text-zinc-500 text-[10px] ml-1">({nonStriker.balls})</span></span>
             </div>
           )}
        </div>

        {/* Bowler */}
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
            {bowlingTeam.color && <div className="absolute right-0 top-0 bottom-0 w-1" style={{ backgroundColor: bowlingTeam.color }}></div>}
            {bowler ? (
              <div className="flex justify-between items-center pr-2">
                <span className="text-xs font-bold flex items-center gap-1" style={{ color: bowlingTeam.color || '#fb923c' }}>
                  ▶ {bowler.name}
                </span>
                <span className="text-sm font-mono text-zinc-200">{bowler.wickets}-{bowler.runs} <span className="text-zinc-500 text-[10px] ml-1">({formatOvers(bowler.balls)})</span></span>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs italic ml-3 pr-2">Selecting Bowler...</div>
            )}
            
            <div className="mt-2 flex items-center justify-end gap-1 pr-2">
              {lastBalls.length > 0 ? lastBalls : <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Start of over</span>}
            </div>
        </div>
      </div>
    </div>
  );
}
