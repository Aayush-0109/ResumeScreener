import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../state/authStore'
import { AppLayout } from '../components/layout/AppLayout'
import { PageSpinner } from '../components/common/Spinner'

export default function AuthWrapper() {
    const { isAuthenticated, bootstrapping, getProfile } = useAuthStore()

    useEffect(() => {
        if (bootstrapping) {
            getProfile()
        }
    }, [bootstrapping, getProfile])

    if (bootstrapping) {
        return <PageSpinner label="Loading..." />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <AppLayout>
            <Outlet />
        </AppLayout>
    )
}


