<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="bottom-sheet-overlay" @click="close">
        <Transition name="slide-up">
          <div v-if="modelValue" class="bottom-sheet" @click.stop>
            <div class="bottom-sheet-handle"></div>
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
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const close = () => {
  emit('update:modelValue', false)
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
  max-height: 90vh;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  position: relative;
  overflow-y: auto;
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  margin: 0 auto 16px;
}

.bottom-sheet-content {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Fade 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide-up 애니메이션 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style> 