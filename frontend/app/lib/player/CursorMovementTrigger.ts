/**
 * Cursor Movement Player
 *
 * Manages the fake cursor element.
 * Position is set directly by action scheduler - no interpolation needed.
 */

export class CursorMovementTrigger {
  private cursorElement: HTMLElement | null = null;

  /**
   * Set reference to the cursor element
   */
  setCursorElement(element: HTMLElement | null): void {
    this.cursorElement = element;
  }

  /**
   * Show the fake cursor
   */
  show(): void {
    if (this.cursorElement && this.cursorElement.style.display !== 'block') {
      this.cursorElement.style.display = 'block';
    }
  }

  /**
   * Hide the fake cursor
   */
  hide(): void {
    if (this.cursorElement && this.cursorElement.style.display !== 'none') {
      this.cursorElement.style.display = 'none';
    }
  }

  /**
   * Set cursor position immediately
   */
  setPosition(x: number, y: number): void {
    if (this.cursorElement) {
      this.cursorElement.style.left = `${x}px`;
      this.cursorElement.style.top = `${y}px`;
    }
  }

  /**
   * Clean up the cursor element
   */
  destroy(): void {
    if (this.cursorElement && this.cursorElement.parentNode) {
      this.cursorElement.parentNode.removeChild(this.cursorElement);
      this.cursorElement = null;
    }
  }
}
