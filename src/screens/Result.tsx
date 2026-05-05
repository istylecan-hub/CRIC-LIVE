import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Home, Share2, Download } from 'lucide-react';
import { Match } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Result({ onBackHome }: { onBackHome: () => void }) {
  const activeMatch = useAppStore(s => s.activeMatch);
  const endMatch = useAppStore(s => s.endMatch);
  const [matchData, setMatchData] = useState<Match | null>(null);

  // When result screen mounts, end the match and save to history.
  // We keep a snapshot to render.
  useEffect(() => {
    if (activeMatch && !activeMatch.isComplete) {
      // Calculate Result
      const m = { ...activeMatch };
      if (m.innings.length === 2) {
         const inn1 = m.innings[0];
         const inn2 = m.innings[1];
         if (inn2.totalRuns > inn1.totalRuns) {
            m.result = {
               winnerId: inn2.battingTeamId,
               margin: 10 - inn2.totalWickets,
               marginType: 'wickets'
            };
         } else if (inn1.totalRuns > inn2.totalRuns) {
            m.result = {
               winnerId: inn1.battingTeamId,
               margin: inn1.totalRuns - inn2.totalRuns,
               marginType: 'runs'
            };
         } else {
            m.result = { isDraw: true };
         }
      }
      m.isComplete = true;
      setMatchData(m);
      // Wait for state updates first, updateMatch in IDB then end.
      useAppStore.getState().updateMatch(m);
      endMatch();
    } else if (activeMatch) {
      setMatchData(activeMatch);
    }
  }, [activeMatch, endMatch]);

  if (!matchData) return null;

  const winnerName = matchData.result?.winnerId === matchData.teamA.id ? matchData.teamA.name : matchData.teamB.name;
  
  const exportToPDF = () => {
    if (!matchData) return;
    const doc = new jsPDF();
    
    let yPos = 20;

    doc.setFontSize(20);
    doc.text('MATCH RESULT', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(14);
    if (matchData.result?.isDraw) {
        doc.text('Match Drawn', 14, yPos);
    } else {
        const winner = matchData.result?.winnerId === matchData.teamA.id ? matchData.teamA.name : matchData.teamB.name;
        doc.text(`${winner} won by ${matchData.result?.margin} ${matchData.result?.marginType}`, 14, yPos);
    }
    yPos += 15;

    matchData.innings.forEach((inn, idx) => {
        const battingTeam = inn.battingTeamId === matchData.teamA.id ? matchData.teamA : matchData.teamB;
        
        // Add Team Logo to PDF if exists
        if (battingTeam.logoDataUrl) {
           try {
             doc.addImage(battingTeam.logoDataUrl, 'PNG', 14, yPos - 8, 10, 10);
             doc.setFontSize(16);
             doc.text(`${battingTeam.name} Innings`, 28, yPos);
           } catch(e) {
             doc.setFontSize(16);
             doc.text(`${battingTeam.name} Innings`, 14, yPos);
           }
        } else {
           doc.setFontSize(16);
           doc.text(`${battingTeam.name} Innings`, 14, yPos);
        }
        
        doc.setFontSize(16);
        doc.text(`${inn.totalRuns}/${inn.totalWickets} (${Math.floor(inn.totalBalls/6)}.${inn.totalBalls%6} Ov)`, 140, yPos);
        yPos += 8;

        // Batting
        const batBody = Object.values(inn.batsmen as Record<string, any>).map(bat => [
            bat.name + (bat.isOut ? ` (${bat.outType})` : ' (not out)'),
            bat.runs.toString(),
            bat.balls.toString(),
            bat.fours.toString(),
            bat.sixes.toString(),
            bat.balls > 0 ? ((bat.runs/bat.balls)*100).toFixed(1) : '-'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Batter', 'R', 'B', '4s', '6s', 'SR']],
            body: batBody,
            theme: 'grid',
            headStyles: { fillColor: battingTeam.color || '#ea580c' },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Bowling 
        const bowlBody = Object.values(inn.bowlers as Record<string, any>).map(bowl => [
            bowl.name,
            `${Math.floor(bowl.balls/6)}.${bowl.balls%6}`,
            bowl.maidens.toString(),
            bowl.runs.toString(),
            bowl.wickets.toString(),
            bowl.balls > 0 ? (bowl.runs / (bowl.balls/6)).toFixed(1) : '-'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Bowler', 'O', 'M', 'R', 'W', 'ECON']],
            body: bowlBody,
            theme: 'grid',
            headStyles: { fillColor: battingTeam.color || '#ea580c' },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Ball by ball details
        doc.setFontSize(14);
        doc.text('Ball by Ball', 14, yPos);
        yPos += 5;

        // group balls by over
        const oversInfo: Record<number, any[]> = {};
        inn.balls.forEach(ball => {
            if (!oversInfo[ball.over]) oversInfo[ball.over] = [];
            oversInfo[ball.over].push(ball);
        });

        const bbbBody: any[] = [];
        Object.keys(oversInfo).sort((a,b) => parseInt(a)-parseInt(b)).forEach(overStr => {
           const o = parseInt(overStr);
           const balls = oversInfo[o];
           // build a string of events
           const events = balls.map(b => {
              if (b.isWicket) {
                 return b.wicketType && b.wicketType.toLowerCase() === 'run out' ? 'W(RO)' : 'W';
              }
              let str = b.runs.toString();
              if (b.isWide) str += 'wd';
              if (b.isNoBall) str += 'nb';
              if (b.isLegBye) str += 'lb';
              if (b.isBye) str += 'b';
              return str;
           }).join(' ');

           // find bowler for this over
           const bowlerName = balls[0] && inn.bowlers[balls[0].bowlerId] ? inn.bowlers[balls[0].bowlerId].name : 'Unknown';

           // calculate over total runs
           const overRuns = balls.reduce((acc, b) => acc + (b.runs || 0) + (b.extras || 0), 0);

           bbbBody.push([
              `Over ${o + 1}`,
              bowlerName,
              events,
              overRuns.toString()
           ]);
        });

        if (bbbBody.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Over', 'Bowler', 'Events', 'Runs']],
                body: bbbBody,
                theme: 'striped',
                headStyles: { fillColor: [50, 50, 50] },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        if (idx === 0 && matchData.innings.length > 1) {
           doc.addPage();
           yPos = 20;
        }
    });

    doc.save(`${matchData.teamA.name}_vs_${matchData.teamB.name}_Scorecard.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex flex-wrap items-center gap-4 p-6 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10 justify-between">
        <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-100">MATCH RESULT</h2>
        <div className="flex gap-4">
           <button onClick={exportToPDF} className="flex items-center gap-2 px-6 py-2 border border-blue-800 bg-blue-900/30 rounded-full font-bold hover:bg-blue-800/50 text-sm text-blue-300 transition-colors">
             <Download size={16} /> EXPORT PDF
           </button>
           <button className="flex items-center gap-2 px-6 py-2 border border-zinc-800 rounded-full font-bold hover:bg-zinc-900 text-sm text-zinc-300 transition-colors hidden sm:flex">
             <Share2 size={16} /> SHARE
           </button>
           <button onClick={onBackHome} className="flex items-center gap-2 px-6 py-2 bg-orange-600 rounded-full text-white font-bold hover:bg-orange-500 text-sm shadow-[0_4px_20px_rgba(234,88,12,0.3)] transition-colors">
             <Home size={16} /> HOME
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 w-full max-w-4xl mx-auto">
        <div className="w-full">
           
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-10 mb-10 text-center shadow-2xl">
              {matchData.result?.isDraw ? (
                <h1 className="text-4xl font-black text-white italic tracking-widest uppercase">Match Drawn</h1>
              ) : (
                <>
                  <div className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4">WINNER</div>
                  <h1 className="text-5xl md:text-6xl font-black text-zinc-100 mb-6 uppercase tracking-tight">{winnerName}</h1>
                  <p className="text-2xl text-zinc-500 font-medium">won by <span className="text-zinc-200 font-bold">{matchData.result?.margin} {matchData.result?.marginType}</span></p>
                </>
              )}
           </div>

           {/* Scorecards */}
           {matchData.innings.map((inn, idx) => {
             const battingTeam = inn.battingTeamId === matchData.teamA.id ? matchData.teamA : matchData.teamB;
             return (
               <div key={idx} className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-3xl overflow-hidden mb-10 shadow-lg relative">
                 <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: battingTeam.color || '#ea580c' }}></div>
                 <div className="bg-zinc-900 p-6 flex justify-between items-center border-b border-zinc-800 pl-8">
                    <div className="flex items-center gap-4">
                      {battingTeam.logoDataUrl && <img src={battingTeam.logoDataUrl} alt={`${battingTeam.name} logo`} className="w-10 h-10 object-contain rounded-md" />}
                      <h3 className="text-xl font-black uppercase tracking-widest" style={{ color: battingTeam.color || '#f4f4f5' }}>{battingTeam.name} Innings</h3>
                    </div>
                    <div className="text-2xl font-mono font-bold text-zinc-100">{inn.totalRuns}<span className="text-zinc-500 font-sans mx-1">/</span>{inn.totalWickets} <span className="text-sm font-sans text-zinc-500 ml-3">({Math.floor(inn.totalBalls/6)}.{inn.totalBalls%6} Ov)</span></div>
                 </div>
                 <div className="p-6">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-800">
                        <tr>
                          <th className="pb-3 text-left">Batter</th>
                          <th className="pb-3 tabular-nums text-right">R</th>
                          <th className="pb-3 tabular-nums text-right">B</th>
                          <th className="pb-3 tabular-nums text-right">4s</th>
                          <th className="pb-3 tabular-nums text-right">6s</th>
                          <th className="pb-3 tabular-nums text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {Object.values(inn.batsmen as Record<string, any>).map(bat => (
                          <tr key={bat.id} className="hover:bg-zinc-900/30 transition-colors">
                             <td className="py-4">
                               <div className="font-bold text-zinc-200">{bat.name || 'Unknown'} {inn.currentStrikerId === bat.id || inn.currentNonStrikerId === bat.id ? <span className="text-orange-500 ml-1">*</span> : ''}</div>
                               <div className="text-xs text-zinc-500 italic mt-1">
                                 {bat.isOut ? bat.outType : 'not out'}
                               </div>
                             </td>
                             <td className="py-4 font-mono text-right font-bold text-zinc-200">{bat.runs}</td>
                             <td className="py-4 font-mono text-right text-zinc-500">{bat.balls}</td>
                             <td className="py-4 font-mono text-right text-zinc-500">{bat.fours}</td>
                             <td className="py-4 font-mono text-right text-zinc-500">{bat.sixes}</td>
                             <td className="py-4 font-mono text-right text-zinc-500">{bat.balls > 0 ? ((bat.runs/bat.balls)*100).toFixed(1) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-10">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                         <thead className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-800">
                           <tr>
                             <th className="pb-3 text-left">Bowler</th>
                             <th className="pb-3 tabular-nums text-right">O</th>
                             <th className="pb-3 tabular-nums text-right">M</th>
                             <th className="pb-3 tabular-nums text-right">R</th>
                             <th className="pb-3 tabular-nums text-right">W</th>
                             <th className="pb-3 tabular-nums text-right">ECON</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-800/50">
                           {Object.values(inn.bowlers as Record<string, any>).map(bowl => {
                              return (
                             <tr key={bowl.id} className="hover:bg-zinc-900/30 transition-colors">
                                <td className="py-4 font-bold text-zinc-200">{bowl.name || 'Unknown'}</td>
                                <td className="py-4 font-mono text-right font-medium text-zinc-200">{Math.floor(bowl.balls/6)}.{bowl.balls%6}</td>
                                <td className="py-4 font-mono text-right text-zinc-500">{bowl.maidens}</td>
                                <td className="py-4 font-mono text-right font-medium text-zinc-200">{bowl.runs}</td>
                                <td className="py-4 font-mono text-right font-black text-white">{bowl.wickets}</td>
                                <td className="py-4 font-mono text-right text-zinc-500">{bowl.balls > 0 ? (bowl.runs / (bowl.balls/6)).toFixed(1) : '-'}</td>
                             </tr>
                           )})}
                         </tbody>
                       </table>
                    </div>
                 </div>
               </div>
             );
           })}

        </div>
      </div>
    </div>
  );
}
