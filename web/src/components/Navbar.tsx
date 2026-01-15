import { FileText, LayoutDashboard, LogOut, MapPin, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
    const { user, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <MapPin className="h-8 w-8 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                Civic AI
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link
                                    to="/report"
                                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Report Issue</span>
                                </Link>
                                <Link
                                    to="/map"
                                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <MapPin className="h-4 w-4" />
                                    <span>Map</span>
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {user ? (
                            <>
                                <Link
                                    to="/report"
                                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FileText className="h-5 w-5" />
                                    <span>Report Issue</span>
                                </Link>
                                <Link
                                    to="/map"
                                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <MapPin className="h-5 w-5" />
                                    <span>Map</span>
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    <span>Dashboard</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        handleSignOut();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
