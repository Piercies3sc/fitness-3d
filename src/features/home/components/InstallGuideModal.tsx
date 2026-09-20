'use client';

import { useState, useEffect } from 'react';

type Tab = 'ios' | 'android';

export function InstallGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('ios');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex min-h-10 items-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <svg
          className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
        Ana Ekrana Ekle
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative w-full max-w-sm border border-border-strong bg-surface p-6 shadow-2xl sm:p-7">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              ✕
            </button>

            {/* Header */}
            <div className="mb-5 pr-8">
              <p className="page-eyebrow mb-1">Kurulum Rehberi</p>
              <h2 id="install-guide-title" className="text-xl font-semibold tracking-[-0.04em] text-text-primary">
                Ana Ekrana Ekle
              </h2>
              <p className="mt-2 text-xs leading-5 text-text-secondary">
                Fitness 3D&apos;yi telefonunun ana ekranına ekleyerek tam ekran ve daha pratik bir antrenman deneyimi yaşayabilirsin.
              </p>
            </div>

            {/* Platform Tabs */}
            <div className="mb-5 grid grid-cols-2 gap-1 border border-border-strong/60 bg-surface-high p-1">
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`min-h-9 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'ios'
                    ? 'border border-border-strong bg-surface text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                iOS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`min-h-9 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'android'
                    ? 'border border-border-strong bg-surface text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Android
              </button>
            </div>

            {/* Instructions */}
            {activeTab === 'ios' ? (
              <div className="space-y-4">
                <ol className="space-y-2.5 text-xs leading-relaxed text-text-secondary list-decimal list-inside">
                  <li>Siteyi Safari&apos;de aç</li>
                  <li>Paylaş simgesine dokun</li>
                  <li>&quot;Ana Ekrana Ekle&quot; seçeneğine dokun</li>
                  <li>&quot;Ekle&quot; ile tamamla</li>
                </ol>
                <p className="border-t border-border-subtle pt-3 text-[11px] text-text-muted">
                  Safari kullanılması önerilir.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <ol className="space-y-2.5 text-xs leading-relaxed text-text-secondary list-decimal list-inside">
                  <li>Siteyi Chrome&apos;da aç</li>
                  <li>Sağ üstteki üç nokta menüsünü aç</li>
                  <li>&quot;Uygulamayı yükle&quot; veya &quot;Ana ekrana ekle&quot; seçeneğine dokun</li>
                  <li>Onayla</li>
                </ol>
                <p className="border-t border-border-subtle pt-3 text-[11px] text-text-muted">
                  Tarayıcı veya cihaz modeline göre ifadeler biraz farklılık gösterebilir.
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 border-t border-border-subtle pt-4 text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="button-secondary min-h-9 px-4 text-xs cursor-pointer"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
