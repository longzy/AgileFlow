import React from 'react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50/50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
          <motion.div 
            className="absolute inset-0 border-4 border-t-gray-900 border-r-transparent border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-sm font-medium text-gray-500 tracking-tight">{message}</p>
      </motion.div>
    </div>
  );
};
