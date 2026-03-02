import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Layout, ArrowRight, Search, Clock } from 'lucide-react';

export function BoardSelectionScreen() {
  const { boards, fetchBoards, selectBoard, isLoading, error } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentBoardIds, setRecentBoardIds] = useState<string[]>([]);

  useEffect(() => {
    fetchBoards();
    // Load recent boards from localStorage
    const saved = localStorage.getItem('recent_boards');
    if (saved) {
      try {
        setRecentBoardIds(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent boards', e);
      }
    }
  }, [fetchBoards]);

  const handleSelectBoard = (board: any) => {
    // Update recent boards
    const newRecents = [board.id, ...recentBoardIds.filter(id => id !== board.id)].slice(0, 5);
    setRecentBoardIds(newRecents);
    localStorage.setItem('recent_boards', JSON.stringify(newRecents));
    
    selectBoard(board);
  };

  const filteredBoards = useMemo(() => {
    return boards.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [boards, searchTerm]);

  const recentBoards = useMemo(() => {
    if (searchTerm) return []; // Don't show recents when searching
    return recentBoardIds
      .map(id => boards.find(b => b.id === id))
      .filter((b): b is typeof boards[0] => !!b);
  }, [boards, recentBoardIds, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading boards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#F9F9F9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100">
          <div className="text-red-500 font-medium text-center mb-4">{error}</div>
          <button 
            onClick={() => fetchBoards()}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F9F9F9] flex items-center justify-center p-4">
      <div className="max-w-3xl w-full py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Select a Board
          </h1>
          <p className="text-gray-500 mb-8">
            Choose a Jira board to start your planning or standup session.
          </p>
          
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all sm:text-sm shadow-sm"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {recentBoards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Boards
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentBoards.map((board) => (
                <button
                  key={`recent-${board.id}`}
                  onClick={() => handleSelectBoard(board)}
                  className="group relative bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-left flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-3 w-full">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{board.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{board.type} Board</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          {recentBoards.length > 0 && (
             <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
               All Boards
             </h2>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBoards.map((board) => (
              <button
                key={board.id}
                onClick={() => handleSelectBoard(board)}
                className="group relative bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-left flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-3 w-full">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors">
                    <Layout className="w-4 h-4" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{board.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{board.type} Board</p>
              </button>
            ))}
          </div>
        </div>
        
        {filteredBoards.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 border-dashed">
            <p className="text-gray-400">No boards found matching "{searchTerm}".</p>
          </div>
        )}
      </div>
    </div>
  );
}
