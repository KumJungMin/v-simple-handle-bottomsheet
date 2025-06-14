# 바텀시트 가이드

## 개요

- Vue 3와 TypeScript를 사용하여 구현된 바텀시트 컴포넌트입니다. 
- 바텀시트는 화면 하단에서 위로 올라오는 모달 형태의 UI로, 사용자가 드래그하여 상태를 변경할 수 있습니다.

<br/>

### 주요 기능

- **드래그 기반 상태 전환**: 사용자가 바텀시트를 드래그하여 상태를 변경할 수 있습니다.
- **반응형 디자인**: 화면 크기에 따라 바텀시트의 높이가 자동으로 조정됩니다.
- **CSS 변수 사용**: 스타일링을 위해 CSS 변수를 사용하여 테마를 쉽게 변경할 수 있습니다.

<br/>

### 동작 흐름

1. **바텀시트 열기**: 사용자가 바텀시트를 열면, 초기 상태는 'half'로 설정됩니다.
2. **드래그 시작**: 사용자가 바텀시트를 드래그하면, 드래그 상태가 활성화되고 시작 위치와 시간이 기록됩니다.
3. **드래그 중**: 사용자가 드래그하는 동안, 바텀시트의 위치가 실시간으로 업데이트됩니다.
4. **드래그 종료**: 사용자가 드래그를 종료하면, 드래그 거리와 속도에 따라 바텀시트의 상태가 변경됩니다.
5. **상태 전환**: 바텀시트의 상태는 'full', 'half', 'closed' 중 하나로 변경됩니다.

<br/><br/>

## 컴포저블 역할

### 1. `useDrag` 컴포저블

- `useDrag`는 바텀시트의 드래그 기능을 관리하는 핵심 함수입니다. 드래그 시작, 중간, 종료 시의 로직을 처리합니다.

```typescript
function useDrag({ sheetHeight, onClose, onStateChange }: UseDragOptions) {
  // 드래그 상태를 관리하는 반응형 객체
  const state = reactive<DragState>({
    isDragging: false, // 드래그 중인지 여부
    startY: 0, // 드래그 시작 Y 좌표
    startTranslateY: 0, // 시작 translateY 값
    startTime: 0, // 드래그 시작 시간
    translateY: 0, // 현재 translateY 값
    currentState: 'half' // 현재 바텀시트 상태
  });

  // 드래그 메트릭을 계산하는 computed 속성
  const metrics = computed<DragMetrics>(() => {
    const deltaY = state.translateY - state.startTranslateY; // Y축 이동 거리
    const velocity = Math.abs(deltaY / (Date.now() - state.startTime)); // 드래그 속도
    const isFastSwipe = velocity > 0.5; // 빠른 스와이프 여부
    const threshold = sheetHeight * 0.2; // 상태 전환 임계값

    return {
      deltaY,
      isFastSwipe,
      threshold
    };
  });

  // Full 상태에서의 드래그 처리
  const handleFullStateDrag = (metrics: DragMetrics) => {
    const { deltaY, isFastSwipe, threshold } = metrics;
    const shouldMoveToHalf = deltaY > threshold || (isFastSwipe && deltaY > 0); // Half 상태로 이동할지 여부
    const shouldClose = deltaY > sheetHeight * 0.5; // 닫을지 여부

    if (shouldClose) {
      state.currentState = 'closed';
      onClose();
    } else if (shouldMoveToHalf) {
      state.currentState = 'half';
      state.translateY = sheetHeight / 2;
    } else {
      state.currentState = 'full';
      state.translateY = 0;
    }
  };

  // Half 상태에서의 드래그 처리
  const handleHalfStateDrag = (metrics: DragMetrics) => {
    const { deltaY, isFastSwipe, threshold } = metrics;
    const shouldMoveToFull = deltaY < -threshold || (isFastSwipe && deltaY < 0); // Full 상태로 이동할지 여부
    const shouldClose = deltaY > sheetHeight * 0.5; // 닫을지 여부

    if (shouldClose) {
      state.currentState = 'closed';
      onClose();
    } else if (shouldMoveToFull) {
      state.currentState = 'full';
      state.translateY = 0;
    } else {
      state.currentState = 'half';
      state.translateY = sheetHeight / 2;
    }
  };

  // 상태 전환 처리
  const handleStateTransition = () => {
    const { currentState } = state;
    const stateChanged = currentState !== state.currentState; // 상태 변경 여부

    if (currentState === 'full') {
      handleFullStateDrag(metrics.value);
    } else if (currentState === 'half') {
      handleHalfStateDrag(metrics.value);
    }

    if (stateChanged && onStateChange) {
      onStateChange(state.currentState);
    }
  };

  // 드래그 시작 처리
  const startDrag = (event: MouseEvent | TouchEvent) => {
    state.isDragging = true;
    state.startY = 'touches' in event ? event.touches[0].clientY : event.clientY; // 시작 Y 좌표 설정
    state.startTranslateY = state.translateY; // 시작 translateY 값 설정
    state.startTime = Date.now(); // 시작 시간 설정

    // 드래그 중 처리
    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!state.isDragging) return;

      const currentY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      state.translateY = state.startTranslateY + (currentY - state.startY); // 현재 translateY 값 업데이트
    };

    // 드래그 종료 처리
    const handleEnd = () => {
      if (!state.isDragging) return;
      state.isDragging = false;
      handleStateTransition(); // 상태 전환 처리
      removeAllListeners(); // 이벤트 리스너 제거
    };

    // 드래그 중 텍스트 선택 방지
    const preventSelectDuringDrag = (event: Event) => {
      if (state.isDragging) {
        event.preventDefault();
      }
    };

    // 이벤트 리스너 등록
    addEventListener(document, 'mousemove', handleMove);
    addEventListener(document, 'touchmove', handleMove);
    addEventListener(document, 'mouseup', handleEnd);
    addEventListener(document, 'touchend', handleEnd);
    addEventListener(document, 'selectstart', preventSelectDuringDrag);
  };

  return {
    state,
    startDrag
  };
}
```

