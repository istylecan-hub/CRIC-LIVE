import { useState } from 'react';
import { useAppStore } from '../store';
import { Ball } from '../types';
import { applyBall, cloneMatch } from '../core/scoreUtils';

export default function ScoringControls() {
  const activeMatch = useAppStore(s => s.activeMatch);
  const updateMatch = useAppStore(s => s.updateMatch);
  const pushUndo = useAppStore(s => s.pushUndo);
  const undo = useAppStore(s => s.undo);
  const undoStack = useAppStore(s => s.undoStack);
  
  const [extraModal, setExtraModal] = useState<{ type: 'Wd' | 'Nb' | 'B' | 'Lb' | 'Out' } | null>(null);

  if (!activeMatch) return null;
  const inn = activeMatch.innings[activeMatch.currentInningsIndex];
  const overNumber = inn.oversCompleted;

  // Next ball is a free hit if the last legal/illegal ball was a No Ball
  const isFreeHit = inn.balls.length > 0 && inn.balls[inn.balls.length - 1].isNoBall;

  const handleRecord = (ballData: Partial<Ball>) => {
    if (!inn.currentStrikerId || !inn.currentNonStrikerId || !inn.currentBowlerId) return;

    // Push the state BEFORE the ball is recorded to the undo stack
    pushUndo();

    const baseBall: Ball = {
      over: overNumber,
      ballNumber: (inn.totalBalls % 6) + 1,
      runsBase: 0,
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      strikerId: inn.currentStrikerId,
      nonStrikerId: inn.currentNonStrikerId,
      bowlerId: inn.currentBowlerId,
      isLegal: true,
      freeHit: isFreeHit, // Mark it as free hit if it follows a no ball
      ...ballData
    };

    if (baseBall.isWide || baseBall.isNoBall) {
      baseBall.isLegal = false;
    }

    const matchClone = cloneMatch(activeMatch);
    const innClone = matchClone.innings[matchClone.currentInningsIndex];
    
    applyBall(innClone, baseBall);
    updateMatch(matchClone);
  };

  const handleRuns = (runs: number) => {
    handleRecord({ runsBase: runs });
  };

  const handleExtraRunsSubmit = (runs: number, extraType: string) => {
    setExtraModal(null);
    if (extraType === 'Wd') handleRecord({ isWide: true, runsBase: runs });
    if (extraType === 'Nb') handleRecord({ isNoBall: true, runsBase: runs });
    if (extraType === 'B') handleRecord({ isBye: true, runsBase: runs });
    if (extraType === 'Lb') handleRecord({ isLegBye: true, runsBase: runs });
  };

  const RenderExtraModal = () => {
    if (!extraModal) return null;
    if (extraModal.type === 'Out') {
      const wicketTypes = ["Bowled", "Caught", "LBW", "RunOut", "Stumped", "HitWicket", "RetiredHurt"];
      return (
        <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-bold mb-4 text-red-500 uppercase tracking-widest text-center">WICKET TYPE</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {wicketTypes.map(w => (
                <button
                  key={w}
                  onClick={() => {
                    setExtraModal(null);
                    handleRecord({ isWicket: true, wicketType: w as any });
                  }}
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl font-bold hover:bg-zinc-800 text-zinc-200"
                >{w}</button>
              ))}
            </div>
            <button className="w-full p-3 font-bold text-zinc-500 uppercase hover:text-zinc-300" onClick={() => setExtraModal(null)}>CANCEL</button>
          </div>
        </div>
      );
    }

    // For Wide/NoBall/Bye/LegBye ask how many additional runs
    return (
      <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h3 className="text-xl font-bold mb-4 uppercase tracking-widest text-center text-orange-500">
            {extraModal.type === 'Wd' && 'Wide + Runs?'}
            {extraModal.type === 'Nb' && 'No Ball + Runs?'}
            {extraModal.type === 'B' && 'How many Byes?'}
            {extraModal.type === 'Lb' && 'How many Leg Byes?'}
          </h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[0,1,2,3,4,5,6].map(r => (
              <button
                key={r}
                onClick={() => handleExtraRunsSubmit(r, extraModal.type)}
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl font-bold text-xl text-zinc-200 hover:bg-zinc-800"
              >{r}</button>
            ))}
          </div>
          <button className="w-full p-3 font-bold text-zinc-500 uppercase hover:text-zinc-300" onClick={() => setExtraModal(null)}>CANCEL</button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 grid grid-cols-4 gap-3 overflow-y-auto w-full max-h-full">
      <RenderExtraModal />
      
      {/* FREE HIT BANNER */}
      {isFreeHit && (
        <div className="col-span-4 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-xl p-2 text-center uppercase tracking-widest font-black text-sm animate-pulse mb-1 shadow-[0_0_15px_rgba(234,88,12,0.2)]">
          FREE HIT
        </div>
      )}

      {/* RUNS */}
      <button onClick={() => handleRuns(0)} className="aspect-square rounded-xl bg-zinc-800 border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center transition-all">
        <span className="text-3xl font-black text-zinc-100">•</span>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">DOT</span>
      </button>
      <button onClick={() => handleRuns(1)} className="aspect-square rounded-xl bg-zinc-800 border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center transition-all">
        <span className="text-3xl font-black text-zinc-100">1</span>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">SINGLE</span>
      </button>
      <button onClick={() => handleRuns(2)} className="aspect-square rounded-xl bg-zinc-800 border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center transition-all">
        <span className="text-3xl font-black text-zinc-100">2</span>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">DOUBLE</span>
      </button>
      <button onClick={() => handleRuns(3)} className="aspect-square rounded-xl bg-zinc-800 border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center transition-all">
        <span className="text-3xl font-black text-zinc-100">3</span>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">TRIPLE</span>
      </button>

      <button onClick={() => handleRuns(4)} className="col-span-2 aspect-[2/1] rounded-xl bg-orange-600 border-b-4 border-orange-800 active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center transition-all">
        <span className="text-4xl font-black text-white">4</span>
        <span className="text-xs font-bold text-orange-200">BOUNDARY</span>
      </button>
      <button onClick={() => handleRuns(6)} className="col-span-2 aspect-[2/1] rounded-xl bg-indigo-600 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center transition-all">
        <span className="text-4xl font-black text-white">6</span>
        <span className="text-xs font-bold text-indigo-200">SIXER</span>
      </button>

      {/* EXTRAS */}
      <button onClick={() => setExtraModal({ type: 'Wd' })} className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center active:scale-95 transition-all text-zinc-300">
        <span className="text-lg font-bold">Wd</span>
        <span className="text-[9px] text-zinc-500 uppercase">Wide</span>
      </button>
      <button onClick={() => setExtraModal({ type: 'Nb' })} className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center active:scale-95 transition-all text-zinc-300">
        <span className="text-lg font-bold">Nb</span>
        <span className="text-[9px] text-zinc-500 uppercase">No Ball</span>
      </button>
      <button onClick={() => setExtraModal({ type: 'B' })} className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center active:scale-95 transition-all text-zinc-300">
        <span className="text-lg font-bold">B</span>
        <span className="text-[9px] text-zinc-500 uppercase">Bye</span>
      </button>
      <button onClick={() => setExtraModal({ type: 'Lb' })} className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center active:scale-95 transition-all text-zinc-300">
        <span className="text-lg font-bold">Lb</span>
        <span className="text-[9px] text-zinc-500 uppercase">Leg Bye</span>
      </button>

      {/* DANGER ACTIONS */}
      <button onClick={() => setExtraModal({ type: 'Out' })} className="col-span-3 rounded-xl bg-red-700 border-b-4 border-red-900 active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center py-4 transition-all">
        <span className="text-2xl font-black tracking-widest uppercase text-white">OUT</span>
        <span className="text-[10px] text-red-200 font-bold uppercase">Wicket Fallen</span>
      </button>
      <button 
        onClick={() => undo()}
        disabled={undoStack.length === 0}
        className={`col-span-1 rounded-xl border-b-4 flex flex-col items-center justify-center transition-all ${
          undoStack.length > 0 
           ? 'bg-zinc-700 border-zinc-800 flex flex-col items-center justify-center transition-all text-zinc-200 active:translate-y-1 active:border-b-0' 
           : 'bg-zinc-900 border-zinc-950 text-zinc-600 cursor-not-allowed opacity-50'
        }`}
      >
        <span className="text-lg font-bold mb-1">UNDO</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 0 0-11-8.5L3 13"></path>
        </svg>
      </button>
    </div>
  );
}
