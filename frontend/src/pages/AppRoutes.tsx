import { Route, Routes, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import Layout from '../ui/Layout';
import JobsPage from './JobsPage';
import ResumesPage from './ResumesPage';
import MatchPage from './MatchPage';
import ResultsPage from './ResultsPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { useAuthStore } from '../state/authStore';
import AuthWrapper from './AuthWrapper';
import PublicOnlyWrapper from './PublicOnlyWrapper';

export default function AppRoutes() {
    const { isAuthenticated } = useAuthStore();
    const { bootstrapping, getProfile } = useAuthStore();

    useEffect(() => {
        if (bootstrapping) {
            getProfile();
        }
    }, [bootstrapping, getProfile]);

    if (bootstrapping) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route element={<PublicOnlyWrapper />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<AuthWrapper />}>
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/resumes" element={<ResumesPage />} />
                <Route path="/match" element={<MatchPage />} />
                <Route path="/results/:jobId" element={<ResultsPage />} />
            </Route>
            <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
        </Routes>
    );
}


