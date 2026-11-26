import { Database } from '@/types/database.types'

export type UserRole = Database['public']['Enums']['user_role']

export interface WorkshopMechanicOption {
  id: string
  full_name: string
  role: UserRole
  active: boolean
}

export const TEAM_ROLE_LABELS: Record<UserRole, string> = {
  mechanic: 'Mecánico',
  owner: 'Propietario',
  admin: 'Administrador',
  manager: 'Gerente',
  receptionist: 'Recepcionista',
}

export function sortMechanicsFirst<T extends { role: string; full_name: string }>(
  members: T[]
): T[] {
  return [...members].sort((a, b) => {
    const aIsMech = a.role === 'mechanic' ? 0 : 1
    const bIsMech = b.role === 'mechanic' ? 0 : 1
    if (aIsMech !== bIsMech) return aIsMech - bIsMech
    return a.full_name.localeCompare(b.full_name, 'es')
  })
}
