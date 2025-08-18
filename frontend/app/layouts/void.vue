<template>
  <div class="layout-default">
    <main class="main-content">
      <slot />
    </main>
    
    <!-- Optional navigation or footer can go here -->
    <div class="layout-controls">
      <button 
        @click="toggleDebug" 
        class="debug-toggle"
        title="Toggle Debug Info"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
        </svg>
      </button>
      
      <button 
        @click="resetView" 
        class="reset-button"
        title="Reset View"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 4v6h6"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
const debugMode = ref(false)

const toggleDebug = () => {
  debugMode.value = !debugMode.value
  // Emit event to child components or use provide/inject
  const event = new CustomEvent('toggleDebug', { 
    detail: { enabled: debugMode.value } 
  })
  window.dispatchEvent(event)
}

const resetView = () => {
  // Emit reset event
  const event = new CustomEvent('resetView')
  window.dispatchEvent(event)
}

// Provide debug state to child components
provide('debugMode', debugMode)
</script>

<style scoped>
.layout-default {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #0a0a0a;
  overflow: hidden;
}

.main-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.layout-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  z-index: 1000;
}

.debug-toggle,
.reset-button {
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.debug-toggle:hover,
.reset-button:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.debug-toggle:active,
.reset-button:active {
  transform: scale(0.95);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .layout-controls {
    bottom: 15px;
    right: 15px;
    gap: 8px;
  }
  
  .debug-toggle,
  .reset-button {
    width: 40px;
    height: 40px;
  }
  
  .debug-toggle svg,
  .reset-button svg {
    width: 14px;
    height: 14px;
  }
}
</style>