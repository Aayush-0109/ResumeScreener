import { useState } from 'react';
import { useAuthStore } from '../state/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
    const { register, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await register({ name, email, password });
            toast.success('Account created successfully! Welcome aboard!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Registration failed. Please try again.');
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-bold text-2xl mb-12">
                        <Zap className="h-8 w-8 fill-current" />
                        <span>ResumeAI</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Start your free trial<br />
                        today.
                    </h1>
                    <p className="text-xl text-primary-foreground/80 max-w-md mb-8">
                        Join thousands of recruiters who are saving hours every week with our AI-powered screening tool.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                            <span className="text-lg">No credit card required</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                            <span className="text-lg">14-day free trial</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                            <span className="text-lg">Cancel anytime</span>
                        </div>
                    </div>
                </div>

                {}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10 text-sm text-primary-foreground/60">
                    © 2025 ResumeAI Inc. All rights reserved.
                </div>
            </div>

            {}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="text-muted-foreground mt-2">
                            Enter your details to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="name">
                                Full Name
                            </label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
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
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Password
                            </label>
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
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
