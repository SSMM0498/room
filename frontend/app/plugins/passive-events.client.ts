export default defineNuxtPlugin(() => {
    if (typeof window === 'undefined') return

    const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel']
    const originalAddEventListener = EventTarget.prototype.addEventListener

    EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (passiveEvents.includes(type)) {
            if (typeof options === 'boolean') {
                options = { capture: options, passive: true }
            } else if (typeof options === 'object') {
                options = { passive: true, ...options }
            } else {
                options = { passive: true }
            }
        }

        // @ts-ignore
        return originalAddEventListener.call(this, type, listener, options)
    }
})
