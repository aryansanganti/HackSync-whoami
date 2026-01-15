import { AlertCircle, Camera, Loader2, MapPin, Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { analyzeCivicIssue } from '../lib/gemini';
import { supabase } from '../lib/supabase';

export function ReportIssuePage() {
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [aiProgress, setAiProgress] = useState('');

    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setImage(base64);
            analyzeImage(base64);
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async (base64Image: string) => {
        setAnalyzing(true);
        setError('');
        setAiProgress('Analyzing image with AI...');

        try {
            const result = await analyzeCivicIssue(
                base64Image.split(',')[1],
                (message) => setAiProgress(message)
            );

            setCategory(result.category);
            setDescription(result.description);
            setUrgency(result.urgency);
            setAiProgress('');
        } catch (err: any) {
            setError('Failed to analyze image. Please try again.');
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setError('Unable to get your location. Please enable location services.');
                }
            );
        }
    };

    const handleSubmit = async () => {
        if (!imageFile || !user) return;

        setSubmitting(true);
        setError('');

        try {
            // Upload image to Supabase Storage
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('issue-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('issue-images')
                .getPublicUrl(fileName);

            // Create issue in database
            const { error: insertError } = await supabase
                .from('issues')
                .insert({
                    reporter_id: user.id,
                    category,
                    description,
                    urgency,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    image_url: publicUrl,
                    status: 'pending',
                });

            if (insertError) throw insertError;

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to submit issue');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Report Civic Issue
                </h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Upload Photo
                        </label>

                        {!image ? (
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Upload className="h-5 w-5 mr-2" />
                                    Choose Image
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={image}
                                    alt="Issue"
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => {
                                        setImage(null);
                                        setImageFile(null);
                                        setCategory('');
                                        setDescription('');
                                    }}
                                    className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        {analyzing && (
                            <div className="mt-4 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <span>{aiProgress || 'Analyzing...'}</span>
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Select Category</option>
                            <option value="Road Damage">Road Damage</option>
                            <option value="Street Light">Street Light</option>
                            <option value="Garbage">Garbage</option>
                            <option value="Water Leak">Water Leak</option>
                            <option value="Traffic Signal">Traffic Signal</option>
                            <option value="Pothole">Pothole</option>
                            <option value="Street Sign">Street Sign</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Describe the issue..."
                        />
                    </div>

                    {/* Urgency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Urgency
                        </label>
                        <div className="flex space-x-4">
                            {(['low', 'medium', 'high'] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setUrgency(level)}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${urgency === level
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                        </label>
                        <button
                            onClick={getCurrentLocation}
                            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            <MapPin className="h-5 w-5 mr-2" />
                            Get Current Location
                        </button>
                        {location.latitude !== 0 && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!image || !category || !description || submitting}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Issue'
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
