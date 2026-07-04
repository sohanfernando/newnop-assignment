import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TaskListPage } from './pages/TaskListPage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="h-screen w-screen overflow-hidden bg-(--color-bg) text-(--color-text)">
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TaskListPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
