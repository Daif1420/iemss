import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'primary',
  isLoading = false
}) => {
  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'primary':
      default:
        return 'bg-blue-600 hover:bg-blue-500 text-white';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 ${getButtonClass()} ${
              isLoading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'جاري المعالجة...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${
          variant === 'danger' 
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
            : variant === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          {variant === 'danger' ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
        </div>
        <div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};
