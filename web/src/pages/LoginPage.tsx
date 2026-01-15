import { Lock, Mail, MapPin, UserPlus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn, signUp, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (user) {
        navigate('/');
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                await signUp(email, password);
                setError('Check your email to confirm your account!');
            } else {
                await signIn(email, password);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2">
                        <div className="p-3 bg-blue-600 rounded-full">
                            <MapPin className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            Civic AI
                        </span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>

                    {error && (
                        <div className={`mb-4 p-3 rounded-lg ${error.includes('email')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            }`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    {isSignUp ? (
                                        <>
                                            <UserPlus className="h-5 w-5 mr-2" />
                                            Sign Up
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {isSignUp
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
