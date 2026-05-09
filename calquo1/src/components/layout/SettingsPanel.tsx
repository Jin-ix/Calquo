import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useLanguage, Language } from '../context/LanguageProvider';
import { useTheme, FestivalTheme } from '../context/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { Globe, Palette, User } from 'lucide-react';

interface SettingsPanelProps {
  onProfileClick: () => void;
}

export function SettingsPanel({ onProfileClick }: SettingsPanelProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, getFestivalName, availableThemes } = useTheme();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('nav.settings')}</h1>
      </div>

      <div className="grid gap-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Select Language</Label>
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      🇺🇸 English
                    </div>
                  </SelectItem>
                  <SelectItem value="hi">
                    <div className="flex items-center gap-2">
                      🇮🇳 हिन्दी (Hindi)
                    </div>
                  </SelectItem>
                  <SelectItem value="ml">
                    <div className="flex items-center gap-2">
                      🇮🇳 മലയാളം (Malayalam)
                    </div>
                  </SelectItem>
                  <SelectItem value="ta">
                    <div className="flex items-center gap-2">
                      🇮🇳 தமிழ் (Tamil)
                    </div>
                  </SelectItem>
                  <SelectItem value="te">
                    <div className="flex items-center gap-2">
                      🇮🇳 తెలుగు (Telugu)
                    </div>
                  </SelectItem>
                  <SelectItem value="gu">
                    <div className="flex items-center gap-2">
                      🇮🇳 ગુજરાતી (Gujarati)
                    </div>
                  </SelectItem>
                  <SelectItem value="kn">
                    <div className="flex items-center gap-2">
                      🇮🇳 ಕನ್ನಡ (Kannada)
                    </div>
                  </SelectItem>
                  <SelectItem value="bn">
                    <div className="flex items-center gap-2">
                      🇮🇳 বাংলা (Bengali)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Festival Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Choose Festival Theme</Label>
              <Select value={theme} onValueChange={(value: FestivalTheme) => setTheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableThemes.map((themeOption) => (
                    <SelectItem key={themeOption} value={themeOption}>
                      <div className="flex items-center gap-2">
                        {getThemeEmoji(themeOption)}
                        {getFestivalName(themeOption, language)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Experience the app with beautiful color schemes inspired by Indian festivals and celebrations.</p>
            </div>

            {/* Theme Preview */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="h-8 rounded-md" style={{ backgroundColor: 'var(--primary)' }}></div>
              <div className="h-8 rounded-md" style={{ backgroundColor: 'var(--secondary)' }}></div>
              <div className="h-8 rounded-md" style={{ backgroundColor: 'var(--accent)' }}></div>
              <div className="h-8 rounded-md" style={{ backgroundColor: 'var(--muted)' }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.profile.fullName}</p>
                <p className="text-sm text-muted-foreground">{user.profile.email}</p>
                <p className="text-sm text-muted-foreground">{user.profile.company}</p>
              </div>
              <Button onClick={onProfileClick} variant="outline">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>CALICO - B2B Apparel Management</p>
            <p>Version 1.0.0</p>
            <p>Made for the Indian apparel industry</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getThemeEmoji(theme: FestivalTheme): string {
  const emojis: Record<FestivalTheme, string> = {
    default: '🎨',
    sustainable: '🌿',
    diwali: '🪔',
    holi: '🌈',
    dussehra: '🏹',
    ganesh: '🐘',
    navratri: '💃',
    'karva-chauth': '🌙',
    onam: '🌺',
    eid: '🌙',
    christmas: '🎄'
  };
  return emojis[theme] || '🎨';
}
