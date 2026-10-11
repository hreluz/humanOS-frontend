import type { ChatMessage } from '~/types/coach'
import { delay } from './mocks/delay'
import { CANNED_REPLY, DAILY_TIP, INITIAL_CHAT } from './mocks/coach'

const conversation: ChatMessage[] = structuredClone(INITIAL_CHAT)

export async function getConversation(): Promise<ChatMessage[]> {
  await delay()
  return structuredClone(conversation)
}

export async function sendMessage(text: string): Promise<ChatMessage[]> {
  await delay()
  conversation.push({ from: 'user', text }, { from: 'ai', text: CANNED_REPLY })
  return structuredClone(conversation)
}

export async function getDailyTip(): Promise<string> {
  await delay()
  return DAILY_TIP
}
