import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import clientLogger from '@/lib/logger';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';

/**
 * Telegram Login Widget Component
 * 
 * This component integrates the Telegram Login Widget script
 * and handles the authentication callback
 */
export default function TelegramLoginWidget() {
  const { setUser } = useAuth();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [showFallback, setShowFallback] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  useEffect(() => {
    // Get bot username from environment
    const username = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    
    if (!username || username === 'your_bot_username') {
      clientLogger.warn('VITE_TELEGRAM_BOT_USERNAME not configured, showing fallback button');
      setShowFallback(true);
      return;
    }
    
    setBotUsername(username);
    const authUrl = `${window.location.origin}/api/auth/telegram/callback`;

    // Handle message from callback window
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'telegram-auth-success') {
        try {
          const { user, sessionId } = event.data;
          clientLogger.info('Telegram auth success received', { userId: user.id });
          
          // Update auth context directly with user and session
          setUser(user, sessionId);
        } catch (error) {
          clientLogger.error('Telegram login error:', error);
        }
      } else if (event.data?.error) {
        clientLogger.error('Telegram auth error:', event.data.error);
        alert('Login failed: ' + event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);

    // Load Telegram Widget script if not already loaded
    if (!scriptLoadedRef.current) {
      const existingScript = document.querySelector('script[src*="telegram-widget.js"]');
      
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.onload = () => {
          clientLogger.info('Telegram widget script loaded');
        };
        script.onerror = () => {
          clientLogger.error('Failed to load Telegram widget script');
          setShowFallback(true);
        };
        document.body.appendChild(script);
      }
      
      scriptLoadedRef.current = true;
    }

    // Create widget in container
    if (widgetContainerRef.current && botUsername) {
      const container = widgetContainerRef.current;
      container.innerHTML = '';
      
      // Wait for script to load, then create widget
      const createWidget = () => {
        if (!container.querySelector('script[data-telegram-login]')) {
          const widgetScript = document.createElement('script');
          widgetScript.async = true;
          widgetScript.src = 'https://telegram.org/js/telegram-widget.js?22';
          widgetScript.setAttribute('data-telegram-login', botUsername);
          widgetScript.setAttribute('data-size', 'medium');
          widgetScript.setAttribute('data-auth-url', authUrl);
          widgetScript.setAttribute('data-request-access', 'write');
          widgetScript.setAttribute('data-userpic', 'true');
          
          widgetScript.onerror = () => {
            clientLogger.error('Failed to create Telegram widget');
            setShowFallback(true);
          };
          
          container.appendChild(widgetScript);
          
          // Check if widget was created after a delay
          setTimeout(() => {
            if (!container.querySelector('iframe') && !container.querySelector('a')) {
              clientLogger.warn('Telegram widget did not render, showing fallback');
              setShowFallback(true);
            }
          }, 2000);
        }
      };

      // Try to create widget immediately, or wait for script to load
      const checkAndCreate = () => {
        if (document.querySelector('script[src*="telegram-widget.js"]')) {
          createWidget();
        } else {
          const checkScript = setInterval(() => {
            if (document.querySelector('script[src*="telegram-widget.js"]')) {
              clearInterval(checkScript);
              createWidget();
            }
          }, 100);
          
          // Cleanup after 5 seconds and show fallback
          setTimeout(() => {
            clearInterval(checkScript);
            if (!container.querySelector('iframe') && !container.querySelector('a')) {
              setShowFallback(true);
            }
          }, 5000);
        }
      };

      checkAndCreate();
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setUser, botUsername]);

  // Fallback button if widget doesn't load or bot username not configured
  if (showFallback || !botUsername) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => {
          alert('Telegram login is not configured. Please set VITE_TELEGRAM_BOT_USERNAME environment variable.');
        }}
      >
        <LogIn className="h-3 w-3 mr-2" />
        Login with Telegram
      </Button>
    );
  }

  return (
    <div 
      ref={widgetContainerRef} 
      className="telegram-login-container flex justify-center w-full"
      style={{ minHeight: '40px' }}
    />
  );
}

