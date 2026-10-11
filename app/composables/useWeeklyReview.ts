import * as statsService from '~/services/statsService'

export function useWeeklyReview() {
  const { state: review, pending } = useServiceState('weekly-review', statsService.getWeeklyReview)
  return { review, pending }
}
