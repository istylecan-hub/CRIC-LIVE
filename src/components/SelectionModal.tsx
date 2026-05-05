import { Player } from '../types';

interface SelectionModalProps {
  title: string;
  players: Player[];
  onSelect: (id: string) => void;
}

export default function SelectionModal({ title, players, onSelect }: SelectionModalProps) {
  return (
    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh]">
        <div className="bg-zinc-900 px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-zinc-100 uppercase tracking-widest">{title}</h2>
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
        </div>
        <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4 bg-zinc-950">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-4 rounded-xl text-left font-bold text-zinc-200 transition-colors active:scale-95 shadow-sm"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
