export function useGreeting() {
  // Seeded on the server so hydration matches; corrected to the client's clock after mount.
  const hour = useState('greeting-hour', () => new Date().getHours())
  onMounted(() => { hour.value = new Date().getHours() })
  return computed(() => hour.value < 12 ? 'Good morning' : hour.value < 18 ? 'Good afternoon' : 'Good evening')
}
