import * as coachService from '~/services/coachService'

export function useCoach() {
  const { state: messages, pending } = useServiceState('coach-conversation', coachService.getConversation)
  const draft = ref('')
  const sending = ref(false)

  async function send() {
    const text = draft.value.trim()
    if (!text || sending.value) return
    draft.value = ''
    sending.value = true
    try {
      messages.value = await coachService.sendMessage(text)
    }
    finally {
      sending.value = false
    }
  }

  return { messages, pending, draft, sending, send }
}

export function useCoachTip() {
  const { state: tip } = useServiceState('coach-tip', coachService.getDailyTip)
  return { tip }
}
