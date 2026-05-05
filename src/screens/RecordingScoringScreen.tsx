import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Player, WicketType } from '../types';
import VideoCompositor from '../components/VideoCompositor';
import ScoringControls from '../components/ScoringControls';
import ScoreboardPane from '../components/ScoreboardPane';
import SelectionModal from '../components/SelectionModal';

export default function RecordingScoringScreen() {
  const activeMatch = useAppStore(s => s.activeMatch);
  const updateMatch = useAppStore(s => s.updateMatch);
  
  if (!activeMatch) return null;
  const inn = activeMatch.innings[activeMatch.currentInningsIndex];
  
  const battingTeam = activeMatch.teamA.id === inn.battingTeamId ? activeMatch.teamA : activeMatch.teamB;
  const bowlingTeam = activeMatch.teamA.id === inn.bowlingTeamId ? activeMatch.teamA : activeMatch.teamB;

  // selection states
  const [needsStriker, setNeedsStriker] = useState(!inn.currentStrikerId);
  const [needsNonStriker, setNeedsNonStriker] = useState(!inn.currentNonStrikerId);
  const [needsBowler, setNeedsBowler] = useState(!inn.currentBowlerId);

  const availableBatsmen = battingTeam.players.filter(p => p.id !== inn.currentStrikerId && p.id !== inn.currentNonStrikerId && !inn.batsmen[p.id]?.isOut);
  const availableBowlers = bowlingTeam.players.filter(p => p.id !== inn.currentBowlerId);

  // Sync selection states if activeMatch changes (e.g. from UNDO)
  useEffect(() => {
    setNeedsStriker(!inn.currentStrikerId && inn.totalWickets < 10);
    setNeedsNonStriker(!inn.currentNonStrikerId && inn.totalWickets < 10);
    setNeedsBowler(!inn.currentBowlerId);
  }, [inn.currentStrikerId, inn.currentNonStrikerId, inn.currentBowlerId, inn.totalBalls, inn.totalWickets]);

  const handleSelectStriker = (playerId: string) => {
    const updated = { ...activeMatch };
    updated.innings[activeMatch.currentInningsIndex].currentStrikerId = playerId;
    updateMatch(updated);
  };

  const handleSelectNonStriker = (playerId: string) => {
    const updated = { ...activeMatch };
    updated.innings[activeMatch.currentInningsIndex].currentNonStrikerId = playerId;
    updateMatch(updated);
  };

  const handleSelectBowler = (playerId: string) => {
    const updated = { ...activeMatch };
    updated.innings[activeMatch.currentInningsIndex].currentBowlerId = playerId;
    updateMatch(updated);
  };

  // Check if at the end of over need new bowler
  useEffect(() => {
    if (inn.totalBalls > 0 && inn.totalBalls % 6 === 0) {
      // Over finished, ask for new bowler if not already asked
      // We can see if the current bowler has bowled the over
      const currentBowlerStats = inn.bowlers[inn.currentBowlerId || ''];
      if (currentBowlerStats && (currentBowlerStats.balls % 6 === 0) && currentBowlerStats.balls > 0) {
        // Need to clear bowler to trigger selection
        if (!needsBowler) {
           const updated = { ...activeMatch };
           updated.innings[activeMatch.currentInningsIndex].currentBowlerId = null;
           updateMatch(updated);
        }
      }
    }
    if (inn.totalWickets >= 10 || (activeMatch.overs * 6 === inn.totalBalls)) {
      // Innings Complete!
      if (!inn.isComplete) {
         const updated = { ...activeMatch };
         updated.innings[activeMatch.currentInningsIndex].isComplete = true;
         updateMatch(updated);
      }
    }
  }, [inn.totalBalls, inn.totalWickets, inn.currentBowlerId, inn.currentStrikerId, needsBowler, activeMatch, updateMatch]);

  return (
    <div className="flex flex-col w-full h-full bg-[#0a0a0a] text-zinc-100 relative font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
          <span className="font-mono text-sm tracking-widest text-zinc-300">LIVE</span>
        </div>
        <div>
          <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">CRICKET SCORER GY</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT: Video & Overlay Pipeline */}
        <section className="w-1/2 relative bg-black flex items-center justify-center border-r border-zinc-800">
          <VideoCompositor />
        </section>

        {/* RIGHT: Scoring UI */}
        <section className="w-1/2 flex flex-col bg-zinc-950">
          <div className="flex-none">
             <ScoreboardPane innings={inn} battingTeam={battingTeam} bowlingTeam={bowlingTeam} />
          </div>
          <div className="flex-1 overflow-hidden flex flex-col bg-zinc-950">
             <ScoringControls />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="h-10 bg-black border-t border-zinc-800 px-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex-shrink-0">
        <div className="flex gap-4">
          <span>{activeMatch.teamA.name}</span>
          <span>VS</span>
          <span>{activeMatch.teamB.name}</span>
        </div>
        <div>{new Date(activeMatch.date).toLocaleDateString()}</div>
      </footer>

      {/* MODALS */}
      {needsStriker && (
        <SelectionModal title="Select Striker" players={availableBatsmen} onSelect={handleSelectStriker} />
      )}
      {!needsStriker && needsNonStriker && (
        <SelectionModal title="Select Non-Striker" players={availableBatsmen} onSelect={handleSelectNonStriker} />
      )}
      {!needsStriker && !needsNonStriker && needsBowler && (
        <SelectionModal title="Select Bowler" players={availableBowlers} onSelect={handleSelectBowler} />
      )}
    </div>
  );
}
