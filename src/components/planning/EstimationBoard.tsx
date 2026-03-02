import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Issue, Vote } from '../../types';
import { Check, RotateCcw, Play } from 'lucide-react';
import { cn } from '../../utils/cn';

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

export function EstimationBoard({ issue }: { issue: Issue }) {
  const { users, currentUser, updateIssuePoints, votes, revealed, consensus, joinRoom, submitVote, revealVotes, resetVotes } = useStore();

  // Join room when issue changes
  useEffect(() => {
    joinRoom(issue.id);
  }, [issue.id, joinRoom]);

  const handleVote = (points: number) => {
    if (revealed || !currentUser) return;
    submitVote(issue.id, points);
  };

  const handleReveal = () => {
    revealVotes(issue.id);
  };

  const handleReset = () => {
    resetVotes(issue.id);
  };

  const handleConfirm = () => {
    if (consensus !== null) {
      updateIssuePoints(issue.id, consensus);
    }
  };

  const allVoted = users.length > 0 && votes.length === users.length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      <div className="mb-8 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold tracking-wider">
            {issue.key}
          </span>
          {issue.estimated && (
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold tracking-wider flex items-center gap-1">
              <Check className="w-3 h-3" />
              {issue.storyPoints} Points
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{issue.summary}</h2>
        {issue.description && <p className="text-sm text-slate-500 whitespace-pre-wrap">{issue.description}</p>}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-12 w-full">
        <div className="relative w-full max-w-4xl h-[500px] bg-slate-50 rounded-[100px] border border-slate-200 shadow-inner flex items-center justify-center mb-8">
          {/* Table Center */}
          <div className="text-center">
            {!revealed ? (
              <button
                disabled={!allVoted}
                onClick={handleReveal}
                className={cn(
                  "px-8 py-4 rounded-full font-semibold transition-all duration-300 flex items-center gap-2",
                  allVoted 
                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                <Play className="w-5 h-5" />
                Reveal Cards
              </button>
            ) : consensus !== null ? (
              <div className="flex flex-col items-center">
                <div className="text-emerald-600 font-bold text-xl mb-4">Consensus!</div>
                <button
                  onClick={handleConfirm}
                  className="px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Save {consensus} Points
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-amber-500 font-bold text-xl mb-4">No Consensus</div>
                <button
                  onClick={handleReset}
                  className="px-8 py-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Re-vote
                </button>
              </div>
            )}
          </div>

          {/* Users around the table */}
          {users.map((user, index) => {
            // Distribute users starting from top (-PI/2)
            const angle = (index / users.length) * Math.PI * 2 - Math.PI / 2;
            const radiusX = 360; 
            const radiusY = 180;
            const x = Math.cos(angle) * radiusX;
            const y = Math.sin(angle) * radiusY;
            
            const userVote = votes.find(v => v.userId === user.id);
            const hasVoted = !!userVote;
            const isCurrentUser = user.id === currentUser?.id;

            return (
              <div 
                key={user.id} 
                className="absolute flex flex-col items-center gap-3 transition-all duration-500"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div className={cn(
                  "w-14 h-20 rounded-xl border-2 flex items-center justify-center bg-white shadow-lg transition-all duration-500",
                  hasVoted && !revealed ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200",
                  revealed && "bg-white border-slate-200",
                  isCurrentUser && "ring-2 ring-blue-500 ring-offset-2"
                )}>
                  {revealed && userVote ? (
                    <span className="text-2xl font-bold text-slate-900">{userVote.points}</span>
                  ) : hasVoted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-slate-300">?</span>
                  )}
                </div>
                <div className={cn(
                  "flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm",
                  isCurrentUser ? "border-blue-200 bg-blue-50" : "border-slate-100"
                )}>
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 min-w-[24px] min-h-[24px] object-cover rounded-full" />
                  <span className={cn("text-sm font-medium", isCurrentUser ? "text-blue-700" : "text-slate-700")}>
                    {isCurrentUser ? 'You' : user.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voting Cards */}
      <div className="flex justify-center gap-4 mt-auto">
        {FIBONACCI.map(points => {
          const isSelected = currentUser && votes.find(v => v.userId === currentUser.id)?.points === points;
          return (
            <button
              key={points}
              disabled={revealed || !currentUser}
              onClick={() => handleVote(points)}
              className={cn(
                "w-16 h-24 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200",
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-xl -translate-y-4"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:-translate-y-2 hover:border-slate-300 shadow-sm",
                (revealed || !currentUser) && !isSelected && "opacity-50 cursor-not-allowed"
              )}
            >
              {points}
            </button>
          );
        })}
      </div>
    </div>
  );
}
