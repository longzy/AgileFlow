import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingDown, Activity, Clock } from 'lucide-react';
import { BurndownChart } from './BurndownChart';
import { VelocityChart } from './VelocityChart';
import { CycleTimeChart } from './CycleTimeChart';
import { useStore } from '../../store/useStore';

export const MetricsView: React.FC = () => {
  const { selectedBoard } = useStore();
  const [metricsData, setMetricsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedBoard) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/jira/board/${selectedBoard.id}/metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetricsData(data);
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedBoard]);

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto h-full overflow-y-auto relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-sm font-bold text-gray-900 tracking-widest uppercase">Loading Metrics</div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <BarChart2 className="w-6 h-6" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Metrics Dashboard</h1>
          </div>
          <p className="text-gray-500 font-medium max-w-xl">
            通过数据洞察团队的交付效率与健康度。
            包含迭代燃尽图、团队速率趋势以及交付周期控制图。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* 燃尽图 - 占满整行 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-gray-900">迭代燃尽图 (Sprint Burndown)</h2>
          </div>
          <div className="h-[300px] w-full">
            <BurndownChart data={metricsData?.burndown} />
          </div>
        </div>

        {/* 速率图 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900">团队速率趋势 (Velocity Trend)</h2>
          </div>
          <div className="h-[300px] w-full">
            <VelocityChart data={metricsData?.velocity} />
          </div>
        </div>

        {/* 交付周期控制图 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">交付周期控制图 (Cycle Time)</h2>
          </div>
          <div className="h-[300px] w-full">
            <CycleTimeChart data={metricsData?.cycleTime} />
          </div>
        </div>
      </div>
    </div>
  );
};
