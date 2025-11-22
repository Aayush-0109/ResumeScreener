import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import DashboardPage from './DashboardPage';
import JobsPage from './JobsPage';
import ResumesPage from './ResumesPage';
import MatchPage from './MatchPage';
import ResultsPage from './ResultsPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { useAuthStore } from '../state/authStore';
import { useUIStore } from '../state/uiStore';
import AuthWrapper from './AuthWrapper';
import PublicOnlyWrapper from './PublicOnlyWrapper';
import { PageSpinner } from '../components/common/Spinner';

export default function AppRoutes() {
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();
    const { bootstrapping, getProfile } = useAuthStore();
    const { closeAllModals } = useUIStore();

    
    useEffect(() => {
        closeAllModals();
    }, [location.pathname, closeAllModals]);

    useEffect(() => {
        if (bootstrapping) {
            getProfile();
        }
    }, [bootstrapping, getProfile]);

    if (bootstrapping) {
        return <PageSpinner label="Loading..." />;
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            <Route element={<PublicOnlyWrapper />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<AuthWrapper />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/resumes" element={<ResumesPage />} />
                <Route path="/match" element={<MatchPage />} />
                <Route path="/results/:jobId" element={<ResultsPage />} />
            </Route>
            <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-900">404</h1>
                        <p className="mt-2 text-gray-600">Page not found</p>
                        <a href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                            Go back home
                        </a>
                    </div>
                </div>
            } />
        </Routes>
    );
}


