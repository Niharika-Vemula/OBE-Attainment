import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { checkHealth } from '../api'

export default function BackendStatus() {
  const [status, setStatus] = useState('checking') // 'ok' | 'down' | 'checking'

  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth()
        setStatus('ok')
      } catch {
        setStatus('down')
      }
    }
    check()
    const interval = setInterval(check, 30000) // re-check every 30s
    return () => clearInterval(interval)
  }, [])

  if (status === 'checking') return null

  return (
    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mx-3 mb-2
      ${status === 'ok' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-300'}`}>
      {status === 'ok'
        ? <><Wifi className="w-3 h-3" /> Backend connected</>
        : <><WifiOff className="w-3 h-3" /> Backend offline</>
      }
    </div>
  )
}
