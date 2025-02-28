import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SessionStep = 'initial' | 'capture' | 'color' | 'processing' | 'result'

interface SessionState {
  sessionId: string
  step: SessionStep
  capturedPhoto: string | null
  selectedColor: string | null
  colorChoice: number | null
  processedImageUrl: string | null
  aiResponse: string | null
  aiName: string | null
  comfyUIImage: string | null
  aiModelImage: string | null
  aiModelProvider: string | null
  userName: string | null
  userEmail: string | null
  isProcessing: boolean
  error: string | null
  uploadedPhotoUrl: string | null
  hasStartedProcessing: boolean
}

interface SessionActions {
  setStep: (step: SessionStep) => void
  setCapturedPhoto: (photo: string | null) => void
  setSelectedColor: (color: string | null) => void
  setColorChoice: (color: number | null) => void
  setProcessedImage: (url: string | null) => void
  setAiResponse: (response: string | null) => void
  setAiName: (name: string | null) => void
  setComfyUIImage: (image: string | null) => void
  setAiModelImage: (image: string | null) => void
  setAiModelProvider: (provider: string | null) => void
  setUserName: (name: string | null) => void
  setUserEmail: (email: string | null) => void
  setIsProcessing: (isProcessing: boolean) => void
  setError: (error: string | null) => void
  setUploadedPhotoUrl: (url: string | null) => void
  setHasStartedProcessing: (hasStarted: boolean) => void
  resetSession: () => void
  resetProcessingState: () => void
}

const initialState: SessionState = {
  sessionId: crypto.randomUUID(),
  step: 'initial',
  capturedPhoto: null,
  selectedColor: null,
  colorChoice: null,
  processedImageUrl: null,
  aiResponse: null,
  aiName: null,
  comfyUIImage: null,
  aiModelImage: null,
  aiModelProvider: null,
  userName: null,
  userEmail: null,
  isProcessing: false,
  error: null,
  uploadedPhotoUrl: null,
  hasStartedProcessing: false
}

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      setCapturedPhoto: (photo) => set({ capturedPhoto: photo }),
      setSelectedColor: (color) => set({ selectedColor: color }),
      setColorChoice: (color) => set({ colorChoice: color }),
      setProcessedImage: (url) => set({ processedImageUrl: url }),
      setAiResponse: (response) => set({ aiResponse: response }),
      setAiName: (name) => set({ aiName: name }),
      setComfyUIImage: (image) => set({ comfyUIImage: image }),
      setAiModelImage: (image) => set({ aiModelImage: image }),
      setAiModelProvider: (provider) => set({ aiModelProvider: provider }),
      setUserName: (name) => set({ userName: name }),
      setUserEmail: (email) => set({ userEmail: email }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      setError: (error) => set({ error }),
      setUploadedPhotoUrl: (url) => set({ uploadedPhotoUrl: url }),
      setHasStartedProcessing: (hasStarted) => set({ hasStartedProcessing: hasStarted }),
      resetSession: () => {
        set({
          ...initialState,
          sessionId: crypto.randomUUID(),
          aiResponse: null,
          aiName: null,
          aiModelImage: null,
          aiModelProvider: state => state.aiModelProvider
        })
      },
      resetProcessingState: () => set({ 
        hasStartedProcessing: false, 
        isProcessing: false,
        error: null 
      })
    }),
    {
      name: 'chromalink-session',
      partialize: (state) => ({
        capturedPhoto: state.capturedPhoto,
        colorChoice: state.colorChoice,
        uploadedPhotoUrl: state.uploadedPhotoUrl,
        aiResponse: state.aiResponse,
        aiModelImage: state.aiModelImage,
        userName: state.userName,
        userEmail: state.userEmail,
        aiModelProvider: state.aiModelProvider
      })
    }
  )
)
