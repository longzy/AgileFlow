import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle, Circle, Calendar, User as UserIcon } from 'lucide-react';
import { GroupSelector } from '../common/GroupSelector';
import { RetroActionPoint } from '../../../shared/retro';
import { format } from 'date-fns';
import { User } from '../../types';
import { toast } from 'react-hot-toast';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, useDraggable, DragOverlay } from '@dnd-kit/core';

export const ActionItemBoard: React.FC = () => {
  const { selectedGroup, users } = useStore();
  const [actionItems, setActionItems] = useState<RetroActionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const fetchActionItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/actions?group=${encodeURIComponent(selectedGroup)}`);
      if (res.ok) {
        const data = await res.json();
        setActionItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch action items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActionItems();
  }, [selectedGroup]);

  const updateItemStatus = async (item: RetroActionPoint, newStatus: 'todo' | 'done') => {
    if (item.status === newStatus) return;
    
    // Optimistic update
    setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
    
    try {
      await fetch(`/api/actions/${item.id}?group=${encodeURIComponent(selectedGroup)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`已标记为 ${newStatus === 'done' ? '已完成' : '待处理'}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert on failure
      setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, status: item.status } : a));
      toast.error("状态更新失败，请重试");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const newStatus = over.id as 'todo' | 'done';
    
    const item = actionItems.find(i => i.id === itemId);
    if (!item || item.status === newStatus) return;

    updateItemStatus(item, newStatus);
  };

  const todoItems = actionItems.filter(item => item.status === 'todo');
  const doneItems = actionItems.filter(item => item.status === 'done');
  
  const activeItem = activeId ? actionItems.find(item => item.id === activeId) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <CheckCircle className="w-6 h-6" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Action Items</h1>
          </div>
          <p className="text-gray-500 font-medium max-w-xl">
            追踪和管理团队在回顾会议中产生的改进项。
            确保每一个好想法都能落地执行。支持拖拽改变状态。
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <GroupSelector />
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : actionItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">暂无 Action Items</h3>
          <p className="text-gray-500 max-w-md">
            当前团队还没有产生任何改进项。在下一次回顾会议中，记得将好的想法转化为 Action Item！
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
            <DroppableColumn 
              id="todo" 
              title="待处理 (To Do)" 
              icon={<Circle className="w-4 h-4 text-amber-500" />} 
              count={todoItems.length}
            >
              {todoItems.map(item => (
                <DraggableCard key={item.id} item={item} users={users} />
              ))}
              {todoItems.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm font-medium">
                  所有任务都已完成！🎉
                </div>
              )}
            </DroppableColumn>

            <DroppableColumn 
              id="done" 
              title="已完成 (Done)" 
              icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} 
              count={doneItems.length}
            >
              {doneItems.map(item => (
                <DraggableCard key={item.id} item={item} users={users} />
              ))}
              {doneItems.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm font-medium">
                  还没有完成的任务
                </div>
              )}
            </DroppableColumn>
          </div>
          
          <DragOverlay>
            {activeItem ? <ActionCard item={activeItem} users={users} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

const DroppableColumn = ({ id, title, icon, count, children }: { id: string, title: string, icon: React.ReactNode, count: number, children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 flex flex-col bg-gray-50 rounded-2xl border ${isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200'} overflow-hidden transition-colors`}
    >
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {children}
      </div>
    </div>
  );
};

const DraggableCard = ({ item, users }: { item: RetroActionPoint, users: User[] }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item }
  });

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef}
        className="bg-gray-100/50 border-2 border-dashed border-indigo-300 rounded-xl h-[100px] opacity-50"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <ActionCard item={item} users={users} />
    </div>
  );
};

const ActionCard = ({ item, users, isOverlay = false }: { item: RetroActionPoint, users: User[], isOverlay?: boolean }) => {
  const isDone = item.status === 'done';
  const ownerName = users.find(u => u.id === item.owner)?.name || item.owner;
  
  return (
    <div className={`bg-white p-4 rounded-xl border transition-all ${isOverlay ? 'shadow-2xl scale-105 border-indigo-400 rotate-2' : 'shadow-sm'} ${!isOverlay && isDone ? 'border-gray-200 opacity-75' : ''} ${!isOverlay && !isDone ? 'border-gray-200 hover:border-indigo-300 hover:shadow-md' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${isDone ? 'text-emerald-500' : 'text-gray-300'}`}>
          {isDone ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium mb-3 ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {item.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {item.owner && (
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <UserIcon className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{ownerName}</span>
              </div>
            )}
            {item.dueDate && (
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <Calendar className="w-3 h-3" />
                <span>{item.dueDate}</span>
              </div>
            )}
            {(item as any).createdAt && (
              <span className="text-gray-400 ml-auto">
                {format(new Date((item as any).createdAt), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
