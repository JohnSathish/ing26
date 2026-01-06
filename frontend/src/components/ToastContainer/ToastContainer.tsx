import { ToastItem } from '../Toast/Toast';
import type { Toast } from '../Toast/Toast';
import './ToastContainer.css';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onRemove} />
      ))}
    </div>
  );
}

export default ToastContainer;

