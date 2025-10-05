import { useState } from 'react'
import { useAuthStore } from '../state/authStore'
import Button from '../ui/components/Button'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterPage() {
    const { register, isLoading } = useAuthStore()
    const navigate = useNavigate()
    const [name, setName] = useState('Demo User')
    const [email, setEmail] = useState('demo@example.com')
    const [password, setPassword] = useState('password')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        await register({ name, email, password })
        navigate('/jobs')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="hidden lg:block">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Create your account</h1>
                    <p className="text-gray-600 text-lg">Start screening candidates in minutes.</p>
                </div>
                <div className="w-full max-w-md lg:ml-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-1">Get started</h2>
                        <p className="text-gray-500 mb-6">No credit card required</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input className="input" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input className="input" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input className="input" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
                            </div>
                            <Button type="submit" loading={isLoading} className="w-full">
                                {isLoading ? 'Creating...' : 'Create account'}
                            </Button>
                        </form>
                        <div className="mt-6 text-sm text-gray-600">
                            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


