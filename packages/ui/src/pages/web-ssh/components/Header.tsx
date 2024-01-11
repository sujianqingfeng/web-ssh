import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useKeyDown } from '@/hooks/key-down'
import { cn } from '@/lib/utils'

const sshSchema = z.object({
  username: z.string().trim().min(1, { message: 'username is required' }),
  password: z.string().trim().min(1, { message: 'password is required' }),
  hostname: z.string().trim().min(1, { message: 'hostname is required' }),
  port: z.coerce.number().min(1).max(65535)
})

export type SSHConfig = z.infer<typeof sshSchema>
interface HeaderProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onConnect: (config: SSHConfig) => void
  sshConnected: boolean
}
export default function Header(props: HeaderProps) {
  const { onFileChange, onConnect, sshConnected } = props

  const [searchParams] = useSearchParams()
  const [schema, setSchema] = useState(searchParams.get('schema') || '')
  const { toast } = useToast()

  const _onConnect = () => {
    const url = new URL(`http://${schema}`)
    const parse = sshSchema.safeParse(url)
    if (!parse.success) {
      const error = parse.error.errors[0]
      toast({
        variant: 'destructive',
        title: error.message
      })
      return
    }

    onConnect(parse.data)
  }

  const { onKeyDown } = useKeyDown('Enter', _onConnect)

  useEffect(() => {
    if (schema) {
      _onConnect()
    }
  }, [])

  return (
    <header className="p-2 flex justify-between items-center ">
      <div className="text-[30px] font-bold">Web SSH</div>
      <div className="flex justify-center items-center gap-1.5">
        <div className="flex justify-center items-center gap-1.5">
          <Input
            className="w-[300px]"
            placeholder="username:password@hostname:port"
            onChange={(event) => setSchema(event.target.value)}
            defaultValue={schema}
            onKeyDown={onKeyDown}
          />
          <Button disabled={!schema} onClick={_onConnect}>
            Connect
          </Button>
        </div>

        <label
          className={cn(
            'inline-flex cursor-pointer font-medium bg-primary text-sm rounded-md text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2',
            !sshConnected && 'pointer-events-none opacity-50'
          )}
        >
          Upload File
          <Input
            className="hidden"
            id="picture"
            type="file"
            onChange={onFileChange}
          />
        </label>
      </div>
    </header>
  )
}
