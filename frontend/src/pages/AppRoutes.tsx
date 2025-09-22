import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import JobsPage from './JobsPage';
import ResumesPage from './ResumesPage';
import MatchPage from './MatchPage';
import ResultsPage from './ResultsPage';

export default function AppRoutes() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Navigate to="/jobs" replace />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/resumes" element={<ResumesPage />} />
                <Route path="/match" element={<MatchPage />} />
                <Route path="/results/:jobId" element={<ResultsPage />} />
                <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
            </Routes>
        </Layout>
    );
}


