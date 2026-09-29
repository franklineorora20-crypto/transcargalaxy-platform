import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  QrCode,
  X,
  Check,
  Share,
  MoreVertical,
  PlusSquare,
  ExternalLink,
  Copy,
  Sparkles,
  WifiOff,
  Zap,
  Ticket,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  usePWAInstall,
  OPEN_PWA_INSTALL_MODAL_EVENT,
  InstallPlatformTab,
} from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'mobile-drawer' | 'footer' | 'inline';
  className?: string;
  onActionComplete?: () => void;
}

const BANNER_DISMISSED_KEY = 'transcar_pwa_banner_dismissed_v2';

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  onActionComplete,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, triggerInstallOrGuide } =
    usePWAInstall();

  // If already running as an installed standalone PWA, hide the install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    await triggerInstallOrGuide();
    if (onActionComplete) {
      onActionComplete();
    }
  };

  if (variant === 'mobile-drawer') {
    return (
      <div className="p-3 rounded-xl bg-slate-950 text-white border border-slate-800 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-extrabold shadow-sm">
            <Download className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>Install TransCar App</span>
              {isInstallable && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {isInstallable
                ? '1-tap install • Works offline'
                : isIOS
                ? 'Add to iPhone Home Screen'
                : isAndroid
                ? 'Add to Android Home Screen'
                : 'Fast access & offline tickets'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="craft-btn-amber text-xs px-3.5 py-2 font-bold shrink-0 min-h-[38px] cursor-pointer whitespace-nowrap"
        >
          {isInstallable ? 'Install Now' : 'Install'}
        </button>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install TransCar App (Phone & PC)</span>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`craft-btn-amber text-xs sm:text-sm px-4 py-2.5 font-bold inline-flex items-center justify-center gap-2 min-h-[44px] cursor-pointer whitespace-nowrap ${className}`}
      >
        <Download className="w-4 h-4 stroke-[2.5] shrink-0" />
        <span>{isInstallable ? 'Install App (1-Click)' : 'Install TransCar App'}</span>
      </button>
    );
  }

  // Default 'header' variant: compact button for top bar
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`craft-btn-secondary text-[11px] px-2 py-1 inline-flex items-center gap-1 whitespace-nowrap font-semibold border-slate-300 hover:border-amber-400 hover:bg-amber-50/70 text-slate-800 transition-all cursor-pointer h-7 sm:h-8 min-h-[28px] rounded-lg ${className}`}
      title="Install TransCar App on your phone or computer for fast offline access"
    >
      <Download className="w-3 h-3 text-amber-600 shrink-0 stroke-[2.25]" />
      <span>Install</span>
      {isInstallable && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
          title="1-Click Direct Install Ready"
        />
      )}
    </button>
  );
};

/**
 * Global Dismissible Floating Install Banner + Unified Device-Aware Install Modal
 * Mount once inside App.tsx so any install trigger opens a clean, unified experience.
 */
