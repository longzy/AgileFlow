import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';
import { socketService } from '../../services/socketService';
import { useStore } from '../../store/useStore';
import { Achievement } from '../../types';

export const AchievementCelebration: React.FC = () => {
  const { selectedGroup, currentUser } = useStore();
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleAchievementUnlocked = (achievement: Achievement & { group?: string, userId?: string }) => {
      // Only show celebration if it's for the current group
      if (achievement.group && achievement.group !== selectedGroup) return;
      
      // If it's a personal achievement, only show to the owner
      if (achievement.userId && achievement.userId !== currentUser?.id) return;

      setUnlockedAchievement(achievement);
      
      // Fire confetti
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500', '#FF8C00'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500', '#FF8C00'] });
      }, 250);
    };

    socketService.on('achievement_unlocked', handleAchievementUnlocked);

    return () => {
      socketService.off('achievement_unlocked', handleAchievementUnlocked);
    };
  }, []);

  return (
    <AnimatePresence>
      {unlockedAchievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
          >
            <button 
              onClick={() => setUnlockedAchievement(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-amber-500 p-8 flex flex-col items-center text-white">
              <motion.div
                initial={{ rotate: -20, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-center">成就达成！</h2>
              <p className="text-amber-100 font-medium text-sm mt-1">解锁了新的荣誉勋章</p>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{unlockedAchievement.title}</h3>
                <p className="text-gray-500 leading-relaxed">{unlockedAchievement.description}</p>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">奖励积分</span>
                <span className="text-lg font-black text-amber-600">+500 XP</span>
              </div>

              <button
                onClick={() => setUnlockedAchievement(null)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
              >
                太棒了！
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
