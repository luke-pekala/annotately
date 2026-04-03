import { useState } from 'react'
import { MessageSquare, Layers, List, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, selectCurrentAnnotations, selectActiveDocument } from '@/store'
import { formatDate, getAnnotationLabel, groupAnnotationsByPage, exportAnnotations } from '@/utils'
import type { Annotation } from '@/types'

const TABS = [
  { id: 'annotations' as const, icon: <List size={14} />, label: 'Annotations' },
  { id: 'pages' as const, icon: <Layers size={14} />, label: 'Pages' },
  { id: 'comments' as const, icon: <MessageSquare size={14} />, label: 'Comments' },
]

export function Sidebar() {
  const { sidebarTab, setSidebarTab, selectedAnnotationId, selectAnnotation, removeAnnotation, updateAnnotation, currentPage, setCurrentPage } = useStore()
  const annotations = useStore(selectCurrentAnnotations)
  const activeDoc = useStore(selectActiveDocument)
  const [search, setSearch] = useState('')

  const filtered = annotations.filter((a) => {
    if (!search) return true
    const label = getAnnotationLabel(a.type).toLowerCase()
    const comment = a.comment?.toLowerCase() ?? ''
    return label.includes(search.toLowerCase()) || comment.includes(search.toLowerCase())
  })

  const byPage = groupAnnotationsByPage(annotations)
  const comments = annotations.filter((a) => a.comment)

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] border-l border-[var(--border)] w-[280px]">
      {/* Tabs */}
      <div className="flex items-center gap-0.5 p-2 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium flex-1 justify-center transition-all duration-150 ${
              sidebarTab === tab.id
                ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {sidebarTab === 'annotations' && (
          <AnnotationsTab
            annotations={filtered}
            search={search}
            setSearch={setSearch}
            selectedId={selectedAnnotationId}
            onSelect={selectAnnotation}
            onDelete={removeAnnotation}
            onUpdate={updateAnnotation}
          />
        )}
        {sidebarTab === 'pages' && (
          <PagesTab byPage={byPage} currentPage={currentPage} onPageChange={setCurrentPage} />
        )}
        {sidebarTab === 'comments' && (
          <CommentsTab comments={comments} selectedId={selectedAnnotationId} onSelect={selectAnnotation} />
        )}
      </div>

      <div className="p-2 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => exportAnnotations(annotations, activeDoc)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          Export JSON
        </button>
      </div>
    </div>
  )
}

function AnnotationsTab({
  annotations, search, setSearch, selectedId, onSelect, onDelete, onUpdate,
}: {
  annotations: Annotation[]
  search: string
  setSearch: (s: string) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Annotation>) => void
}) {
  return (
    <>
      <div className="p-2 border-b border-[var(--border)]">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search annotations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-7 py-1.5 text-xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] flex items-center justify-center mb-3">
              <List size={18} className="text-[var(--text-tertiary)]" />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{search ? 'No matching annotations' : 'No annotations yet'}</p>
            {!search && <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Select a tool and start annotating</p>}
          </div>
        ) : (
          annotations.map((ann) => (
            <AnnotationItem
              key={ann.id}
              annotation={ann}
              selected={selectedId === ann.id}
              onSelect={() => onSelect(ann.id === selectedId ? null : ann.id)}
              onDelete={() => onDelete(ann.id)}
              onUpdate={(updates) => onUpdate(ann.id, updates)}
            />
          ))
        )}
      </div>
    </>
  )
}

function AnnotationItem({ annotation, selected, onSelect, onDelete, onUpdate }: {
  annotation: Annotation
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<Annotation>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [comment, setComment] = useState(annotation.comment ?? '')

  const saveComment = () => { onUpdate({ comment }); setEditing(false) }

  return (
    <div className={selected ? 'annotation-item-active' : 'annotation-item'}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: annotation.color }} />
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-medium text-[var(--text-primary)] truncate">{getAnnotationLabel(annotation.type)}</span>
          <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">p.{annotation.pageNumber}</span>
        </div>
        <span className="text-[11px] text-[var(--text-tertiary)]">{formatDate(annotation.createdAt)}</span>
        {annotation.comment && !editing && (
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">{annotation.comment}</p>
        )}
        {selected && (
          <AnimatePresence>
            {editing ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2" onClick={(e) => e.stopPropagation()}>
                <textarea
                  autoFocus value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…" className="input text-xs py-1.5 resize-none" rows={3}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) saveComment(); if (e.key === 'Escape') setEditing(false) }}
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={saveComment} className="btn-primary text-[11px] py-0.5 px-2">Save</button>
                  <button onClick={() => setEditing(false)} className="btn-ghost text-[11px] py-0.5 px-2">Cancel</button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setEditing(true)} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  {annotation.comment ? 'Edit comment' : '+ Comment'}
                </button>
                <span className="text-[var(--text-tertiary)]">·</span>
                <button onClick={onDelete} className="text-[11px] text-[var(--text-tertiary)] hover:text-red-400 transition-colors">Delete</button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function PagesTab({ byPage, currentPage, onPageChange }: { byPage: Record<number, Annotation[]>; currentPage: number; onPageChange: (p: number) => void }) {
  const pages = Object.keys(byPage).map(Number).sort((a, b) => a - b)
  if (pages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] flex items-center justify-center mb-3">
          <Layers size={18} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-xs text-[var(--text-secondary)]">No annotated pages yet</p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {pages.map((page) => (
        <button key={page} onClick={() => onPageChange(page)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
            page === currentPage ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-amber-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
          }`}
        >
          <span>Page {page}</span>
          <span className="badge bg-white/10 text-[var(--text-secondary)]">{byPage[page].length}</span>
        </button>
      ))}
    </div>
  )
}

function CommentsTab({ comments, selectedId, onSelect }: { comments: Annotation[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
  if (comments.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] flex items-center justify-center mb-3">
          <MessageSquare size={18} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-xs text-[var(--text-secondary)]">No comments yet</p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Select an annotation and add a comment</p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {comments.map((ann) => (
        <div key={ann.id} onClick={() => onSelect(ann.id)}
          className={`p-2.5 rounded-lg cursor-pointer transition-all text-xs border ${
            selectedId === ann.id ? 'bg-[var(--accent-dim)] border-amber-500/20' : 'bg-white/5 border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ann.color }} />
            <span className="font-medium text-[var(--text-primary)]">{getAnnotationLabel(ann.type)}</span>
            <span className="text-[var(--text-tertiary)] ml-auto">p.{ann.pageNumber}</span>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">{ann.comment}</p>
          <p className="text-[var(--text-tertiary)] mt-1">{formatDate(ann.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}
