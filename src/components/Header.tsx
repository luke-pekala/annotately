import { useRef } from 'react'
import { Upload, Download, Undo2, Redo2, PanelRight, FileText, Image } from 'lucide-react'
import { useStore, selectActiveDocument, selectCurrentAnnotations } from '@/store'
import { exportAnnotations, isPDFFile, readFileAsDataURL } from '@/utils'
import type { DocumentFile } from '@/types'

export function Header() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    documents,
    activeDocumentId,
    sidebarOpen,
    undoStack,
    redoStack,
    zoom,
    setSidebarOpen,
    undo,
    redo,
    zoomIn,
    zoomOut,
    zoomReset,
    addDocument,
    setActiveDocument,
    removeDocument,
  } = useStore()

  const activeDoc = useStore(selectActiveDocument)
  const annotations = useStore(selectCurrentAnnotations)

  const handleFileOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await readFileAsDataURL(file)
    const docType: DocumentFile['type'] = isPDFFile(file) ? 'pdf' : 'image'
    addDocument({ name: file.name, type: docType, url, pageCount: docType === 'image' ? 1 : 0 })
    e.target.value = ''
  }

  return (
    <header className="flex items-center h-12 px-3 gap-2 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 flex-shrink-0">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="7" fill="var(--accent-dim)" />
          <rect x="6" y="8" width="14" height="18" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
          <rect x="9" y="13" width="6" height="1.5" rx="0.75" fill="var(--accent)" />
          <rect x="9" y="16.5" width="8" height="1.5" rx="0.75" fill="var(--accent)" opacity="0.5" />
          <rect x="9" y="20" width="5" height="1.5" rx="0.75" fill="var(--accent)" opacity="0.3" />
          <circle cx="22" cy="22" r="5" fill="var(--accent)" />
          <path d="M20.5 22h3M22 20.5v3" stroke="#0d0d1a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)]">
          Annotately
        </span>
      </div>

      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      {/* Document tabs */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar min-w-0">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDocument(doc.id)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap
              transition-all duration-150 group flex-shrink-0 max-w-[160px]
              ${doc.id === activeDocumentId
                ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-amber-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
              }
            `}
          >
            {doc.type === 'pdf' ? <FileText size={12} className="flex-shrink-0" /> : <Image size={12} className="flex-shrink-0" />}
            <span className="truncate">{doc.name}</span>
            <span
              onClick={(e) => { e.stopPropagation(); removeDocument(doc.id) }}
              className="opacity-0 group-hover:opacity-100 ml-0.5 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
            >
              ×
            </span>
          </button>
        ))}
        {documents.length === 0 && (
          <span className="text-xs text-[var(--text-tertiary)] px-1">No documents open</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={undo} disabled={!undoStack.length} title="Undo (Ctrl+Z)" className="tool-btn disabled:opacity-30 disabled:cursor-not-allowed">
          <Undo2 size={15} />
        </button>
        <button onClick={redo} disabled={!redoStack.length} title="Redo (Ctrl+Shift+Z)" className="tool-btn disabled:opacity-30 disabled:cursor-not-allowed">
          <Redo2 size={15} />
        </button>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button onClick={zoomOut} title="Zoom out" className="tool-btn text-xs font-mono">−</button>
        <button onClick={zoomReset} title="Reset zoom" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-mono cursor-pointer w-10 text-center">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={zoomIn} title="Zoom in" className="tool-btn text-xs font-mono">+</button>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        {activeDoc && (
          <button onClick={() => exportAnnotations(annotations, activeDoc)} className="btn-secondary text-xs gap-1.5" title="Export annotations">
            <Download size={13} />
            Export
          </button>
        )}

        <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-xs gap-1.5">
          <Upload size={13} />
          Open File
        </button>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar" className={sidebarOpen ? 'tool-btn-active' : 'tool-btn'}>
          <PanelRight size={15} />
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileOpen} />
    </header>
  )
}
