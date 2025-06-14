import { reactive, computed } from 'vue'
import { useEventListeners } from './useEventListeners'

interface DragState {
  isDragging: boolean
  startY: number
  startTranslateY: number
  startTime: number
  translateY: number
  currentState: 'closed' | 'half' | 'full'
}

interface UseDragOptions {
  sheetHeight: number
  onClose: () => void
  onStateChange?: (state: DragState['currentState']) => void
}

interface DragMetrics {
  deltaY: number
  isFastSwipe: boolean
  threshold: number
}

export const useDrag = ({ sheetHeight, onClose, onStateChange }: UseDragOptions) => {
  const state = reactive<DragState>({
    isDragging: false,
    startY: 0,
    startTranslateY: 0,
    startTime: 0,
    translateY: 0,
    currentState: 'half'
  })

  const metrics = computed(() => {
    const deltaY = state.translateY - state.startTranslateY // 드래그 거리(현재 위치 - 시작 위치)
    const dt = performance.now() - state.startTime
    const velocity = Math.abs(deltaY / dt) // 드래그 속도
    const isFastSwipe = velocity > 0.5     // 0.5 이상일 경우 빠른 스와이프로 판단
    const threshold = sheetHeight / 3      // 스와이프 임계값

    return { deltaY, velocity, isFastSwipe, threshold }
  })

  /**
   * 드래그 중 사용자 선택 방지
   * 드래그 중 사용자 선택을 막지 않으면 드래그 중 텍스트 선택이 되어버림
   * */ 
  function disableUserSelect() {
    document.body.style.userSelect = 'none'
    ;(document.body.style as any).webkitTouchCallout = 'none'
    ;(document.body.style as any).touchAction = 'none'
  }

  /**
   * 드래그 완료 후 사용자 선택 방지 해제
   */
  function enableUserSelect() {
    document.body.style.userSelect = ''
    ;(document.body.style as any).webkitTouchCallout = ''
    ;(document.body.style as any).touchAction = ''
  }

  /**
   * 상태 전환 처리(드래그 완료 후 상태 전환)
   * 상태 전환 시 상태 변경 이벤트 발생
   * */ 
  function handleStateTransition() {
    const { deltaY, isFastSwipe, threshold } = metrics.value
    const prevState = state.currentState

    if (state.currentState === 'full') {
      handleFullStateDrag({ deltaY, isFastSwipe, threshold })
    } else if (state.currentState === 'half') {
      handleHalfStateDrag({ deltaY, isFastSwipe, threshold })
    }

    const stateChanged = prevState !== state.currentState
    if (stateChanged && onStateChange) onStateChange(state.currentState)
    
  }

  /**
   * full 상태에서의 드래그 처리
   * 아래로 드래그하면 half 상태로 전환
   */
  function handleFullStateDrag(metrics: DragMetrics) {
    const { deltaY, isFastSwipe, threshold } = metrics

    // 드래그 거리(deltaY)가 임계값 이상이거나 빠른 스와이프인 경우
    const shouldMoveToHalf = deltaY > threshold || (isFastSwipe && deltaY > 0)
    
    // 바텀시트를 반으로 줄이기
    if (shouldMoveToHalf) {
      state.currentState = 'half'
      state.translateY = sheetHeight / 2
    } else {
      state.translateY = 0
    }
  }

  /**
   * half 상태에서의 드래그 처리
   * 위로 드래그하면 full 상태로, 아래로 드래그하면 닫힘
   */
  function handleHalfStateDrag(metrics: DragMetrics) {
    const { deltaY, isFastSwipe, threshold } = metrics
    
    // 드래그 거리(deltaY)가 임계값 이하이거나 빠른 스와이프인 경우
    const shouldMoveToFull = deltaY < -threshold || (isFastSwipe && deltaY < 0)
    const shouldClose = deltaY > threshold || (isFastSwipe && deltaY > 0)
    
    // 바텀시트를 확장하기
    if (shouldMoveToFull) {
      state.currentState = 'full'
      state.translateY = 0
    } else if (shouldClose) {
      onClose()
    } else {
      state.translateY = sheetHeight / 2
    }
  }

  function preventSelectDuringDrag(e: Event) {
    e.preventDefault()
  }

  function startDrag(e: MouseEvent | TouchEvent) {
    state.isDragging = true

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY // 드래그 시작 위치
    state.startY = clientY
    state.startTranslateY = state.translateY
    state.startTime = performance.now()
    disableUserSelect()
  }

  function onDrag(e: MouseEvent | TouchEvent) {
    if (!state.isDragging) return

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY // 드래그 중 위치
    const deltaY = clientY - state.startY // 드래그 거리(현재 위치 - 시작 위치)

    let newTranslateY = state.startTranslateY + deltaY
    newTranslateY = Math.max(0, Math.min(sheetHeight, newTranslateY))
    state.translateY = newTranslateY
  }

  function endDrag() {
    if (!state.isDragging) return
    
    state.isDragging = false
    enableUserSelect()
    handleStateTransition()
  }

  useEventListeners<MouseEvent | TouchEvent>([
    { type: 'mousemove', handler: onDrag },
    { type: 'touchmove', handler: onDrag, options: { passive: false } },
    { type: 'mouseup', handler: endDrag },
    { type: 'touchend', handler: endDrag },
    { type: 'selectstart', handler: preventSelectDuringDrag }
  ])

  return {
    state,
    startDrag,
    onDrag,
    endDrag
  }
} 