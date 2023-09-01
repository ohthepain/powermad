import {Sequence} from "../../player/sequence";
import {produce} from 'immer'
import { StateCreator } from 'zustand'

export class NavigationInfo {
    startBar: number = 0;
    startSixtyfourth: number = 0;
    endBar: number = 2;
    endSixtyfourth: number = 0;

    middleNote: number = 60;
    minNote: number = this.middleNote - 24;
    maxNote: number = this.middleNote + 24;

    // getViewStart64th() : number {
    //     return this.startBar * 64 + this.startSixtyfourth
    // }

    // getViewEnd64th() : number {
    //     return this.endBar * 64 + this.endSixtyfourth
    // }

    // getViewRange64ths() : number {
    //     return this.getViewEnd64th() - this.getViewStart64th() + 1
    // }
    
    // getTime64thsX(navigationInfo: NavigationInfo, time64ths: number) {
    //     const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
    //     const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
    //     const span64ths = end64th - start64th
    //     // const maxTime = sequence.steps.length * sequence.tempo / 60 / sequence.division
    
    //     const x =  (time64ths - start64th) / span64ths
    //     // console.log(`getTime64thsX ${time64ths} / ${span64ths} * ${(width - borderWidth - borderWidth)} => ${x} (span is ${span64ths} 64ths`)
    //     return x
    // }
    
    // getXTime64ths(navigationInfo: NavigationInfo, x: number, width: number) {
    //     const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
    //     const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
    //     const span64ths = end64th - start64th
    
    //     // console.log(`getXTime64ths: sequence.steps ${sequence.steps.length} * sequence.tempo ${sequence.tempo} / 60 / sequence.division ${sequence.division}`)
    //     // const maxTime = sequence.steps.length * sequence.tempo / 60 / sequence.division
    //     const time64ths = start64th + x / width * span64ths
    //     // console.log(`getXTime64ths ${x} => ${time64ths} : ${getTime64thsX(sequence, navigationInfo, time64ths)}`)
    //     return time64ths
    // }
    
    // getNoteTop(note: number) {
    //     return (note + 12 - this.minNote) / (this.maxNote - this.minNote + 12);
    // }
    
    // getNoteHeight() {
    //     return 12 / (this.maxNote - this.minNote + 12);
    // }
    
    // getStepLeft(sequence: Sequence, stepNum: number) {
    //     const timeSignatureNumerator = sequence.getTimeSignatureBeatsForBar(0)
    //     const timeSignatureDivision = sequence.getTimeSignatureDivisionForBar(0)
    //     const numStepsPerBar = sequence.division * timeSignatureNumerator / timeSignatureDivision
    //     const barNum = Math.floor(stepNum / numStepsPerBar)
    //     const stepsRemaining = stepNum - (barNum * numStepsPerBar)
    //     const remaining64ths = stepsRemaining * 64 / sequence.division
    
    //     const barX = this.getBarX(sequence, barNum)
    //     const barStride = this.getBarStride(sequence, barNum)
    //     const x = barX + remaining64ths * barStride / 64
    //     return x
    // }
    
    // getBarX(sequence: Sequence, barNum: number) {
    //     var x: number = this.startSixtyfourth * this.getBarStride(sequence, barNum) / 64;
    //     for (var bar = this.startBar; bar < barNum; bar++) {
    //         x += this.getBarStride(sequence, bar)
    //     }
    //     return x
    // }
    
    // getBeatX(sequence: Sequence, barNum: number, beatNum: number) {
    //     var x: number = this.getBarX(sequence, barNum)
    //     const beatStride: number = this.getBeatStride(sequence, barNum)
    //     x += beatStride * beatNum
    //     return x
    // }
    
    // getBarStride(sequence: Sequence, barNum: number) {
    //     const start64th = this.startSixtyfourth + this.startBar * 64
    //     const end64th = this.endSixtyfourth + this.endBar * 64
    //     const span64ths = end64th - start64th
    //     const stride = 64 / span64ths * sequence.getTimeSignatureBeatsForBar(barNum) / 4
    //     // console.log(`getBarStride: span64ths ${span64ths} => stride ${stride}`)
    //     return stride
    // }
    
    // getBeatStride(sequence: Sequence, barNum: number) {
    //     const start64th = this.startSixtyfourth + this.startBar * 64
    //     const end64th = this.endSixtyfourth + this.endBar * 64
    //     const span64ths = end64th - start64th
    //     const stride = 64 / sequence.getTimeSignatureDivisionForBar(barNum) / span64ths
    //     // console.log(`getBeatStride: span64ths ${span64ths} => stride ${stride}`)
    //     return stride
    // }
    
    // getStepStride(sequence: Sequence) {
    //     const start64th = this.startSixtyfourth + this.startBar * 64
    //     const end64th = this.endSixtyfourth + this.endBar * 64
    //     const span64ths = end64th - start64th
    //     const stride = 64 / sequence.division / span64ths
    //     return stride
    // }
    
    // getStepWidth(sequence: Sequence, stepNum: number) {
    //     var stride = this.getStepStride(sequence);
    //     var step = sequence.steps[stepNum];
    //     return stride * step.gateLength;
    // }
}

export interface NavSlice {
    navigationInfo: NavigationInfo,
    selectedStepNumStart: number;
    selectedStepNumEnd: number;
    midiLearnMode: boolean;

