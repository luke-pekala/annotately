import { useRef, useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useStore, selectActiveDocument, selectCurrentAnnotations } from '@/store'
import { AnnotationLayer } from './AnnotationLayer'
import { PageNav } from './PageNav'
import type { Point, Annotation } from '@/types'

// Fix PDF worker for Vite + GitHub Pages (avoids base-path issues)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [drawingAnnotation, setDrawingAnnotation] = useState<Partial<Annotation> | null>(null)
  const lastPan = useRef<Point | null>(null)

  const {
    activeTool, activeColor, activeOpacity, activeStrokeWidth,
    zoom, currentPage, setCurrentPage, addAnnotation, setZoom,
  } = useStore()

  const activeDoc = useStore(selectActiveDocument)
  const annotations = useStore(selectCurrentAnnotations)

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    if (activeDoc) {
      useStore.setState((s) => ({
        documents: s.documents.map((d) => d.id === activeDoc.id ? { ...d, pageCount: n } : d),
      }))
    }
  }, [activeDoc])

  const onPageLoadSuccess = useCallback((page: { width: number; height: number }) => {
    setPageSize({ width: page.width, height: page.height })
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1))
    }
  }, [zoom, setZoom])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const getPagePoint = (e: React.MouseEvent): Point => {
    const pageEl = (
      containerRef.current?.querySelector('.react-pdf__Page') ??
      containerRef.current?.querySelector('img')
    ) as HTMLElement | null
    if (!pageEl) return { x: 0, y: 0 }
    const rect = pageEl.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    if (activeTool === 'pan') {
      lastPan.current = { x: e.clientX, y: e.clientY }
      setIsDragging(true)
      return
    }
    if (activeTool === 'select' || activeTool === 'eraser') return
    const pt = getPagePoint(e)
    setDragStart(pt)
    setIsDragging(true)
    if (activeTool === 'note') {
      addAnnotation({
        type: 'note', pageNumber: currentPage, color: activeColor,
        opacity: 1, position: pt, text: '', isOpen: true,
      } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
      setIsDragging(false)
      setDragStart(null)
    }
    if (activeTool === 'text') {
      addAnnotation({
        type: 'text', pageNumber: currentPage, color: activeColor,
        opacity: 1, position: pt, text: 'Text', fontSize: 16, fontWeight: 'normal',
      } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
      setIsDragging(false)
      setDragStart(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    if (activeTool === 'pan' && lastPan.current) {
      if (containerRef.current) {
        containerRef.current.scrollLeft -= e.clientX - lastPan.current.x
        containerRef.current.scrollTop -= e.clientY - lastPan.current.y
      }
      lastPan.current = { x: e.clientX, y: e.clientY }
      return
    }
    if (!dragStart) return
    const pt = getPagePoint(e)
    if (activeTool === 'rectangle' || activeTool === 'ellipse') {
      setDrawingAnnotation({
        type: activeTool,
        rect: { x: Math.min(dragStart.x, pt.x), y: Math.min(dragStart.y, pt.y), width: Math.abs(pt.x - dragStart.x), height: Math.abs(pt.y - dragStart.y) },
        color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth,
      })
    } else if (activeTool === 'arrow') {
      setDrawingAnnotation({ type: 'arrow', start: dragStart, end: pt, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth })
    } else if (activeTool === 'freehand') {
      setDrawingAnnotation((prev) => ({
        type: 'freehand',
        points: [...((prev as { points?: Point[] })?.points ?? [dragStart]), pt],
        color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth,
      }))
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    lastPan.current = null
    if (drawingAnnotation && dragStart) {
      if ((activeTool === 'rectangle' || activeTool === 'ellipse') && (drawingAnnotation as { rect?: { width: number; height: number } }).rect) {
        const r = (drawingAnnotation as { rect: { x: number; y: number; width: number; height: number } }).rect
        if (r.width > 4 && r.height > 4) {
          addAnnotation({ type: activeTool, pageNumber: currentPage, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth, filled: false, rect: r } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
        }
      } else if (activeTool === 'arrow') {
        const a = drawingAnnotation as { start: Point; end: Point }
        const dx = a.end.x - a.start.x, dy = a.end.y - a.start.y
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          addAnnotation({ type: 'arrow', pageNumber: currentPage, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth, start: a.start, end: a.end } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
        }
      } else if (activeTool === 'freehand') {
        const f = drawingAnnotation as { points?: Point[] }
        if ((f.points?.length ?? 0) > 3) {
          addAnnotation({ type: 'freehand', pageNumber: currentPage, color: activeColor, opacity: activeOpacity, strokeWidth: activeStrokeWidth, points: f.points! } as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
        }
      }
    }
    setDrawingAnnotation(null)
    setDragStart(null)
  }

  if (!activeDoc) return null
  const pageAnnotations = annotations.filter((a) => a.pageNumber === currentPage)
  const scaledWidth = pageSize.width > 0 ? pageSize.width * zoom : undefined

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        data-tool={activeTool}
        style={{ background: 'var(--canvas-bg)' }}
      >
        <div
          className="flex justify-center py-8 min-h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative"
            style={{
              width: scaledWidth,
              boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)',
              borderRadius: '2px',
            }}
          >
            {activeDoc.type === 'pdf' ? (
              <Document
                file={activeDoc.url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<LoadingPage />}
                error={<ErrorPage />}
              >
                <Page
                  pageNumber={currentPage}
                  scale={zoom}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={
                    activeTool === 'highlight' ||
                    activeTool === 'underline' ||
                    activeTool === 'strikethrough'
                  }
                  renderAnnotationLayer={false}
                />
              </Document>
            ) : (
              <img
                src={activeDoc.url}
                alt={activeDoc.name}
                onLoad={(e) => {
                  const img = e.currentTarget
                  setPageSize({ width: img.naturalWidth, height: img.naturalHeight })
                  setNumPages(1)
                }}
                style={{ width: scaledWidth, display: 'block' }}
                draggable={false}
              />
            )}

            {pageSize.width > 0 && (
              <AnnotationLayer
                annotations={pageAnnotations}
                drawingAnnotation={drawingAnnotation}
                pageSize={pageSize}
                zoom={zoom}
                activeTool={activeTool}
                interactive={activeTool !== 'select' && activeTool !== 'pan'}
              />
            )}
          </div>
        </div>
      </div>

      {numPages > 1 && (
        <PageNav current={currentPage} total={numPages} onPageChange={setCurrentPage} />
      )}
    </div>
  )
}

function LoadingPage() {
  return (
    <div style={{ width: 595, height: 842, background: 'var(--card)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent-amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Loading PDF…</span>
    </div>
  )
}

function ErrorPage() {
  return (
    <div style={{ width: 595, height: 400, background: 'var(--card)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 13, color: '#f87171' }}>Failed to load PDF. Make sure it's a valid PDF file.</span>
    </div>
  )
}
