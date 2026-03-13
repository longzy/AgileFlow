import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle, Circle, Calendar, User as UserIcon, Plus } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editDate, setEditDate] = useState("");

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

  const updateItem = async (item: RetroActionPoint, updates: Partial<RetroActionPoint>) => {
    // Optimistic update
    setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, ...updates } : a));
    
    try {
      await fetch(`/api/actions/${item.id}?group=${encodeURIComponent(selectedGroup)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      toast.success("更新成功");
    } catch (error) {
      console.error("Failed to update item:", error);
      // Revert on failure
      setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, ...item } : a));
      toast.error("更新失败，请重试");
    }
  };

  const handleEdit = (item: RetroActionPoint) => {
    setEditingId(item.id);
    setEditDesc(item.description);
    setEditOwnerId(item.owner || "");
    setEditDate(item.dueDate || "");
  };

  const handleSave = (item: RetroActionPoint) => {
    updateItem(item, {
      description: editDesc,
      owner: editOwnerId,
      dueDate: editDate,
    });
    setEditingId(null);
  };

  const updateItemStatus = async (item: RetroActionPoint, newStatus: 'todo' | 'in-progress' | 'done') => {
    if (item.status === newStatus) return;
    updateItem(item, { status: newStatus });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const newStatus = over.id as 'todo' | 'in-progress' | 'done';
    
    const item = actionItems.find(i => i.id === itemId);
    if (!item || item.status === newStatus) return;

    updateItemStatus(item, newStatus);
  };

  const todoItems = actionItems.filter(item => item.status === 'todo');
  const inProgressItems = actionItems.filter(item => item.status === 'in-progress');
  const doneItems = actionItems.filter(item => item.status === 'done');
  
  const activeItem = activeId ? actionItems.find(item => item.id === activeId) : null;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-gray-900 mb-2">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
              onAdd={async () => {
                const newItem = {
                  id: crypto.randomUUID(),
                  description: "新任务",
                  status: "todo" as const,
                  group: selectedGroup
                };
                setActionItems(prev => [...prev, newItem]);
                try {
                  await fetch(`/api/actions?group=${encodeURIComponent(selectedGroup)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newItem)
                  });
                  toast.success("任务已创建");
                } catch (error) {
                  console.error("Failed to create item:", error);
                  setActionItems(prev => prev.filter(a => a.id !== newItem.id));
                  toast.error("创建失败");
                }
              }}
            >
              {todoItems.map(item => (
                <DraggableCard 
                  key={item.id} 
                  item={item} 
                  users={users} 
                  onEdit={() => handleEdit(item)}
                  isEditing={editingId === item.id}
                  editDesc={editDesc}
                  setEditDesc={setEditDesc}
                  editOwnerId={editOwnerId}
                  setEditOwnerId={setEditOwnerId}
                  editDate={editDate}
                  setEditDate={setEditDate}
                  onSave={() => handleSave(item)}
                  onCancel={() => setEditingId(null)}
                />
              ))}
              {todoItems.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm font-medium">
                  暂无任务
                </div>
              )}
            </DroppableColumn>

            <DroppableColumn 
              id="in-progress" 
              title="进行中 (In Progress)" 
              icon={<Calendar className="w-4 h-4 text-blue-500" />} 
              count={inProgressItems.length}
            >
              {inProgressItems.map(item => (
                <DraggableCard 
                  key={item.id} 
                  item={item} 
                  users={users} 
                  onEdit={() => handleEdit(item)}
                  isEditing={editingId === item.id}
                  editDesc={editDesc}
                  setEditDesc={setEditDesc}
                  editOwnerId={editOwnerId}
                  setEditOwnerId={setEditOwnerId}
                  editDate={editDate}
                  setEditDate={setEditDate}
                  onSave={() => handleSave(item)}
                  onCancel={() => setEditingId(null)}
                />
              ))}
              {inProgressItems.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm font-medium">
                  暂无进行中任务
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
                <DraggableCard 
                  key={item.id} 
                  item={item} 
                  users={users} 
                  onEdit={() => handleEdit(item)}
                  isEditing={editingId === item.id}
                  editDesc={editDesc}
                  setEditDesc={setEditDesc}
                  editOwnerId={editOwnerId}
                  setEditOwnerId={setEditOwnerId}
                  editDate={editDate}
                  setEditDate={setEditDate}
                  onSave={() => handleSave(item)}
                  onCancel={() => setEditingId(null)}
                />
              ))}
              {doneItems.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm font-medium">
                  暂无已完成任务
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

const DroppableColumn: React.FC<{ id: string, title: string, icon: React.ReactNode, count: number, children: React.ReactNode, onAdd?: () => void }> = ({ id, title, icon, count, children, onAdd }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 flex flex-col bg-gray-50 rounded-2xl border ${isOver ? 'border-gray-400 bg-gray-100' : 'border-gray-200'} overflow-hidden transition-colors`}
    >
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {onAdd && (
            <button onClick={onAdd} className="text-gray-500 hover:text-gray-900">
              <Plus className="w-4 h-4" />
            </button>
          )}
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
            {count}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {children}
      </div>
    </div>
  );
};

const DraggableCard: React.FC<{ 
  item: RetroActionPoint, 
  users: User[], 
  onEdit: () => void,
  isEditing: boolean,
  editDesc: string,
  setEditDesc: (val: string) => void,
  editOwnerId: string,
  setEditOwnerId: (val: string) => void,
  editDate: string,
  setEditDate: (val: string) => void,
  onSave: () => void,
  onCancel: () => void
}> = ({ item, users, onEdit, isEditing, editDesc, setEditDesc, editOwnerId, setEditOwnerId, editDate, setEditDate, onSave, onCancel }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: isEditing
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
      className={isEditing ? "" : "cursor-grab active:cursor-grabbing"}
    >
      <ActionCard 
        item={item} 
        users={users} 
        onEdit={onEdit}
        isEditing={isEditing}
        editDesc={editDesc}
        setEditDesc={setEditDesc}
        editOwnerId={editOwnerId}
        setEditOwnerId={setEditOwnerId}
        editDate={editDate}
        setEditDate={setEditDate}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
};

const ActionCard: React.FC<{ 
  item: RetroActionPoint, 
  users: User[], 
  isOverlay?: boolean,
  onEdit?: () => void,
  isEditing?: boolean,
  editDesc?: string,
  setEditDesc?: (val: string) => void,
  editOwnerId?: string,
  setEditOwnerId?: (val: string) => void,
  editDate?: string,
  setEditDate?: (val: string) => void,
  onSave?: () => void,
  onCancel?: () => void
}> = ({ item, users, isOverlay = false, onEdit, isEditing, editDesc, setEditDesc, editOwnerId, setEditOwnerId, editDate, setEditDate, onSave, onCancel }) => {
  const isDone = item.status === 'done';
  const isInProgress = item.status === 'in-progress';
  const ownerName = users.find(u => u.id === item.owner)?.name || item.owner;
  
  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-lg space-y-3">
        <textarea 
          className="w-full text-sm border border-gray-300 rounded-md p-2"
          value={editDesc}
          onChange={(e) => setEditDesc?.(e.target.value)}
        />
        <div className="space-y-2">
          <div className="text-xs text-gray-500">选择负责人</div>
          <select 
            className="w-full text-sm border border-gray-300 rounded-md p-2"
            value={editOwnerId}
            onChange={(e) => setEditOwnerId?.(e.target.value)}
          >
            <option value="">选择负责人</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="text-xs text-gray-500">截止日期</div>
          <input 
            type="date"
            className="w-full text-sm border border-gray-300 rounded-md p-2"
            value={editDate}
            onChange={(e) => setEditDate?.(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">取消</button>
          <button onClick={onSave} className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-gray-900">保存</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-xl border transition-all ${isOverlay ? 'shadow-2xl scale-105 border-gray-400 rotate-2' : 'shadow-sm'} ${!isOverlay && isDone ? 'border-emerald-200 opacity-75' : ''} ${!isOverlay && !isDone && !isInProgress ? 'border-gray-200 hover:border-gray-300 hover:shadow-md' : ''} ${!isOverlay && isInProgress ? 'border-blue-200' : ''}`}>
      <div className="flex items-start gap-3">
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
            <button onClick={onEdit} className="ml-auto text-gray-600 hover:text-gray-900">编辑</button>
          </div>
        </div>
      </div>
    </div>
  );
};
