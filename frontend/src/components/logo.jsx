import { cn } from '@/lib/utils'

function Logo({ size = 'sm' }) {
  return (
    <div className={cn(size === 'sm' ? 'w-10' : 'w-15')}>
      <img src='/logo.svg' alt='' />
    </div>
  )
}

export default Logo