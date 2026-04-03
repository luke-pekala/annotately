import { useState } from 'react'
import {
  MousePointer2, Hand, Highlighter, StickyNote,
  Square, Circle, ArrowRight, PenLine, Type, Eraser,
  Underline, Strikethrough, Minus, Plus,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store'
import type { ToolType } from '@/types'

interface ToolItem {
  id: ToolType
  icon: React.ReactNode
  label: string
  shortcut: string
}

const TOOLS: ToolItem[] = [
  { id: 'select', icon: <MousePointer2 size={16} />, label: 'Select', shortcut: 'V' },
  { id: 'pan', icon: <Hand size={16} />, label: 'Pan', shortcut: 'H' },
]

const ANNOTATION_TOOLS: ToolItem[] = [
  { id: 'highlight', icon: <Highlighter size={16} />, label: 'Highlight', shortcut: 'L' },
  { id: 'underline', icon: <Underline size={16} />, label: 'Underline', shortcut: 'U' },
  { id: 'strikethrough', icon: <Strikethrough size={16} />, label: 'Strikethrough', shortcut: 'S' },
  { id: 'note', icon: <StickyNote size={16} />, label: 'Note', shortcut: 'N' },
  { id: 'text', icon: <Type size={16} />, label: 'Text', shortcut: 'T' },
]

const SHAPE_TOOLS: ToolItem[] = [
  { id: 'rectangle', icon: <Square size={16} />, label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse', icon: <Circle size={16} />, label: 'Ellipse', shortcut: 'E' },
  { id: 'arrow', icon: <ArrowRight size={16} />, label: 'Arrow', shortcut: 'A' },
  { id: 'freehand', icon: <PenLine size={16} />, label: 'Draw', shortcut: 'F' },
]

const UTIL_TOOLS: ToolItem[] = [
  { id: 'eraser', icon: <Eraser size={16} />, label: 'Eraser', shortcut: 'X' },
]

const ACCENT_COLORS = [
  '#fbbf24', '#f87171', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#ffffff',
]

function ToolButton({ tool, active, onClick }: { tool: ToolItem; active: boolean; onClick: () => void }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <button onClick={onClick} className={active ? 'tool-btn-active' : 'tool-btn'} aria-label={tool.label}>
        {tool.icon}
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="glass rounded-md px-2 py-1 whitespace-nowrap flex items-center gap-2">
              <span className="text-xs text-[var(--text-primary)]">{tool.label}</span>
              <kbd className="text-[10px] bg-white/10 text-[var(--text-secondary)] px-1 py-0.5 rounded font-mono">{tool.shortcut}</kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Toolbar() {
  const { activeTool, activeColor, activeStrokeWidth, zoom, setActiveTool, setActiveColor, setActiveStrokeWidth, zoomIn, zoomOut, zoomReset } = useStore()

  return (
    <aside className="flex flex-col items-center w-12 py-3 gap-1 border-r border-[var(--border)] bg-[var(--surface)] flex-shrink-0 overflow-y-auto no-scrollbar z-20">
      {TOOLS.map((tool) => (
        <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onClick={() => setActiveTool(tool.id)} />
      ))}

      <div className="divider w-6 mx-auto" />

      {ANNOTATION_TOOLS.map((tool) => (
        <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onClick={() => setActiveTool(tool.id)} />
      ))}

      <div className="divider w-6 mx-auto" />

      {SHAPE_TOOLS.map((tool) => (
        <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onClick={() => setActiveTool(tool.id)} />
      ))}

      <div className="divider w-6 mx-auto" />

      {UTIL_TOOLS.map((tool) => (
        <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onClick={() => setActiveTool(tool.id)} />
      ))}

      <div className="flex-1" />

      {/* Color swatches */}
      <div className="flex flex-col items-center gap-1 pb-1">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            title={color}
            className="w-5 h-5 rounded-full border-2 transition-all duration-150 flex-shrink-0"
            style={{
              backgroundColor: color,
              borderColor: activeColor === color ? 'white' : 'transparent',
              transform: activeColor === color ? 'scale(1.2)' : 'scale(1)',
              boxShadow: activeColor === color ? `0 0 8px ${color}80` : 'none',
            }}
          />
        ))}
      </div>

      <div className="divider w-6 mx-auto" />

      {/* Stroke width */}
      <div className="flex flex-col items-center gap-1 pb-1">
        {[1, 2, 4].map((w) => (
          <button
            key={w}
            onClick={() => setActiveStrokeWidth(w)}
            title={`Stroke ${w}px`}
            className={`w-7 h-6 flex items-center justify-center rounded transition-all duration-150 ${activeStrokeWidth === w ? 'bg-[var(--accent-dim)]' : 'hover:bg-white/5'}`}
          >
            <div className="bg-[var(--text-secondary)] rounded-full" style={{ width: 14, height: w + 0.5 }} />
          </button>
        ))}
      </div>

      <div className="divider w-6 mx-auto" />

      {/* Zoom */}
      <button onClick={zoomIn} className="tool-btn" title="Zoom in"><Plus size={14} /></button>
      <button onClick={zoomReset} title="Reset zoom" className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-mono cursor-pointer w-9 text-center py-0.5 rounded hover:bg-white/5">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={zoomOut} className="tool-btn" title="Zoom out"><Minus size={14} /></button>
    </aside>
  )
}
