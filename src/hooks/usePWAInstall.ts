import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallPlatformTab = 'android' | 'ios' | 'desktop' | 'qr';

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
    __isPWAInstalled?: boolean;
  }
}

export const OPEN_PWA_INSTALL_MODAL_EVENT = 'transcar:open-pwa-install-modal';

export function dispatchOpenPWAInstallModal(tab?: InstallPlatformTab) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(OPEN_PWA_INSTALL_MODAL_EVENT, { detail: { tab } })
    );
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt) {
      return window.__deferredPWAInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      Boolean(window.__isPWAInstalled) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const checkStandalone = () => {
      const standalone =
        Boolean(window.__isPWAInstalled) ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };
    checkStandalone();

    // Detect device platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIPadOS =
      window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
    const iosDevice = /iphone|ipad|ipod/.test(ua) || isIPadOS;
    const androidDevice = /android/.test(ua);
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);
    setIsMobile(iosDevice || androidDevice || /mobile/.test(ua));

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Sync any prompt already captured in index.html
    if (window.__deferredPWAInstallPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptCaptured = () => {
      if (window.__deferredPWAInstallPrompt) {
        setDeferredPrompt(window.__deferredPWAInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      window.__deferredPWAInstallPrompt = null;
      window.__isPWAInstalled = true;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-captured', handlePromptCaptured);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-captured', handlePromptCaptured);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, []);

  const install = useCallback(async () => {
    const promptToUse = deferredPrompt || window.__deferredPWAInstallPrompt;
    if (!promptToUse) return false;
    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        window.__deferredPWAInstallPrompt = null;
        window.__isPWAInstalled = true;
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  }, [deferredPrompt]);

  const getDefaultTab = useCallback((): InstallPlatformTab => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  }, [isIOS, isAndroid]);

  const triggerInstallOrGuide = useCallback(
    async (preferredTab?: InstallPlatformTab) => {
      const promptToUse = deferredPrompt || window.__deferredPWAInstallPrompt;
      if (promptToUse && !preferredTab) {
        const installed = await install();
        if (installed) return true;
      }
      dispatchOpenPWAInstallModal(preferredTab || getDefaultTab());
      return false;
    },
    [deferredPrompt, install, getDefaultTab]
  );

  return {
    isInstallable: Boolean(deferredPrompt || window.__deferredPWAInstallPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    isInIframe,
    install,
    openInstallModal: dispatchOpenPWAInstallModal,
    triggerInstallOrGuide,
    defaultTab: getDefaultTab(),
  };
}

