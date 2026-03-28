import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/components/auth'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Landing() {
  const { isAuthenticated } = useAuth()
  const [openAuth, setOpenAuth] = useState(false)
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/home')
      return
    }

    setOpenAuth(true)
  }

  return (
    <div className="h-screen w-full flex flex-col gap-5 items-center justify-center">
      <h1 className='text-4xl font-semibold'>Zapp</h1>
      <p>short your links</p>
      <Button
      onClick={handleGetStarted}
      >
        Get Started
      </Button>
      <AuthDialog
        open={openAuth}
        onOpenChange={setOpenAuth}
        onSuccess={() => navigate('/home')}
      />
    </div>
  )
}

export default Landing