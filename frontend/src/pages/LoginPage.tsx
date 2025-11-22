import { useState } from 'react';
import { useAuthStore } from '../state/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const { login, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await login({ email, password });
        navigate('/jobs');
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            { }
            <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-bold text-2xl mb-12">
                        <Zap className="h-8 w-8 fill-current" />
                        <span>Siftly</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Hire the best talent,<br />
                        faster than ever.
                    </h1>
                    <p className="text-xl text-primary-foreground/80 max-w-md mb-8">
                        Our AI-powered platform automates resume screening, matching candidates to jobs with incredible accuracy.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                            <span className="text-lg">Smart Resume Parsing</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                            <span className="text-lg">AI-Driven Matching</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                            <span className="text-lg">Instant Candidate Ranking</span>
                        </div>
                    </div>
                </div>

                { }
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10 text-sm text-primary-foreground/60">
                    © 2025 ResumeAI Inc. All rights reserved.
                </div>
            </div>

            { }
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground mt-2">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            isLoading={isLoading}
                        >
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="text-center text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-primary hover:underline">
                            Sign up for free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
