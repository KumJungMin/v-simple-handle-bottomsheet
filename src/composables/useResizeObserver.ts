import { ref, onMounted, onUnmounted } from 'vue'

export const useResizeObserver = (callback: (entry: ResizeObserverEntry) => void) => {
  const elementRef = ref<HTMLElement | null>(null)
  let observer: ResizeObserver | null = null

  onMounted(() => {
    observer = new ResizeObserver((entries) => {
      callback(entries[0])
    })

    if (elementRef.value) {
      observer.observe(elementRef.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    elementRef
  }
} 