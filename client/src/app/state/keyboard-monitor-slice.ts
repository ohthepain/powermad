import {produce} from 'immer'
import { StateCreator } from 'zustand'

export interface KeyboardMonitorSlice {
    currentSequenceId: string

    setCurrentSequenceId: (sequenceId: string) => void;
    // getCurrentSequenceId: () => string;
}

export const createKeyboardMonitorSlice: StateCreator<KeyboardMonitorSlice, [], [], KeyboardMonitorSlice> = (set) => ({
    currentSequenceId: "",

    setCurrentSequenceId: (sequenceId: string) => set(produce(state => setCurrentSequenceId(state, sequenceId))),
    // getCurrentSequenceId: () => 
})

export const setCurrentSequenceId = (draft: KeyboardMonitorSlice, sequenceId: string) => {
    console.log(`setCurrentSequenceId:  ${sequenceId}`)
    draft.currentSequenceId = sequenceId
}

export function getCurrentSequenceId(state: KeyboardMonitorSlice) : string {
    console.log(`getCurrentSequenceId:  ${state.currentSequenceId}`)
    return state.currentSequenceId
}
