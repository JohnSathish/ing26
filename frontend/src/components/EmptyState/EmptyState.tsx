import './EmptyState.css';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({ title, message, icon = '📭', action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      {title && <h3 className="empty-state-title">{title}</h3>}
      <p className="empty-state-message">{message}</p>
      {action && (
        <button className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;