<br/>

### 2. `useEventListeners` 컴포저블

- `useEventListeners`는 이벤트 리스너를 관리하는 함수입니다. 
- 드래그 중 발생하는 이벤트를 처리하고, 이벤트 리스너를 등록 및 제거합니다.

```typescript
function useEventListeners() {
  // 등록된 이벤트 리스너를 저장하는 배열
  const listeners: { element: HTMLElement | Document; type: string; handler: EventHandler<any> }[] = [];

  
  // 컴포넌트가 언마운트될 때 모든 이벤트 리스너 제거
  onUnmounted(() => {
    removeAllListeners();
  });

  // 이벤트 리스너 등록 함수
   addEventListener = <T extends Event>(
    element: HTMLElement | Document,
    type: string,
    handler: EventHandler<T>
  ) => {
    element.addEventListener(type, handler as EventListener);
    listeners.push({ element, type, handler: handler as EventHandler<any> });
  };

  // 모든 이벤트 리스너 제거 함수
  const removeAllListeners = () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler as EventListener);
    });
    listeners.length = 0;
  };

  return {
    addEventListener,
    removeAllListeners
  };
}
```

<br/>

### 3. `useResizeObserver` 컴포저블

- `useResizeObserver`는 바텀시트의 크기 변경을 감지하는 함수입니다. 
- 바텀시트의 크기가 변경될 때마다 콜백 함수를 호출합니다.

```typescript
function useResizeObserver(
  elementRef: Ref<HTMLElement | null>,
  callback: (entry: ResizeObserverEntry | null) => void
) {
  let observer: ResizeObserver | null = null;

  // 컴포넌트가 언마운트될 때 감지 중지
  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });
  
  // elementRef 변경 시 감지 시작
  watch(elementRef, (newElement) => {
    if (observer) {
      observer.disconnect();
    }
    if (newElement) {
      observe();
    }
  });

  // 크기 변경 감지 시작
  const observe = () => {
    if (elementRef.value) {
      observer = new ResizeObserver((entries) => {
        callback(entries[0]); // 크기 변경 시 콜백 호출
      });
      observer.observe(elementRef.value);
    } else {
      callback(null);
    }
  };

  return {
    observe
  };
}
```

<br/><br/>

## 핵심 로직 다이어그램


```sql
                              +----------------+
                              | 바텀시트 열림  |
                              +----------------+
                                       |
                                       v
                          +----------------------------+
                          | currentState = 'half'      |
                          | translateY = sheetHeight/2 |
                          +----------------------------+
                                       |
                                       v
                          +----------------------------+
                          | 드래그 시작 대기           |
                          +----------------------------+
                                       |
                          (마우스/터치 DOWN 이벤트)
                                       |
                                       v
                          +----------------------------+
                          | isDragging = true         |
                          | startY, startTime 저장    |
                          +----------------------------+
                                       |
                                       v
                          +----------------------------+
                          |   드래그 중: translateY    |
                          +----------------------------+
                                       |
                          (마우스/터치 UP 이벤트)
                                       |
                                       v
                          +----------------------------+
                          | metrics 계산               |
                          | (deltaY, isFastSwipe,      |
                          |  threshold)                |
                          +----------------------------+
                                       |
                                       v
                         +-----------------------------+
                         | currentState == 'half'?     |
                         +-----------+-----------------+
                                     |
              Yes -------------------+------------------- No
                                     |
                   +-----------------v------------------+
                   |          Half 상태 처리            |
                   +------------------------------------+
                   | deltaY > sheetHeight*0.5 → 닫기     |
                   | deltaY < -threshold      → full     |
                   | else                    → half     |
                   +------------------------------------+
                                     |
                                     v
                   상태 변경? → onStateChange 호출 여부
                                     |
                                     v
                         +-----------------------------+
                         | 이벤트 리스너 제거         |
                         +-----------------------------+
                                     |
                                     v
                              +----------------+
                              |     완료       |
                              +----------------+

```

<br/><br/>

## 모션 구현 주의사항

1. **성능 최적화**: 드래그 중에는 `transition`을 제거하여 부드러운 움직임을 유지합니다.
2. **터치 이벤트 처리**: 모바일 환경에서 최적의 성능을 위해 `touch-action: none`을 설정합니다.
3. **상태 전환 조건**: 스와이프 거리와 속도를 고려하여 상태 전환 조건을 설정합니다.