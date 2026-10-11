<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Create your account · HumanOS' })

const { form, errors, formError, showPassword, submitting, submit } = useSignupForm()
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AuthHeading title="Create your account" subtitle="Takes about a minute." />
    <AuthNotice v-if="formError" tone="error">{{ formError }}</AuthNotice>
    <AuthField v-model="form.name" label="Name" placeholder="Alex Morgan" :error="errors.name" autocomplete="name" />
    <AuthField v-model="form.email" label="Email" type="email" placeholder="you@example.com" :error="errors.email" autocomplete="email" />
    <AuthField v-model="form.password" label="Password" :type="showPassword ? 'text' : 'password'" placeholder="8+ characters" :error="errors.password" autocomplete="new-password">
      <template #suffix>
        <AuthPasswordToggle v-model="showPassword" />
      </template>
    </AuthField>
    <AuthField v-model="form.confirm" label="Confirm password" :type="showPassword ? 'text' : 'password'" :error="errors.confirm" autocomplete="new-password" />
    <AuthPrimaryButton :disabled="submitting">Continue</AuthPrimaryButton>
    <p class="text-[13.5px] text-center" :class="inkSoftCls">
      Already have an account? <NuxtLink to="/login" :class="authLinkCls">Sign in</NuxtLink>
    </p>
  </form>
</template>
