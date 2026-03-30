import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Home from './pages/Home'
import LinkPage from './pages/LinkPage'
import { useAuth } from './lib/auth-context'

function ProtectedHome() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className='h-screen w-full flex items-center justify-center'>Checking session...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to='/' replace />
  }

  return <Home />
}

function App() {
  return (
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route path='/home' element={<ProtectedHome />} />
      <Route path='/:slug' element={<LinkPage />} />
    </Routes>
  )
}

export default App