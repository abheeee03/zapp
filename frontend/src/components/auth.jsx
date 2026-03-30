import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { getApiErrorMessage } from '@/lib/api'

export const AuthDialog = ({ trigger, open, onOpenChange, onSuccess }) => {
  const { isAuthenticated, login, register } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isControlled = useMemo(() => typeof open === 'boolean', [open])
  const dialogOpen = isControlled ? open : internalOpen

  const resetForm = () => {
    setError(null)
    setEmail('')
    setPassword('')
    setMode('login')
  }

  const setDialogOpen = (nextOpen) => {
    if (nextOpen && isAuthenticated) {
      onSuccess?.()
      return
    }

    if (!nextOpen) {
      resetForm()
    }

    if (isControlled) {
      onOpenChange?.(nextOpen)
      return
    }

    setInternalOpen(nextOpen)
  }

  const submitLabel = mode === 'login' ? 'Login' : 'Create account'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      setDialogOpen(false)
      onSuccess?.()
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Welcome back' : 'Create your account'}</DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? 'Login to continue to your dashboard.'
              : 'Register and start managing your short links.'}
          </DialogDescription>
        </DialogHeader>

        <form className='space-y-3' onSubmit={handleSubmit}>
          <Input
            type='email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder='you@example.com'
            required
          />
          <Input
            type='password'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder='Password'
            minLength={6}
            required
          />

          {error ? <p className='text-sm text-destructive'>{error}</p> : null}

          <DialogFooter className='mx-0 mb-0 rounded-none border-none bg-transparent p-0 sm:justify-between'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => {
                setError(null)
                setMode((prev) => (prev === 'login' ? 'register' : 'login'))
              }}
            >
              {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}