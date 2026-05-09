// Load decorative CSS animations after app startup to improve initial performance
export const loadDecorativeStyles = () => {
  // Only load decorative styles after app is fully loaded
  if (document.readyState === 'complete') {
    const decorativeCSS = `
      /* Festival theme animations */
      .festival-glow {
        animation: festival-glow 2s ease-in-out infinite alternate;
      }
      
      @keyframes festival-glow {
        from {
          box-shadow: 0 0 5px var(--primary);
        }
        to {
          box-shadow: 0 0 20px var(--primary), 0 0 30px var(--primary);
        }
      }

      /* Enhanced floating apparel animations */
      .floating-apparel {
        animation: float 20s ease-in-out infinite;
      }
      
      @keyframes float {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
        }
        25% {
          transform: translateY(-20px) rotate(5deg);
        }
        50% {
          transform: translateY(0px) rotate(0deg);
        }
        75% {
          transform: translateY(-15px) rotate(-3deg);
        }
      }

      .floating-drift {
        animation: drift 30s linear infinite;
      }
      
      @keyframes drift {
        0% {
          transform: translateX(0px);
        }
        50% {
          transform: translateX(30px);
        }
        100% {
          transform: translateX(0px);
        }
      }

      /* Colorful pulse animations for apparel icons */
      .apparel-pulse {
        animation: apparel-pulse 4s ease-in-out infinite;
      }
      
      @keyframes apparel-pulse {
        0%, 100% {
          opacity: 0.3;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.1);
        }
      }

      /* Sparkle trail animation */
      .sparkle-trail {
        animation: sparkle-trail 3s ease-in-out infinite;
      }
      
      @keyframes sparkle-trail {
        0% {
          opacity: 0;
          transform: scale(0) rotate(0deg);
        }
        30% {
          opacity: 1;
          transform: scale(1) rotate(120deg);
        }
        70% {
          opacity: 1;
          transform: scale(0.8) rotate(240deg);
        }
        100% {
          opacity: 0;
          transform: scale(0) rotate(360deg);
        }
      }

      /* Colorful gradient text */
      .gradient-text {
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #fd79a8, #ffeaa7);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradient-shift 5s ease infinite;
      }
      
      @keyframes gradient-shift {
        0%, 100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }

      /* Navigation hint animations */
      .nav-hint-arrow {
        animation: nav-hint-arrow 2s ease-in-out infinite;
      }
      
      @keyframes nav-hint-arrow {
        0%, 100% {
          transform: translateX(0px);
          opacity: 0.3;
        }
        50% {
          transform: translateX(-10px);
          opacity: 1;
        }
      }

      .nav-hint-pulse {
        animation: nav-hint-pulse 2s ease-in-out infinite;
      }
      
      @keyframes nav-hint-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.2);
          opacity: 1;
        }
      }

      .nav-hint-glow {
        animation: nav-hint-glow 3s ease-in-out infinite;
      }
      
      @keyframes nav-hint-glow {
        0%, 100% {
          box-shadow: 0 0 5px var(--primary);
        }
        50% {
          box-shadow: 0 0 20px var(--primary), 0 0 30px var(--primary);
        }
      }

      /* Floating Home Button animations */
      .floating-home-enter {
        animation: floating-home-enter 0.5s ease-out;
      }
      
      @keyframes floating-home-enter {
        0% {
          transform: scale(0) rotate(-180deg);
          opacity: 0;
        }
        50% {
          transform: scale(1.2) rotate(-90deg);
          opacity: 0.8;
        }
        100% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }

      .floating-home-pulse {
        animation: floating-home-pulse 3s ease-in-out infinite;
      }
      
      @keyframes floating-home-pulse {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }
        50% {
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.5), 0 0 0 8px rgba(22, 163, 74, 0.1);
        }
      }

      .floating-home-bounce {
        animation: floating-home-bounce 2s ease-in-out infinite;
      }
      
      @keyframes floating-home-bounce {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-4px);
        }
      }

      /* Home button sparkle effect */
      .home-sparkle {
        animation: home-sparkle 4s ease-in-out infinite;
      }
      
      @keyframes home-sparkle {
        0%, 100% {
          opacity: 0;
          transform: scale(0.5) rotate(0deg);
        }
        25% {
          opacity: 1;
          transform: scale(1) rotate(90deg);
        }
        50% {
          opacity: 0.7;
          transform: scale(0.8) rotate(180deg);
        }
        75% {
          opacity: 1;
          transform: scale(1) rotate(270deg);
        }
      }
    `;

    // Inject decorative styles
    const styleElement = document.createElement('style');
    styleElement.textContent = decorativeCSS;
    styleElement.setAttribute('data-decorative-styles', 'true');
    document.head.appendChild(styleElement);
  }
};

// Auto-load decorative styles after a delay
if (typeof window !== 'undefined') {
  // Wait for app to be fully loaded before adding decorative styles
  setTimeout(() => {
    loadDecorativeStyles();
  }, 2000); // 2 second delay to prioritize app startup
}