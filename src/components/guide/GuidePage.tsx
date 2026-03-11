import React from 'react';
import { Layers, LayoutDashboard, MessageSquare, CheckCircle, Trophy } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

export const GuidePage: React.FC = () => {
  const features = [
    {
      id: 'planning',
      title: '冲刺计划 (Planning)',
      icon: <Layers className="w-8 h-8 text-indigo-500" />,
      description: '为即将到来的冲刺规划任务，评估工作量，并确保团队对目标有清晰的共识。',
      highlights: [
        '查看 Future Sprint 的所有待办事项',
        '快速浏览每个任务的故事点 (Story Points)',
        '了解团队成员的任务分配情况',
      ],
      color: 'bg-indigo-50 border-indigo-100',
    },
    {
      id: 'standup',
      title: '每日站会 (Standup)',
      icon: <LayoutDashboard className="w-8 h-8 text-blue-500" />,
      description: '高效进行每日同步，了解团队进度，及时发现并解决阻塞问题。',
      highlights: [
        '按成员分组查看当前 Sprint 的任务状态',
        '直观展示每个人的工作负荷与进度',
        '快速识别处于 Blocked 状态的异常任务',
      ],
      color: 'bg-blue-50 border-blue-100',
    },
    {
      id: 'retro',
      title: '回顾会议 (Retro)',
      icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
      description: '在冲刺结束后进行团队复盘，总结经验教训，持续改进工作方式。',
      highlights: [
        '支持 Went Well, To Improve, Action Items 标准回顾流程',
        '实时多人协作，匿名提交与点赞投票',
        '自动将讨论结果转化为可执行的 Action Items',
      ],
      color: 'bg-purple-50 border-purple-100',
    },
    {
      id: 'actions',
      title: '改进项 (Action Items)',
      icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
      description: '追踪和管理团队在回顾会议中产生的改进项，确保每一个好想法都能落地执行。',
      highlights: [
        '双栏 Kanban 视图管理待处理与已完成项',
        '支持拖拽快速改变状态',
        '明确责任人与截止日期，防止遗漏',
      ],
      color: 'bg-emerald-50 border-emerald-100',
    },
    {
      id: 'achievements',
      title: '成就勋章墙 (Hall of Fame)',
      icon: <Trophy className="w-8 h-8 text-amber-500" />,
      description: '记录团队的每一个里程碑与卓越时刻，通过游戏化机制激励团队持续进步。',
      highlights: [
        '自动根据 Sprint 数据结算成就勋章',
        '包含团队荣誉与个人突破多维度奖励',
        '丰富的视觉动效与庆祝反馈',
      ],
      color: 'bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4">
          欢迎使用 AgileFlow
        </h1>
        <p className="text-lg text-gray-500 font-medium">
          一站式敏捷研发协作平台，帮助团队更高效地规划、同步、复盘与持续改进。
          以下是核心功能模块的详细介绍。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
};
