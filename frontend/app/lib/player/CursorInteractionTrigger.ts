/**
 * Cursor Interaction Player
 *
 * Displays visual feedback for mouse click events during playback.
 * Creates animated ripple effects at click positions.
 */

export class CursorInteractionTrigger {
  private animationDuration: number = 600; // ms

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

    console.log(`[CursorInteractionTrigger] Showing click at (${x}, ${y}), button=${button}`);
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
