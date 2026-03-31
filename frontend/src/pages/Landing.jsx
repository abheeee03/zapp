import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/components/auth'
import { FeatureSection } from '@/components/feature-section'
import { useAuth } from '@/lib/auth-context'

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
    <div className='min-h-screen w-full'>
      <div className="min-h-screen w-full relative">
  {/* Radial Gradient Background */}
  <div
    className="absolute inset-0 -z-10"
    style={{
      background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
    }}
  />
      <div className='mx-auto h-screen flex w-full max-w-5xl flex-col items-center justify-center gap-12 z-20'>
        <div className='flex flex-col items-center justify-center gap-5 text-center'>
          <span className='rounded-xl border px-3'>Introducing zapp</span>
          <h1 className='text-5xl font-semibold leading-tight md:text-6xl'>Make your links look smart.</h1>
          <p className='max-w-lg text-lg leading-tight text-muted-foreground'>
            Turn long, messy URLs into sleek, shareable links. Simple to use, powerful to grow your reach.
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Button size='lg' onClick={handleGetStarted}>
              Get Started
            </Button>
            <Button size='lg' variant='outline'>
              Learn More
            </Button>
          </div>
        </div>
</div>

      </div>
        <FeatureSection />
      <AuthDialog open={openAuth} onOpenChange={setOpenAuth} onSuccess={() => navigate('/home')} />
    </div>
  )
}

export default Landing