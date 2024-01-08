import { Loader2 } from 'lucide-react'

type LoadingProps = {
  size?: number
}
export default function Loading(props: LoadingProps) {
  const { size = 20 } = props
  return <Loader2 size={size} className="animate-spin dark:text-gray-300" />
}
