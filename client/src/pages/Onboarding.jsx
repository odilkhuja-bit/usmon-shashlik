// ============================================
// USMON SHASHLIK — Onboarding Page
// ============================================

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../utils/i18n';
import { haptic } from '../utils/telegram';

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language } = useApp();

  const slides = [
    { emoji: '🍢', title: t('onboarding_1_title', language), text: t('onboarding_1_text', language) },
    { emoji: '📱', title: t('onboarding_2_title', language), text: t('onboarding_2_text', language) },
    { emoji: '🔥', title: t('onboarding_3_title', language), text: t('onboarding_3_text', language) },
  ];

  const handleNext = () => {
    haptic('light');
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem('usmon_onboarding', 'done');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('usmon_onboarding', 'done');
    onComplete();
  };

  return (
    <div className="onboarding">
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
        {currentSlide < slides.length - 1 && (
          <button onClick={handleSkip} style={{ padding: '8px 16px', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600 }}>
            {t('skip', language)}
          </button>
        )}
      </div>

      <div className="onboarding-slides" style={{ transform: `translateX(-${currentSlide * 100}%)`, transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {slides.map((slide, i) => (
          <div key={i} className="onboarding-slide">
            <div className="onboarding-emoji">{slide.emoji}</div>
            <h1 className="onboarding-title">{slide.title}</h1>
            <p className="onboarding-text">{slide.text}</p>
          </div>
        ))}
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-dots">
          {slides.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === currentSlide ? 'active' : ''}`} />
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleNext}>
          {currentSlide === slides.length - 1 ? t('start', language) : t('next', language)}
        </button>
      </div>
    </div>
  );
}
