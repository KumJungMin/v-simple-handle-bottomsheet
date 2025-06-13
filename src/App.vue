<script setup lang="ts">
import { ref } from 'vue'
import BottomSheet from './components/BottomSheet.vue'

const showBottomSheet = ref(false)
</script>

<template>
  <div class="app">
    <button @click="showBottomSheet = true">바텀시트 열기</button>
    
    <BottomSheet v-model="showBottomSheet">
      <div class="content">
        <h2>바텀시트 내용</h2>
        <p>여기에 원하는 내용을 넣을 수 있습니다.</p>
        <button @click="showBottomSheet = false">닫기</button>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.app {
  padding: 20px;
}

.content {
  padding: 20px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

h2 {
  margin-bottom: 16px;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
