import { onMounted, onUnmounted } from 'vue'

type EventHandler<T extends Event = Event> = (e: T) => void

interface EventListenerOptions {
  target?: EventTarget
  passive?: boolean
}

export const useEventListeners = <T extends Event = Event>(
  events: Array<{
    type: string
    handler: EventHandler<T>
    options?: EventListenerOptions
  }>
) => {
  onMounted(() => {
    events.forEach(({ type, handler, options }) => {
      const target = options?.target || document
      target.addEventListener(type, handler as EventListener, options)
    })
  })

  onUnmounted(() => {
    events.forEach(({ type, handler, options }) => {
      const target = options?.target || document
      target.removeEventListener(type, handler as EventListener)
    })
  })
} 