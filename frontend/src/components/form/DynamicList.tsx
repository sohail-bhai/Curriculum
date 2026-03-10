'use client'
/**
 * DynamicList Component
 * Manages a list of items with add, remove, and edit capabilities
 */
import { ReactNode, useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'

export interface DynamicListItem {
  id: string
  [key: string]: any
}

export interface DynamicListProps {
  label?: string
  items: DynamicListItem[]
  onAdd: () => void
  onRemove: (id: string) => void
  onMove?: (id: string, direction: 'up' | 'down') => void
  renderItem: (item: DynamicListItem, index: number) => ReactNode
  addButtonLabel?: string
  emptyMessage?: string
  canMove?: boolean
  minItems?: number
  maxItems?: number
}

export default function DynamicList({
  label,
  items,
  onAdd,
  onRemove,
  onMove,
  renderItem,
  addButtonLabel = 'Add Item',
  emptyMessage = 'No items added yet',
  canMove = false,
  minItems = 0,
  maxItems = Infinity,
}: DynamicListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const canAddMore = items.length < maxItems
  const canRemoveItem = items.length > minItems

  return (
    <div className="space-y-4">
      {label && (
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      )}

      {items.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-start gap-3">
                {/* Item content */}
                <div className="flex-1 min-w-0">
                  {renderItem(item, index)}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {/* Move buttons */}
                  {canMove && (
                    <>
                      <button
                        onClick={() => onMove?.(item.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => onMove?.(item.id, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown size={16} className="text-gray-600" />
                      </button>
                    </>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => onRemove(item.id)}
                    disabled={!canRemoveItem}
                    className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove item"
                  >
                    <Trash2 size={16} className="text-red-500 hover:text-red-700" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {canAddMore && (
        <Button
          onClick={onAdd}
          variant="secondary"
          size="md"
          fullWidth
          icon={<Plus size={18} />}
          className="justify-center"
        >
          {addButtonLabel}
        </Button>
      )}

      {maxItems < Infinity && (
        <p className="text-xs text-gray-600 text-center mt-2">
          {items.length} / {maxItems}
        </p>
      )}
    </div>
  )
}
