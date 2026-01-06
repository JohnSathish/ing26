import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

function LoadingSpinner({ size = 'medium', message, fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className={`loading-spinner ${fullScreen ? 'fullscreen' : ''}`}>
      <div className={`spinner spinner-${size}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );

  return spinner;
}

export default LoadingSpinner;

