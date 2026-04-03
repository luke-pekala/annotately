import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type {
  Annotation,
  AnnotationStore,
  ToolType,
  AnnotationColor,
  DocumentFile,
} from '@/types'

interface AnnotationActions {
  addDocument: (doc: Omit<DocumentFile, 'id' | 'createdAt'>) => string
  removeDocument: (id: string) => void
  setActiveDocument: (id: string | null) => void
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void
  selectAnnotation: (id: string | null) => void
  clearAnnotations: (docId?: string) => void
  setActiveTool: (tool: ToolType) => void
  setActiveColor: (color: AnnotationColor) => void
  setActiveOpacity: (opacity: number) => void
  setActiveStrokeWidth: (width: number) => void
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void
  setCurrentPage: (page: number) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarTab: (tab: 'annotations' | 'pages' | 'comments') => void
  undo: () => void
  redo: () => void
  snapshot: () => void
}

type Store = AnnotationStore & AnnotationActions

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      annotations: {},
      selectedAnnotationId: null,
      activeTool: 'select',
      activeColor: '#fbbf24',
      activeOpacity: 0.6,
      activeStrokeWidth: 2,
      zoom: 1,
      currentPage: 1,
      documents: [],
      activeDocumentId: null,
      sidebarOpen: true,
      sidebarTab: 'annotations',
      undoStack: [],
      redoStack: [],

      addDocument: (doc) => {
        const id = uuidv4()
        set((state) => ({
          documents: [...state.documents, { ...doc, id, createdAt: Date.now() }],
          annotations: { ...state.annotations, [id]: [] },
          activeDocumentId: id,
          currentPage: 1,
        }))
        return id
      },
      removeDocument: (id) => {
        set((state) => {
          const { [id]: _removed, ...rest } = state.annotations
          return {
            documents: state.documents.filter((d) => d.id !== id),
            annotations: rest,
            activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
          }
        })
      },
      setActiveDocument: (id) => set({ activeDocumentId: id, currentPage: 1 }),

      addAnnotation: (annotation) => {
        const id = uuidv4()
        const now = Date.now()
        const docId = get().activeDocumentId
        if (!docId) return id
        get().snapshot()
        set((state) => ({
          annotations: {
            ...state.annotations,
            [docId]: [
              ...(state.annotations[docId] ?? []),
              { ...annotation, id, createdAt: now, updatedAt: now } as Annotation,
            ],
          },
          selectedAnnotationId: id,
          redoStack: [],
        }))
        return id
      },
      updateAnnotation: (id, updates) => {
        const docId = get().activeDocumentId
        if (!docId) return
        set((state) => ({
          annotations: {
            ...state.annotations,
            [docId]: (state.annotations[docId] ?? []).map((a) =>
              a.id === id ? { ...a, ...updates, updatedAt: Date.now() } as Annotation : a
            ),
          },
        }))
      },
      removeAnnotation: (id) => {
        const docId = get().activeDocumentId
        if (!docId) return
        get().snapshot()
        set((state) => ({
          annotations: {
            ...state.annotations,
            [docId]: (state.annotations[docId] ?? []).filter((a) => a.id !== id),
          },
          selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
          redoStack: [],
        }))
      },
      selectAnnotation: (id) => set({ selectedAnnotationId: id }),
      clearAnnotations: (docId) => {
        const targetId = docId ?? get().activeDocumentId
        if (!targetId) return
        set((state) => ({ annotations: { ...state.annotations, [targetId]: [] } }))
      },

      setActiveTool: (tool) => set({ activeTool: tool }),
      setActiveColor: (color) => set({ activeColor: color }),
      setActiveOpacity: (opacity) => set({ activeOpacity: opacity }),
      setActiveStrokeWidth: (width) => set({ activeStrokeWidth: width }),

      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
      zoomIn: () => set((s) => ({ zoom: Math.min(4, Math.round((s.zoom + 0.25) * 4) / 4) })),
      zoomOut: () => set((s) => ({ zoom: Math.max(0.25, Math.round((s.zoom - 0.25) * 4) / 4) })),
      zoomReset: () => set({ zoom: 1 }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      snapshot: () => {
        const docId = get().activeDocumentId
        if (!docId) return
        const current = [...(get().annotations[docId] ?? [])]
        set((state) => ({ undoStack: [...state.undoStack.slice(-19), current] }))
      },
      undo: () => {
        const docId = get().activeDocumentId
        if (!docId) return
        const { undoStack, redoStack, annotations } = get()
        if (!undoStack.length) return
        const prev = undoStack[undoStack.length - 1]
        const current = annotations[docId] ?? []
        set({
          annotations: { ...annotations, [docId]: prev },
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack.slice(-19), current],
          selectedAnnotationId: null,
        })
      },
      redo: () => {
        const docId = get().activeDocumentId
        if (!docId) return
        const { undoStack, redoStack, annotations } = get()
        if (!redoStack.length) return
        const next = redoStack[redoStack.length - 1]
        const current = annotations[docId] ?? []
        set({
          annotations: { ...annotations, [docId]: next },
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack.slice(-19), current],
          selectedAnnotationId: null,
        })
      },
    }),
    {
      name: 'annotately-store',
      partialize: (state) => ({
        annotations: state.annotations,
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
        activeColor: state.activeColor,
        activeOpacity: state.activeOpacity,
        activeStrokeWidth: state.activeStrokeWidth,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

export const selectCurrentAnnotations = (state: Store) => {
  if (!state.activeDocumentId) return []
  return state.annotations[state.activeDocumentId] ?? []
}

export const selectActiveDocument = (state: Store) =>
  state.documents.find((d) => d.id === state.activeDocumentId) ?? null
