import { Eye, Filter, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Issue {
    id: string;
    category: string;
    description: string;
    status: string;
    urgency: string;
    created_at: string;
    image_url: string;
}

export function DashboardPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const { user } = useAuth();

    useEffect(() => {
        fetchIssues();
    }, [filter, user]);

    const fetchIssues = async () => {
        try {
            let query = supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter by status if not 'all'
            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setIssues(data || []);
        } catch (error) {
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'pending':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'medium':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            case 'low':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Issues Dashboard
                    </h1>

                    <div className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="all">All Issues</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : issues.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            No issues found
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {issues.map((issue) => (
                            <div
                                key={issue.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {issue.image_url && (
                                    <img
                                        src={issue.image_url}
                                        alt={issue.category}
                                        className="w-full h-48 object-cover"
                                    />
                                )}

                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {issue.category}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(issue.urgency)}`}>
                                            {issue.urgency}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                                        {issue.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                                            {issue.status.replace('_', ' ')}
                                        </span>

                                        <Link
                                            to={`/issue/${issue.id}`}
                                            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View Details
                                        </Link>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {new Date(issue.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
