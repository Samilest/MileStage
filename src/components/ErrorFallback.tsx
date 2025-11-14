import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import Card from './Card';

interface ErrorFallbackProps {
  type: 'notfound' | 'permission' | 'auth' | 'general';
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ type, message, onRetry }: ErrorFallbackProps) {
  const navigate = useNavigate();

  const getErrorContent = () => {
    switch (type) {
      case 'notfound':
        return {
          title: 'Project not found',
          description: message || "This project doesn't exist or has been deleted.",
          icon: <AlertCircle className="w-16 h-16 text-slate-400" />,
          actions: (
            <Button onClick={() => navigate('/dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          ),
        };

      case 'permission':
        return {
          title: 'Access denied',
          description:
            message || "You don't have permission to access this project.",
          icon: <AlertCircle className="w-16 h-16 text-amber-400" />,
          actions: (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          ),
        };

      case 'auth':
        return {
          title: 'Authentication required',
          description: message || 'Please sign in to continue.',
          icon: <AlertCircle className="w-16 h-16 text-blue-400" />,
          actions: (
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          ),
        };

      default:
        return {
          title: 'Something went wrong',
          description:
            message || 'An unexpected error occurred. Please try again.',
          icon: <AlertCircle className="w-16 h-16 text-red-400" />,
          actions: (
            <div className="flex gap-3">
              {onRetry && (
                <Button onClick={onRetry}>Try Again</Button>
              )}
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          ),
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center space-y-6 p-8">
          <div className="flex justify-center">{content.icon}</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {content.title}
            </h1>
            <p className="text-slate-600">{content.description}</p>
          </div>
          <div className="flex justify-center">{content.actions}</div>
        </div>
      </Card>
    </div>
  );
}
