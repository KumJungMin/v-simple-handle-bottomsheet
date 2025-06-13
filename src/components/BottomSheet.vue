<template>
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modelValue" class="bottom-sheet-overlay" @click="!isDragging && close">
          <Transition name="slide-up">
            <div 
              v-if="modelValue" 
              class="bottom-sheet" 
              @click.stop
              :style="{ transform: 'translateY(' + translateY + 'px)', height: sheetHeight + 'px' }"
            >
              <div 
                class="bottom-sheet-handle-area"
                @mousedown="startDrag"
                @touchstart="startDrag"
              >
                <div class="bottom-sheet-handle"></div>
              </div>
              <div class="bottom-sheet-content">
                <slot></slot>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted } from 'vue'
  
  const props = defineProps<{ modelValue: boolean }>()
  const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
  
  const translateY = ref(0)
  const isDragging = ref(false)
  const startY = ref(0)
  const startTranslateY = ref(0)
  const startTime = ref(0)
  const sheetHeight = ref(0)
  const windowHeight = ref(0)
  
  type SheetState = 'closed' | 'half' | 'full'
  const currentState = ref<SheetState>('half')

  const preventDefault = (e: Event) => {
    e.preventDefault()
  }

  onMounted(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('mouseup', endDrag)
    document.addEventListener('touchend', endDrag)
    document.addEventListener('selectstart', preventDefault)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions)
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('mouseup', endDrag)
    document.removeEventListener('touchend', endDrag)
    document.removeEventListener('selectstart', preventDefault)
  })

  
  // reset to half-sheet on open
  watch(() => props.modelValue, (val) => {
    if (val) {
      updateDimensions()
      currentState.value = 'half'
      translateY.value = sheetHeight.value / 2
    }
  })
  
  const close = () => {
    emit('update:modelValue', false)

    translateY.value = 0
    currentState.value = 'half'
  }
  
  const startDrag = (e: MouseEvent | TouchEvent) => {
    isDragging.value = true

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startY.value = clientY

    startTranslateY.value = translateY.value
    startTime.value = performance.now()

    // 드래그 시작 시 텍스트 선택 방지
    document.body.style.userSelect = 'none'
    ;(document.body.style as any).webkitTouchCallout = 'none'
  }
  
  const onDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = clientY - startY.value

    let newTranslateY = startTranslateY.value + deltaY
    newTranslateY = Math.max(0, Math.min(sheetHeight.value, newTranslateY))
    translateY.value = newTranslateY
  }
  
  const endDrag = () => {
    if (!isDragging.value) return
    
    isDragging.value = false
  
    // 드래그 종료 시 텍스트 선택 허용
    document.body.style.userSelect = ''
    ;(document.body.style as any).webkitTouchCallout = ''

    const deltaY = translateY.value - startTranslateY.value
    const dt = performance.now() - startTime.value
    const velocity = Math.abs(deltaY / dt) // px per ms
    const fastSwipe = velocity > 0.5 // ~500px/s threshold
    const threshold = sheetHeight.value / 3
  
    if (currentState.value === 'full') {
      if (deltaY > threshold || (fastSwipe && deltaY > 0)) {
        // full -> half
        currentState.value = 'half'
        translateY.value = sheetHeight.value / 2
      } else {
        // stay full
        translateY.value = 0
      }
    } else if (currentState.value === 'half') {
      if (deltaY < -threshold || (fastSwipe && deltaY < 0)) {
        // half -> full
        currentState.value = 'full'
        translateY.value = 0
      } else if (deltaY > threshold || (fastSwipe && deltaY > 0)) {
        // half -> closed
        close()
      } else {
        // stay half
        translateY.value = sheetHeight.value / 2
      }
    }
  }
  
  const updateDimensions = () => {
    windowHeight.value = window.innerHeight
    sheetHeight.value = windowHeight.value * 0.8
  }
  </script>
  
  <style scoped>
  .bottom-sheet-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1000;
  }
  
  .bottom-sheet {
    background-color: white;
    width: 100%;
    max-width: 500px;
    border-radius: 16px 16px 0 0;
    padding: 16px;
    position: relative;
    overflow-y: auto;
    transition: transform 0.14s ease;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  
  .bottom-sheet-handle-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    touch-action: none;
    z-index: 1;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  
  .bottom-sheet-handle-area:active {
    cursor: grabbing;
  }
  
  .bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background-color: #e0e0e0;
    border-radius: 2px;
  }
  
  .bottom-sheet-content {
    padding-top: 40px;
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  /* Fade */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  /* Slide-up */
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: transform 0.3s ease;
  }
  
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(100%);
  }
  </style>
  