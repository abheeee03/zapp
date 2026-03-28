import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'

function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className='min-h-screen w-full p-6'>
      <div className='mx-auto flex w-full max-w-3xl items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Home</h1>
          <p className='text-sm text-muted-foreground'>{user?.email}</p>
        </div>
        <Button
          variant='outline'
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  )
}

export default Home