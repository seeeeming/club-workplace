<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGrowthStore } from '../stores/growth'

const route = useRoute()
const router = useRouter()
const store = useGrowthStore()

const name = ref('')
const error = ref('')

function onSubmit() {
  const value = name.value.trim()
  if (!value) {
    error.value = '请输入你的名字'
    return
  }
  error.value = ''
  store.login(value)
  const redirect = (route.query.redirect as string) || '/platform'
  router.replace(redirect)
}
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="logo">🏫</div>
      <h1 class="app-name">社团成长中心</h1>
      <p class="app-slogan">经验从属于个人，逐渐沉淀为社团的知识资产</p>

      <div class="form">
        <label class="field-label" for="login-name">你的名字</label>
        <input
          id="login-name"
          v-model="name"
          class="text-input"
          type="text"
          maxlength="12"
          placeholder="输入昵称进入社团平台"
          @keydown.enter.prevent="onSubmit"
        />
        <p v-if="error" class="login-error">{{ error }}</p>

        <button class="btn btn-primary btn-block" :disabled="!name.trim()" @click="onSubmit">
          进入社团平台 →
        </button>
      </div>

      <p class="login-note">原型演示：无需密码，输入名字即可登录</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(160deg, #eef1ff 0%, #f6f8fc 100%);
}

.login-card {
  width: 100%;
  max-width: 380px;
  text-align: center;
  padding: 36px 28px;
}

.logo {
  font-size: 52px;
}

.app-name {
  font-size: 22px;
  font-weight: 700;
  margin-top: 10px;
}

.app-slogan {
  margin: 8px 0 26px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.text-input {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 15px;
}

.text-input:focus {
  border-color: var(--primary);
}

.login-error {
  color: var(--danger);
  font-size: 13px;
}

.login-note {
  margin-top: 18px;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
