import create from 'zustand'

// Store for position, isPlaying state, etc. It should  not a slice as we do not want undo

interface PositionStoreState {
    isPlaying: boolean
    currentStepNum: number
    pulseNum: number
    pulseTime: number
    pulseDuration: number
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentStepNum: (stepNum: number) => void;
    setCurrentPulse: (stepNum: number, pulseNum: number, pulseTime: number, pulseDuration: number) => void;
}  
  
export const usePositionStore = create<PositionStoreState>((set) => ({
    currentStepNum: 0,
    isPlaying: false,
    pulseNum: 0,
    pulseTime: 0,
    pulseDuration: 0,

    setIsPlaying: (isPlaying: boolean) => set((state: any) => ({ ...state, isPlaying: isPlaying})),
    setCurrentStepNum: (stepNum: number) => set((state: any) => ({ ...state, currentStepNum: stepNum })),
    setCurrentPulse: (stepNum: number, pulseNum: number, pulseTime: number, pulseDuration: number) => set((state: any) => ({ ...state, currentStepNum: stepNum, pulseNum: pulseNum, pulseTime: pulseTime, pulseDuration: pulseDuration }))
}))
