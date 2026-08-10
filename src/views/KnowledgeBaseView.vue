<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGrowthStore } from '../stores/growth'
import type { KnowledgeType } from '../types'

const store = useGrowthStore()

const filter = ref<'all' | KnowledgeType>('all')

const list = computed(() => {
  const all = store.knowledge
  return filter.value === 'all' ? all : all.filter((k) => k.type === filter.value)
})

const counts = computed(() => ({
  experience: store.knowledge.filter((k) => k.type === 'experience').length,
  risk: store.knowledge.filter((k) => k.type === 'risk').length,
}))

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div>
    <h1 class="page-title">社团资料库</h1>
    <p class="page-subtitle">历届社长沉淀的经验与风险提醒，为未来提供参考</p>

    <div class="filter-row">
      <button
        class="filter-chip"
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'"
      >
        全部（{{ store.knowledge.length }}）
      </button>
      <button
        class="filter-chip"
        :class="{ active: filter === 'experience' }"
        @click="filter = 'experience'"
      >
        📚 经验（{{ counts.experience }}）
      </button>
      <button
        class="filter-chip"
        :class="{ active: filter === 'risk' }"
        @click="filter = 'risk'"
      >
        ⚠️ 风险（{{ counts.risk }}）
      </button>
    </div>

    <div v-if="list.length" class="kb-list">
      <div v-for="item in list" :key="item.id" class="kb-item card">
        <div class="kb-item-head">
          <span class="chip" :class="item.type === 'risk' ? 'chip-risk' : 'chip-experience'">
            {{ item.type === 'risk' ? '⚠️ 风险' : '📚 经验' }}
          </span>
          <span class="kb-date">{{ fmtDate(item.createdAt) }}</span>
        </div>
        <p class="kb-content">{{ item.content }}</p>
      </div>
    </div>
    <p v-else class="empty">还没有沉淀的知识，完成一次 Reflection 后会出现在这里。</p>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  margin: 6px 0 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.filter-chip {
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-secondary);
}

.filter-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 600;
}

.kb-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kb-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.kb-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.kb-content {
  font-size: 14px;
  line-height: 1.7;
}
</style>
