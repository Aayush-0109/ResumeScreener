import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../state/authStore'
import { AppLayout } from '../components/layout/AppLayout'
import { PageSpinner } from '../components/common/Spinner'

export default function AuthWrapper() {
    const { isAuthenticated, bootstrapping } = useAuthStore()

    // Bootstrap is handled in AppRoutes - no need to duplicate here
    if (bootstrapping) {
        return <PageSpinner label="Loading..." />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <AppLayout />
}


