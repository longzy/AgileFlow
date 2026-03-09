import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Users, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export function GroupSelector() {
  const { groups, selectedGroup, setSelectedGroup, fetchGroups } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
        title="Select User Group"
      >
        <Users className="w-4 h-4" />
        <span className="max-w-[120px] truncate">{selectedGroup}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
            User Groups
          </div>
          {groups.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No groups found</div>
          ) : (
            groups.map((group) => (
              <button
                key={group.name}
                onClick={() => {
                  setSelectedGroup(group.name);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                  selectedGroup === group.name
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className="truncate pr-2" dangerouslySetInnerHTML={{ __html: group.html || group.name }} />
                {selectedGroup === group.name && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
