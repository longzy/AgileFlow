import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    setIsOpen(false);
  }, [options]);

  const handleCancel = useCallback(() => {
    if (options?.onCancel) {
      options.onCancel();
    }
    setIsOpen(false);
  }, [options]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
            onClick={handleCancel}
          />
          
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all scale-100 opacity-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    options.type === 'danger' ? "bg-red-100 text-red-600" :
                    options.type === 'warning' ? "bg-amber-100 text-amber-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 leading-6">
                    {options.title}
                  </h3>
                </div>
                <button 
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mt-2 ml-13 pl-13">
                <p className="text-sm text-gray-500 leading-relaxed">
                  {options.message}
                </p>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  onClick={handleCancel}
                >
                  {options.cancelLabel || 'Cancel'}
                </button>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-white border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm",
                    options.type === 'danger' 
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
                      : options.type === 'warning'
                        ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  )}
                  onClick={handleConfirm}
                >
                  {options.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
};
