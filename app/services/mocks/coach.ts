import type { ChatMessage } from '~/types/coach'

export const INITIAL_CHAT: ChatMessage[] = [
  { from: 'ai', text: 'Your weight has plateaued for 3 weeks, and protein slips on weekends. Want me to try a small weekend calorie tweak?' },
]

export const CANNED_REPLY = 'Noted — I\'ll fold that into tomorrow\'s plan and flag it in your weekly review.'

export const DAILY_TIP = 'Today\'s a better day for recovery than heavy legs — your sleep was short last night. Click to ask your coach.'
