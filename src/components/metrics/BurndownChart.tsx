import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BurndownChartProps {
  data?: any[];
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-400">暂无数据</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Line 
          type="monotone" 
          dataKey="ideal" 
          name="理想基线 (Ideal)" 
          stroke="#9CA3AF" 
          strokeWidth={2} 
          strokeDasharray="5 5" 
          dot={false} 
        />
        <Line 
          type="monotone" 
          dataKey="remaining" 
          name="实际剩余 (Remaining)" 
          stroke="#F43F5E" 
          strokeWidth={3} 
          activeDot={{ r: 6, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
