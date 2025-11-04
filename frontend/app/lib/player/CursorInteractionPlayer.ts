/**
 * Cursor Interaction Player
 *
 * Displays visual feedback for mouse click events during playback.
 * Creates animated ripple effects at click positions.
 */

export class CursorInteractionPlayer {
  private animationDuration: number = 600; // ms

  constructor() {
    this.injectStyles();
  }

  /**
   * Inject CSS styles for click animations
   */
  private injectStyles(): void {
    // Check if styles already injected
    if (document.querySelector('#player-click-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'player-click-styles';
    style.textContent = `
      .player-click-ripple {
        position: fixed;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        border: 2px solid rgba(59, 130, 246, 0.8);
        background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%);
        animation: player-click-ripple 0.6s ease-out;
      }

      @keyframes player-click-ripple {
        0% {
          width: 10px;
          height: 10px;
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          width: 50px;
          height: 50px;
          opacity: 0;
          transform: translate(-50%, -50%) scale(2);
        }
      }

      .player-click-ripple.left-click {
        border-color: rgba(59, 130, 246, 0.8);
        background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%);
      }

      .player-click-ripple.right-click {
        border-color: rgba(239, 68, 68, 0.8);
        background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0) 70%);
      }

      .player-click-ripple.middle-click {
        border-color: rgba(34, 197, 94, 0.8);
        background: radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0) 70%);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show a click animation at the specified position
   */
  showClick(x: number, y: number, button: number = 0): void {
    const ripple = document.createElement('div');
    ripple.className = 'player-click-ripple';

    // Add button-specific class
    if (button === 0) {
      ripple.classList.add('left-click');
    } else if (button === 1) {
      ripple.classList.add('middle-click');
    } else if (button === 2) {
      ripple.classList.add('right-click');
    }

    // Position the ripple
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Add to DOM
    document.body.appendChild(ripple);

    // Remove after animation completes
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, this.animationDuration);

    console.log(`[CursorInteractionPlayer] Showing click at (${x}, ${y}), button=${button}`);
  }

  /**
   * Clean up injected styles
   */
  destroy(): void {
    const styleElement = document.querySelector('#player-click-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }

    // Remove any remaining ripple elements
    const ripples = document.querySelectorAll('.player-click-ripple');
    ripples.forEach(ripple => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    });
  }
}
