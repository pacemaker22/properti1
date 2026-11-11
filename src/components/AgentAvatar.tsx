import { useState } from 'react'
import type { Property } from '../types/property'

interface AgentAvatarProps {
  property: Property
  className?: string
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export function AgentAvatar({ property, className = 'h-14 w-14' }: AgentAvatarProps) {
  const [photoFailed, setPhotoFailed] = useState(false)

  if (!property.agent_photo || photoFailed) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full bg-primary-500 text-base font-bold text-white ${className}`}
      >
        {getInitials(property.agent_name)}
      </span>
    )
  }

  return (
    <img
      src={property.agent_photo}
      alt={property.agent_name}
      onError={() => setPhotoFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  )
}
