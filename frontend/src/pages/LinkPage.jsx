import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Logo from '@/components/logo'
import { resolveShortLinkRequest } from '@/lib/api'

function LinkPage() {
  const { slug } = useParams()
  const [status, setStatus] = useState('loading')

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
    return (
      <div className='h-screen w-full flex items-center justify-center'>
        <div className='flex flex-col items-center justify-center gap-8 py-10 px-10 bg-secondary rounded-xl'>
          <Logo size='lg' />
          <p>Powered By Zapp</p>
        </div>
      </div>
    )
  }

  if (status === 'not-found') {
    return <div className='h-screen w-full flex items-center justify-center'>Link not found</div>
  }

  return <div className='h-screen w-full flex items-center justify-center'>Failed to resolve link</div>
}

export default LinkPage