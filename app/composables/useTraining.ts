import * as trainingService from '~/services/trainingService'

export function useTraining() {
  const { state: workout, pending } = useServiceState('today-workout', trainingService.getTodayWorkout)
  return { workout, pending }
}
