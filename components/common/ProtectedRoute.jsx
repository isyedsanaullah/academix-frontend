import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import CollegesHubLoader from './CollegesHubLoader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <CollegesHubLoader size="md" text="Verifying session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default ProtectedRoute;
