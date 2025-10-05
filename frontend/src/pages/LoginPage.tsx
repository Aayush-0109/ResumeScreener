import { useState } from 'react'
import { useAuthStore } from '../state/authStore'
import Button from '../ui/components/Button'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
    const { login, isLoading } = useAuthStore()
    const navigate = useNavigate()
    const [email, setEmail] = useState('demo@example.com')
    const [password, setPassword] = useState('password')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        await login({ email, password })
        navigate('/jobs')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="hidden lg:block">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">ResumeScreener</h1>
                    <p className="text-gray-600 text-lg mb-6">AI-powered matching and parsing to shortlist candidates in minutes.</p>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>Secure, async processing with robust queueing</li>
                        <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>Detailed AI insights per candidate</li>
                        <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>Production-grade logging and error handling</li>
                    </ul>
                </div>
                <div className="w-full max-w-md lg:ml-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-1">Welcome back</h2>
                        <p className="text-gray-500 mb-6">Sign in to continue</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input className="input" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com" required />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <a className="text-sm text-blue-600 hover:underline" href="#">Forgot?</a>
                                </div>
                                <input className="input" value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
                            </div>
                            <Button type="submit" loading={isLoading} className="w-full">
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                        <div className="mt-6 text-sm text-gray-600">
                            New here? <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">By continuing, you agree to our Terms and Privacy Policy.</p>
                </div>
            </div>
        </div>
    )
}


