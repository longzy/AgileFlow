import React from 'react';
import { User } from '../../types';

interface SyncAnimationProps {
  show: boolean;
}

export const SyncAnimation: React.FC<SyncAnimationProps> = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(38,204,255,0.8)] animate-bounce">
        Perfect Sync 🎯
      </div>
    </div>
  );
};

interface FightAnimationProps {
  show: boolean;
  fightUsers: {
    minUser: User;
    maxUser: User;
    minPoints: number;
    maxPoints: number;
  } | null;
}

export const FightAnimation: React.FC<FightAnimationProps> = ({ show, fightUsers }) => {
  if (!show || !fightUsers) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="text-6xl md:text-8xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] mb-12 animate-pulse">
        FIGHT! 🥊
      </div>
      <div className="flex items-center justify-center gap-16 md:gap-32 w-full px-8">
        {/* Min User */}
        <div className="flex flex-col items-center animate-slide-in-left">
          <div className="relative">
            <img src={fightUsers.minUser.avatar} alt={fightUsers.minUser.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-blue-500 object-cover shadow-[0_0_40px_rgba(59,130,246,0.5)]" />
            <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white text-2xl md:text-4xl font-bold w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 border-black">
              {fightUsers.minPoints}
            </div>
          </div>
          <div className="text-white text-2xl md:text-3xl font-bold mt-6">{fightUsers.minUser.name}</div>
          <div className="text-blue-400 text-lg md:text-xl mt-2">Lowest Estimate</div>
        </div>

        {/* VS */}
        <div className="text-5xl md:text-7xl font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
          VS
        </div>

        {/* Max User */}
        <div className="flex flex-col items-center animate-slide-in-right">
          <div className="relative">
            <img src={fightUsers.maxUser.avatar} alt={fightUsers.maxUser.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-red-500 object-cover shadow-[0_0_40px_rgba(239,68,68,0.5)]" />
            <div className="absolute -bottom-4 -left-4 bg-red-500 text-white text-2xl md:text-4xl font-bold w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 border-black">
              {fightUsers.maxPoints}
            </div>
          </div>
          <div className="text-white text-2xl md:text-3xl font-bold mt-6">{fightUsers.maxUser.name}</div>
          <div className="text-red-400 text-lg md:text-xl mt-2">Highest Estimate</div>
        </div>
      </div>
      <div className="text-white/70 text-xl mt-16 animate-pulse">
        Please discuss your estimates!
      </div>
    </div>
  );
};
