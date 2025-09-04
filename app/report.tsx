import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';
import AILoadingModal from '../components/AILoadingModal';
import { analyzeCivicIssue, generateIssueDescription, testGeminiConnection } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import SupabaseService from '../lib/supabase-service';
import { IssueCategory } from '../types';

export default function ReportScreen() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('AI is analyzing...');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Others');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    // Test Gemini connection
    testGeminiConnection().then(isWorking => {
      if (!isWorking) {
        Alert.alert(
          'AI Service Warning',
          'Gemini AI service may not be available. Image analysis might not work properly.'
        );
      }
    });
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to report issues');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const addressString = [
          address.street,
          address.city,
          address.region,
          address.country,
        ].filter(Boolean).join(', ');
        setLocation(prev => ({ ...prev!, address: addressString }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);

        // Show loading immediately when image is selected
        if (newImages.length === 1) {
          setLoadingMessage('🔍 Preparing image for AI analysis...');
          setIsAnalyzing(true);

          // Small delay to ensure loading screen appears before heavy processing
          setTimeout(() => {
            analyzeImage(result.assets[0].uri);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);

        // Show loading immediately when photo is taken
        if (newImages.length === 1) {
          setLoadingMessage('📸 Processing captured image...');
          setIsAnalyzing(true);

          // Small delay to ensure loading screen appears
          setTimeout(() => {
            analyzeImage(result.assets[0].uri);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setLoadingMessage('🔍 Converting image for AI analysis...');

    try {
      // Convert image to base64 using FileSystem (robust vs fetch(file://))
      const base64Data = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      if (!base64Data) throw new Error('Failed to read image as base64');

      setLoadingMessage('🤖 AI is analyzing your civic issue...');
      console.log('Sending image to Gemini for analysis...');
      const analysis = await analyzeCivicIssue(base64Data, (message, attempt, maxAttempts) => {
        setLoadingMessage(message);
      });

      // Keep loading visible while processing results
      setLoadingMessage('✨ Processing AI analysis results...');

      if (analysis.confidence > 30) {
        const mappedCategory = mapAICategory(analysis.category);
        setCategory(mappedCategory);
        setDescription(analysis.description);
        // Map urgency to priority format
        const urgencyToPriority = {
          'low': 'Low' as const,
          'medium': 'Medium' as const,
          'high': 'High' as const
        };
        setPriority(urgencyToPriority[analysis.urgency]);
        setTitle(`Issue: ${mappedCategory}`);
        setAiConfidence(analysis.confidence);

        // Show completion message before hiding loader
        setLoadingMessage('AI analysis complete! Processing results...');

        // Small delay to show completion message
        setTimeout(() => {
          setIsAnalyzing(false);
          Alert.alert(
            'AI Analysis Complete',
            `Detected: ${analysis.category} → ${mappedCategory}\nConfidence: ${analysis.confidence}%\n\nAI has automatically filled the form based on the image. You can edit the details if needed.`,
            [{ text: 'OK' }]
          );
        }, 1000);
      } else {
        setAiConfidence(analysis.confidence);

        // Show completion message before hiding loader
        setLoadingMessage('⚠️ AI analysis complete but confidence is low');

        // Small delay to show completion message
        setTimeout(() => {
          setIsAnalyzing(false);
          Alert.alert(
            'AI Analysis',
            `The image doesn't appear to show a clear civic issue (confidence: ${analysis.confidence}%). Please fill in the details manually.`,
            [{ text: 'OK' }]
          );
        }, 1000);
      }
      return;
    } catch (error) {
      console.error('Error analyzing image:', error);
      setLoadingMessage('❌ AI analysis failed');

      // Small delay to show error message
      setTimeout(() => {
        setIsAnalyzing(false);
        Alert.alert(
          'Analysis Error',
          'Failed to analyze image with AI. Please fill in the details manually.'
        );
      }, 1000);
    }
  };

  const analyzeText = async (userText: string) => {
    if (!userText.trim()) return;

    setLoadingMessage('AI is analyzing your description...');
    setIsAnalyzing(true);
    try {
      const analysis = await generateIssueDescription(userText, (message, attempt, maxAttempts) => {
        setLoadingMessage(message);
      });
      const mappedCategory = mapAICategory(analysis.category);
      setCategory(mappedCategory);
      setDescription(analysis.description);
      // Map urgency to priority format
      const urgencyToPriority = {
        'low': 'Low' as const,
        'medium': 'Medium' as const,
        'high': 'High' as const
      };
      setPriority(urgencyToPriority[analysis.urgency]);
      setTitle(`Issue: ${mappedCategory}`);

      // Show completion message before hiding loader
      setLoadingMessage('✅ AI analysis complete! Processing results...');

      // Small delay to show completion message
      setTimeout(() => {
        setIsAnalyzing(false);
        Alert.alert(
          'AI Analysis Complete',
          `Based on your description, AI suggests:\nCategory: ${analysis.category} → ${mappedCategory}\nUrgency: ${analysis.urgency}\n\nAI has updated the form. You can edit if needed.`,
          [{ text: 'OK' }]
        );
      }, 1000);
    } catch (error) {
      console.error('Error analyzing text:', error);
      setLoadingMessage('❌ AI analysis failed');

      // Small delay to show error message
      setTimeout(() => {
        setIsAnalyzing(false);
        Alert.alert('Error', 'Failed to analyze text with AI');
      }, 1000);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (newImages.length === 0) {
      setAiConfidence(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    setIsLoading(true);
    try {
      // Create unique issue ID for image uploads
      const issueId = uuid.v4() as string;

      // Upload images if any (with error handling)
      let imageUrls: string[] = [];
      if (images.length > 0) {
        try {
          setLoadingMessage('Uploading images...');
          imageUrls = await SupabaseService.uploadMultipleImages(images, issueId);
          console.log('Images uploaded successfully:', imageUrls);
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          // Don't fail the entire submission if image upload fails
          Alert.alert('Warning', 'Images could not be uploaded, but your report will still be submitted.');
        }
      }

      // Create issue data with validated category
      const validatedCategory = mapAICategory(category);
      const issueData = {
        title: title.trim(),
        description: description.trim(),
        category: validatedCategory,
        priority,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || `${location.latitude}, ${location.longitude}`,
        image_urls: imageUrls,
        is_anonymous: isAnonymous,
      };

      console.log('Submitting issue data:', JSON.stringify(issueData, null, 2));
      console.log('Category being sent:', `"${issueData.category}"`);
      console.log('Category type:', typeof issueData.category);

      let createdIssue;
      if (isAnonymous) {
        // Submit anonymously
        createdIssue = await SupabaseService.createAnonymousIssue(issueData);
      } else {
        // Get current user for authenticated submission
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          Alert.alert('Error', 'You must be logged in to submit a non-anonymous issue');
          setIsLoading(false);
          return;
        }

        // Submit with user authentication
        createdIssue = await SupabaseService.createIssue({
          ...issueData,
          reporter_id: user.id,
        });
      }

      if (createdIssue) {
        Alert.alert(
          'Success',
          isAnonymous
            ? 'Anonymous issue reported successfully! Our AI has analyzed and categorized your report for quick resolution.'
            : 'Issue reported successfully! Our AI has analyzed and categorized your report for quick resolution.',
          [{ text: 'OK', onPress: () => router.back() }]
        );

        // Reset form
        setTitle('');
        setDescription('');
        setCategory('Others');
        setPriority('Medium');
        setImages([]);
        setAiConfidence(null);
        setIsAnonymous(false);
      } else {
        throw new Error('Failed to create issue');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);

      let errorMessage = 'Please try again.';

      if (error instanceof Error) {
        const errorStr = error.message;
        if (errorStr.includes('23514') || errorStr.includes('check constraint')) {
          errorMessage = 'Invalid category selected. Please choose a different category and try again.';
        } else if (errorStr.includes('network') || errorStr.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorStr.includes('storage') || errorStr.includes('Storage')) {
          errorMessage = 'Image upload failed. Your report was submitted but without images.';
        } else {
          errorMessage = errorStr;
        }
      }

      Alert.alert('Error', `Failed to submit issue: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: IssueCategory[] = [
    'Roads',
    'Sanitation',
    'Electricity',
    'Water Supply',
    'Public Safety',
    'Others',
  ];

  // Map AI detected categories to our predefined categories
  const mapAICategory = (aiCategory: string): IssueCategory => {
    const categoryMap: Record<string, IssueCategory> = {
      'Pothole': 'Roads',
      'Road': 'Roads',
      'Traffic': 'Roads',
      'Street': 'Roads',
      'Garbage': 'Sanitation',
      'Waste': 'Sanitation',
      'Sewage': 'Sanitation',
      'Toilet': 'Sanitation',
      'Power': 'Electricity',
      'Electric': 'Electricity',
      'Lighting': 'Electricity',
      'Water': 'Water Supply',
      'Plumbing': 'Water Supply',
      'Safety': 'Public Safety',
      'Crime': 'Public Safety',
      'Security': 'Public Safety',
    };

    // Check if we have a direct mapping
    const mapped = categoryMap[aiCategory];
    if (mapped) {
      return mapped;
    }

    // Check if any of our valid categories are contained in the AI category
    const validCategories: IssueCategory[] = ['Roads', 'Sanitation', 'Electricity', 'Water Supply', 'Public Safety', 'Others'];
    for (const category of validCategories) {
      if (aiCategory.toLowerCase().includes(category.toLowerCase())) {
        return category;
      }
    }

    // Default to Others if no mapping found
    return 'Others';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#ffffff' : '#111827' }}>
              Report Issue
            </Text>
          </View>

          {/* Anonymous Toggle */}
          <TouchableOpacity
            onPress={() => setIsAnonymous(!isAnonymous)}
            style={{
              backgroundColor: isAnonymous ? (isDark ? '#059669' : '#10b981') : (isDark ? '#1f2937' : '#ffffff'),
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isAnonymous ? (isDark ? '#059669' : '#10b981') : (isDark ? '#374151' : '#e5e7eb'),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isAnonymous ? "shield-checkmark" : "shield-outline"}
                size={20}
                color={isAnonymous ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: isAnonymous ? '#ffffff' : (isDark ? '#ffffff' : '#111827'),
              }}>
                Submit Anonymously
              </Text>
            </View>
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: isAnonymous ? '#ffffff' : 'transparent',
              borderWidth: 2,
              borderColor: isAnonymous ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isAnonymous && (
                <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isDark ? '#059669' : '#10b981',
                }} />
              )}
            </View>
          </TouchableOpacity>

          {isAnonymous && (
            <View style={{
              backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: isDark ? '#059669' : '#10b981',
            }}>
              <Text style={{
                fontSize: 14,
                color: isDark ? '#9ca3af' : '#6b7280',
                fontStyle: 'italic',
              }}>
                Your report will be submitted without linking it to your account. You won't be able to track the status, but it will still be processed by officials.
              </Text>
            </View>
          )}

          {/* AI Status */}
          {aiConfidence !== null && (
            <View style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: aiConfidence > 50 ? '#10b981' : '#f59e0b',
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#111827',
                marginBottom: 4
              }}>
                AI Analysis
              </Text>
              <Text style={{
                fontSize: 12,
                color: isDark ? '#9ca3af' : '#6b7280'
              }}>
                Confidence: {aiConfidence}% • Form auto-filled by AI
              </Text>
            </View>
          )}

          {/* Image Capture */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 12
            }}>
              Photos (AI will analyze automatically)
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderRadius: 8,
                  padding: 12,
                  marginRight: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                }}
              >
                <Ionicons name="images-outline" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} />
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 }}>
                  Gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                }}
              >
                <Ionicons name="camera-outline" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} />
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 }}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>

            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {images.map((image, index) => (
                  <View key={index} style={{ marginRight: 8 }}>
                    <Image source={{ uri: image }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: '#ef4444',
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Title */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 8
            }}>
              Title 
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of the issue"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              style={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: isDark ? '#ffffff' : '#111827',
                borderWidth: 1,
                borderColor: isDark ? '#374151' : '#e5e7eb',
              }}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 8
            }}>
              Description 
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in detail (AI will analyze and suggest improvements)"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: isDark ? '#ffffff' : '#111827',
                borderWidth: 1,
                borderColor: isDark ? '#374151' : '#e5e7eb',
                textAlignVertical: 'top',
              }}
            />
            <TouchableOpacity
              onPress={() => analyzeText(description)}
              disabled={!description.trim() || isAnalyzing}
              style={{
                backgroundColor: isDark ? '#3b82f6' : '#3b82f6',
                borderRadius: 8,
                padding: 8,
                alignItems: 'center',
                marginTop: 8,
                opacity: !description.trim() || isAnalyzing ? 0.5 : 1,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500' }}>
                🤖 Analyze with AI
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 8
            }}>
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    backgroundColor: category === cat ? (isDark ? '#3b82f6' : '#3b82f6') : (isDark ? '#1f2937' : '#ffffff'),
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                  }}
                >
                  <Text style={{
                    color: category === cat ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 8
            }}>
              Priority
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {(['Low', 'Medium', 'High'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setPriority(level)}
                  style={{
                    flex: 1,
                    backgroundColor: priority === level ? (isDark ? '#3b82f6' : '#3b82f6') : (isDark ? '#1f2937' : '#ffffff'),
                    paddingVertical: 12,
                    marginHorizontal: 4,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                  }}
                >
                  <Text style={{
                    color: priority === level ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 8
            }}>
              📍 Location
            </Text>
            <View style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }}>
              {location ? (
                <View>
                  <Text style={{
                    fontSize: 14,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    marginBottom: 4
                  }}>
                    {location.address || 'Current Location'}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: isDark ? '#6b7280' : '#9ca3af'
                  }}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </View>
              ) : (
                <Text style={{
                  fontSize: 14,
                  color: isDark ? '#6b7280' : '#9ca3af'
                }}>
                  Getting location...
                </Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? (isDark ? '#6b7280' : '#9ca3af') : (isDark ? '#3b82f6' : '#3b82f6'),
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                {isAnonymous ? '🕶️ Submit Anonymous Report' : 'Submit with AI Analysis'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Loading Modal */}
      <AILoadingModal
        visible={isAnalyzing}
        message={loadingMessage}
        onRequestClose={() => {
          // Allow users to close if they want, but keep isAnalyzing true
          // until the actual analysis is complete
        }}
      />
    </SafeAreaView>
  );
}