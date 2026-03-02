/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { PlanningView } from './components/planning/PlanningView';
import { StandupView } from './components/standup/StandupView';
import { LoginScreen } from './components/auth/LoginScreen';
import { BoardSelectionScreen } from './components/auth/BoardSelectionScreen';
import { useStore } from './store/useStore';
import { LogOut } from 'lucide-react';

export default function App() {
  const { activeView, fetchBoardData, isLoading, error, currentUser, selectedBoard, clearSelectedBoard, initSocket, logout } = useStore();

  useEffect(() => {
    if (currentUser) {
      initSocket();
    }
  }, [currentUser, initSocket]);

  useEffect(() => {
    if (selectedBoard) {
      fetchBoardData();
    }
  }, [fetchBoardData, selectedBoard]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (!selectedBoard) {
    return <BoardSelectionScreen />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white text-slate-800 overflow-hidden font-sans selection:bg-slate-900/10">
      {/* Background decoration - subtle or removed for cleaner look */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Minimalist background, maybe just pure white or very subtle gradient */}
      </div>

      <Sidebar />
      
      <main className="flex-1 flex flex-col relative z-10 bg-white">
        <header className="h-16 flex items-center px-8 bg-white border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {activeView === 'planning' ? 'Planning' : 'Standup'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={clearSelectedBoard}
              className="text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer flex items-center gap-2"
              title="Switch Board"
            >
              {selectedBoard.name}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        
        {activeView === 'planning' ? <PlanningView /> : <StandupView />}
      </main>
    </div>
  );
}
