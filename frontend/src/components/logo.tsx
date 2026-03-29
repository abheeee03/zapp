import { cn } from '@/lib/utils'
import React from 'react'

function Logo({size = "sm"}: {size?: "sm" | "lg"}) {
  return (
    <div className={cn(
        size == "sm" ? "w-10" : "w-15"
    )}>
          <img src="/logo.svg" alt="" />
    </div>
  )
}

export default Logo