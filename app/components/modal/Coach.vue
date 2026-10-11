<script setup lang="ts">
const { close } = useModal()
const { messages, draft, send } = useCoach()

const scroller = ref<HTMLElement>()
watch(() => messages.value?.length, async () => {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight })
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="fixed inset-0 bg-black/30 z-20" @click="close">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Coach"
      class="fixed md:absolute inset-x-0 bottom-0 top-auto md:inset-x-auto md:top-0 md:right-0 md:bottom-0 h-[85vh] md:h-auto w-full md:w-[400px] rounded-t-3xl md:rounded-none flex flex-col shadow-2xl"
      :class="cardCls"
      @click.stop
    >
      <div class="p-5 border-b flex items-center justify-between" :class="dividerCls">
        <span class="text-base font-bold" :class="inkCls">Coach</span>
        <ModalCloseButton />
      </div>
      <div ref="scroller" class="flex-1 overflow-auto px-5 py-4 flex flex-col gap-3.5" aria-live="polite">
        <template v-for="(msg, i) in messages ?? []" :key="i">
          <div v-if="msg.from === 'ai'" class="flex gap-2.5 items-start max-w-[92%]">
            <div class="w-7 h-7 rounded-full bg-[#0B0B0C] flex items-center justify-center shrink-0">
              <AppIcon :path="ICONS.coach" class="w-3.5 h-3.5 text-white" />
            </div>
            <div class="rounded-tr-2xl rounded-bl-2xl rounded-br-2xl rounded-tl-[4px] px-3.5 py-2.5" :class="bgCls">
              <div class="text-[13.5px] leading-relaxed" :class="inkCls">{{ msg.text }}</div>
            </div>
          </div>
          <div v-else class="self-end max-w-[85%] bg-[#0B0B0C] rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-[4px] px-3.5 py-2.5">
            <div class="text-[13.5px] leading-relaxed text-white">{{ msg.text }}</div>
          </div>
        </template>
      </div>
      <form class="p-3.5 border-t" :class="dividerCls" @submit.prevent="send">
        <div class="rounded-full py-1 pl-3.5 pr-1 flex items-center gap-2" :class="bgCls">
          <input
            v-model="draft"
            placeholder="Ask your coach anything…"
            aria-label="Message your coach"
            class="flex-1 border-none outline-hidden bg-transparent text-sm placeholder:text-black/30 dark:placeholder:text-white/30"
            :class="inkCls"
          >
          <button type="submit" aria-label="Send" class="w-8 h-8 rounded-full bg-[#0B0B0C] flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 12l16-8-6 8 6 8-16-8z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" /></svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
