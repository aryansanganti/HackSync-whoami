import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Text,
    View,
} from 'react-native';

interface AILoadingModalProps {
    visible: boolean;
    message?: string;
    onRequestClose?: () => void;
    showRetryInfo?: boolean;
    currentAttempt?: number;
    maxAttempts?: number;
}

const { width, height } = Dimensions.get('window');

export default function AILoadingModal({
    visible,
    message = "AI is analyzing...",
    onRequestClose,
    showRetryInfo = false,
    currentAttempt = 1,
    maxAttempts = 3
}: AILoadingModalProps) {
    const { isDark } = useTheme();

    // Animation values
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    const scaleValue = useRef(new Animated.Value(0.8)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;
    const dotAnimation1 = useRef(new Animated.Value(0)).current;
    const dotAnimation2 = useRef(new Animated.Value(0)).current;
    const dotAnimation3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Main entry animation
            Animated.parallel([
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Continuous spinning animation
            const spinAnimation = Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );

            // Pulsing animation
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseValue, {
                        toValue: 1.2,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseValue, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            );

            // Animated dots sequence
            const dotSequence = Animated.loop(
                Animated.sequence([
                    Animated.timing(dotAnimation1, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotAnimation2, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotAnimation3, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotAnimation1, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotAnimation2, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotAnimation3, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            );

            spinAnimation.start();
            pulseAnimation.start();
            dotSequence.start();

            return () => {
                spinAnimation.stop();
                pulseAnimation.stop();
                dotSequence.stop();
            };
        } else {
            // Reset animations when not visible
            spinValue.setValue(0);
            pulseValue.setValue(1);
            scaleValue.setValue(0.8);
            opacityValue.setValue(0);
            dotAnimation1.setValue(0);
            dotAnimation2.setValue(0);
            dotAnimation3.setValue(0);
        }
    }, [visible]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onRequestClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Animated.View
                    style={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderRadius: 24,
                        padding: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: width * 0.7,
                        maxWidth: width * 0.9,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 10,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 20,
                        elevation: 10,
                        transform: [
                            { scale: scaleValue },
                        ],
                        opacity: opacityValue,
                    }}
                >
                    {/* Main AI Brain Icon with Pulse Effect */}
                    <Animated.View
                        style={{
                            marginBottom: 24,
                            transform: [
                                { scale: pulseValue },
                            ],
                        }}
                    >
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: isDark ? '#3b82f6' : '#60a5fa',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: isDark ? '#3b82f6' : '#60a5fa',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.3,
                                shadowRadius: 15,
                                elevation: 8,
                            }}
                        >
                            <Animated.View
                                style={{
                                    transform: [{ rotate: spin }],
                                }}
                            >
                                <Ionicons
                                    name="sparkles"
                                    size={40}
                                    color="#ffffff"
                                />
                            </Animated.View>

                            {/* Orbiting dots around the main icon */}
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    width: 100,
                                    height: 100,
                                    borderRadius: 50,
                                    transform: [{ rotate: spin }],
                                }}
                            >
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '50%',
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#ffffff',
                                        marginLeft: -3,
                                    }}
                                />
                                <View
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: '50%',
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#ffffff',
                                        marginLeft: -3,
                                    }}
                                />
                                <View
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#ffffff',
                                        marginTop: -3,
                                    }}
                                />
                                <View
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '50%',
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#ffffff',
                                        marginTop: -3,
                                    }}
                                />
                            </Animated.View>
                        </View>
                    </Animated.View>

                    {/* Neural Network Animation */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}
                    >
                        {[dotAnimation1, dotAnimation2, dotAnimation3].map((anim, index) => (
                            <Animated.View
                                key={index}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: isDark ? '#60a5fa' : '#3b82f6',
                                    marginHorizontal: 4,
                                    opacity: anim,
                                    transform: [
                                        {
                                            scale: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.5, 1.5],
                                            }),
                                        },
                                    ],
                                }}
                            />
                        ))}
                    </View>

                    {/* Main Message */}
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: '600',
                            color: isDark ? '#f9fafb' : '#111827',
                            marginBottom: 8,
                            textAlign: 'center',
                        }}
                    >
                        🤖 AI Working
                    </Text>

                    {/* Sub Message */}
                    <Text
                        style={{
                            fontSize: 16,
                            color: isDark ? '#9ca3af' : '#6b7280',
                            textAlign: 'center',
                            lineHeight: 22,
                        }}
                    >
                        {message}
                    </Text>

                    {/* Progress Indicator */}
                    <View
                        style={{
                            marginTop: 24,
                            width: '100%',
                            height: 4,
                            backgroundColor: isDark ? '#374151' : '#e5e7eb',
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}
                    >
                        <Animated.View
                            style={{
                                height: '100%',
                                backgroundColor: isDark ? '#60a5fa' : '#3b82f6',
                                borderRadius: 2,
                                transform: [
                                    {
                                        translateX: spinValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-200, 200],
                                        }),
                                    },
                                ],
                                width: '50%',
                            }}
                        />
                    </View>

                    {/* Secondary message */}
                    <Text
                        style={{
                            fontSize: 12,
                            color: isDark ? '#6b7280' : '#9ca3af',
                            textAlign: 'center',
                            marginTop: 16,
                        }}
                    >
                        {showRetryInfo && currentAttempt > 1
                            ? `Retrying... (${currentAttempt}/${maxAttempts})`
                            : 'This may take a few moments...'
                        }
                    </Text>

                    {/* Retry indicator */}
                    {showRetryInfo && currentAttempt > 1 && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 12,
                            }}
                        >
                            <Ionicons
                                name="refresh"
                                size={16}
                                color={isDark ? '#60a5fa' : '#3b82f6'}
                            />
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: isDark ? '#60a5fa' : '#3b82f6',
                                    marginLeft: 6,
                                }}
                            >
                                Service temporarily busy, retrying...
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}
