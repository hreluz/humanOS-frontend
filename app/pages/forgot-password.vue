<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Reset your password · HumanOS' })

const { email, error, sent, submitting, submit, resend } = useForgotPassword()
const linkCls = 'font-semibold text-[#0B0B0C] dark:text-white underline underline-offset-2'
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <template v-if="!sent">
      <AuthHeading title="Reset your password" subtitle="We'll email you a link to set a new one." />
      <AuthField v-model="email" label="Email" type="email" placeholder="you@example.com" :error="error" autocomplete="email" />
      <AuthPrimaryButton :disabled="submitting">Send reset link</AuthPrimaryButton>
    </template>
    <div v-else class="flex flex-col gap-3 items-start" role="status">
      <div class="w-11 h-11 rounded-full bg-[#E5F6EC] dark:bg-[#32D74B]/20 flex items-center justify-center">
        <AppIcon :path="ICONS.check" class="w-5 h-5 text-[#33C463] dark:text-[#32D74B]" />
      </div>
      <h1 class="text-[22px] font-bold tracking-tight" :class="inkCls">Check your email</h1>
      <p class="text-[14px]" :class="inkSoftCls">If an account exists for <span class="font-semibold" :class="inkCls">{{ email }}</span>, a reset link is on its way.</p>
      <button type="button" class="text-[13px]" :class="linkCls" @click="resend">Resend</button>
    </div>
    <p class="text-[13.5px] text-center" :class="inkSoftCls">
      <NuxtLink to="/login" :class="linkCls">Back to sign in</NuxtLink>
    </p>
  </form>
</template>
