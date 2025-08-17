import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

interface LocationState {
    userLocation: { latitude: number; longitude: number; } | null;
    region: Region;
    isLoading: boolean;
    error: string | null;
}

export const useLocation = () => {
    const [state, setState] = useState<LocationState>({
        userLocation: null,
        region: {
            latitude: 19.0760, // Mumbai coordinates as default
            longitude: 72.8777,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        },
        isLoading: true,
        error: null,
    });

    const getCurrentLocation = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission Required',
                    'This app needs location access to show your position on the map and nearby civic issues.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Settings',
                            onPress: () => {
                                Linking.openSettings();
                            }
                        }
                    ]
                );
                setState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const newRegion = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };

            setState({
                userLocation: {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                },
                region: newRegion,
                isLoading: false,
                error: null,
            });

            return newRegion;
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your current location. Please check your GPS settings.',
                [{ text: 'OK' }]
            );
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Unable to get your current location'
            }));
        }
    };

    useEffect(() => {
        getCurrentLocation();
    }, []);

    return {
        ...state,
        getCurrentLocation,
    };
};
