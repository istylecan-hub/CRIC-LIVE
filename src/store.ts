import { create } from 'zustand';
import * as idb from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { Match, Innings, Player, Ball, WicketType } from './types';

// For simplicity, we just sync the active match to idb on changes
interface AppState {
  activeMatch: Match | null;
  savedMatches: Match[];
  undoStack: Match[];
  loadMatches: () => Promise<void>;
  startMatch: (matchConfig: Partial<Match>) => void;
  updateMatch: (match: Match) => void;
  pushUndo: () => void;
  undo: () => void;
  recordBall: (ball: Partial<Ball>, options?: any) => void;
  saveMatch: () => void;
  deleteMatch: (id: string) => void;
  endMatch: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeMatch: null,
  savedMatches: [],
  undoStack: [],

  loadMatches: async () => {
    const active = await idb.get<Match>('activeMatch');
    const saved = await idb.get<Match[]>('savedMatches') || [];
    set({ activeMatch: active || null, savedMatches: saved, undoStack: [] });
  },

  startMatch: async (config) => {
    const match: Match = {
      id: uuidv4(),
      date: new Date().toISOString(),
      teamA: config.teamA!,
      teamB: config.teamB!,
      overs: config.overs || 20,
      mode: config.mode || 'single',
      toss: config.toss || { winnerTeamId: config.teamA!.id, choice: 'bat' },
      innings: [],
      currentInningsIndex: 0,
      isComplete: false,
    };

    // INIT FIRST INNINGS
    const battingTeamId = match.toss.choice === 'bat' ? match.toss.winnerTeamId : (match.toss.winnerTeamId === match.teamA.id ? match.teamB.id : match.teamA.id);
    const bowlingTeamId = battingTeamId === match.teamA.id ? match.teamB.id : match.teamA.id;
    
    // Will be populated in setup screen 
    match.innings.push(createEmptyInnings(battingTeamId, bowlingTeamId));

    await idb.set('activeMatch', match);
    set({ activeMatch: match, undoStack: [] });
  },

  updateMatch: async (match) => {
    await idb.set('activeMatch', match);
    set({ activeMatch: match });
  },

  pushUndo: () => {
    const match = get().activeMatch;
    if (match) {
      // Just keep last 10 states in memory map to avoid massive memory usage
      const stack = [...get().undoStack, JSON.parse(JSON.stringify(match))].slice(-10);
      set({ undoStack: stack });
    }
  },

  undo: async () => {
    const stack = [...get().undoStack];
    const prevMatch = stack.pop();
    if (prevMatch) {
      await idb.set('activeMatch', prevMatch);
      set({ activeMatch: prevMatch, undoStack: stack });
    }
  },

  recordBall: async (ballInput, options) => {
    // Left as placeholder since component does the heavy clone & computation
  },

  saveMatch: async () => {
    const state = get();
    if (!state.activeMatch) return;
    const active = state.activeMatch;
    const saved = [...state.savedMatches, active];
    await idb.set('savedMatches', saved);
    await idb.del('activeMatch');
    set({ savedMatches: saved, activeMatch: null, undoStack: [] });
  },

  deleteMatch: async (id) => {
    const saved = get().savedMatches.filter(m => m.id !== id);
    await idb.set('savedMatches', saved);
    set({ savedMatches: saved });
  },

  endMatch: async () => {
    const match = get().activeMatch;
    if (!match) return;
    match.isComplete = true;
    await get().saveMatch();
  }
}));

export function createEmptyInnings(battingTeamId: string, bowlingTeamId: string): Innings {
  return {
    battingTeamId,
    bowlingTeamId,
    totalRuns: 0,
    totalWickets: 0,
    totalBalls: 0,
    oversCompleted: 0,
    extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
    balls: [],
    batsmen: {},
    bowlers: {},
    currentStrikerId: null,
    currentNonStrikerId: null,
    currentBowlerId: null,
    isComplete: false,
  };
}
