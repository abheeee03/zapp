import { resolveShortLinkRequest } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function LinkPage() {
  const { slug } = useParams()
  const [status, setStatus] = useState<'loading' | 'not-found' | 'error'>('loading')

  useEffect(() => {
    const resolveAndRedirect = async () => {
      if (!slug) {
        setStatus('not-found')
        return
      }

      try {
        const response = await resolveShortLinkRequest(slug)
        window.location.replace(response.url)
      } catch {
        setStatus('not-found')
      }
    }

    void resolveAndRedirect()
  }, [slug])

  if (status === 'loading') {
    return <div className='h-screen w-full flex items-center justify-center'>Redirecting...</div>
  }

  if (status === 'not-found') {
    return <div className='h-screen w-full flex items-center justify-center'>Link not found</div>
  }

  return <div className='h-screen w-full flex items-center justify-center'>Failed to resolve link</div>
}

export default LinkPage