import React from 'react';
import { Achievement } from '../../types';
import { cn } from '../../utils/cn';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const IconComponent = (Icons as any)[achievement.icon] || Icons.Trophy;
  
  const levelColors = {
    gold: "border-amber-400 bg-amber-50/50 text-amber-700 shadow-amber-100",
    silver: "border-zinc-300 bg-zinc-50/50 text-zinc-700 shadow-zinc-100",
    bronze: "border-orange-300 bg-orange-50/50 text-orange-700 shadow-orange-100"
  };

  const progress = achievement.progress && achievement.target 
    ? (achievement.progress / achievement.target) * 100 
    : 0;

  const categoryLabels = {
    delivery: "交付",
    quality: "质量",
    culture: "文化"
  };

  const LevelIcon = achievement.level === 'gold' ? Icons.Trophy : 
                    achievement.level === 'silver' ? Icons.Medal : Icons.Award;

  const levelLabels = {
    gold: "黄金",
    silver: "白银",
    bronze: "青铜"
  };

  const scopeLabels = {
    personal: "个人",
    team: "团队"
  };

  const ScopeIcon = achievement.scope === 'personal' ? Icons.User : Icons.Users;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative p-5 rounded-2xl border-2 flex flex-col gap-3 transition-all duration-300 shadow-sm min-h-[220px] h-full",
        achievement.achieved ? levelColors[achievement.level] : "border-gray-100 bg-white text-gray-400 grayscale opacity-60"
      )}
    >
      <div className="flex justify-between items-start">
        <div className={cn(
          "p-3 rounded-xl w-fit",
          achievement.achieved ? "bg-white/80 shadow-sm" : "bg-gray-50"
        )}>
          <IconComponent className="w-6 h-6" />
        </div>
        
        {achievement.achieved && (
          <div className="absolute -top-2 -right-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md",
              achievement.level === 'gold' ? "bg-amber-400" : 
              achievement.level === 'silver' ? "bg-zinc-400" : "bg-orange-400"
            )}>
              <LevelIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md w-fit",
          achievement.achieved ? "bg-black/5" : "bg-gray-100"
        )}>
          {categoryLabels[achievement.category]}
        </span>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md w-fit flex items-center gap-0.5",
          achievement.achieved ? "bg-white/50" : "bg-gray-100"
        )}>
          <LevelIcon className="w-2 h-2" />
          {levelLabels[achievement.level]}
        </span>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md w-fit flex items-center gap-0.5",
          achievement.achieved ? "bg-black/5" : "bg-gray-100"
        )}>
          <ScopeIcon className="w-2 h-2" />
          {scopeLabels[achievement.scope]}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-lg leading-tight mb-1">{achievement.title}</h3>
        <p className="text-xs leading-relaxed opacity-80 line-clamp-2">{achievement.description}</p>
      </div>

      <div className="mt-auto pt-4 border-t border-black/5">
        {achievement.achieved ? (
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">达成日期</span>
              <span className="text-xs font-black">{achievement.achievedDate}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <Icons.CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">已解锁</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="opacity-60">当前进度</span>
              <span>{achievement.progress} / {achievement.target}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn(
                  "h-full rounded-full",
                  achievement.level === 'gold' ? "bg-amber-400" : 
                  achievement.level === 'silver' ? "bg-zinc-400" : "bg-orange-400"
                )}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
