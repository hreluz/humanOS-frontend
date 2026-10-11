<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Set a new password · HumanOS' })

const { email, validLink, form, errors, formError, showPassword, submitting, submit } = useResetPassword()
</script>

<template>
  <form v-if="validLink" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AuthHeading title="Set a new password" subtitle="Choose a password you haven't used here before." />
    <AuthNotice v-if="formError" tone="error">{{ formError }}</AuthNotice>
    <AuthField :model-value="email" label="Email" type="email" :error="errors.email" autocomplete="username" readonly />
    <AuthField v-model="form.password" label="New password" :type="showPassword ? 'text' : 'password'" placeholder="8+ characters" :error="errors.password" autocomplete="new-password">
      <template #suffix>
        <AuthPasswordToggle v-model="showPassword" />
      </template>
    </AuthField>
    <AuthField v-model="form.confirm" label="Confirm password" :type="showPassword ? 'text' : 'password'" :error="errors.confirm" autocomplete="new-password" />
    <AuthPrimaryButton :disabled="submitting">Update password</AuthPrimaryButton>
    <p class="text-[13.5px] text-center" :class="inkSoftCls">
      <NuxtLink to="/login" :class="authLinkCls">Back to sign in</NuxtLink>
    </p>
  </form>
  <div v-else class="flex flex-col gap-4">
    <AuthHeading title="This reset link is invalid" subtitle="It's missing information. Request a new link to reset your password." />
    <NuxtLink to="/forgot-password" class="text-[13.5px]" :class="authLinkCls">Request a new link</NuxtLink>
    <p class="text-[13.5px] text-center" :class="inkSoftCls">
      <NuxtLink to="/login" :class="authLinkCls">Back to sign in</NuxtLink>
    </p>
  </div>
</template>
