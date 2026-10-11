<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Sign in · HumanOS' })

const { form, errors, formError, passwordReset, signedOut, showPassword, submitting, submit } = useLoginForm()
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AuthHeading title="Welcome back" subtitle="Sign in to pick up today's plan." />
    <AuthNotice v-if="passwordReset" tone="success">Password updated — sign in with your new password.</AuthNotice>
    <AuthNotice v-if="signedOut" tone="success">You've signed out.</AuthNotice>
    <AuthNotice v-if="formError" tone="error">{{ formError }}</AuthNotice>
    <AuthField v-model="form.email" label="Email" type="email" placeholder="you@example.com" :error="errors.email" autocomplete="email" />
    <div class="flex flex-col gap-1.5">
      <AuthField v-model="form.password" label="Password" :type="showPassword ? 'text' : 'password'" :error="errors.password" autocomplete="current-password">
        <template #suffix>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </AuthField>
      <NuxtLink to="/forgot-password" class="self-end text-[12.5px] font-semibold hover:text-ink dark:hover:text-white" :class="inkSoftCls">Forgot password?</NuxtLink>
    </div>
    <AuthPrimaryButton :disabled="submitting">Sign in</AuthPrimaryButton>
    <p class="text-[13.5px] text-center" :class="inkSoftCls">
      New to HumanOS? <NuxtLink to="/signup" :class="authLinkCls">Create an account</NuxtLink>
    </p>
  </form>
</template>
