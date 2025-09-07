'use client'

import React, { useState } from 'react'
import { Card, ImageContent } from '@/types/board'
import { useBoardStore } from '@/stores/boardStore'

interface ImageCardProps {
  card: Card
  className?: string
}

export const ImageCard: React.FC<ImageCardProps> = ({ card, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const { updateCard } = useBoardStore()

  // カードの内容が image タイプであることを確認
  const imageContent = card.content.type === 'image' ? (card.content.data as ImageContent) : null

  React.useEffect(() => {
    if (imageContent) {
      setImageUrl(imageContent.src)
      setCaption(imageContent.caption || '')
    }
  }, [imageContent])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    if (imageContent && (imageUrl !== imageContent.src || caption !== imageContent.caption)) {
      updateCard(card.id, {
        content: {
          ...card.content,
          data: {
            ...imageContent,
            src: imageUrl,
            caption
          }
        }
      })
    }
  }

  const handleCancel = () => {
    setImageUrl(imageContent?.src || '')
    setCaption(imageContent?.caption || '')
    setIsEditing(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImageUrl(result)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!imageContent) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Invalid image card data
      </div>
    )
  }

  const imageStyle = {
    objectFit: imageContent.fit as 'cover' | 'contain' | 'fill',
    objectPosition: imageContent.alignment
  }

  return (
    <div 
      className={`w-full h-full flex flex-col ${className}`}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <div className="p-3 h-full flex flex-col space-y-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              画像URL または ファイルアップロード
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full mt-1 text-xs"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              キャプション
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="画像の説明（オプション）"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <>
          {imageContent.src ? (
            <>
              <div className="flex-1 overflow-hidden">
                <img
                  src={imageContent.src}
                  alt={imageContent.alt || 'Card image'}
                  className="w-full h-full"
                  style={imageStyle}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
              {imageContent.caption && (
                <div className="px-2 py-1 text-xs text-gray-600 bg-gray-50 border-t">
                  {imageContent.caption}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 cursor-pointer">
              <div className="text-center">
                <div className="text-3xl mb-2">🖼️</div>
                <div className="text-sm">画像なし</div>
                <div className="text-xs">ダブルクリックして画像を追加</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
