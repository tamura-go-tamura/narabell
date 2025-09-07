'use client'

import React, { useState } from 'react'
import { Card, ListContent, ListItem } from '@/types/board'
import { useBoardStore } from '@/stores/boardStore'

interface ListCardProps {
  card: Card
  isEditing?: boolean
  className?: string
}

export const ListCard: React.FC<ListCardProps> = ({ card, isEditing: externalIsEditing = false, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const { updateCard } = useBoardStore()

  // カードの内容が list タイプであることを確認
  const listContent = card.content.type === 'list' ? (card.content.data as ListContent) : null

  const handleToggleItem = (itemId: string) => {
    if (!listContent) return

    const updatedItems = listContent.items.map(item =>
      item.id === itemId 
        ? { ...item, checked: !item.checked, completed: !item.checked }
        : item
    )

    updateCard(card.id, {
      content: {
        ...card.content,
        data: {
          ...listContent,
          items: updatedItems
        }
      }
    })
  }

  const handleAddItem = () => {
    if (!listContent || !newItemText.trim()) return

    const newItem: ListItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newItemText.trim(),
      checked: false,
      completed: false,
      priority: 'medium'
    }

    updateCard(card.id, {
      content: {
        ...card.content,
        data: {
          ...listContent,
          items: [...listContent.items, newItem]
        }
      }
    })

    setNewItemText('')
  }

  const handleRemoveItem = (itemId: string) => {
    if (!listContent) return

    const updatedItems = listContent.items.filter(item => item.id !== itemId)

    updateCard(card.id, {
      content: {
        ...card.content,
        data: {
          ...listContent,
          items: updatedItems
        }
      }
    })
  }

  const handleEditItem = (itemId: string, newText: string) => {
    if (!listContent) return

    const updatedItems = listContent.items.map(item =>
      item.id === itemId 
        ? { ...item, text: newText }
        : item
    )

    updateCard(card.id, {
      content: {
        ...card.content,
        data: {
          ...listContent,
          items: updatedItems
        }
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddItem()
    }
  }

  if (!listContent) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Invalid list card data
      </div>
    )
  }

  const getListIcon = (style: string, index: number) => {
    switch (style) {
      case 'checklist':
        return '☐'
      case 'numbered':
        return `${index + 1}.`
      case 'bulleted':
        return '•'
      default:
        return '•'
    }
  }

  return (
    <div className={`w-full h-full p-3 flex flex-col ${className}`}>
      {/* リストアイテム */}
      <div className="flex-1 overflow-auto space-y-1">
        {listContent.items.length === 0 ? (
          <div className="text-gray-400 text-sm italic text-center py-4">
            リストが空です
          </div>
        ) : (
          listContent.items.map((item, index) => (
            <ListItemComponent
              key={item.id}
              item={item}
              index={index}
              listStyle={listContent.listStyle}
              onToggle={() => handleToggleItem(item.id)}
              onEdit={(newText) => handleEditItem(item.id, newText)}
              onRemove={() => handleRemoveItem(item.id)}
            />
          ))
        )}
      </div>

      {/* 新しいアイテム追加 */}
      <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-200">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新しいアイテムを追加..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          追加
        </button>
      </div>
    </div>
  )
}

interface ListItemComponentProps {
  item: ListItem
  index: number
  listStyle: string
  onToggle: () => void
  onEdit: (newText: string) => void
  onRemove: () => void
}

const ListItemComponent: React.FC<ListItemComponentProps> = ({
  item,
  index,
  listStyle,
  onToggle,
  onEdit,
  onRemove
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)

  const handleSave = () => {
    setIsEditing(false)
    if (editText.trim() !== item.text) {
      onEdit(editText.trim())
    }
  }

  const handleCancel = () => {
    setEditText(item.text)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="flex items-center space-x-2 group">
      {/* チェックボックス/アイコン */}
      {listStyle === 'checklist' ? (
        <button
          onClick={onToggle}
          className="text-lg hover:text-blue-500 focus:outline-none"
        >
          {item.checked ? '☑️' : '☐'}
        </button>
      ) : (
        <span className="text-sm text-gray-500 min-w-[20px]">
          {listStyle === 'numbered' ? `${index + 1}.` : '•'}
        </span>
      )}

      {/* アイテムテキスト */}
      <div className="flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-1 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span
            className={`text-sm cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded ${
              item.completed ? 'line-through text-gray-500' : ''
            }`}
            onClick={() => setIsEditing(true)}
          >
            {item.text}
          </span>
        )}
      </div>

      {/* 優先度インジケーター */}
      <div className={`text-xs ${getPriorityColor(item.priority)} opacity-50`}>
        {item.priority === 'high' && '🔴'}
        {item.priority === 'medium' && '🟡'}
        {item.priority === 'low' && '🟢'}
      </div>

      {/* 削除ボタン */}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm focus:outline-none transition-opacity"
      >
        ×
      </button>
    </div>
  )
}