export const PWAInstallManager: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInIframe,
    install,
    defaultTab,
  } = usePWAInstall();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InstallPlatformTab>(defaultTab);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showFloatingBanner, setShowFloatingBanner] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://transcarrongai.co.ke';

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Listen for global modal open requests from any button across the site
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: InstallPlatformTab }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      } else {
        setActiveTab(defaultTab);
      }
      setIsModalOpen(true);
    };

    window.addEventListener(OPEN_PWA_INSTALL_MODAL_EVENT, handleOpenModal);
    return () => {
      window.removeEventListener(OPEN_PWA_INSTALL_MODAL_EVENT, handleOpenModal);
    };
  }, [defaultTab]);

  // Generate QR code for the app URL so desktop users can scan with their phone
  useEffect(() => {
    if (!appUrl) return;
    QRCode.toDataURL(appUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0A0A0A',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [appUrl]);

  // Show non-intrusive bottom install bar after 12 seconds dwell if not installed and not dismissed
  useEffect(() => {
    if (isInstalled || bannerDismissed) {
      setShowFloatingBanner(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowFloatingBanner(true);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [isInstalled, bannerDismissed]);

  const handleDismissBanner = () => {
    setShowFloatingBanner(false);
    setBannerDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        window.setTimeout(() => {
          setIsModalOpen(false);
          setShowFloatingBanner(false);
        }, 1200);
        return;
      }
    }
    setIsModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback copy
    }
  };

  if (isInstalled && !installSuccess) {
    return null;
  }

  return (
    <>
      {/* Non-Intrusive Bottom-Left Floating Install Bar */}
      {showFloatingBanner && !isModalOpen && (
        <div
          role="region"
          aria-label="Install TransCar App"
          className="fixed bottom-4 left-3 right-20 sm:right-auto sm:left-5 sm:bottom-5 z-40 max-w-sm bg-slate-950/95 text-white backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/icons/icon-192.png"
              alt="TransCar App Icon"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl border border-amber-400/40 shrink-0 object-cover bg-slate-900"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-white truncate">
                  Install TransCar App
                </span>
                {isInstallable && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {isInstallable
                  ? '1-tap install • Offline QR tickets'
                  : 'Add to Home Screen for fast booking'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDirectInstall}
              className="craft-btn-amber text-xs px-3 py-2 font-bold min-h-[38px] whitespace-nowrap cursor-pointer"
            >
              {isInstallable ? 'Install' : 'Get App'}
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              aria-label="Dismiss install banner"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Unified Interactive Install Guide & 1-Click Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/icons/icon-192.png"
                  alt="TransCar App"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl border border-amber-400/50 shrink-0 bg-slate-900"
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Fast & Lightweight Web App
                  </div>
                  <h3
                    id="pwa-install-modal-title"
                    className="text-base sm:text-lg font-extrabold text-white truncate"
                  >
                    Install TransCar rongai App
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close install dialog"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
              {/* Benefits Strip */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <WifiOff className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-slate-900 block">Works Offline</span>
                  <span className="text-[10px] text-slate-500">View QR passes</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Zap className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-slate-900 block">1-Tap Launch</span>
                  <span className="text-[10px] text-slate-500">From home screen</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Ticket className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-slate-900 block">No App Store</span>
                  <span className="text-[10px] text-slate-500">Instant 0 MB wait</span>
                </div>
              </div>

              {/* 1-Click Direct Native Install Banner (When Supported & Ready) */}
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-emerald-950 text-white border border-emerald-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>1-Click Direct Installation Ready</span>
                    </div>
                    <p className="text-xs text-emerald-100">
                      Your browser supports instant 1-tap installation onto your device.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="craft-btn-amber text-xs px-4 py-2.5 font-extrabold shrink-0 min-h-[42px] cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 mr-1.5 inline" />
                    <span>Install Now</span>
                  </button>
                </div>
              )}

              {/* Embedded Preview / Iframe Helper (if viewing inside an iframe where browsers block prompt) */}
              {!isInstallable && isInIframe && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-slate-900 space-y-2.5">
                  <div className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Tip: Open in a Full Browser Tab for 1-Click Install</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Browsers disable direct app installation inside embedded preview frames. Open the app in a full browser tab to enable 1-click installation:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="craft-btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 font-bold min-h-[38px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open in Full Browser Tab</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="craft-btn-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5 font-semibold min-h-[38px] cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copy App Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Device Selector Tabs */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Choose Your Device for Simple Instructions:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'android'
                        ? 'bg-slate-950 text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>Android</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'ios'
                        ? 'bg-slate-950 text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>iPhone / iPad</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('desktop')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'desktop'
                        ? 'bg-slate-950 text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span>Computer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('qr')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'qr'
                        ? 'bg-slate-950 text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 shrink-0" />
                    <span>Scan QR</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Android Instructions */}
              {activeTab === 'android' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">
                      Install on Android (Chrome, Samsung Internet, Edge)
                    </h4>
                    {isAndroid && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Detected Device
                      </span>
                    )}
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        Tap the browser menu icon{' '}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900">
                          <MoreVertical className="w-3 h-3 mr-0.5" /> ⋮
                        </span>{' '}
                        in the top-right corner of Chrome.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        Select{' '}
                        <strong className="text-slate-950">“Install app”</strong> or{' '}
                        <strong className="text-slate-950">“Add to Home screen”</strong> from the menu.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        Tap <strong className="text-slate-950">Install</strong>. The{' '}
                        <strong className="text-slate-950">TransCar</strong> app icon will appear right on your phone home screen!
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Tab 2: iPhone / iPad Instructions */}
              {activeTab === 'ios' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">
                      Install on iPhone or iPad (Safari)
                    </h4>
                    {isIOS && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Detected Device
                      </span>
                    )}
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        Tap the{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900">
                          <Share className="w-3 h-3 text-blue-600" /> Share
                        </span>{' '}
                        button at the bottom of Safari (or top-right on iPad).
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        Scroll down the share sheet and tap{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900">
                          <PlusSquare className="w-3 h-3" /> Add to Home Screen
                        </span>
                        .
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        Tap <strong className="text-slate-950">Add</strong> in the top-right corner to place TransCar on your iPhone home screen.
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Tab 3: Desktop / Laptop Instructions */}
              {activeTab === 'desktop' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">
                    Install on Computer / Laptop (Chrome, Edge, Safari)
                  </h4>
                  <ol className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        Look at the right side of your browser’s address bar (URL bar) and click the{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900">
                          <Download className="w-3 h-3" /> Install TransCar
                        </span>{' '}
                        icon.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        Or open your browser menu{' '}
                        <strong className="text-slate-950">(⋮)</strong> →{' '}
                        <strong className="text-slate-950">Cast, save, and share</strong> →{' '}
                        <strong className="text-slate-950">Install page as app...</strong>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        Want it on your phone instead? Switch to the{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('qr')}
                          className="text-amber-700 underline font-bold cursor-pointer"
                        >
                          Scan QR tab
                        </button>{' '}
                        to scan with your phone camera!
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Tab 4: Scan QR Code to Install on Phone */}
              {activeTab === 'qr' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  {qrDataUrl && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                      <img
                        src={qrDataUrl}
                        alt="Scan QR Code to install TransCar on your phone"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  )}
                  <div className="space-y-2 text-center sm:text-left">
                    <h4 className="text-sm font-extrabold text-slate-950">
                      Scan with Your Phone Camera
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Point your Android or iPhone camera at this QR code to open{' '}
                      <strong className="text-slate-900">TransCar rongai</strong> directly on your phone, then tap{' '}
                      <strong className="text-slate-900">Install App</strong>.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="craft-btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 font-semibold cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied App Link!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy App Link</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                {isInstallable && (
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="craft-btn-amber text-xs px-4 py-2 font-bold cursor-pointer"
                  >
                    Install Now (1-Click)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="craft-btn-primary text-xs px-4 py-2 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

