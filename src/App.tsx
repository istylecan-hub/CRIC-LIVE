import { useState, useEffect } from 'react';
import { useAppStore } from './store';
import Home from './screens/Home';
import MatchSetup from './screens/MatchSetup';
import PlayersSetup from './screens/PlayersSetup';
import RecordingScoringScreen from './screens/RecordingScoringScreen';
import InningsBreak from './screens/InningsBreak';
import Result from './screens/Result';

export type Screen = 'Home' | 'MatchSetup' | 'PlayersSetup' | 'Recording' | 'InningsBreak' | 'Result';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const loadMatches = useAppStore(s => s.loadMatches);
  const activeMatch = useAppStore(s => s.activeMatch);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    if (activeMatch) {
      if (activeMatch.isComplete) {
        setCurrentScreen('Result');
      } else {
        const inn = activeMatch.innings[activeMatch.currentInningsIndex];
        if (inn.isComplete) {
          if (activeMatch.mode === 'single' || activeMatch.currentInningsIndex === 1) {
            setCurrentScreen('Result');
          } else {
            setCurrentScreen('InningsBreak');
          }
        } else {
          // Check if players setup is done (do we have openers?)
          if (!inn.currentStrikerId || !inn.currentNonStrikerId || !inn.currentBowlerId) {
             // Wait, maybe we haven't selected players at all.
             // team A players length
             if (activeMatch.teamA.players.length === 0 || activeMatch.teamB.players.length === 0) {
               setCurrentScreen('PlayersSetup');
             } else {
               // We need openers selected, we handle this in PlayersSetup or an inline modal in Recording.
               // Let's go to Recording and have an inline modal for new batsmen/bowler.
               setCurrentScreen('Recording');
             }
          } else {
            setCurrentScreen('Recording');
          }
        }
      }
    } else {
      setCurrentScreen('Home');
    }
  }, [activeMatch]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home': return <Home onNewMatch={() => setCurrentScreen('MatchSetup')} />;
      case 'MatchSetup': return <MatchSetup onBack={() => setCurrentScreen('Home')} />;
      case 'PlayersSetup': return <PlayersSetup />;
      case 'Recording': return <RecordingScoringScreen />;
      case 'InningsBreak': return <InningsBreak />;
      case 'Result': return <Result onBackHome={() => setCurrentScreen('Home')} />;
      default: return <Home onNewMatch={() => setCurrentScreen('MatchSetup')} />;
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-neutral-950 text-neutral-50 overflow-hidden font-sans">
      {renderScreen()}
    </div>
  );
}
