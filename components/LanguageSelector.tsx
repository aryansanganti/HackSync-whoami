import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface LanguageSelectorProps {
  showLabel?: boolean;
  style?: any;
}

export default function LanguageSelector({ showLabel = true, style }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const { currentLanguage, availableLanguages, changeAppLanguage, isLoading } = useLanguage();
  const { isDark } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsModalVisible(false);
      return;
    }

    try {
      await changeAppLanguage(languageCode);
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to change language');
    }
  };

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    buttonText: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#111827',
      marginLeft: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 20,
      textAlign: 'center',
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    languageItemText: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#111827',
      flex: 1,
    },
    languageItemNative: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginLeft: 8,
    },
    selectedIndicator: {
      marginLeft: 8,
    },
    closeButton: {
      marginTop: 20,
      paddingVertical: 12,
      backgroundColor: isDark ? '#3b82f6' : '#3b82f6',
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>{t('profile.language')}</Text>
      )}
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsModalVisible(true)}
        disabled={isLoading}
      >
        <Ionicons
          name="language"
          size={20}
          color={isDark ? '#60a5fa' : '#3b82f6'}
        />
        <Text style={styles.buttonText}>
          {currentLanguageInfo?.nativeName || 'English'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={isDark ? '#6b7280' : '#9ca3af'}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={styles.languageItem}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text style={styles.languageItemText}>
                    {language.name}
                  </Text>
                  <Text style={styles.languageItemNative}>
                    {language.nativeName}
                  </Text>
                  {language.code === currentLanguage && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={isDark ? '#60a5fa' : '#3b82f6'}
                      style={styles.selectedIndicator}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
