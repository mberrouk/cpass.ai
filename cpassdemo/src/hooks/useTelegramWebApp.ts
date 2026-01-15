import { useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  close: () => void;
  ready: () => void;
  expand: () => void;
  sendData: (data: string) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: { title?: string; message: string; buttons?: any[] }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);

  useEffect(() => {
    // Check if running inside Telegram WebApp
    const tg = window.Telegram?.WebApp;
    console.log('Checking for Telegram WebApp...', tg);
    
    if (tg) {

           // Notify Telegram that the app is ready
      tg.ready();
      
      // Expand to full height
      tg.expand(); 
        setWebApp(tg);
      setIsTelegramMiniApp(true);
      // Get user data
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }



      console.log('Telegram WebApp initialized:', {
        platform: tg.platform,
        version: tg.version,
        user: tg.initDataUnsafe?.user,
      });
    } else {
      console.log('Not running in Telegram WebApp');
    }
  }, []);

  return {
    webApp,
    user,
    isTelegramMiniApp,
    initData: webApp?.initData || null,
  };
}

// Helper function to validate Telegram WebApp data with backend
export async function validateTelegramData(initData: string, apiUrl: string = 'http://localhost:8000/api'): Promise<{ valid: boolean; user?: any }> {
  try {
    const response = await fetch(`${apiUrl}/telegram/validate-webapp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ init_data: initData }),
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();
    return { valid: true, user: data.user };
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return { valid: false };
  }
}
