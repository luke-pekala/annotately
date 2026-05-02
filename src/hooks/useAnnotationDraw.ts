import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/store'
import type { Point, Annotation } from '@/types'

interface DrawState {
  drawingAnnotation: Partial<Annotation> | null
  isDragging: boolean
}

export function useAnnotationDraw(
  zoom: number,
  currentPage: number,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const [drawState, setDrawState] = useState<DrawState>({ drawingAnnotation: null, isDragging: false })
  const dragStart = useRef<Point | null>(null)
  const lastPan = useRef<Point | null>(null)
  const { activeTool, activeColor, activeOpacity, activeStrokeWidth, addAnnotation } = useStore()

  const getPagePoint = useCallback((e: React.MouseEvent): Point => {
    const pageEl = (containerRef.current?.querySelector('.react-pdf__Page') ?? containerRef.current?.querySelector('img')) as HTMLElement | null
    if (!pageEl) return { x: 0, y: 0 }
    const rect = pageEl.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
  }, [zoom, containerRef])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if (activeTool === 'pan') {
      lastPan.current = { x: e.clientX, y: e.clientY }
      setDrawState((s) => ({ ...s, isDragging: true }))
      return
    }
    if (activeTool === 'select' || activeTool === 'eraser') return
    const pt = getPagePoint(e)
    dragStart.current = pt
    setDrawState((s) => ({ ...s, isDragging: true }))
    if (activeTool === 'note') {
      addAnnotation({ type: 'note', pageNumber: currentPage, color: activeColor, opacity: 1, position: pt, text: '', isOpen: true } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
      dragStart.current = null
      setDrawState((s) => ({ ...s, isDragging: false }))
    }
    if (activeTool === 'text') {
      addAnnotation({ type: 'text', pageNumber: currentPage, color: activeColor, opacity: 1, position: pt, text: 'Text', fontSize: 16, fontWeight: 'normal' } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
      dragStart.current = null
      setDrawState((s) => ({ ...s, isDragging: false }))
    }
  }, [activeTool, getPagePoint, currentPage, activeColor, addAnnotation])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawState.isDragging) return
    if (activeTool === 'pan' && lastPan.current) {
      const dx = e.clientX - lastPan.current.x, dy = e.clientY - lastPan.current.y
      if (containerRef.current) { containerRef.current.scrollLeft -= dx; containerRef.current.scrollTop -= dy }
      lastPan.current = { x: e.clientX, y: e.clientY }
      return
    }
    if (!dragStart.current) return
    const pt = getPagePoint(e)
    const start = dragStart.current
    if (activeTool === 'rectangle' || activeTool === 'ellipse') {
      setDrawState((s) => ({ ...s, drawingAnnotation: { type: activeTool, rect: { x: Math.min(start.x, pt.x), y: Math.min(start.y, pt.y), width: Math.abs(pt.x - start.x), height: Math.abs(pt.y - start.y) }, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth } }))
    } else if (activeTool === 'arrow') {
      setDrawState((s) => ({ ...s, drawingAnnotation: { type: 'arrow', start, end: pt, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth } }))
    } else if (activeTool === 'freehand') {
      setDrawState((s) => ({ ...s, drawingAnnotation: { type: 'freehand', points: [...((s.drawingAnnotation as { points?: Point[] })?.points ?? [start]), pt], color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth } }))
    }
  }, [drawState.isDragging, activeTool, getPagePoint, activeColor, activeOpacity, activeStrokeWidth, containerRef])

  const handleMouseUp = useCallback(() => {
    if (!drawState.isDragging) return
    const ann = drawState.drawingAnnotation
    const start = dragStart.current
    if (ann && start) {
      if ((activeTool === 'rectangle' || activeTool === 'ellipse') && (ann as { rect?: { width: number; height: number } }).rect) {
        const r = (ann as { rect: { x: number; y: number; width: number; height: number } }).rect
        if (r.width > 4 && r.height > 4) addAnnotation({ type: activeTool, pageNumber: currentPage, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth, filled: false, rect: r } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
      } else if (activeTool === 'arrow') {
        const a = ann as { start: Point; end: Point }
        const dx = a.end.x - a.start.x, dy = a.end.y - a.start.y
        if (Math.sqrt(dx * dx + dy * dy) > 10) addAnnotation({ type: 'arrow', pageNumber: currentPage, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth, start: a.start, end: a.end } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
      } else if (activeTool === 'freehand') {
        const f = ann as { points?: Point[] }
        if ((f.points?.length ?? 0) > 3) addAnnotation({ type: 'freehand', pageNumber: currentPage, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth, points: f.points! } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
      }
    }
    dragStart.current = null
    lastPan.current = null
    setDrawState({ isDragging: false, drawingAnnotation: null })
  }, [drawState, activeTool, currentPage, activeColor, activeOpacity, activeStrokeWidth, addAnnotation])

  return { drawingAnnotation: drawState.drawingAnnotation, isDragging: drawState.isDragging, handleMouseDown, handleMouseMove, handleMouseUp }
}