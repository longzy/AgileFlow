import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

interface CycleTimeChartProps {
  data?: any[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
        <p className="font-bold text-gray-900">{data.issue}</p>
        <p className="text-sm text-gray-600">完成日期: {data.date}</p>
        <p className="text-sm text-blue-600 font-medium">交付周期: {data.cycleTime} 天</p>
      </div>
    );
  }
  return null;
};

export const CycleTimeChart: React.FC<CycleTimeChartProps> = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-400">暂无数据</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis 
          dataKey="date" 
          name="完成日期" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6B7280', fontSize: 12 }} 
          dy={10} 
        />
        <YAxis 
          dataKey="cycleTime" 
          name="交付周期 (天)" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6B7280', fontSize: 12 }} 
          dx={-10} 
        />
        <ZAxis range={[60, 60]} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Issues" data={data} fill="#3B82F6" opacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};
