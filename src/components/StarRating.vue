<script setup lang="ts">
import type { ActivityRating } from '../types'

const props = withDefaults(
  defineProps<{
    modelValue: ActivityRating | null
    /** 交互模式；若为 false 仅展示 */
    interactive?: boolean
  }>(),
  { interactive: true },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: ActivityRating): void
}>()

const stars = [1, 2, 3, 4, 5] as const

function pick(n: number) {
  if (!props.interactive) return
  emit('update:modelValue', n as ActivityRating)
}

function label(score: ActivityRating | null): string {
  if (!score) return ''
  const map: Record<ActivityRating, string> = {
    1: '很不满意',
    2: '不太满意',
    3: '一般',
    4: '满意',
    5: '非常满意',
  }
  return map[score]
}
</script>

<template>
  <div class="rating">
    <div class="stars" :class="{ readonly: !interactive }">
      <button
        v-for="n in stars"
        :key="n"
        class="star"
        :class="{ on: modelValue !== null && n <= modelValue }"
        :disabled="!interactive"
        type="button"
        @click="pick(n)"
      >
        ★
      </button>
    </div>
    <p v-if="modelValue" class="rating-label">{{ label(modelValue) }}</p>
  </div>
</template>

<style scoped>
.stars {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.star {
  background: none;
  font-size: 40px;
  line-height: 1;
  color: #d9dbe1;
  transition: color 0.15s ease, transform 0.1s ease;
  padding: 4px;
}

.star:not(:disabled):active {
  transform: scale(1.2);
}

.star.on {
  color: #f7b500;
}

.readonly .star {
  cursor: default;
}

.rating-label {
  text-align: center;
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
}
</style>
