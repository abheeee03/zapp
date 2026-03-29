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
      <span className='px-3 border rounded-xl'>Introducing zapp</span>
      <h1 className='text-6xl font-semibold text-center mb-5'>Make your links look smart.</h1>
      <p className='max-w-lg text-lg text-center leading-tight'>Turn long, messy URLs into sleek, shareable links. Simple to use, powerful to grow your reach.</p>
      <div className="flex gap-3">
      <Button
      size={"lg"}
      onClick={handleGetStarted}
      >
        Get Started
      </Button>
      <Button 
      size={"lg"}
      variant={"outline"}>
        Learn More
      </Button>
      </div>
      <AuthDialog
        open={openAuth}
        onOpenChange={setOpenAuth}
        onSuccess={() => navigate('/home')}
      />
    </div>
  )
}

export default Landing