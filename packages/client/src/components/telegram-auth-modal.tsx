import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import clientLogger from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';

/**
 * Telegram Authentication Modal
 * 
 * Shows a modal dialog requiring Telegram authentication before accessing the site
 */
export default function TelegramAuthModal() {
  const { isAuthenticated, isLoading, setUser } = useAuth();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Modal should be open if not authenticated and not loading
  const isOpen = !isLoading && !isAuthenticated;

  useEffect(() => {
    if (!isOpen) return;

    // Get bot username from environment
    const username = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    
    if (!username || username === 'your_bot_username') {
      setShowFallback(true);
      setError('Telegram authentication is not configured. Please contact the administrator.');
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
          setError(null);
        } catch (error) {
          clientLogger.error('Telegram login error:', error);
          setError('Authentication failed. Please try again.');
        }
      } else if (event.data?.error) {
        clientLogger.error('Telegram auth error:', event.data.error);
        setError('Authentication failed: ' + event.data.error);
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
          setError('Failed to load Telegram authentication. Please refresh the page.');
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
          widgetScript.setAttribute('data-size', 'large');
          widgetScript.setAttribute('data-auth-url', authUrl);
          widgetScript.setAttribute('data-request-access', 'write');
          widgetScript.setAttribute('data-userpic', 'true');
          
          widgetScript.onerror = () => {
            clientLogger.error('Failed to create Telegram widget');
            setError('Failed to initialize Telegram authentication. Please refresh the page.');
          };
          
          container.appendChild(widgetScript);
          
          // Check if widget was created after a delay
          const checkWidget = setInterval(() => {
            const iframe = container.querySelector('iframe');
            const link = container.querySelector('a');
            if (iframe || link) {
              setWidgetReady(true);
              setShowFallback(false);
              clearInterval(checkWidget);
            }
          }, 200);
          
          // Timeout after 3 seconds
          setTimeout(() => {
            clearInterval(checkWidget);
            if (!container.querySelector('iframe') && !container.querySelector('a')) {
              clientLogger.warn('Telegram widget did not render');
              setShowFallback(true);
            }
          }, 3000);
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
          
          // Cleanup after 5 seconds
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
  }, [isOpen, botUsername, setUser]);

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-md z-[100]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            Please sign in with Telegram to access this application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {error && error.includes('not configured') ? (
            <div className="w-full p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          ) : null}
          
          {/* Telegram Widget Container */}
          <div 
            ref={widgetContainerRef} 
            className="telegram-login-container flex justify-center w-full"
            style={{ minHeight: '60px', minWidth: '200px' }}
          />
          
          {/* Fallback button - always show if bot username is set, or if widget failed */}
          {(showFallback || (botUsername && !widgetReady)) && (
            <div className="w-full flex flex-col gap-2">
              <Button
                variant="default"
                size="lg"
                className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white"
                onClick={() => {
                  if (botUsername) {
                    // Try to trigger widget manually
                    const container = widgetContainerRef.current;
                    if (container) {
                      const iframe = container.querySelector('iframe');
                      const link = container.querySelector('a');
                      if (iframe) {
                        (iframe as HTMLIFrameElement).click();
                      } else if (link) {
                        (link as HTMLAnchorElement).click();
                      } else {
                        // Open Telegram OAuth manually
                        const authUrl = `${window.location.origin}/api/auth/telegram/callback`;
                        window.open(
                          `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(window.location.origin)}&request_access=write&return_to=${encodeURIComponent(authUrl)}`,
                          '_blank',
                          'width=500,height=600'
                        );
                      }
                    }
                  } else {
                    setError('Telegram bot username is not configured. Please contact the administrator.');
                  }
                }}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login with Telegram
              </Button>
              {!widgetReady && botUsername && (
                <p className="text-xs text-muted-foreground text-center">
                  If the button above doesn't work, click here
                </p>
              )}
            </div>
          )}
          
          {!botUsername && !error && (
            <p className="text-sm text-muted-foreground text-center">
              Loading authentication...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

