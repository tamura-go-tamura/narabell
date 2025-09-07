'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, TextContent } from '@/types/board'
import { useBoardStore } from '@/stores/boardStore'

interface TextCardProps {
  card: Card
  isEditing?: boolean
  className?: string
}

export const TextCard: React.FC<TextCardProps> = ({ card, isEditing: externalIsEditing = false, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { updateCard } = useBoardStore()

  // カードの内容が text タイプであることを確認
  const textContent = card.content.type === 'text' ? (card.content.data as TextContent) : null

  useEffect(() => {
    if (textContent) {
      setText(textContent.text)
    }
  }, [textContent])

  // 外部からの編集モードフラグを監視
  useEffect(() => {
    if (externalIsEditing) {
      setIsEditing(true)
    }
  }, [externalIsEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    
    // 編集モードフラグをリセット
    updateCard(card.id, {
      metadata: {
        ...card.metadata,
        isEditing: false
      }
    })
    
    if (textContent && text !== textContent.text) {
      updateCard(card.id, {
        content: {
          ...card.content,
          data: {
            ...textContent,
            text
          }
        }
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setText(textContent?.text || '')
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  if (!textContent) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Invalid text card data
      </div>
    )
  }

  const textStyle = {
    fontSize: `${textContent.fontSize}px`,
    fontFamily: textContent.fontFamily,
    fontWeight: textContent.fontWeight,
    color: textContent.color,
    textAlign: textContent.textAlign as 'left' | 'center' | 'right' | 'justify',
    lineHeight: textContent.lineHeight,
    letterSpacing: `${textContent.letterSpacing}px`
  }

  const containerStyle = {
    display: 'flex',
    alignItems: textContent.verticalAlign === 'top' ? 'flex-start' : 
                textContent.verticalAlign === 'bottom' ? 'flex-end' : 'center'
  }

  return (
    <div 
      className={`w-full h-full p-3 ${className}`}
      style={containerStyle}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full resize-none border-none outline-none bg-transparent"
          style={textStyle}
          placeholder="テキストを入力してください..."
        />
      ) : (
        <div 
          className="w-full h-full cursor-text"
          style={textStyle}
        >
          {text || (
            <span className="text-gray-400 italic">
              ダブルクリックして編集
            </span>
          )}
        </div>
      )}
    </div>
  )
}
