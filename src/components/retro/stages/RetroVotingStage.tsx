import { RetroRoom, RetroCard } from "@/shared/retro";
import { useRetroStore } from "../../../stores/useRetroStore";
import { ThumbsUp, Layers } from "lucide-react";

interface Props {
  room: RetroRoom;
  currentUser: any;
}

const TEMPLATE_COLUMNS: Record<string, string[]> = {
  "start-stop-continue": ["Start", "Stop", "Continue"],
  "went-well-improve-action": ["Went Well", "To Improve", "Action"],
  "mad-sad-glad": ["Mad", "Sad", "Glad"],
};

export function RetroVotingStage({ room, currentUser }: Props) {
  const { vote, revokeVote } = useRetroStore();
  const columns = TEMPLATE_COLUMNS[room.template] || [];

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
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Voting Stage</h2>
        <p className="text-gray-500">Vote for the most important cards. You have <strong className="text-blue-600">{votesRemaining}</strong> votes remaining.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {columns.map(column => (
          <div key={column} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{column}</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {parentCards.filter(c => c.column === column).map(card => {
                const children = cardsByParent[card.id] || [];
                const hasVoted = userVotes.includes(card.id);
                const voteCount = getVoteCount(card.id);
                const isGroup = children.length > 0;
                
                return (
                  <div 
                    key={card.id} 
                    className={`rounded-xl border transition-all ${
                      hasVoted 
                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" 
                        : "bg-gray-50 border-gray-200 hover:border-blue-200"
                    }`}
                  >
                    {isGroup && (
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200/50 text-xs font-medium text-gray-500 bg-gray-100/50 rounded-t-xl">
                        <Layers className="w-3 h-3" />
                        Group ({children.length + 1} cards)
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        {/* Parent Card */}
                        <p className="text-gray-800 whitespace-pre-wrap break-words">{card.text}</p>
                        
                        {/* Child Cards */}
                        {children.map(child => (
                          <div key={child.id} className="pl-3 border-l-2 border-gray-300 relative">
                            <p className="text-gray-600 text-sm whitespace-pre-wrap break-words">{child.text}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200/50">
                        <span className="text-xs text-gray-400">
                          {isGroup ? "Group Vote" : (card.anonymous ? "Anonymous" : "User")}
                        </span>
                        
                        <button
                          onClick={() => handleVote(card.id)}
                          disabled={!hasVoted && votesRemaining === 0}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            hasVoted 
                              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" 
                              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${hasVoted ? "fill-white" : ""}`} />
                          <span>{voteCount > 0 ? voteCount : "Vote"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
