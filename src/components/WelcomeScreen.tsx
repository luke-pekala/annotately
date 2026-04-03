import { useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Image, Highlighter, Square, StickyNote, PenLine } from 'lucide-react'
import { useStore } from '@/store'
import { readFileAsDataURL, isPDFFile, isImageFile } from '@/utils'
const FEATURES = [
  { icon: <Highlighter size={16} />, label: 'Highlight & Underline', desc: 'Mark up text in PDFs with colored highlights' },
  { icon: <StickyNote size={16} />, label: 'Sticky Notes', desc: 'Pin notes anywhere on the document' },
  { icon: <Square size={16} />, label: 'Shapes & Arrows', desc: 'Draw rectangles, ellipses, and arrows' },
  { icon: <PenLine size={16} />, label: 'Freehand Drawing', desc: 'Sketch freely with the pen tool' },
]

export function WelcomeScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addDocument } = useStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!isPDFFile(file) && !isImageFile(file)) return
    const url = await readFileAsDataURL(file)
    addDocument({
      name: file.name,
      type: isPDFFile(file) ? 'pdf' : 'image',
      url,
      pageCount: isPDFFile(file) ? 0 : 1,
    })
  }, [addDocument])

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleFile(file)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          w-full max-w-lg border-2 border-dashed rounded-2xl px-8 py-12 cursor-pointer
          transition-all duration-200 group
          ${isDragOver
            ? 'border-[var(--accent)] bg-[var(--accent-dim)] scale-[1.02]'
            : 'border-[var(--border-strong)] hover:border-[var(--accent)]/50 hover:bg-white/5'
          }
        `}
      >
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-200
          ${isDragOver ? 'bg-[var(--accent)] text-ink-900' : 'bg-[var(--surface-3)] text-[var(--text-secondary)] group-hover:bg-[var(--accent-dim)] group-hover:text-[var(--accent)]'}
        `}>
          <Upload size={28} />
        </div>

        <h2 className="font-display text-xl font-700 text-[var(--text-primary)] mb-2">
          {isDragOver ? 'Drop to open' : 'Open a file to annotate'}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Drag & drop a PDF or image, or click to browse
        </p>

        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[var(--text-secondary)]">
            <FileText size={13} className="text-red-400" />
            PDF
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[var(--text-secondary)]">
            <Image size={13} className="text-blue-400" />
            PNG / JPG / WebP
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[var(--text-secondary)]">
            <Image size={13} className="text-green-400" />
            SVG / GIF
          </div>
        </div>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 gap-3 mt-8 max-w-lg w-full"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent)] flex-shrink-0 mt-0.5">
              {f.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">{f.label}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  )
}


