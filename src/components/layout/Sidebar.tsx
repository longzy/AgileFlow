import { Calendar, LayoutDashboard, Layers, Settings } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { format, differenceInDays } from 'date-fns';

export function Sidebar() {
  const { sprint, activeView, setActiveView, currentUser } = useStore();
  
  const daysLeft = sprint ? differenceInDays(new Date(sprint.endDate), new Date()) : 0;

  return (
    <aside className="w-64 flex-shrink-0 h-screen bg-[#F9F9F9] flex flex-col p-4 text-gray-600">
      <div className="flex items-center gap-3 mb-2 px-2">
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          AgileFlow
        </h1>
      </div>

      <nav className="flex-1 space-y-1 py-2">
        <button
          onClick={() => setActiveView('planning')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
            activeView === 'planning' 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <Layers className="w-5 h-5" />
          <span>Planning</span>
        </button>
        <button
          onClick={() => setActiveView('standup')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
            activeView === 'standup' 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Standup</span>
        </button>
      </nav>

      <div className="mt-auto pt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
           <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">当前冲刺</div>
           {sprint ? (
             <div>
               <div className="text-sm font-bold text-gray-900 mb-1">{sprint.name}</div>
               <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                 <div 
                   className="bg-gray-900 h-1.5 rounded-full" 
                   style={{ width: `${Math.max(0, Math.min(100, ((14 - daysLeft) / 14) * 100))}%` }}
                 />
               </div>
               <div className="text-xs text-gray-500">剩余 {daysLeft} 天</div>
             </div>
           ) : (
             <div className="text-xs text-gray-400">无活跃冲刺</div>
           )}
        </div>

        {currentUser && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-200/50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
               <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{currentUser.name}</div>
              <div className="text-xs text-gray-500">User</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
