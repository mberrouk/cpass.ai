/**
 * Telegram Mini App Authentication Utilities
 */

const API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';

export interface TelegramAuthResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    telegram_id: string;
    full_name: string;
    phone_number?: string;
    role: string;
  };
  error?: string;
}

/**
 * Authenticate user via one-time token (for WebApp from keyboard)
 */
export async function authenticateWithToken(token: string): Promise<TelegramAuthResult> {
  try {
    const response = await fetch(`${API_URL}/telegram/auth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
      return {
        success: false,
        error: errorData.error || 'Authentication failed',
      };
    }

    const data = await response.json();
    
    // Store tokens
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    };
  } catch (error) {
    console.error('Token authentication error:', error);
    return {
      success: false,
      error: 'Network error during authentication',
    };
  }
}

/**
 * Authenticate user via Telegram WebApp initData (for WebApp from menu button)
 */
export async function authenticateWithTelegram(initData: string): Promise<TelegramAuthResult> {
  try {
    const response = await fetch(`${API_URL}/telegram/auth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ init_data: initData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
      return {
        success: false,
        error: errorData.error || 'Authentication failed',
      };
    }

    const data = await response.json();
    
    // Store tokens
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    };
  } catch (error) {
    console.error('Telegram authentication error:', error);
    return {
      success: false,
      error: 'Network error during authentication',
    };
  }
}

/**
 * Get or create worker profile for Telegram user
 */
export async function getOrCreateTelegramWorkerProfile(telegramId: string, phoneNumber?: string) {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/telegram/worker-profile/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch/create worker profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting/creating worker profile:', error);
    throw error;
  }
}

/**
 * Check if user has completed signup
 */
export async function checkSignupStatus(telegramId: string): Promise<{
  completed: boolean;
  hasProfile: boolean;
  contactVerified: boolean;
  workerId?: string;
  profileId?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/telegram/signup-status/?telegram_id=${telegramId}`);
    
    if (!response.ok) {
      return {
        completed: false,
        hasProfile: false,
        contactVerified: false,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking signup status:', error);
    return {
      completed: false,
      hasProfile: false,
      contactVerified: false,
    };
  }
}

/**
 * Extract auth token from URL params
 */
export function getAuthTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

/**
 * Extract telegram_id from URL params (for backward compatibility)
 */
export function getTelegramIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('telegram_id');
}

/**
 * Check if running in Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}