    setView: (startBar: number, endBar: number, start64ths: number, end64ths: number) => void;
    setViewRangeSteps: (sequence: Sequence, startStep: number, numSteps: number) => void;
    setViewRange64ths: (sequence: Sequence, start64ths: number, num64ths: number) => void;
    setViewEnd64th: (endSixtyfourth: number) => void,
    setMidiLearnMode: (on: boolean) => void,
    selectSteps: (startStepNum: number, endStepNum: number) => void,

    getViewStart64th : () => number,
    getViewEnd64th : () => number,
    getViewRange64ths : () => number,
}

export const createNavSlice: StateCreator<NavSlice, [], [], NavSlice> = (set, get) => ({
    navigationInfo: new NavigationInfo(),
    selectedStepNumStart: -1,
    selectedStepNumEnd: -1,
    midiLearnMode: false,
    // startBar: 0,
    // startSixtyfourth: 0,
    // endBar: 2,
    // endSixtyfourth: 0,

    getViewStart64th: () => get().navigationInfo.startBar * 64 + get().navigationInfo.startSixtyfourth,
    getViewEnd64th: () => get().navigationInfo.endBar * 64 + get().navigationInfo.endSixtyfourth,
    getViewRange64ths: () => (get().navigationInfo.endBar * 64 + get().navigationInfo.endSixtyfourth) - (get().navigationInfo.startBar * 64 + get().navigationInfo.startSixtyfourth) + 1,

    setView: (startBar: number, endBar: number, start64ths: number, end64ths: number) =>
        set(produce(state => setView(state, startBar, endBar, start64ths, end64ths))),

    setViewEnd64th: (endSixtyfourth: number) => set(produce(state => setViewEnd64th(state, endSixtyfourth))),

    selectSteps: (startStepNum: number, endStepNum: number) => {
        console.log(`selectSteps: ${startStepNum} to ${endStepNum}`)
        set(produce(state => selectSteps(state, startStepNum, endStepNum)))
    },

    setMidiLearnMode: (on: boolean) => {
        console.log(`nav-slice - setMidiLearnMode ${on}`)
        set(produce(state => setMidiLearnMode(state, on)))
    },

    setViewRange64ths: (sequence: Sequence, start64ths: number, num64ths: number) => {
        set(produce(state => setViewStartEndSixtyfourth(state, start64ths, start64ths + num64ths)))
    },

    setViewRangeSteps: (sequence: Sequence, startStep: number, numSteps: number) => {
        const startSixtyfourths = Math.round(startStep * 64 / sequence.division)
        const endSixtyfourths = Math.round((startStep + numSteps) * 64 / sequence.division)
        set(produce(state => setViewStartEndSixtyfourth(state, startSixtyfourths, endSixtyfourths)))
    },
})

type NavState = {
    navigationInfo: NavigationInfo;
    selectedStepNumStart: number;
    selectedStepNumEnd: number;
    midiLearnMode: boolean;

    setView: (startBar: number, endBar: number, start64ths: number, end64ths: number) => void;
    setViewRangeSteps: (sequence: Sequence, startStep: number, numSteps: number) => void;
    setViewEnd64th: (end64th: number) => void;
    setMidiLearnMode: (on: boolean) => void;
    selectSteps: (startStepNum: number, endStepNum: number) => void;
}

const selectSteps = (draft: NavState, startStepNum: number, endStepNum: number) => {
    // console.log(`selectSteps: ${startStepNum} to ${endStepNum}`)
    draft.selectedStepNumStart = startStepNum
    draft.selectedStepNumEnd = endStepNum
}

const setMidiLearnMode = (draft: NavState, on: boolean) => {
    draft.midiLearnMode = on
}

const setView = (draft: NavState, startBar: number, endBar: number, start64ths: number, end64ths: number) => {
    console.log(`📍setView:  ${startBar}:0:${start64ths} to ${endBar}:0:${end64ths}`)
    draft.navigationInfo.startBar = startBar
    draft.navigationInfo.endBar = endBar
    draft.navigationInfo.startSixtyfourth = start64ths
    draft.navigationInfo.endSixtyfourth = end64ths
}

export const setViewEnd64th = (draft: NavState, endSixtyfourth: number) => {
    console.log(`📍setViewEnd64th:  to ${endSixtyfourth} -> bar ${Math.floor(endSixtyfourth / 64)}`)
    // const startBar: number = Math.floor(startSixtyfourth / 64)
    const endBar: number = Math.floor(endSixtyfourth / 64)
    const end64th: number = Math.floor(endSixtyfourth - endBar * 64)
    console.log(`📍setViewEnd64th: to ${endBar}:xxx:${end64th}`)
    draft.navigationInfo.endBar = endBar
    draft.navigationInfo.endSixtyfourth = end64th
}

export const setViewStartEndSixtyfourth = (draft: NavState, startSixtyfourth: number, endSixtyfourth: number) => {
    console.log(`📍setViewStartEndSixtyfourth: ${startSixtyfourth} to ${endSixtyfourth} -> bar ${Math.floor(endSixtyfourth / 64)}`)
    const startBar: number = Math.floor(startSixtyfourth / 64)
    const start64th: number = Math.floor(startSixtyfourth - startBar * 64)
    const endBar: number = Math.floor(endSixtyfourth / 64)
    const end64th: number = Math.floor(endSixtyfourth - endBar * 64)
    console.log(`📍setViewStartEndSixtyfourth: ${startBar}:xxx:${start64th} to ${endBar}:xxx:${end64th}`)
    draft.navigationInfo.startBar = startBar
    draft.navigationInfo.startSixtyfourth = start64th
    draft.navigationInfo.endBar = endBar
    draft.navigationInfo.endSixtyfourth = end64th
}
