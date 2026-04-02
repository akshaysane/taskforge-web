import { useAuthStore } from '../store/auth'
import ParentHome from './ParentHome'
import ChildHome from './ChildHome'

export default function Home() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === 'child') {
    return <ChildHome />
  }

  return <ParentHome />
}
