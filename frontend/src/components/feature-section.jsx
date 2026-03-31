import { BarChart3, Link2, ShieldCheck } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'Fast Link Shortening',
    description: 'Turn long URLs into clean short links in seconds and share them anywhere.',
    icon: Link2,
  },
  {
    title: 'Click Analytics',
    description: 'Track total clicks for every short link and measure what is working best.',
    icon: BarChart3,
  },
  {
    title: 'Secure Access',
    description: 'Manage links in your own account with authenticated and protected routes.',
    icon: ShieldCheck,
  },
]

function FeatureSection() {
  return (
    <section className='w-full h-screen flex flex-col items-center justify-center gap-10'>
      <div className='mb-5 text-center'>
        <h2 className='text-5xl font-semibold'>Why use zapp?</h2>
        <p className='mt-2 text-sm text-muted-foreground'>Simple tools to create, share, and track your links.</p>
      </div>

      <div className='flex flex-wrap items-center justify-center gap-4 max-w-xl'>
        {features.map((feature) => {
          const Icon = feature.icon

          return (
            <Card key={feature.title} className='min-w-60 flex-1'>
              <CardHeader>
                <div className='mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <Icon className='h-4 w-4' />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export { FeatureSection }
