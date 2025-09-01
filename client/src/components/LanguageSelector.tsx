import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setLanguage, getLanguage, type Language } from "@/lib/i18n";

const languages = [
  { code: 'fr' as Language, label: '🇫🇷 Français' },
  { code: 'en' as Language, label: '🇬🇧 English' },
  { code: 'pt' as Language, label: '🇵🇹 Português' },
];

interface LanguageSelectorProps {
  onLanguageChange?: () => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const [currentLang, setCurrentLang] = useState<Language>('fr');

  useEffect(() => {
    setCurrentLang(getLanguage());
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setCurrentLang(newLang);
    setLanguage(newLang);
    onLanguageChange?.();
    // Trigger a re-render of the app
    window.location.reload();
  };

  return (
    <Select value={currentLang} onValueChange={handleLanguageChange}>
      <SelectTrigger 
        className="w-[140px] text-sm bg-background border border-border"
        data-testid="select-language"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} data-testid={`option-language-${lang.code}`}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
