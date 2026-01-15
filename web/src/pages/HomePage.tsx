import { FileText, LayoutDashboard, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-blue-600 rounded-full">
                            <MapPin className="h-16 w-16 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Civic AI
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Empowering citizens to report local civic issues using AI-powered detection
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            AI-Powered Detection
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Our AI automatically identifies and categorizes civic issues from photos
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
                            <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Real-Time Tracking
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Track the status of your reports and get live updates on resolution progress
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4">
                            <LayoutDashboard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Officer Dashboard
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Efficient issue management tools for civic officers and administrators
                        </p>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    {user ? (
                        <Link
                            to="/report"
                            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors"
                        >
                            <FileText className="h-5 w-5 mr-2" />
                            Report an Issue
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors"
                        >
                            Get Started
                        </Link>
                    )}
                </div>
            </main>
        </div>
    );
}
