import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Navbar } from '../components/Navbar';
import { supabase } from '../lib/supabase';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Issue {
    id: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    status: string;
    urgency: string;
    created_at: string;
}

export function MapPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default to Delhi

    useEffect(() => {
        fetchIssues();

        // Get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

    const fetchIssues = async () => {
        try {
            const { data, error } = await supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setIssues(data || []);
        } catch (error) {
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="h-[calc(100vh-4rem)]">
                <MapContainer
                    center={center}
                    zoom={13}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {issues.map((issue) => (
                        <Marker
                            key={issue.id}
                            position={[issue.latitude, issue.longitude]}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-semibold text-lg mb-1">{issue.category}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`px-2 py-1 rounded ${issue.status === 'resolved'
                                                ? 'bg-green-100 text-green-800'
                                                : issue.status === 'in_progress'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {issue.status}
                                        </span>
                                        <span className={`px-2 py-1 rounded ${issue.urgency === 'high'
                                                ? 'bg-red-100 text-red-800'
                                                : issue.urgency === 'medium'
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {issue.urgency}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </main>
        </div>
    );
}
