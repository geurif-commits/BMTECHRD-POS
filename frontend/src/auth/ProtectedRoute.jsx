import { Navigate } from 'react-router-dom'
import { useStore } from '../stores/useStore'

const ProtectedRoute = ({ children, roles }) => {
  const user = useStore(state => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Verificar si el rol del usuario está incluido en los roles permitidos
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
