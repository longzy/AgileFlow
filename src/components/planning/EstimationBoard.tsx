import { useState, useEffect } from 'react';
// Force UI sync
import { useStore } from '../../store/useStore';
import { Issue, Vote, User } from '../../types';
import { Check, RotateCcw, Play, Crown } from 'lucide-react';
import { cn } from '../../utils/cn';
import confetti from 'canvas-confetti';

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

export function EstimationBoard({ issue }: { issue: Issue }) {
  const { users, onlineUsers, currentUser, updateIssuePoints, votes, revealed, consensus, joinRoom, submitVote, revealVotes, resetVotes, hostId } = useStore();
  const [revealAnimation, setRevealAnimation] = useState<'sync' | 'fight' | null>(null);
  const [fightUsers, setFightUsers] = useState<{minUser: User, maxUser: User, minPoints: number, maxPoints: number} | null>(null);

  const isHost = currentUser?.id === hostId;

  // Use onlineUsers for the table display
  const displayUsers = [...onlineUsers];
  if (currentUser && !displayUsers.find(u => u.id === currentUser.id)) {
    displayUsers.push(currentUser);
  }

  // Join room when issue changes
  useEffect(() => {
    joinRoom(issue.id);
  }, [issue.id, joinRoom]);

  // Confetti effect when cards are revealed
  useEffect(() => {
    if (revealed && votes.length > 0) {
      const points = votes.map(v => v.points);
      const maxPoints = Math.max(...points);
      const minPoints = Math.min(...points);
      
      if (maxPoints === minPoints) {
        setRevealAnimation('sync');
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
            zIndex: 100
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
            zIndex: 100
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
        
        setTimeout(() => setRevealAnimation(null), 4000);
      } else if (FIBONACCI.indexOf(maxPoints) - FIBONACCI.indexOf(minPoints) >= 3) {
        setRevealAnimation('fight');
        const minVote = votes.find(v => v.points === minPoints);
        const maxVote = votes.find(v => v.points === maxPoints);
        
        const allUsers = [...onlineUsers];
        if (currentUser && !allUsers.find(u => u.id === currentUser.id)) {
          allUsers.push(currentUser);
        }
        
        const minUser = allUsers.find(u => u.id === minVote?.userId);
        const maxUser = allUsers.find(u => u.id === maxVote?.userId);
        
        if (minUser && maxUser) {
          setFightUsers({ minUser, maxUser, minPoints, maxPoints });
        }
        
        setTimeout(() => setRevealAnimation(null), 6000);
      }
    } else {
      setRevealAnimation(null);
      setFightUsers(null);
    }
  }, [revealed, votes, onlineUsers, currentUser]);

  const handleVote = (points: number) => {
    if (revealed || !currentUser) return;
    submitVote(issue.id, points);
  };

  const handleReveal = () => {
    if (isHost) revealVotes(issue.id);
  };

  const handleReset = () => {
    if (isHost) resetVotes(issue.id);
  };

  const handleConfirm = () => {
    if (isHost && consensus !== null) {
      updateIssuePoints(issue.id, consensus);
    }
  };

  const allVoted = onlineUsers.length > 0 && votes.length === onlineUsers.length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full relative">
      {/* Perfect Sync Animation */}
      {revealAnimation === 'sync' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(38,204,255,0.8)] animate-bounce">
            Perfect Sync 🎯
          </div>
        </div>
      )}

      {/* Fight Animation */}
      {revealAnimation === 'fight' && fightUsers && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="text-6xl md:text-8xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] mb-12 animate-pulse">
            FIGHT! 🥊
          </div>
          <div className="flex items-center justify-center gap-16 md:gap-32 w-full px-8">
            {/* Min User */}
            <div className="flex flex-col items-center animate-slide-in-left">
              <div className="relative">
                <img src={fightUsers.minUser.avatar} alt={fightUsers.minUser.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-blue-500 object-cover shadow-[0_0_40px_rgba(59,130,246,0.5)]" />
                <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white text-2xl md:text-4xl font-bold w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 border-black">
                  {fightUsers.minPoints}
                </div>
              </div>
              <div className="text-white text-2xl md:text-3xl font-bold mt-6">{fightUsers.minUser.name}</div>
              <div className="text-blue-400 text-lg md:text-xl mt-2">Lowest Estimate</div>
            </div>

            {/* VS */}
            <div className="text-5xl md:text-7xl font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              VS
            </div>

            {/* Max User */}
            <div className="flex flex-col items-center animate-slide-in-right">
              <div className="relative">
                <img src={fightUsers.maxUser.avatar} alt={fightUsers.maxUser.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-red-500 object-cover shadow-[0_0_40px_rgba(239,68,68,0.5)]" />
                <div className="absolute -bottom-4 -left-4 bg-red-500 text-white text-2xl md:text-4xl font-bold w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 border-black">
                  {fightUsers.maxPoints}
                </div>
              </div>
              <div className="text-white text-2xl md:text-3xl font-bold mt-6">{fightUsers.maxUser.name}</div>
              <div className="text-red-400 text-lg md:text-xl mt-2">Highest Estimate</div>
            </div>
          </div>
          <div className="text-white/70 text-xl mt-16 animate-pulse">
            Please discuss your estimates!
          </div>
        </div>
      )}

      <div className="mb-8 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold tracking-wider">
            {issue.key}
          </span>
          {issue.estimated && (
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold tracking-wider flex items-center gap-1">
              <Check className="w-3 h-3" />
              {issue.storyPoints} Points
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{issue.summary}</h2>
        {issue.description && <p className="text-sm text-gray-500 whitespace-pre-wrap">{issue.description}</p>}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-12 w-full">
        <div className="relative w-full max-w-4xl h-[500px] bg-gray-50 rounded-[100px] border border-gray-200 shadow-inner flex items-center justify-center mb-8">
          {/* Table Center */}
          <div className="text-center">
            {!revealed ? (
              isHost ? (
                <button
                  disabled={!allVoted}
                  onClick={handleReveal}
                  className={cn(
                    "px-8 py-4 rounded-full font-semibold transition-all duration-300 flex items-center gap-2",
                    allVoted 
                      ? "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Play className="w-5 h-5" />
                  Reveal Cards
                </button>
              ) : (
                <div className="text-gray-500 font-medium px-6 py-3 bg-white rounded-full shadow-sm border border-gray-100">
                  {allVoted ? "Waiting for Scrum Master to reveal..." : "Waiting for votes..."}
                </div>
              )
            ) : consensus !== null ? (
              <div className="flex flex-col items-center">
                <div className="text-emerald-600 font-bold text-xl mb-4">Consensus!</div>
                {isHost ? (
                  <button
                    onClick={handleConfirm}
                    className="px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Save {consensus} Points
                  </button>
                ) : (
                  <div className="text-gray-500 font-medium mt-2 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-100">
                    Waiting for Scrum Master to save...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-amber-500 font-bold text-xl mb-4">No Consensus</div>
                {isHost ? (
                  <button
                    onClick={handleReset}
                    className="px-8 py-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Re-vote
                  </button>
                ) : (
                  <div className="text-gray-500 font-medium mt-2 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-100">
                    Waiting for Scrum Master to restart...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Users around the table */}
          {(() => {
            // Reorder users so current user is at the bottom (index 0 in our calculation logic below)
            let orderedUsers = [...displayUsers];
            if (currentUser) {
              const currentUserIndex = orderedUsers.findIndex(u => u.id === currentUser.id);
              if (currentUserIndex !== -1) {
                // Remove current user
                const [me] = orderedUsers.splice(currentUserIndex, 1);
                orderedUsers = [me, ...orderedUsers];
              }
            }

            return orderedUsers.map((user, index) => {
              const angle = (index / orderedUsers.length) * Math.PI * 2 + Math.PI / 2;
              
              const radiusX = 360; 
              const radiusY = 180;
              const x = Math.cos(angle) * radiusX;
              const y = Math.sin(angle) * radiusY;
              
              const userVote = votes.find(v => v.userId === user.id);
              const hasVoted = !!userVote;
              const isCurrentUser = user.id === currentUser?.id;
              const isHostUser = user.id === hostId;

              return (
                <div 
                  key={user.id} 
                  className="absolute flex flex-col items-center gap-3 transition-all duration-500"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <div className="relative w-14 h-20 [perspective:1000px]">
                    <div className={cn(
                      "w-full h-full transition-transform duration-700 [transform-style:preserve-3d]",
                      revealed ? "[transform:rotateY(180deg)]" : ""
                    )}>
                      {/* Front face (Unrevealed) */}
                      <div className={cn(
                        "absolute inset-0 [backface-visibility:hidden] rounded-xl border-2 flex items-center justify-center shadow-lg transition-colors duration-300",
                        hasVoted ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white",
                        isCurrentUser && "ring-2 ring-blue-500 ring-offset-2"
                      )}>
                        {hasVoted ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-gray-300">?</span>
                        )}
                      </div>
                      
                      {/* Back face (Revealed) */}
                      <div className={cn(
                        "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border-2 border-gray-200 bg-white flex items-center justify-center shadow-lg",
                        isCurrentUser && "ring-2 ring-blue-500 ring-offset-2"
                      )}>
                        {userVote ? (
                          <span className="text-2xl font-bold text-gray-900">{userVote.points}</span>
                        ) : (
                          <span className="text-gray-300">?</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm relative",
                    isCurrentUser ? "border-blue-200 bg-blue-50" : "border-gray-100"
                  )}>
                    {isHostUser && (
                      <div className="absolute -top-3 -right-2 bg-amber-100 p-1 rounded-full border border-amber-200 shadow-sm z-10" title="Scrum Master">
                        <Crown className="w-3 h-3 text-amber-500" />
                      </div>
                    )}
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 min-w-[24px] min-h-[24px] object-cover rounded-full" />
                    <span className={cn("text-sm font-medium", isCurrentUser ? "text-blue-700" : "text-gray-700")}>
                      {isCurrentUser ? 'You' : user.name}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
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
                  ? "border-gray-900 bg-gray-900 text-white shadow-xl -translate-y-4"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:-translate-y-2 hover:border-gray-300 shadow-sm",
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
