<template>
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modelValue" class="bottom-sheet-overlay" @click="!state.isDragging && close">
          <Transition name="slide-up" appear>
            <div 
              v-if="modelValue" 
              class="bottom-sheet" 
              @click.stop
              :style="{ transform: 'translateY(' + state.translateY + 'px)', height: sheetHeight + 'px' }"
              :class="{ 'dragging': state.isDragging }"
              ref="elementRef"
            >
              <div 
                class="bottom-sheet-handle-area"
                @mousedown="startDrag"
                @touchstart.passive="startDrag"
              >
                <div class="bottom-sheet-handle"></div>
              </div>
              <slot></slot>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useDrag } from '../composables/useDrag'
  import { useResizeObserver } from '../composables/useResizeObserver'
  
  const props = defineProps<{ modelValue: boolean }>()
  const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
  
  const elementRef = ref<HTMLElement | null>(null)
  const sheetHeight = ref(window.innerHeight * 0.8)

  const { state, startDrag } = useDrag({
    sheetHeight: sheetHeight.value,
    onClose: () => emit('update:modelValue', false),
    onStateChange: (newState) => console.log('Sheet state changed:', newState)
  })
  
  useResizeObserver((entry) => sheetHeight.value = entry.contentRect.height)
  
  watch(() => props.modelValue, (b) => {
    // 바텀시트 초기 상태 설정
    if (b) {
      state.currentState = 'half'
      state.translateY = sheetHeight.value / 2
    }
  })
  
  function close() {
    emit('update:modelValue', false)
    state.translateY = 0
    state.currentState = 'half'
  }
  </script>
  
  <style>
  :root {
    --bottom-sheet-bg: white;
    --bottom-sheet-handle-bg: #e0e0e0;
    --bottom-sheet-overlay-bg: rgba(0, 0, 0, 0.5);
    --bottom-sheet-border-radius: 16px;
    --bottom-sheet-transition-duration: 0.18s;
  }
  
  @media (prefers-color-scheme: dark) {
    :root {
      --bottom-sheet-bg: #1a1a1a;
      --bottom-sheet-handle-bg: #404040;
      --bottom-sheet-overlay-bg: rgba(0, 0, 0, 0.7);
    }
  }
  
  .bottom-sheet-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--bottom-sheet-overlay-bg);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1000;
  }
  
  .bottom-sheet {
    background-color: var(--bottom-sheet-bg);
    width: 100%;
    max-width: 500px;
    border-radius: var(--bottom-sheet-border-radius) var(--bottom-sheet-border-radius) 0 0;
    padding: 16px;
    position: relative;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    will-change: transform;
  }
  
  .bottom-sheet:not(.dragging) {
    transition: transform var(--bottom-sheet-transition-duration) ease;
  }
  
  .bottom-sheet-handle-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
    touch-action: none;
  }
  
  .bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background-color: var(--bottom-sheet-handle-bg);
    border-radius: 2px;
  }
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity var(--bottom-sheet-transition-duration) ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: transform var(--bottom-sheet-transition-duration) ease;
  }
  
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(100%);
  }
  </style>
  