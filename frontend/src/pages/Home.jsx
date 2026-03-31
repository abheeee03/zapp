import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddLinkDialog } from '@/components/add-link-dialog'
import { EditLinkDialog } from '@/components/edit-link-dialog'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { deleteLinkRequest, getApiErrorMessage, getLinksRequest } from '@/lib/api'

function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [links, setLinks] = useState([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(true)
  const [error, setError] = useState(null)
  const [deletingSlug, setDeletingSlug] = useState(null)

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const response = await getLinksRequest()
        setLinks(response.links)
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoadingLinks(false)
      }
    }

    void loadLinks()
  }, [])

  return (
    <div className='min-h-screen w-full p-6'>
      <div className='mx-auto max-w-3xl'>
        <div className='flex w-full items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>Home</h1>
            <p className='text-sm text-muted-foreground'>{user?.email}</p>
          </div>
          <div className='flex items-center gap-2'>
            <AddLinkDialog
              trigger={<Button>Add Link</Button>}
              onCreated={(newLink) => {
                setError(null)
                setLinks((prev) => [newLink, ...prev])
              }}
            />
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

        <div className='mt-10 flex flex-col gap-4'>
          <h1 className='text-xl font-semibold'>Your Links</h1>

          {isLoadingLinks ? <p className='text-sm text-muted-foreground'>Loading links...</p> : null}
          {error ? <p className='text-sm text-destructive'>{error}</p> : null}

          {!isLoadingLinks && !error && links.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No links yet. Create your first short link.</p>
          ) : null}

          {!isLoadingLinks && !error
            ? links.map((link) => {
                const shortUrl = `${window.location.origin}/${link.slug}`

                return (
                  <Card key={link.id}>
                    <CardHeader>
                      <CardAction>
                        <div className='flex items-center gap-2'>
                          <EditLinkDialog
                            link={link}
                            trigger={<Button variant='outline' size='sm'>Edit URL</Button>}
                            onUpdated={(updatedLink) => {
                              setError(null)
                              setLinks((prev) =>
                                prev.map((existingLink) =>
                                  existingLink.id === updatedLink.id ? updatedLink : existingLink,
                                ),
                              )
                            }}
                          />
                          <Button
                            variant='outline'
                            size='icon-sm'
                            disabled={deletingSlug === link.slug}
                            onClick={async () => {
                              const shouldDelete = window.confirm(`Delete /${link.slug}?`)
                              if (!shouldDelete) {
                                return
                              }

                              setError(null)
                              setDeletingSlug(link.slug)

                              try {
                                await deleteLinkRequest(link.slug)
                                setLinks((prev) => prev.filter((existingLink) => existingLink.id !== link.id))
                              } catch (deleteError) {
                                setError(getApiErrorMessage(deleteError))
                              } finally {
                                setDeletingSlug(null)
                              }
                            }}
                          >
                            <Trash2 className='size-4' />
                            <span className='sr-only'>Delete link</span>
                          </Button>
                        </div>
                      </CardAction>
                      <CardTitle className='text-sm'>{link.slug}</CardTitle>
                      <CardDescription className='break-all'>{link.url}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className='mb-2 text-xs text-muted-foreground'>Total clicks: {link.clicks ?? 0}</p>
                      <a
                        href={shortUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='text-sm font-medium text-primary underline underline-offset-4'
                      >
                        {shortUrl}
                      </a>
                    </CardContent>
                  </Card>
                )
              })
            : null}
        </div>
      </div>
    </div>
  )
}

export default Home