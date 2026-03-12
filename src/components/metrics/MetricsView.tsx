import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingDown, Activity, Clock } from 'lucide-react';
import { BurndownChart } from './BurndownChart';
import { VelocityChart } from './VelocityChart';
import { CycleTimeChart } from './CycleTimeChart';
import { useStore } from '../../store/useStore';

export const MetricsView: React.FC = () => {
  const { selectedBoard } = useStore();
  const [burndownData, setBurndownData] = useState<any>(null);
  const [velocityData, setVelocityData] = useState<any>(null);
  const [cycleTimeData, setCycleTimeData] = useState<any>(null);
  
  const [isBurndownLoading, setIsBurndownLoading] = useState(false);
  const [isVelocityLoading, setIsVelocityLoading] = useState(false);
  const [isCycleTimeLoading, setIsCycleTimeLoading] = useState(false);
  
  const [velocityMonths, setVelocityMonths] = useState<number>(6);

  // Fetch Burndown
  useEffect(() => {
    const fetchBurndown = async () => {
      if (!selectedBoard) return;
      setIsBurndownLoading(true);
      try {
        const res = await fetch(`/api/jira/burndown/${selectedBoard.id}`);
        if (res.ok) {
          const data = await res.json();
          setBurndownData(data);
        }
      } catch (error) {
        console.error("Failed to fetch burndown:", error);
      } finally {
        setIsBurndownLoading(false);
      }
    };
    fetchBurndown();
  }, [selectedBoard]);

  // Fetch Velocity
  useEffect(() => {
    const fetchVelocity = async () => {
      if (!selectedBoard) return;
      setIsVelocityLoading(true);
      try {
        const res = await fetch(`/api/jira/velocity/${selectedBoard.id}?months=${velocityMonths}`);
        if (res.ok) {
          const data = await res.json();
          setVelocityData(data);
        }
      } catch (error) {
        console.error("Failed to fetch velocity:", error);
      } finally {
        setIsVelocityLoading(false);
      }
    };
    fetchVelocity();
  }, [selectedBoard, velocityMonths]);

  // Fetch Cycle Time
  useEffect(() => {
    const fetchCycleTime = async () => {
      if (!selectedBoard) return;
      setIsCycleTimeLoading(true);
      try {
        const res = await fetch(`/api/jira/cycle-time/${selectedBoard.id}`);
        if (res.ok) {
          const data = await res.json();
          setCycleTimeData(data);
        }
      } catch (error) {
        console.error("Failed to fetch cycle time:", error);
      } finally {
        setIsCycleTimeLoading(false);
      }
    };
    fetchCycleTime();
  }, [selectedBoard]);

  const isInitialLoading = !burndownData && !velocityData && !cycleTimeData && (isBurndownLoading || isVelocityLoading || isCycleTimeLoading);

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto h-full overflow-y-auto relative">
      {isInitialLoading && (
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

      <div className="flex flex-col gap-6 pb-8">
        {/* 燃尽图 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full relative min-h-[400px]">
          {isBurndownLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-gray-900">迭代燃尽图 (Sprint Burndown)</h2>
          </div>
          <div className="h-[300px] w-full">
            <BurndownChart data={burndownData} />
          </div>
        </div>

        {/* 速率图 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full relative min-h-[400px]">
          {isVelocityLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">团队速率趋势 (Velocity Trend)</h2>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setVelocityMonths(6)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  velocityMonths === 6
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                最近 6 个月
              </button>
              <button
                onClick={() => setVelocityMonths(12)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  velocityMonths === 12
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                最近 12 个月
              </button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <VelocityChart data={velocityData} />
          </div>
        </div>

        {/* 交付周期控制图 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full relative min-h-[400px]">
          {isCycleTimeLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">交付周期控制图 (Cycle Time)</h2>
          </div>
          <div className="h-[300px] w-full">
            <CycleTimeChart data={cycleTimeData} />
          </div>
        </div>
      </div>
    </div>
  );
};
