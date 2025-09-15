'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

export interface TransformState {
  x: number
  y: number
  scale: number
}

interface ZoomPanCanvasProps {
  children: React.ReactNode
  onTransformChange?: (state: TransformState) => void
  className?: string
  // 親へ最小限のズーム API を渡す（最小差分実装）
  onApi?: (api: { zoomIn: () => void; zoomOut: () => void; reset: () => void }) => void
}

export const ZoomPanCanvas: React.FC<ZoomPanCanvasProps> = ({
  children,
  onTransformChange,
  className = '',
  onApi
}) => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  
  // 変換状態変更時のコールバック
  const handleTransformed = useCallback((ref: ReactZoomPanPinchRef, state: any) => {
    const transformState: TransformState = {
      x: state.positionX,
      y: state.positionY,
      scale: state.scale
    }
    onTransformChange?.(transformState)
  }, [onTransformChange])

  // 最小 API expose
  useEffect(() => {
    if (!onApi || !transformRef.current) return
    onApi({
      zoomIn: () => transformRef.current?.zoomIn?.(),
      zoomOut: () => transformRef.current?.zoomOut?.(),
      reset: () => transformRef.current?.resetTransform?.()
    })
  }, [onApi])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.1}
        maxScale={5}
        limitToBounds={false}
        centerOnInit={false}
        disablePadding={true}
        onTransformed={handleTransformed}
        panning={{
          velocityDisabled: true,
          lockAxisX: false,
          lockAxisY: false
        }}
        wheel={{
          step: 0.1,
          wheelDisabled: false,
          touchPadDisabled: false
        }}
        pinch={{
          step: 5,
          disabled: false
        }}
        doubleClick={{
          disabled: true
        }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full"
        >
          <div className="w-full h-full">
            {children}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

// 最小構成では未使用のため一時撤去
export {}