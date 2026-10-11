<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Sign in · HumanOS' })

const { form, errors, formError, passwordReset, showPassword, submitting, submit } = useLoginForm()
const linkCls = 'font-semibold text-[#0B0B0C] dark:text-white underline underline-offset-2'
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AuthHeading title="Welcome back" subtitle="Sign in to pick up today's plan." />
    <AuthNotice v-if="passwordReset" tone="success">Password updated — sign in with your new password.</AuthNotice>
    <AuthNotice v-if="formError" tone="error">{{ formError }}</AuthNotice>
    <AuthField v-model="form.email" label="Email" type="email" placeholder="you@example.com" :error="errors.email" autocomplete="email" />
    <div class="flex flex-col gap-1.5">
      <AuthField v-model="form.password" label="Password" :type="showPassword ? 'text' : 'password'" :error="errors.password" autocomplete="current-password">
        <template #suffix>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </AuthField>
      <NuxtLink to="/forgot-password" class="self-end text-[12.5px] font-semibold hover:text-[#0B0B0C] dark:hover:text-white" :class="inkSoftCls">Forgot password?</NuxtLink>
    </div>
    <AuthPrimaryButton :disabled="submitting">Sign in</AuthPrimaryButton>
    <p class="text-[13.5px] text-center" :class="inkSoftCls">
      New to HumanOS? <NuxtLink to="/signup" :class="linkCls">Create an account</NuxtLink>
    </p>
  </form>
</template>
