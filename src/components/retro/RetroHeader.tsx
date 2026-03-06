import { RetroRoom, RetroStage } from "@/shared/retro";
import { useRetroStore } from "../../stores/useRetroStore";
import { Clock, Play, CheckCircle, ArrowRight, Download, Copy, Settings2, Pause, Users, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { UserListDrawer } from "./UserListDrawer";
import { useConfirm } from "../../context/ConfirmContext";

interface RetroHeaderProps {
  room: RetroRoom;
  isHost: boolean;
  state: any;
}

const STAGES: RetroStage[] = ["WRITING", "REVIEW", "VOTING", "ACTION", "DONE"];

export function RetroHeader({ room, isHost, state }: RetroHeaderProps) {
  const { changeStage, toggleTimer, deleteRoom, onlineUsers } = useRetroStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [copied, setCopied] = useState(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const { confirm } = useConfirm();

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteRoom = () => {
    confirm({
      title: "Delete Room",
      message: "Are you sure you want to delete this room? This action cannot be undone.",
      confirmLabel: "Delete",
      type: "danger",
      onConfirm: () => {
        deleteRoom();
      }
    });
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
    const proceed = () => {
      const currentIndex = STAGES.indexOf(room.stage);
      if (currentIndex < STAGES.length - 1) {
        changeStage(STAGES[currentIndex + 1]);
      }
    };

    // Check if there are no cards when leaving WRITING stage
    if (room.stage === "WRITING" && (!room.cards || room.cards.length === 0)) {
      confirm({
        title: "No Cards Submitted",
        message: "No one has submitted any cards yet. Are you sure you want to proceed to the next stage?",
        confirmLabel: "Proceed Anyway",
        cancelLabel: "Wait",
        type: "warning",
        onConfirm: proceed
      });
      return;
    }

    // If timer is running and not paused, ask for confirmation
    if (timeLeft !== null && timeLeft > 0 && !room.timerPausedAt) {
      confirm({
        title: "Timer Running",
        message: "Timer is still running. Are you sure you want to proceed to the next stage?",
        confirmLabel: "Proceed",
        type: "warning",
        onConfirm: proceed
      });
      return;
    }

    proceed();
  };

  return (
    <header className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between shadow-sm z-10 gap-y-3 w-full min-w-0">
      <div className="flex flex-col gap-1 flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
            Retro: {room.template}
          </h1>
          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium text-gray-600 shrink-0 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {room.stage}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <span className="font-mono truncate">ID: {room.id}</span>
          <button 
            onClick={handleCopyRoomId}
            className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors shrink-0"
            title="Copy Room ID"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
        {timeLeft !== null && (
          <div className="flex items-center gap-1 sm:gap-2">
            <div className={`flex items-center gap-1.5 sm:gap-2 font-mono font-bold text-sm sm:text-lg px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border ${room.timerPausedAt ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              {formatTime(timeLeft)}
            </div>
            {isHost && (
              <button
                onClick={toggleTimer}
                className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${room.timerPausedAt ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                title={room.timerPausedAt ? "Resume Timer" : "Pause Timer"}
              >
                {room.timerPausedAt ? <Play className="w-4 h-4 sm:w-5 sm:h-5" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setIsUserDrawerOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 font-medium text-xs sm:text-sm shrink-0"
          title="View Users"
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Users ({onlineUsers?.length || 0})</span>
          <span className="sm:hidden">{onlineUsers?.length || 0}</span>
        </button>

        <UserListDrawer 
          isOpen={isUserDrawerOpen} 
          onClose={() => setIsUserDrawerOpen(false)} 
          users={onlineUsers || []} 
          hostId={room.hostId}
        />

        {isHost && room.stage !== "DONE" && (
          <div className="flex items-center gap-2 sm:gap-3 relative shrink-0">
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
                      className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-500">m</span>
                    <button
                      onClick={() => {
                        changeStage(room.stage, customMinutes);
                        setShowTimerSettings(false);
                      }}
                      className="p-1 sm:p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => setShowTimerSettings(false)}
                      className="p-1 sm:p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
                  <button
                    onClick={() => changeStage(room.stage, 5)} // default 5 mins
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-blue-600 font-medium hover:bg-blue-100 transition-colors text-xs sm:text-sm"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    5m
                  </button>
                  <div className="w-px h-4 sm:h-6 bg-blue-200"></div>
                  <button
                    onClick={() => setShowTimerSettings(!showTimerSettings)}
                    className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Custom Timer"
                  >
                    <Settings2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={handleNextStage}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm text-xs sm:text-sm whitespace-nowrap"
            >
              Next
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {isHost && room.stage === "DONE" && (
          <div className="flex items-center gap-2 shrink-0">
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
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleDeleteRoom}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors shadow-sm border border-red-100"
              title="Delete Room"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
