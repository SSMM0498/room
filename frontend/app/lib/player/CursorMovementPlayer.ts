/**
 * Cursor Movement Player
 *
 * Manages the fake cursor element.
 * Position is set directly by action scheduler - no interpolation needed.
 */

export class CursorMovementPlayer {
  private cursorElement: HTMLElement | null = null;

  constructor() {
    this.createCursorElement();
  }

  /**
   * Create the fake cursor element
   */
  private createCursorElement(): void {
    // Check if cursor already exists
    if (document.querySelector('.player-mouse')) {
      this.cursorElement = document.querySelector('.player-mouse');
      return;
    }

    // Create new cursor element
    const cursor = document.createElement('div');
    cursor.className = 'player-mouse';
    cursor.style.position = 'fixed';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999';
    cursor.style.display = 'none';

    // Add inner light element
    const light = document.createElement('div');
    light.className = 'player-mouse-light';
    cursor.appendChild(light);

    document.body.appendChild(cursor);
    this.cursorElement = cursor;
  }

  /**
   * Show the fake cursor
   */
  show(): void {
    if (this.cursorElement) {
      this.cursorElement.style.display = 'block';
    }
  }

  /**
   * Hide the fake cursor
   */
  hide(): void {
    if (this.cursorElement) {
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
