'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/types/board'
import { useBoardStore } from '@/stores/boardStore'

interface CardComponentProps {
  card: Card
  isSelected?: boolean
  className?: string
}

export const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  isSelected = false, 
  className = '' 
}) => {
  const { updateCard } = useBoardStore()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (card.content.type === 'shape') {
      setText(card.content.data.text)
    }
  }, [card.content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (card.content.type === 'shape' && text !== card.content.data.text) {
      updateCard(card.id, {
        content: {
          type: 'shape',
          data: { ...card.content.data, text }
        }
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setText(card.content.type === 'shape' ? card.content.data.text : '')
      setIsEditing(false)
    }
  }

  const style = card.style
  const cardStyle = {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: `${style.borderWidth}px`,
    borderStyle: style.borderStyle,
    borderRadius: `${style.borderRadius}px`,
    opacity: style.opacity,
    transform: `rotate(${style.rotation}deg)`,
    boxShadow: style.shadow.enabled 
      ? `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.spread}px ${style.shadow.color}`
      : 'none'
  }

  const textStyle = {
    fontSize: `${card.content.data.fontSize}px`,
    fontWeight: card.content.data.fontWeight,
    textAlign: card.content.data.textAlign as 'left' | 'center' | 'right',
    color: card.content.data.color,
    lineHeight: 1.4
  }

  return (
    <div
      className={`w-full h-full overflow-hidden transition-all duration-200 hover:shadow-lg relative ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${className}`}
      style={cardStyle}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent p-2 text-sm"
            style={textStyle}
            placeholder="テキストを入力..."
        />
      ) : (
        <div className="w-full h-full cursor-text p-2 text-sm" style={textStyle}>
          {text || <span className="text-gray-400 italic">ダブルクリックして入力</span>}
        </div>
      )}
      <div className="absolute top-1 right-1 text-xs opacity-50">🔲</div>
    </div>
  )
}
