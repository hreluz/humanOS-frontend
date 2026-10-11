<template>
  <div class="min-h-screen w-full bg-[#F2F2F7] dark:bg-black flex flex-col items-center justify-start md:justify-center px-4 py-10 md:py-12">
    <div class="flex items-center gap-2.5 mb-6">
      <div class="w-8 h-8 rounded-[9px] bg-[#0B0B0C] dark:bg-white flex items-center justify-center">
        <span class="text-white dark:text-black text-[15px] font-bold">H</span>
      </div>
      <span class="text-[17px] font-bold tracking-tight" :class="inkCls">HumanOS</span>
    </div>

    <div class="w-full max-w-[420px] bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xs p-6 sm:p-8">
      <slot />
    </div>
  </div>
</template>
