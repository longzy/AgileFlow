import React from 'react';

interface FeatureCardProps {
  feature: {
    id: string;
    title: string;
    icon: React.ReactNode;
    description: string;
    highlights: string[];
    color: string;
  };
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  return (
    <div className={`flex flex-col p-6 rounded-2xl border ${feature.color} bg-white shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${feature.color.split(' ')[0]} bg-opacity-50`}>
          {feature.icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{feature.title}</h2>
      </div>
      
      <p className="text-gray-600 font-medium mb-6 flex-1">
        {feature.description}
      </p>
      
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">核心亮点</h3>
        <ul className="space-y-2">
          {feature.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
              <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
