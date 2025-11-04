/**
 * Cursor Style Player
 *
 * Applies cursor style changes to the fake cursor element during playback.
 * Maps CSS cursor values to the appropriate CSS classes defined in mouse.css.
 */

export class CursorStylePlayer {
  private cursorElement: HTMLElement | null = null;

  /**
   * Set reference to the cursor element
   */
  setCursorElement(element: HTMLElement | null): void {
    this.cursorElement = element;
  }

  /**
   * Apply a cursor style to the fake cursor element
   */
  setCursorStyle(style: string): void {
    if (!this.cursorElement) {
      console.warn('[CursorStylePlayer] No cursor element set');
      return;
    }

    // Remove all existing cursor style classes
    this.removeAllCursorClasses();

    // Normalize the style value (remove url() and other complex values)
    const normalizedStyle = this.normalizeCursorStyle(style);

    // Add the new cursor style class if not 'default' or 'auto'
    if (normalizedStyle && normalizedStyle !== 'default' && normalizedStyle !== 'auto') {
      this.cursorElement.classList.add(normalizedStyle);
      console.log(`[CursorStylePlayer] Applied cursor style: ${normalizedStyle}`);
    } else {
      console.log(`[CursorStylePlayer] Reset to default cursor`);
    }
  }

  /**
   * Normalize cursor style value to match CSS class names
   */
  private normalizeCursorStyle(style: string): string {
    // Handle URL-based cursors or fallback cursors
    // Example: "url(data:image...), pointer" -> "pointer"
    if (style.includes(',')) {
      const parts = style.split(',').map(s => s.trim());
      // Find the first non-url part
      for (const part of parts) {
        if (!part.startsWith('url(')) {
          return part;
        }
      }
    }

    // Handle url() cursors - extract fallback or ignore
    if (style.startsWith('url(')) {
      return 'default';
    }

    return style;
  }

  /**
   * Remove all cursor style classes from the cursor element
   */
  private removeAllCursorClasses(): void {
    if (!this.cursorElement) return;

    // List of all cursor style classes from mouse.css
    const cursorClasses = [
      'active',
      'alias',
      'all-scroll',
      'context-menu',
      'help',
      'copy',
      'not-allowed',
      'wait',
      'no-drop',
      'progress',
      'ew-resize',
      'nesw-resize',
      'nwse-resize',
      'ns-resize',
      'n-resize',
      'e-resize',
      's-resize',
      'w-resize',
      'ne-resize',
      'nw-resize',
      'se-resize',
      'sw-resize',
      'crosshair',
      'move',
      'pointer',
      'grab',
      'grabbing',
      'none',
      'vertical-text',
      'text',
      'zoom-in',
      'zoom-out',
    ];

    // Remove all cursor classes
    cursorClasses.forEach(className => {
      this.cursorElement?.classList.remove(className);
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cursorElement) {
      this.removeAllCursorClasses();
      this.cursorElement = null;
    }
  }
}
