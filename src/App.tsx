/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { PlanningView } from './components/planning/PlanningView';
import { StandupView } from './components/standup/StandupView';
import { RetroView } from './components/retro/RetroView';
import { LoginScreen } from './components/auth/LoginScreen';
import { BoardSelectionScreen } from './components/auth/BoardSelectionScreen';
import { useStore } from './store/useStore';
import { LogOut } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './components/common/ErrorFallback';
import { Toaster, toast } from 'react-hot-toast';
import { GroupSelector } from './components/common/GroupSelector';
import { RetroHeaderUsers } from './components/retro/RetroHeaderUsers';

export default function App() {
  const { fetchBoardData, isLoading, error, currentUser, selectedBoard, clearSelectedBoard, initSocket, logout } = useStore();
  const location = useLocation();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (currentUser) {
      initSocket();
    }
  }, [currentUser, initSocket]);

  useEffect(() => {
    if (selectedBoard) {
      if (location.pathname === '/planning') {
        fetchBoardData('future');
      } else if (location.pathname === '/standup' || location.pathname.startsWith('/retro')) {
        fetchBoardData('active');
      }
      // If it's any other path (like '/'), the <Navigate> component will redirect us to '/planning',
      // which will trigger this effect again with the correct path, avoiding duplicate/incorrect requests.
    }
  }, [fetchBoardData, selectedBoard, location.pathname]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (!selectedBoard) {
    return <BoardSelectionScreen />;
  }

  const isStandup = location.pathname === '/standup';
  const isRetro = location.pathname.startsWith('/retro');
  const isPlanning = location.pathname === '/planning';

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="flex h-screen w-full bg-white text-gray-800 overflow-hidden font-sans selection:bg-gray-900/10">
        <Toaster position="top-right" toastOptions={{
          className: 'text-sm font-medium text-gray-900 bg-white shadow-lg border border-gray-100 rounded-xl',
          duration: 4000,
        }} />
        {/* Background decoration - subtle or removed for cleaner look */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Minimalist background, maybe just pure white or very subtle gradient */}
      </div>

      <Sidebar />
      
      <main className="flex-1 flex flex-col relative z-10 bg-white min-w-0">
        <header className="h-16 flex items-center px-8 bg-white border-b border-gray-100 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isStandup ? 'Standup' : isRetro ? 'Retro' : 'Planning'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            {isStandup && <GroupSelector />}
            {isRetro && <RetroHeaderUsers />}
            <button
              onClick={clearSelectedBoard}
              className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all cursor-pointer flex items-center gap-2"
              title="Switch Board"
            >
              {selectedBoard.name}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        
        <Routes>
          <Route path="/planning" element={<PlanningView />} />
          <Route path="/standup" element={<StandupView />} />
          <Route path="/retro" element={<RetroView />} />
          <Route path="/retro/:roomId" element={<RetroView />} />
          <Route path="*" element={<Navigate to="/planning" replace />} />
        </Routes>
      </main>
    </div>
    </ErrorBoundary>
  );
}
