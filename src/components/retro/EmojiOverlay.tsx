import { useEffect, useState } from 'react';
import { useRetroStore } from '../../store/useRetroStore';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  userId: string;
}

export function EmojiOverlay() {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const { onlineUsers } = useRetroStore();

  useEffect(() => {
    const handleEmoji = (e: Event) => {
      const customEvent = e as CustomEvent<{ emoji: string; userId: string }>;
      const { emoji, userId } = customEvent.detail;
      
      const id = Math.random().toString(36).substring(2, 9);
      
      // Calculate random starting position near the bottom
      const startX = 10 + Math.random() * 80; // 10% to 90% of screen width
      
      setEmojis(prev => [...prev, {
        id,
        emoji,
        x: startX,
        y: 100, // Start at bottom
        userId
      }]);

      // Remove emoji after animation completes
      setTimeout(() => {
        setEmojis(prev => prev.filter(e => e.id !== id));
      }, 3000); // Match animation duration
    };

    window.addEventListener('retro-emoji', handleEmoji);
    return () => window.removeEventListener('retro-emoji', handleEmoji);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {emojis.map(e => {
        const user = onlineUsers.find(u => u.id === e.userId);
        
        return (
          <div
            key={e.id}
            className="absolute flex flex-col items-center animate-float-up"
            style={{
              left: `${e.x}%`,
              bottom: '0',
            }}
          >
            <span className="text-4xl filter drop-shadow-md">{e.emoji}</span>
            {user && (
              <span className="text-[10px] font-medium bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full mt-1 text-gray-700 shadow-sm">
                {user.name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
