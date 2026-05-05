import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { formatOvers } from '../core/scoreUtils';
import { Video, Square, Play, ShieldAlert } from 'lucide-react';

export default function VideoCompositor() {
  const activeMatch = useAppStore(s => s.activeMatch);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Use a ref for the match to avoid restarting the animation loop on every score change
  const matchRef = useRef(activeMatch);
  useEffect(() => {
    matchRef.current = activeMatch;
  }, [activeMatch]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
          audio: true 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        // Start drawing loop
        const draw = () => {
          if (videoRef.current && canvasRef.current) {
             const ctx = canvasRef.current.getContext('2d');
             if (ctx) {
               // Draw Video
               ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
               
               // Draw Overlay if match exists
               const match = matchRef.current;
               if (match) {
                 const inn = match.innings[match.currentInningsIndex];
                 const battingTeam = match.teamA.id === inn.battingTeamId ? match.teamA : match.teamB;
                 const striker = inn.currentStrikerId ? inn.batsmen[inn.currentStrikerId] : null;
                 const nonStriker = inn.currentNonStrikerId ? inn.batsmen[inn.currentNonStrikerId] : null;
                 const bowler = inn.currentBowlerId ? inn.bowlers[inn.currentBowlerId] : null;

                 // Box properties
                 ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                 ctx.fillRect(30, 30, 500, 90);
                 
                 // Accent bar
                 ctx.fillStyle = battingTeam.color || '#ea580c';
                 ctx.fillRect(30, 30, 8, 90);
                 
                 let textStartX = 50;
                 
                 // Logo
                 if (battingTeam.logoDataUrl) {
                    const img = new Image();
                    img.src = battingTeam.logoDataUrl;
                    // Draw if complete, else wait for next frame
                    if (img.complete) {
                       ctx.drawImage(img, 45, 43, 36, 36);
                    }
                    textStartX = 95;
                 }
                 
                 ctx.fillStyle = 'white';
                 ctx.font = 'bold 36px monospace';
                 ctx.fillText(`${battingTeam.name} ${inn.totalRuns}/${inn.totalWickets}`, textStartX, 70);
                 
                 ctx.fillStyle = '#ffb703'; // nice orange
                 // Overs
                 ctx.fillText(`(${formatOvers(inn.totalBalls)})`, textStartX + 290, 70);
                 
                 ctx.fillStyle = '#ffffff';
                 ctx.font = '20px sans-serif';
                 ctx.fillText(`${striker?.name || '-'} ${striker?.runs||0}*  |  ${nonStriker?.name || '-'} ${nonStriker?.runs||0}`, textStartX, 105);
                 
                 ctx.fillStyle = '#8E9299'; // subtle text
                 ctx.fillText(`|  ${bowler?.name || '-'} ${bowler?.wickets||0}-${bowler?.runs||0}`, textStartX + 300, 105);
               }
             }
          }
          animFrame = requestAnimationFrame(draw);
        };
        draw();

      } catch (e) {
        console.error("Camera access denied", e);
        setPermissionError(true);
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrame);
    };
  }, []);

  const handleToggleRecord = async () => {
    if (!isRecording) {
      if (!canvasRef.current) return;
      
      try {
        if ('wakeLock' in navigator) {
          await navigator.wakeLock.request('screen').catch(console.error);
        }
      } catch (e) {}
      
      // Capture stream from canvas at 30 fps
      const canvasStream = canvasRef.current.captureStream(30);
      
      // Add audio track from the camera stream if available
      if (videoRef.current && videoRef.current.srcObject) {
         const audioTracks = (videoRef.current.srcObject as MediaStream).getAudioTracks();
         if (audioTracks.length > 0) {
           canvasStream.addTrack(audioTracks[0]);
         }
      }

      mediaRecorderRef.current = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm; codecs=vp8,opus'
      });

      const chunks: Blob[] = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          // In full version, write to indexedDB here.
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        const match = matchRef.current;
        a.download = `cricket_match_${match?.date || 'recording'}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current.start(2000); // 2 second chunks
      setIsRecording(true);
    } else {
      if (window.confirm("Stop recording and save video?")) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      }
    }
  };

  if (permissionError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-neutral-900 border border-neutral-800 rounded-3xl m-4">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h3 className="text-white font-bold text-xl mb-2">Camera Access Required</h3>
        <p className="text-neutral-400">Please allow camera access in your browser to enable capturing and recording.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group bg-black">
      <video ref={videoRef} playsInline muted className="hidden" />
      <canvas 
        ref={canvasRef} 
        width={1280} 
        height={720} 
        className="w-full h-full object-contain"
      />
      
      {/* Top Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
         <div className="pointer-events-auto">
            <button 
              onClick={handleToggleRecord} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-2xl transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-black hover:bg-neutral-200'}`}
            >
              {isRecording ? <Square size={16} fill="currentColor" /> : <Video size={16} fill="currentColor" />}
              {isRecording ? 'REC 00:00' : 'START REC'}
            </button>
         </div>
      </div>
    </div>
  );
}
