import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Layout, ArrowRight } from 'lucide-react';

export function BoardSelectionScreen() {
  const { boards, fetchBoards, selectBoard, isLoading, error } = useStore();

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading boards...</p>
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
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F9F9F9] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Select a Board
          </h1>
          <p className="text-slate-500">
            Choose a Jira board to start your planning or standup session.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => selectBoard(board)}
              className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Layout className="w-5 h-5" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{board.name}</h3>
              <p className="text-sm text-slate-500 capitalize">{board.type} Board</p>
            </button>
          ))}
        </div>
        
        {boards.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-slate-400">No boards found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
