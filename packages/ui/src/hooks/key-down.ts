export function useKeyDown(key: string, callback: () => void) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === key) {
      callback && callback()
    }
  }
  return { onKeyDown }
}
