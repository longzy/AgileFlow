import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AchievementCard } from './AchievementCard';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '../../utils/cn';
import { GroupSelector } from '../common/GroupSelector';

export const AchievementWall: React.FC = () => {
  const { achievements, fetchAchievements, selectedGroup, currentUser } = useStore();
  const [activeScope, setActiveScope] = React.useState<'all' | 'personal' | 'team'>('all');

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements, selectedGroup, currentUser]);

  const filteredAchievements = achievements.filter(a => 
    activeScope === 'all' ? true : a.scope === activeScope
  );

  const achievedCount = filteredAchievements.filter(a => a.achieved).length;
  const totalCount = filteredAchievements.length;

  const testAchievement = async () => {
    const unachieved = achievements.find(a => !a.achieved);
    if (!unachieved) {
      alert("所有成就已达成！");
      return;
    }

    try {
      const res = await fetch(`/api/achievements/update/${unachieved.id}?group=${encodeURIComponent(selectedGroup)}&userId=${currentUser?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: unachieved.target })
      });
      if (res.ok) {
        fetchAchievements();
      }
    } catch (error) {
      console.error("Test failed:", error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <Trophy className="w-8 h-8" />
            <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900">成就勋章墙</h1>
          </div>
          <p className="text-gray-500 font-medium max-w-xl">
            记录团队的每一个里程碑与卓越时刻。
            每一枚勋章都见证了我们向更高效、更紧密协作迈进的步伐。
          </p>
          <div className="flex items-center gap-4 mt-4">
            {import.meta.env.DEV && (
              <button 
                onClick={testAchievement}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-200 transition-colors border border-amber-200"
              >
                🚀 模拟达成成就 (测试特效)
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <GroupSelector />
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm min-w-fit">
            <div className="flex flex-col items-center px-6 border-r border-gray-100">
              <span className="text-3xl font-black text-gray-900 leading-none mb-1">{achievedCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">已解锁</span>
            </div>
            <div className="flex flex-col items-center px-6">
              <span className="text-3xl font-black text-gray-400 leading-none mb-1">{totalCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">总勋章</span>
            </div>
            <div className="ml-2 flex items-center gap-2 pr-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm z-30">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-400 border-2 border-white flex items-center justify-center shadow-sm z-20">
                  <Medal className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-white flex items-center justify-center shadow-sm z-10">
                  <Award className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-12 bg-gray-100/50 p-1.5 rounded-2xl w-fit border border-gray-200/50">
        <LayoutGroup>
          {[
            { id: 'all', label: '全部成就' },
            { id: 'team', label: '团队荣誉' },
            { id: 'personal', label: '个人突破' }
          ].map((scope) => (
            <button
              key={scope.id}
              onClick={() => setActiveScope(scope.id as any)}
              className={cn(
                "relative px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200",
                activeScope === scope.id 
                  ? "text-gray-900" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {activeScope === scope.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{scope.label}</span>
            </button>
          ))}
        </LayoutGroup>
      </div>

      <div className="space-y-16">
        {['delivery', 'quality', 'culture'].map((category) => {
          const categoryAchievements = filteredAchievements.filter(a => a.category === category);
          if (categoryAchievements.length === 0) return null;

          const categoryLabels: Record<string, string> = {
            delivery: "交付与效率",
            quality: "质量与稳定性",
            culture: "协作与文化"
          };

          return (
            <div key={category} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">{categoryLabels[category]}</h2>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {categoryAchievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <AchievementCard achievement={achievement} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
        <p className="text-sm text-gray-400 font-medium italic">
          “伟大的事业绝非由一人完成，而是由团队共同成就。”
        </p>
        <div className="flex items-center gap-2 opacity-30 grayscale">
          <img src="https://placehold.co/40x40?text=Team" alt="Team" className="w-8 h-8 rounded-full" />
          <span className="text-xs font-bold uppercase tracking-widest">Agile Studio 团队</span>
        </div>
      </div>
    </div>
  );
};
