import { RetroRoom, RetroStage } from "@/shared/retro";
import { useRetroStore } from "../../stores/useRetroStore";
import { Clock, Play, CheckCircle, ArrowRight, Download, Copy, Settings2, Pause, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { UserListDrawer } from "./UserListDrawer";

interface RetroHeaderProps {
  room: RetroRoom;
  isHost: boolean;
  state: any;
}

const STAGES: RetroStage[] = ["WRITING", "REVIEW", "VOTING", "ACTION", "DONE"];

export function RetroHeader({ room, isHost, state }: RetroHeaderProps) {
  const { changeStage, toggleTimer } = useRetroStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [copied, setCopied] = useState(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!room.endTime) {
      setTimeLeft(null);
      return;
    }

    if (room.timerPausedAt) {
      const remaining = Math.max(0, Math.floor((room.endTime - room.timerPausedAt) / 1000));
      setTimeLeft(remaining);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.endTime! - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0 && isHost && (room.stage === "WRITING" || room.stage === "VOTING")) {
        const nextStage = STAGES[STAGES.indexOf(room.stage) + 1];
        if (nextStage) {
          changeStage(nextStage);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.endTime, room.timerPausedAt, room.stage, isHost, changeStage]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleNextStage = () => {
    const currentIndex = STAGES.indexOf(room.stage);
    if (currentIndex < STAGES.length - 1) {
      changeStage(STAGES[currentIndex + 1]);
    }
  };

  return (
    <header className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
            Retro: {room.template}
          </h1>
          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 shrink-0 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {room.stage}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-mono">ID: {room.id}</span>
          <button 
            onClick={handleCopyRoomId}
            className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors shrink-0"
            title="Copy Room ID"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {timeLeft !== null && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl border ${room.timerPausedAt ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            {isHost && (
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-xl border transition-colors ${room.timerPausedAt ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                title={room.timerPausedAt ? "Resume Timer" : "Pause Timer"}
              >
                {room.timerPausedAt ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setIsUserDrawerOpen(true)}
          className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 font-medium text-sm"
          title="View Users"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Users ({room.users?.length || 0})</span>
        </button>

        <UserListDrawer 
          isOpen={isUserDrawerOpen} 
          onClose={() => setIsUserDrawerOpen(false)} 
          users={room.users || []} 
        />

        {isHost && room.stage !== "DONE" && (
          <div className="flex items-center gap-3 relative">
            {(room.stage === "WRITING" || room.stage === "VOTING") && !room.endTime && (
              <div className="relative flex items-center">
                {showTimerSettings ? (
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-lg absolute right-0 top-full mt-2 z-50">
                    <input 
                      type="number" 
                      min="1" 
                      max="60" 
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 5)}
                      className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">min</span>
                    <button
                      onClick={() => {
                        changeStage(room.stage, customMinutes);
                        setShowTimerSettings(false);
                      }}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowTimerSettings(false)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
                  <button
                    onClick={() => changeStage(room.stage, 5)} // default 5 mins
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    5m
                  </button>
                  <div className="w-px h-6 bg-blue-200"></div>
                  <button
                    onClick={() => setShowTimerSettings(!showTimerSettings)}
                    className="px-2 py-2 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Custom Timer"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={handleNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Next Stage
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {room.stage === "DONE" && (
          <button
            onClick={() => {
              // Export logic
              const markdown = `# Retro Export\n\n${room.cards.map(c => `- [${c.column}] ${c.text}`).join('\n')}`;
              const blob = new Blob([markdown], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `retro-${room.id}.md`;
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Markdown
          </button>
        )}
      </div>
    </header>
  );
}
