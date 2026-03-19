import { Calendar, LayoutDashboard, Layers, Settings, MessageSquare, Trophy, CheckCircle, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { format, differenceInDays } from 'date-fns';
import { useState } from 'react';

export function Sidebar() {
  const { sprint, currentUser, issues } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  const daysLeft = sprint ? differenceInDays(new Date(sprint.endDate), new Date()) : 0;
  const isPlanning = location.pathname === '/planning';

  // Calculate total story points for the current sprint
  const totalStoryPoints = issues.reduce((total, issue) => {
    return total + (issue.storyPoints || 0);
  }, 0);

  return (
    <aside className={cn(
      "flex-shrink-0 h-screen bg-[#F9F9F9] flex flex-col px-4 pb-4 pt-0 text-gray-600 transition-all duration-300 ease-in-out relative border-r border-gray-100 z-20",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-5 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-30 text-gray-400 hover:text-gray-900"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={cn(
        "flex items-center gap-3 h-16 px-2 shrink-0",
        isCollapsed ? "justify-center" : ""
      )}>
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        {!isCollapsed && (
          <h1 className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">
            AgileFlow
          </h1>
        )}
      </div>

      <nav className="flex-1 space-y-1 py-2">
        <NavLink
          to="/planning"
          title={isCollapsed ? "Planning" : ""}
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-xl transition-all duration-200 font-medium",
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
            isActive 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <Layers className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Planning</span>}
        </NavLink>
        <NavLink
          to="/standup"
          title={isCollapsed ? "Standup" : ""}
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-xl transition-all duration-200 font-medium",
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
            isActive 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Standup</span>}
        </NavLink>
        <NavLink
          to="/retro"
          title={isCollapsed ? "Retro" : ""}
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-xl transition-all duration-200 font-medium",
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
            isActive 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Retro</span>}
        </NavLink>
        <NavLink
          to="/actions"
          title={isCollapsed ? "Action Items" : ""}
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-xl transition-all duration-200 font-medium",
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
            isActive 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Action Items</span>}
        </NavLink>
        <NavLink
          to="/metrics"
          title={isCollapsed ? "Metrics" : ""}
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-xl transition-all duration-200 font-medium",
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
            isActive 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <BarChart2 className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Metrics</span>}
        </NavLink>
        <NavLink
          to="/achievements"
          title={isCollapsed ? "Hall of Fame" : ""}
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-xl transition-all duration-200 font-medium",
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
            isActive 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <Trophy className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Hall of Fame</span>}
        </NavLink>
        <NavLink
          to="/guide"
          title={isCollapsed ? "功能介绍" : ""}
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-xl transition-all duration-200 font-medium",
            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
            isActive 
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" 
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">功能介绍</span>}
        </NavLink>
      </nav>

      <div className="mt-auto pt-6 overflow-hidden">
        <div className={cn(
          "bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 transition-all",
          isCollapsed ? "p-2 flex flex-col items-center" : "p-4"
        )}>
           {!isCollapsed ? (
             <>
               <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                 {isPlanning ? '计划冲刺' : '当前冲刺'}
               </div>
               {sprint ? (
                 <div>
                   <div className="flex items-center justify-between mb-1">
                     <div className="text-sm font-bold text-gray-900">{sprint.name}</div>
                     <div className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full" title="Total Story Points">
                       {totalStoryPoints} SP
                     </div>
                   </div>
                   {sprint.isActive ? (
                     <>
                       <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                         <div 
                           className="bg-gray-900 h-1.5 rounded-full" 
                           style={{ width: `${Math.max(0, Math.min(100, ((14 - daysLeft) / 14) * 100))}%` }}
                         />
                       </div>
                       <div className="text-xs text-gray-500">剩余 {daysLeft} 天</div>
                     </>
                   ) : (
                     <div className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-lg inline-block mt-1">
                       状态: Future
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-xs text-gray-400">
                   {isPlanning ? '无 Future 冲刺' : '无活跃冲刺'}
                 </div>
               )}
             </>
           ) : (
             <div className="flex flex-col items-center gap-1" title={sprint ? `${sprint.name} (${totalStoryPoints} SP)` : "No Sprint"}>
               <Calendar className="w-5 h-5 text-gray-400" />
               {sprint && <div className="text-[10px] font-bold text-gray-900">{totalStoryPoints}</div>}
             </div>
           )}
        </div>

        {currentUser && (
          <div className={cn(
            "flex items-center rounded-xl hover:bg-gray-200/50 transition-colors cursor-pointer overflow-hidden",
            isCollapsed ? "justify-center p-1" : "gap-3 px-2 py-2"
          )} title={isCollapsed ? currentUser.name : ""}>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
               <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</div>
                <div className="text-xs text-gray-500">User</div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
