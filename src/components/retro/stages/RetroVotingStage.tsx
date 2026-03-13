import { RetroRoom, RetroCard, RetroUser } from "@/shared/retro";
import { useRetroStore } from "../../../store/useRetroStore";
import { ThumbsUp, Layers } from "lucide-react";
import { TimelineVotingStage } from "./TimelineVotingStage";

interface Props {
  room: RetroRoom;
  currentUser: RetroUser;
}

const TEMPLATE_COLUMNS: Record<string, string[]> = {
  "start-stop-continue": ["Start", "Stop", "Continue"],
  "went-well-improve-action": ["Went Well", "To Improve", "Action"],
  "mad-sad-glad": ["Mad", "Sad", "Glad"],
};

const getColumnColor = (column: string) => {
  const lower = column.toLowerCase();
  if (lower.includes('start') || lower.includes('well') || lower.includes('glad')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' };
  }
  if (lower.includes('stop') || lower.includes('improve') || lower.includes('mad')) {
    return { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' };
  }
  return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' };
};

export function RetroVotingStage({ room, currentUser }: Props) {
  const { vote, revokeVote } = useRetroStore();
  const columns = TEMPLATE_COLUMNS[room.template] || [];

  if (room.template === "timeline") {
    return <TimelineVotingStage room={room} currentUser={currentUser} />;
  }

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

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Voting Stage</h2>
        <p className="text-gray-500 text-sm mt-1">Vote for the most important cards. You have <strong className="text-blue-600 font-bold">{votesRemaining}</strong> votes remaining.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {columns.map(column => {
          const colors = getColumnColor(column);
          return (
            <div key={column} className="flex flex-col h-full min-h-0">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <h3 className="text-lg font-bold text-gray-900">{column}</h3>
                <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {parentCards.filter(c => c.column === column).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2 min-h-0">
                {parentCards.filter(c => c.column === column).map(card => {
                  const children = cardsByParent[card.id] || [];
                  const hasVoted = userVotes.includes(card.id);
                  const voteCount = getVoteCount(card.id);
                  const isGroup = children.length > 0;
                  const author = room.users.find(u => u.id === card.authorId);
                  const authorName = author ? author.name : "User";
                  
                  return (
                    <div 
                      key={card.id} 
                      className={`rounded-2xl border transition-all m-0.5 ${
                        hasVoted 
                          ? "bg-blue-50/50 border-blue-300 ring-2 ring-blue-500 shadow-md" 
                          : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md shadow-sm"
                      }`}
                    >
                      {isGroup && (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-500 bg-gray-50/80 rounded-t-2xl uppercase tracking-wider">
                          <Layers className="w-3.5 h-3.5" />
                          Group ({children.length + 1} cards)
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="space-y-3">
                          {/* Parent Card */}
                          <div className="flex items-start gap-2">
                            {!isGroup && <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />}
                            <p className="text-gray-800 whitespace-pre-wrap break-words text-sm leading-relaxed flex-1">{card.text}</p>
                          </div>
                          
                          {/* Child Cards */}
                          {children.map(child => (
                            <div key={child.id} className="pl-4 border-l-2 border-gray-200 relative ml-1">
                              <p className="text-gray-600 text-sm whitespace-pre-wrap break-words leading-relaxed">{child.text}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isGroup ? 'bg-gray-100 text-gray-600' : `${colors.bg} ${colors.text}`}`}>
                            {isGroup ? "Group Vote" : (card.anonymous ? "Anonymous" : authorName)}
                          </span>
                          
                          <button
                            onClick={() => handleVote(card.id)}
                            disabled={!hasVoted && votesRemaining === 0}
                            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                              hasVoted 
                                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" 
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? "fill-white" : ""}`} />
                            <span>{voteCount > 0 ? voteCount : "Vote"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
