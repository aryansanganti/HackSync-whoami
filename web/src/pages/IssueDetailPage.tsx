import { AlertCircle, Calendar, Loader2, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { supabase } from '../lib/supabase';

interface Issue {
    id: string;
    category: string;
    description: string;
    status: string;
    urgency: string;
    latitude: number;
    longitude: number;
    created_at: string;
    image_url: string;
    reporter_id: string;
}

export function IssueDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchIssue();
        }
    }, [id]);

    const fetchIssue = async () => {
        try {
            const { data, error } = await supabase
                .from('issues')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setIssue(data);
        } catch (err: any) {
            setError('Failed to load issue details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (!issue) return;

        try {
            const { error } = await supabase
                .from('issues')
                .update({ status: newStatus })
                .eq('id', issue.id);

            if (error) throw error;
            setIssue({ ...issue, status: newStatus });
        } catch (err: any) {
            console.error('Error updating status:', err);
            setError('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    if (error || !issue) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                        <p className="text-red-700 dark:text-red-300">{error || 'Issue not found'}</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-6 text-blue-600 dark:text-blue-400 hover:underline"
                >
                    ← Back to Dashboard
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {issue.image_url && (
                        <img
                            src={issue.image_url}
                            alt={issue.category}
                            className="w-full h-96 object-cover"
                        />
                    )}

                    <div className="p-6 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {issue.category}
                            </h1>
                            <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${issue.status === 'resolved'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        : issue.status === 'in_progress'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                    {issue.status.replace('_', ' ')}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${issue.urgency === 'high'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        : issue.urgency === 'medium'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    }`}>
                                    {issue.urgency} urgency
                                </span>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Description
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                {issue.description}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start space-x-2">
                                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Location
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Reported On
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(issue.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Update Buttons (for officers) */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Update Status
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {['pending', 'in_progress', 'resolved'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(status)}
                                        disabled={issue.status === status}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${issue.status === status
                                                ? 'bg-blue-600 text-white cursor-default'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
