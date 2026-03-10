import React from 'react';
import { BookOpen, Bug, CheckSquare } from 'lucide-react';
import { cn } from '../../utils/cn';

interface IssueTypeTagProps {
  type?: string;
  className?: string;
}

export const getTypeColor = (type?: string) => {
  switch (type?.toLowerCase()) {
    case 'story': return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case 'bug': return "text-rose-700 bg-rose-50 border-rose-200";
    default: return "text-sky-700 bg-sky-50 border-sky-200";
  }
};

export const getTypeIcon = (type?: string) => {
  switch (type?.toLowerCase()) {
    case 'story': return <BookOpen className="w-3 h-3" />;
    case 'bug': return <Bug className="w-3 h-3" />;
    default: return <CheckSquare className="w-3 h-3" />;
  }
};

export const IssueTypeTag: React.FC<IssueTypeTagProps> = ({ type, className }) => {
  return (
    <div className={cn(
      "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
      getTypeColor(type),
      className
    )}>
      {getTypeIcon(type)}
      <span>{type || 'Task'}</span>
    </div>
  );
};
