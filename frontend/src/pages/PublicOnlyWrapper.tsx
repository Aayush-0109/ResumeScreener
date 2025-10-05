import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../state/authStore'

export default function PublicOnlyWrapper() {
    const { isAuthenticated, bootstrapping, getProfile } = useAuthStore()

    useEffect(() => {
        if (bootstrapping) getProfile()
    }, [bootstrapping, getProfile])

    if (bootstrapping) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (isAuthenticated) {
        return <Navigate to="/jobs" replace />
    }

    return <Outlet />
}


