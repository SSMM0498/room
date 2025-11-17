/**
 * EditorScrollPlayer - Plays back editor scroll events
 *
 * Receives callbacks from the editor component and triggers scroll actions
 * during playback. Sets positions directly like cursor movement - no animation.
 * The Player scheduler handles timing, similar to CursorMovementPlayer.
 */

export class EditorScrollPlayer {
  private onScrollCallback: ((filePath: string, top: number, left: number) => void) | null = null;

  /**
   * Register callback for scroll playback
   * Called by editor component to register how to handle scroll events
   * @param callback - Function to execute when scroll event is played
   */
  setOnScroll(callback: (filePath: string, top: number, left: number) => void): void {
    this.onScrollCallback = callback;
    console.log('[EditorScrollPlayer] Scroll callback registered');
  }

  /**
   * Play a scroll action immediately
   * Called during playback when a scroll event is encountered
   * Sets position directly - scheduler handles timing
   * @param filePath - Path of file to scroll
   * @param top - Vertical scroll position
   * @param left - Horizontal scroll position
   */
  playScroll(filePath: string, top: number, left: number): void {
    if (!this.onScrollCallback) {
      console.warn('[EditorScrollPlayer] Callback not registered');
      return;
    }

    // Set scroll position immediately - no animation
    // The Player's scheduler ensures this happens at the right time
    this.onScrollCallback(filePath, top, left);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.onScrollCallback = null;
    console.log('[EditorScrollPlayer] Destroyed');
  }
}
