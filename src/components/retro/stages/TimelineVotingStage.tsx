import { RetroRoom, RetroCard } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { ThumbsUp, Layers } from "lucide-react";
import { cn } from "../../../utils/cn";

interface Props {
  room: RetroRoom;
  currentUser: any;
}

export function TimelineVotingStage({ room, currentUser }: Props) {
  const { vote, revokeVote } = useRetroStore();

  const userVotes = room.votes[currentUser.id] || [];
  const votesRemaining = 3 - userVotes.length;

  const getVoteCount = (cardId: string) => {
    let count = 0;
    Object.values(room.votes).forEach(votes => {
      if (Array.isArray(votes) && votes.includes(cardId)) count++;
    });
    return count;
  };

  const handleVote = (cardId: string) => {
    if (userVotes.includes(cardId)) {
      revokeVote(cardId);
    } else if (votesRemaining > 0) {
      vote(cardId);
    }
  };

  const days = Array.from({ length: 10 }, (_, i) => i + 1);

  // Group cards by parentId
  const parentCards = room.cards.filter(c => !c.parentId);
  const cardsByParent: Record<string, RetroCard[]> = {};
  
  room.cards.forEach(c => {
    if (c.parentId) {
      if (!cardsByParent[c.parentId]) {
        cardsByParent[c.parentId] = [];
      }
      cardsByParent[c.parentId].push(c);
    }
  });

  const renderCardOrGroup = (card: RetroCard) => {
    const children = cardsByParent[card.id] || [];
    const hasVoted = userVotes.includes(card.id);
    const voteCount = getVoteCount(card.id);
    const isGroup = children.length > 0;
    const isPositive = card.column.endsWith("positive");
    
    return (
      <div 
        key={card.id} 
        className={cn(
          "w-full max-w-[160px] rounded-xl border transition-all text-sm shadow-sm m-0.5",
          hasVoted 
            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20" 
            : isPositive ? "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200" : "bg-rose-50/50 border-rose-100 hover:border-rose-200"
        )}
      >
        {isGroup && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-200/50 text-[10px] font-medium text-gray-500 bg-gray-100/50 rounded-t-xl">
            <Layers className="w-3 h-3" />
            Group ({children.length + 1})
          </div>
        )}
        
        <div className="p-3">
          <div className="space-y-2">
            {/* Parent Card */}
            <p className="text-gray-800 whitespace-pre-wrap break-words line-clamp-3" title={card.text}>{card.text}</p>
            
            {/* Child Cards */}
            {children.map(child => (
              <div key={child.id} className="pl-2 border-l-2 border-gray-300 relative">
                <p className="text-gray-600 text-xs whitespace-pre-wrap break-words line-clamp-2" title={child.text}>{child.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200/50">
            <span className="text-[10px] text-gray-400">
              {isGroup ? "Group" : (card.anonymous ? "Anon" : "User")}
            </span>
            
            <button
              onClick={() => handleVote(card.id)}
              disabled={!hasVoted && votesRemaining === 0}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                hasVoted 
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" 
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ThumbsUp className={cn("w-3 h-3", hasVoted && "fill-white")} />
              <span>{voteCount > 0 ? voteCount : "Vote"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Voting Stage (Timeline)</h2>
        <p className="text-gray-500">Vote for the most important cards. You have <strong className="text-blue-600">{votesRemaining}</strong> votes remaining.</p>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto pb-8 relative min-w-0 w-full">
        <div className="min-w-[1200px] min-h-full grid grid-rows-[1fr_auto_1fr] grid-cols-10 relative py-12">
          {/* Central Axis */}
          <div className="row-start-2 col-span-10 h-1 bg-gray-300 self-center rounded-full" />

          {/* Days Grid */}
          {days.map((day, index) => {
            const col = index + 1;
            const positiveCards = parentCards.filter(c => c.column === `day-${day}-positive`);
            const negativeCards = parentCards.filter(c => c.column === `day-${day}-negative`);

            return (
              <div key={day} className="contents group">
                {/* Hover Catcher & Guide Line */}
                <div 
                  className="row-start-1 row-span-3 flex justify-center z-0" 
                  style={{ gridColumnStart: col }}
                >
                  <div className="w-full h-full flex justify-center">
                    <div className="w-px h-full bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Top Half (Positive) */}
                <div 
                  className="row-start-1 flex flex-col-reverse items-center pb-6 px-2 gap-2 z-10" 
                  style={{ gridColumnStart: col }}
                >
                  {positiveCards.map(renderCardOrGroup)}
                </div>

                {/* Day Marker */}
                <div 
                  className="row-start-2 flex justify-center items-center z-20" 
                  style={{ gridColumnStart: col }}
                >
                  <div className="w-8 h-8 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                    <span className="text-xs font-bold text-gray-600">D{day}</span>
                  </div>
                </div>

                {/* Bottom Half (Negative) */}
                <div 
                  className="row-start-3 flex flex-col items-center pt-6 px-2 gap-2 z-10" 
                  style={{ gridColumnStart: col }}
                >
                  {negativeCards.map(renderCardOrGroup)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
