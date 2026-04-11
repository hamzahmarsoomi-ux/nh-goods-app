import { translations, Language, isRTL } from '../i18n/translations';
import { useAuthStore } from '../store/authStore';

export const useTranslation = () => {
  const language = useAuthStore((state) => state.language);
  
  const t = (key: string): string => {
    const langTranslations = translations[language] || translations.en;
    return (langTranslations as any)[key] || key;
  };
  
  const rtl = isRTL(language);
  
  return { t, language, rtl, isRTL: rtl };
};
