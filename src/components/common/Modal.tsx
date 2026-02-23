import { useEffect, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  overlayClassName?: string
  fullScreen?: boolean
}

const getDocument = () => {
  if (typeof document === 'undefined') {
    return null
  }
  return document
}

const Modal = ({
  isOpen,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  fullScreen = false,
}: ModalProps) => {
  const doc = getDocument()

  useEffect(() => {
    if (!isOpen || !doc) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const originalOverflow = doc.body.style.overflow
    doc.body.style.overflow = 'hidden'
    doc.addEventListener('keydown', handleKeyDown)

    return () => {
      doc.body.style.overflow = originalOverflow
      doc.removeEventListener('keydown', handleKeyDown)
    }
  }, [doc, isOpen, onClose])

  if (!isOpen || !doc) {
    return null
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const tokens = className
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
  const hasCustomMaxWidth = tokens.some((token) => token.includes('max-w'))

  const modalContentClass = fullScreen
    ? 'relative w-full h-full'
    : [
        'relative w-full rounded-3xl border border-border/60 bg-surface p-6 shadow-xl',
        hasCustomMaxWidth ? '' : 'max-w-md',
      ]
        .filter(Boolean)
        .join(' ')

  const overlayBaseClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/50 backdrop-blur-sm'
    : 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm'

  return createPortal(
    <div className={`${overlayBaseClass} ${overlayClassName}`.trim()} onClick={handleOverlayClick}>
      <div
        role="dialog"
        aria-modal="true"
        className={`${modalContentClass} ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    doc.body,
  )
}

export default Modal
