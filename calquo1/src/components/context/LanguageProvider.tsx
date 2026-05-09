import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'ml' | 'ta' | 'te' | 'gu' | 'kn' | 'bn';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    ml: string;
    ta: string;
    te: string;
    gu: string;
    kn: string;
    bn: string;
  };
}

const translations: Translations = {
  // Authentication
  'auth.signin': {
    en: 'Sign In',
    hi: 'साइन इन करें',
    ml: 'സൈൻ ഇൻ ചെയ്യുക',
    ta: 'உள்நுழைக',
    te: 'సైన్ ఇన్ చేయండి',
    gu: 'સાઇન ઇન કરો',
    kn: 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
    bn: 'সাইন ইন করুন'
  },
  'auth.email': {
    en: 'Email',
    hi: 'ईमेल',
    ml: 'ഇമെയിൽ',
    ta: 'மின்னஞ்சல்',
    te: 'ఇమెయిల్',
    gu: 'ઇમેઇલ',
    kn: 'ಇಮೇಲ್',
    bn: 'ইমেইল'
  },
  'auth.gstnumber': {
    en: 'GST Number',
    hi: 'जीएसटी नंबर',
    ml: 'ജിഎസ്ടി നമ്പർ',
    ta: 'ஜிஎஸ்டி எண்',
    te: 'జిఎస్టి నంబర్',
    gu: 'જીએસટી નંબર',
    kn: 'ಜಿಎಸ್ಟಿ ಸಂಖ್ಯೆ',
    bn: 'জিএসটি নম্বর'
  },
  'auth.password': {
    en: 'Password',
    hi: 'पासवर्ड',
    ml: 'പാസ്‌വേഡ്',
    ta: 'கடவுச்சொல்',
    te: 'పాస్‌వర్డ్',
    gu: 'પાસવર્ડ',
    kn: 'ಪಾಸ್‌ವರ್ಡ್',
    bn: 'পাসওয়ার্ড'
  },
  'auth.role': {
    en: 'Role',
    hi: 'भूमिका',
    ml: 'റോൾ',
    ta: 'பங்கு',
    te: 'పాత్ర',
    gu: 'ભૂમિકા',
    kn: 'ಪಾತ್ರ',
    bn: 'ভূমিকা'
  },
  'auth.manufacturer': {
    en: 'Manufacturer',
    hi: 'निर्माता',
    ml: 'നിർമ്മാതാവ്',
    ta: 'உற்பத்தியாளர்',
    te: 'తయారీదారు',
    gu: 'ઉતવાદક', 
    kn: 'ತಯಾರಿಕದಾರ',
    bn: 'প্রস্তুতকারক'
  },
  'auth.trader': {
    en: 'Trader',
    hi: 'व्यापारी',
    ml: 'ട്രേഡർ',
    ta: 'வியாபாரி',
    te: 'వర్తకుడు',
    gu: 'વેપારી',
    kn: 'ವ್ಯಾಪಾರಿ',
    bn: 'ব্যবসায়ী'
  },
  'auth.logistics-agent': {
    en: 'Logistics Agent',
    hi: 'लॉजिस्टिक्स एजेंट',
    ml: 'ലോജിസ്റ്റിക്സ് ഏജൻറ്',
    ta: 'தளவாட முகவர்',
    te: 'లాజిస్టిక్స్ ఏజెంట్',
    gu: 'લોજિસ્ટિક્સ એજન્ટ',
    kn: 'ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಏಜೆಂಟ್',
    bn: 'লজিস্টিক্স এজেন্ট'
  },
  'auth.retailer': {
    en: 'Retailer',
    hi: 'खुदरा विक्रेता',
    ml: 'റീട്ടെയിലർ',
    ta: 'சில்லறை விற்பனையாளர்',
    te: 'రిటైలర్',
    gu: 'છૂટક વિક્રેતા',
    kn: 'ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿ',
    bn: 'খুচরা বিক্রেতা'
  },
  'auth.financial': {
    en: 'Financial Agent',
    hi: 'वित्तीय एजेंट',
    ml: 'ഫിനാൻഷ്യൽ ഏജൻറ്',
    ta: 'நிதி முகவர்',
    te: 'ఆర్థిక ఏజెంట్',
    gu: 'નાણાકીય એજન્ટ',
    kn: 'ಹಣಕಾಸು ಏಜೆಂಟ್',
    bn: 'আর্থিক এজেন্ট'
  },
  'auth.agent': {
    en: 'Agent',
    hi: 'एजेंट',
    ml: 'ഏജന്റ്',
    ta: 'முகவர்',
    te: 'ఏజెంట్',
    gu: 'એજન્ટ',
    kn: 'ಏಜಂಟ್',
    bn: 'এজেন্ট'
  },
  'auth.dealer': {
    en: 'Dealer',
    hi: 'डीलर',
    ml: 'ഡീലർ',
    ta: 'விற்பனையாளர்',
    te: 'డీలర్',
    gu: 'ડીલર',
    kn: 'ಡೀಲರ್',
    bn: 'ডিলার'
  },
  'auth.admin': {
    en: 'Administrator',
    hi: 'प्रशासक',
    ml: 'അഡ്മിനിസ്ട്രേറ്റർ',
    ta: 'நிர்வாகி',
    te: 'నిర్వాహకుడు',
    gu: 'સંચાલક',
    kn: 'ನಿರ್ವಾಹಕ',
    bn: 'প্রশাসক'
  },
  
  // Navigation
  'nav.home': {
    en: 'Home',
    hi: 'होम',
    ml: 'ഹോം',
    ta: 'முகப்பு',
    te: 'హోమ్',
    gu: 'હોમ',
    kn: 'ಹೋಮ್',
    bn: 'হোম'
  },
  'nav.dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    ml: 'ഡാഷ്‌ബോർഡ്',
    ta: 'டாஷ்போர்டு',
    te: 'డాష్‌బోర్డ్',
    gu: 'ડેશબોર્ડ',
    kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    bn: 'ড্যাশবোর্ড'
  },
  'nav.mystock': {
    en: 'My Stock',
    hi: 'मेरा स्टॉक',
    ml: 'എന്റെ സ്റ്റോക്ക്',
    ta: 'என் பங்கு',
    te: 'నా స్టాక్',
    gu: 'મારો સ્ટોક',
    kn: 'ನನ್ನ ಸ್ಟಾಕ್',
    bn: 'আমার স্টক'
  },
  'nav.addstock': {
    en: 'Add Stock',
    hi: 'स्टॉक जोड़ें',
    ml: 'സ്റ്റോക്ക് ചേർക്കുക',
    ta: 'பங்கு சேர்க்கவும்',
    te: 'స్టాక్ జోడించు',
    gu: 'સ્ટોક ઉમેરો',
    kn: 'ಸ್ಟಾಕ್ ಸೇರಿಸಿ',
    bn: 'স্টক যোগ করুন'
  },
  'nav.browsestock': {
    en: 'Browse Stock',
    hi: 'स्टॉक ब्राउज़ करें',
    ml: 'സ്റ്റോക്ക് ബ്രൗസ് ചെയ്യുക',
    ta: 'பங்கு உலாவு',
    te: 'స్టాక్ బ్రౌజ్ చేయండి',
    gu: 'સ્ટોક બ્રાઉઝ કરો',
    kn: 'ಸ್ಟಾಕ್ ಬ್ರೌಸ್ ಮಾಡಿ',
    bn: 'স্টক ব্রাউজ করুন'
  },
  'nav.orders': {
    en: 'Orders',
    hi: 'ऑर्डर',
    ml: 'ഓർഡറുകൾ',
    ta: 'ஆர்டர்கள்',
    te: 'ఆర్డర్లు',
    gu: 'ઓર્ડર',
    kn: 'ಆರ್ಡರ್‌ಗಳು',
    bn: 'অর্ডার'
  },
  'nav.payments': {
    en: 'Payments',
    hi: 'भुगतान',
    ml: 'പേയ്‌മെന്റുകൾ',
    ta: 'கொடுப்பனவுகள்',
    te: 'చెల్లింపులు',
    gu: 'ચુકવણી',
    kn: 'ಪಾವತಿಗಳು',
    bn: 'পেমেন্ট'
  },
  'nav.profile': {
    en: 'Profile',
    hi: 'प्रोफ़ाइल',
    ml: 'പ്രൊഫൈൽ',
    ta: 'சுயவிவரம்',
    te: 'ప్రొఫైల్',
    gu: 'પ્રોફાઇલ',
    kn: 'ಪ್ರೊಫೈಲ್',
    bn: 'প্রোফাইল'
  },
  'nav.settings': {
    en: 'Settings',
    hi: 'सेटिंग्स',
    ml: 'ക്രമീകരണങ്ങൾ',
    ta: 'அமைப்புகள்',
    te: 'సెట్టింగ్‌లు',
    gu: 'સેટિંગ્સ',
    kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    bn: 'সেটিংস'
  },
  'nav.suppliers': {
    en: 'Suppliers',
    hi: 'आपूर्तिकर्ता',
    ml: 'വിതരണംക്കാർ',
    ta: 'வி ધરણય',
    te: 'సరఫరాదారులు',
    gu: 'સપ્લાયર્સ',
    kn: 'ಪೂರೈಕೆದಾರರು',
    bn: 'সরবরাহকারী'
  },
  'nav.back': {
    en: 'Back',
    hi: 'वापस',
    ml: 'തിരികെ',
    ta: 'பின்பு',
    te: 'వెనుకకు',
    gu: 'પાછળ',
    kn: 'ಹಿಂದೆ',
    bn: 'পিছনে'
  },

  // Profile
  'profile.fullname': {
    en: 'Full Name',
    hi: 'पूरा नाम',
    ml: 'പൂർണ്ണ നാമം',
    ta: 'முழு பெயர்',
    te: 'పూర్తి పేరు',
    gu: 'પૂરું નામ',
    kn: 'ಪೂರ್ಣ ಹೆಸರು',
    bn: 'পূর্ণ নাম'
  },
  'profile.phone': {
    en: 'Phone Number',
    hi: 'फोन नंबर',
    ml: 'ഫോൺ നമ്പർ',
    ta: 'தொலைபேசி எண்',
    te: 'ఫోన్ నంబర్',
    gu: 'ફોન номер',
    kn: 'ಫೋನ್ ಸಂಖ್ಯ'
  },
  'profile.address': {
    en: 'Address',
    hi: 'पता',
    ml: 'വിലാസം',
    ta: 'முகவரி',
    te: 'చిరునామా',
    gu: 'સરનામું',
    kn: 'ವಿಳಾಸ',
    bn: 'ঠিকানা'
  },
  'profile.company': {
    en: 'Company',
    hi: 'कंपनी',
    ml: 'കമ്പനി',
    ta: 'நிறுவனம்',
    te: 'కంపెనీ',
    gu: 'કંપની',
    kn: 'ಕಂಪನಿ',
    bn: 'কোম্পানি'
  },
  'profile.businesscategory': {
    en: 'Business Category',
    hi: 'व्यवसाय श्रेणी',
    ml: 'ബിസിനസ്സ് വിഭാഗം',
    ta: 'வணிக வகை',
    te: 'వ్యాపార వర్గం',
    gu: 'બિઝનેસ ટેસ્ટી',
    kn: 'ವ್ಯಾಪಾರ ವರ್ಗ',
    bn: 'ব্যবসার ধরন'
  },
  
  // Stock
  'stock.productname': {
    en: 'Product Name',
    hi: 'उत्पाद का नाम',
    ml: 'ഉൽപ്പന്ന നാമം',
    ta: 'தயாரிப்பு பெயர்',
    te: 'ఉత్పత్తి పేరు',
    gu: 'ઉત્પાદનનું નામ',
    kn: 'ಉತ್ಪನ್ನದ ಹೆಸರು',
    bn: 'পণ্যের নাম'
  },
  'stock.category': {
    en: 'Category',
    hi: 'श्रेणी',
    ml: 'വിഭാഗം',
    ta: 'வகை',
    te: 'వర్గం',
    gu: 'કેટેગરી',
    kn: 'ವರ್ಗ',
    bn: 'বিভাগ'
  },
  'stock.quantity': {
    en: 'Quantity',
    hi: 'मात्रा',
    ml: 'അളവ്',
    ta: 'அளவு',
    te: 'పరిమాణం',
    gu: 'માત્રા',
    kn: 'ಪ್ರಮಾಣ',
    bn: 'পরিমাণ'
  },
  'stock.price': {
    en: 'Price',
    hi: 'मूल्य',
    ml: 'വില',
    ta: 'விலை',
    te: 'ధర',
    gu: 'કિંમત',
    kn: 'ಬೆಲೆ',
    bn: 'দাম'
  },
  'stock.additem': {
    en: 'Add Stock Item',
    hi: 'स्टॉक आइटम जोड़ें',
    ml: 'സ്റ്റോക്ക് ഇനം ചേർക്കുക',
    ta: 'பங்கு பொருள் சேர்',
    te: 'స్టాక్ ఐటమ్ జోడించు',
    gu: 'સ્ટોક આઇટમ ઉમેરો',
    kn: 'ಸ್ಟಾಕ್ ಐಟಂ ಸೇರಿಸಿ',
    bn: 'স্টক আইটেম যোগ করুন'
  },
  
  // Orders
  'order.placeorder': {
    en: 'Send Request',
    hi: 'अनुरोध भेजें',
    ml: 'അഭ്യർത്ഥന അയയ്ക്കുക',
    ta: 'கோரிக்கை அனுப்பவும்',
    te: 'అభ్యర్థన పంపండి',
    gu: 'વિનંતી મોકલો',
    kn: 'ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಿ',
    bn: 'অনুরোধ পাঠান'
  },
  'order.ordernow': {
    en: 'Send Request',
    hi: 'अनुरोध भेजें',
    ml: 'അഭ്യർത്ഥന അയയ്ക്കുക',
    ta: 'கோரிக்கை அனுப்பவும்',
    te: 'అభ్యర్థన పంపండి',
    gu: 'વિનંતી મોકલો',
    kn: 'ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಿ',
    bn: 'অনুরোধ পাঠান'
  },
  
  // Common
  'common.cancel': {
    en: 'Cancel',
    hi: 'रद्द करें',
    ml: 'റദ്ദാക്കുക',
    ta: 'ரத்து செய்',
    te: 'రద్దు చేయండి',
    gu: 'રદ કરો',
    kn: 'ರದ್ದೂಕಾರಣ',
    bn: 'বাতিল করুন'
  },
  'common.save': {
    en: 'Save',
    hi: 'सहेजें',
    ml: 'സംരക്‍ഷിക്കുക',
    ta: 'சேமி',
    te: 'సేవ్ చేయండి',
    gu: 'સેવ કરો',
    kn: 'ಉಳಿಸಿ',
    bn: 'সংরক্ষণ করুন'
  },
  'common.edit': {
    en: 'Edit',
    hi: 'संपादित करें',
    ml: 'എഡിറ്റ് ചെയ്യുക',
    ta: 'திருத்து',
    te: 'సవరించు',
    gu: 'એડિટ કરો',
    kn: 'ಸಂಪಾದಿಸಿ',
    bn: 'সম্পাদনা করুন'
  },
  'common.delete': {
    en: 'Delete',
    hi: 'मिटाएं',
    ml: 'ഇല്ലാതാക്കുക',
    ta: 'நீக்கு',
    te: 'తొలగించు',
    gu: 'ડિલીટ કરે છે',
    kn: 'ಅಳಿಸಿ',
    bn: 'মুছে ফেলুন'
  },
  'common.loading': {
    en: 'Loading...',
    hi: 'लोड हो रहा है...',
    ml: 'ലോഡിംഗ്...',
    ta: 'ஏற்றுகிறது...',
    te: 'లోడ్ అవుతోంది...',
    gu: 'લોડ થઈ રહ્યું છે...',
    kn: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    bn: 'লোড হচ্ছে...'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
