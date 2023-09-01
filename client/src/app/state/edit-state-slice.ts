// import {Sequence} from "../player/sequence";
import {produce} from 'immer'
import { StateCreator } from 'zustand'

export enum RecordMode {
    Off,
    Step,
}

// export class EditStateInfo {
//     currentEditStepNum: number = 0
//     recordMode: RecordMode = RecordMode.Off
// }

export interface EditStateSlice {
    // editStateInfo: EditStateInfo,
    currentEditStepNum: number,
    recordMode: RecordMode,

    setCurrentEditStepNum: (stepNum: number) => void;
    setRecordMode: (recordMode: RecordMode) => void;

    // getCurrentEditStepNum: () => number;
    // getRecordMode: () => RecordMode;
}

export const createEditStateSlice: StateCreator<EditStateSlice, [], [], EditStateSlice> = (set) => ({
    // editStateInfo: new EditStateInfo(),
    currentEditStepNum: 0,
    recordMode: RecordMode.Off,

    setCurrentEditStepNum: (stepNum: number) => set(produce(state => setCurrentEditStepNum(state, stepNum))),
    setRecordMode: (recordMode: RecordMode) => set(produce(state => setRecordMode(state, recordMode))),

    // getCurrentEditStepNum: () => state => getGurrentEditStepNum(state),
    // getRecordMode: () => state => getRecordMode(state),
})

// type EditState = {
//     // editStateInfo: EditStateInfo;
//     setCurrentEditStepNum: (stepNum: number) => void;
//     setRecordMode: (recordMode: RecordMode) => void;
// }

export const setCurrentEditStepNum = (draft: EditStateSlice, stepNum: number) => {
    console.log(`setCurrentEditStepNum:  ${stepNum}`)
    draft.currentEditStepNum = stepNum
}

export function getCurrentEditStepNum(state: EditStateSlice) : number {
    console.log(`getCurrentEditStepNum:  ${state.currentEditStepNum}`)
    return state.currentEditStepNum
}

export const setRecordMode = (draft: EditStateSlice, recordMode: RecordMode) => {
    console.log(`setRecordMode:  ${recordMode}`)
    draft.recordMode = recordMode
}

export const getRecordMode = (state: EditStateSlice) => {
    console.log(`getRecordMode:  ${state.recordMode}`)
    return state.recordMode
}
