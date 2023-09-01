import React from 'react'
import Select from "react-select";
import {useSequenceStore} from "../../app/state/sequence-store";
import {useBoundStore} from "../../app/state/bound-store";
import EnvelopeSelector from "./envelope-selector";
import {Envelope, EnvelopePoint, SequenceStep} from "../../player/sequence";

const NotesBar = (props: any) => {

    const sequence = useSequenceStore(state => state.sequence)
    const setDivision = useSequenceStore(state => state.setDivision)
    const setLength = useSequenceStore(state => state.setLength)
    const setNumSteps = useSequenceStore(state => state.setNumSteps)
    const setSteps = useSequenceStore(state => state.setSteps)
    const reverse = useSequenceStore(state => state.reverse)
    // Deprecated
    const setViewRangeSteps = useBoundStore(state => state.setViewRangeSteps)
    const setView = useBoundStore(state => state.setView)

    const divisionOptions = [
        {value: 1, label: 'Whole'},
        {value: 2, label: 'Half'},
        {value: 4, label: 'Quarter'},
        {value: 8, label: 'Eighth'},
        {value: 16, label: 'Sixteenth'},
        {value: 32, label: '32nd'},
        {value: 64, label: '64th'},
    ]

    function getDivisionOption(divisionValue: any) {
        for (const divisionOption of divisionOptions) {
            if (divisionOption.value === divisionValue) {
                return divisionOption;
            }
        }
    }

    const handleNumSteps = (e: any) => {
        console.log(`SequenceView.handleNumSteps: ${e.target.value}`)
        const numSteps: number = e.target.value
        // const sequence = sequenceRef.current
        setNumSteps(numSteps)
        setViewRangeSteps(sequence, 0, numSteps)
    }

    const handleDivisionChange = (e: any) => {
        console.log(`handleDivisionChange: ${JSON.stringify(e)}`)
        setDivision(e.value)
        setViewRangeSteps(sequence, 0, sequence.numSteps)
    }

    const handleHalf = () => {
        console.log(`handleHalf`)
        var steps: Array<SequenceStep> = [...sequence.steps]
        steps = steps.splice(0, Math.floor((sequence.steps.length+1) / 2))
        setSteps(steps)
        setViewRangeSteps(sequence, 0, steps.length)
    }

    const handleDouble = () => {
        var steps: Array<SequenceStep> = [...sequence.steps].slice(0, sequence.numSteps)
        steps = steps.concat(steps)
        setSteps(steps)
        setViewRangeSteps(sequence, 0, steps.length)
    }

    const handleMirror = () => {
        console.log(`handleMirror`)
        var steps: Array<SequenceStep> = [...sequence.steps].slice(0, sequence.numSteps)
        var steps2 = [...steps]
        steps = steps.concat(steps2.reverse())
        setSteps(steps)
        setViewRangeSteps(sequence, 0, steps.length)
    }

    const handleReverse = () => {
        reverse()
    }

    const handleDeleteSteps = () => {
        const selectedStepNumStart = useBoundStore.getState().selectedStepNumStart
        const selectedStepNumEnd = useBoundStore.getState().selectedStepNumEnd
        console.log(`handleDeleteSteps ${selectedStepNumStart} ${selectedStepNumEnd}`)
        console.log(`${JSON.stringify(sequence.steps)}`)
        if (selectedStepNumStart !== -1 && selectedStepNumEnd !== -1) {
            var steps1 = sequence.steps.slice(0, selectedStepNumStart)
            console.log(`${JSON.stringify(steps1)}`)
            var steps2 = sequence.steps.slice(selectedStepNumEnd + 1, sequence.steps.length)
            console.log(`${JSON.stringify(steps2)}`)
            var steps = [...steps1, ...steps2]
            console.log(`${JSON.stringify(steps)}`)
            setSteps(steps)
        }
    }

    const handleShiftHorizontal = (amount: number) => {
        console.log(`handleShift ${amount} : numSteps ${sequence.numSteps} length of steps[] ${sequence.steps.length} steps ${JSON.stringify(sequence.steps)}`)
        const selectedStepNumStart = useBoundStore.getState().selectedStepNumStart
        const selectedStepNumEnd = useBoundStore.getState().selectedStepNumEnd
        var steps: Array<SequenceStep> = [...sequence.steps]
        const start = selectedStepNumStart === -1 ? 0 : selectedStepNumStart
        const end = selectedStepNumEnd === -1 ? steps.length - 1 : selectedStepNumEnd

        var steps1 = sequence.steps.slice(0, start)
        console.log(`${JSON.stringify(steps1)}`)
        var steps2 = sequence.steps.slice(start, end + 1)
        console.log(`${JSON.stringify(steps2)}`)
        var steps3 = sequence.steps.slice(end + 1, sequence.steps.length)
        console.log(`${JSON.stringify(steps3)}`)

        const len = Math.min(sequence.steps.length, sequence.numSteps)
        if (amount > 0) {
            var stepsa: Array<SequenceStep> = steps2.slice(0, steps2.length - amount)
            console.log(`stepsa ${JSON.stringify(stepsa)}`)
            var stepsb: Array<SequenceStep> = steps2.slice(steps2.length - 1 - amount, steps2.length - amount)
            console.log(`stepsb ${JSON.stringify(stepsb)}`)
            steps2 = stepsb.concat(stepsa)
        } else {
            var stepsa: Array<SequenceStep> = steps2.slice(-amount, steps2.length)
            var stepsb: Array<SequenceStep> = steps2.slice(0, -amount)
            steps2 = stepsa.concat(stepsb)
        }
        console.log(`${JSON.stringify(steps2)}`)

        var steps = [...steps1, ...steps2, ...steps3]
        console.log(`${JSON.stringify(steps)}`)
        setSteps(steps)
    }

    const handleShiftVertical = (amount: number) => {
        console.log(`handleShift ${amount} : numSteps ${sequence.numSteps} length of steps[] ${sequence.steps.length} steps ${JSON.stringify(sequence.steps)}`)
        const selectedStepNumStart = useBoundStore.getState().selectedStepNumStart
        const selectedStepNumEnd = useBoundStore.getState().selectedStepNumEnd
        var steps: Array<SequenceStep> = [...sequence.steps]
        const start = selectedStepNumStart === -1 ? 0 : selectedStepNumStart
        const end = selectedStepNumEnd === -1 ? steps.length - 1 : selectedStepNumEnd
        for (var n = start; n <= end; n++) {
            console.log(`${n}`)
            steps[n] = {...steps[n], note : Math.max(steps[n].note + amount, 0)}
        }
        setSteps(steps)
    }

    return (
        <div className="notes-envelope-bar Island">
            {/* <EnvelopeSelector/> */}
            <div className="flexbox-item"> Steps </div>
            <div className="flexbox-item">
                <input type="number" value={sequence.numSteps} onChange={e => handleNumSteps(e) }></input>
            </div>
            <div className="flexbox-item"> Division </div>
            <div className="flexbox-item">
                <Select options={divisionOptions} value={getDivisionOption(sequence.division)} onChange={e => handleDivisionChange(e)}></Select>
            </div>
            <button className="menu-button zen-mode-transition" type="button" title="cut in half" onClick={() => {handleHalf()}}>
                <svg fill="#000000" viewBox="2 2 32 32">
                    <path className="clr-i-outline clr-i-outline-path-1" d="M34,16.78a2.22,2.22,0,0,0-1.29-4l-9-.34a.23.23,0,0,1-.2-.15L20.4,3.89a2.22,2.22,0,0,0-4.17,0l-3.1,8.43a.23.23,0,0,1-.2.15l-9,.34a2.22,2.22,0,0,0-1.29,4l7.06,5.55a.22.22,0,0,1,.08.24L7.35,31.21A2.23,2.23,0,0,0,9.49,34a2.22,2.22,0,0,0,1.24-.38l7.46-5a.22.22,0,0,1,.25,0l7.46,5a2.22,2.22,0,0,0,3.38-2.45l-2.45-8.64a.23.23,0,0,1,.08-.24ZM18.33,26.62h0a2.21,2.21,0,0,0-1.24.38L9.62,32a.22.22,0,0,1-.34-.25l2.45-8.64A2.21,2.21,0,0,0,11,20.76L3.9,15.21a.22.22,0,0,1,.13-.4l9-.34A2.22,2.22,0,0,0,15,13l3.1-8.43a.2.2,0,0,1,.21-.15h0Z"></path>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="double" onClick={() => {handleDouble()}}>
                <svg viewBox="0 0 14 14" version="1.1" className="si-glyph si-glyph-two-arrow-right">
                    <g stroke="none" strokeWidth="1" fill="none">
                        <g transform="translate(-1, 2)" fill="#434343">
                            <path d="M11.83,4.999 L8.086,10 L12.025,10 L15.969,4.999 L11.927,0.03 L8.009,0.03 L7.998,0.041 L11.83,4.999 Z" className="si-glyph-fill"></path>
                            <path d="M4.047,4.999 L0.096,10 L4.034,10 L8,4.999 L3.935,0.03 L0.018,0.03 L0.008,0.041 L4.047,4.999 Z" className="si-glyph-fill"></path>
                        </g>
                    </g>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="mirror" onClick={() => {handleMirror()}}>
            <svg viewBox="2 2 14 14" className="si-glyph si-glyph-two-arrow-in-left-right">
                <g stroke="none" strokeWidth="1" fill="none">
                    <g transform="translate(1.000000, 5.000000)" fill="#434343">
                        <path d="M4.125,0.229 C3.863,-0.035 3.44,-0.035 3.179,0.229 C2.918,0.493 2.918,0.919 3.179,1.183 L4.532,3.011 L1,3.011 C0.447,3.011 0,3.455 0,4.003 C0,4.551 0.447,4.995 1,4.995 L4.594,4.995 L3.21,6.812 C2.947,7.075 2.947,7.5 3.21,7.764 C3.34,7.896 3.512,7.962 3.682,7.962 C3.854,7.962 4.026,7.896 4.157,7.764 L6.976,4.024 L4.125,0.229 L4.125,0.229 Z" className="si-glyph-fill"></path>
                        <path d="M11.821,0.229 C12.084,-0.035 12.507,-0.035 12.768,0.229 C13.03,0.493 13.03,0.919 12.768,1.183 L11.44,3.011 L14.971,3.011 C15.524,3.011 15.971,3.455 15.971,4.003 C15.971,4.551 15.524,4.995 14.971,4.995 L11.518,4.995 L12.784,6.812 C13.046,7.075 13.046,7.5 12.784,7.764 C12.653,7.896 12.482,7.962 12.311,7.962 C12.139,7.962 11.968,7.896 11.837,7.764 L8.999,4.024 L11.821,0.229 L11.821,0.229 Z" className="si-glyph-fill"></path>
                    </g>
                </g>
            </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="shift up" onClick={() => {handleShiftVertical(1)}}>
                <svg fill="#000000" viewBox="0 0 512 512" enableBackground="new 0 0 512 512">
                    <polygon points="247.5,0 34.2,213.3 34.2,341.3 204.8,170.7 204.8,512 290.2,512 290.2,170.7 460.8,341.3 460.8,213.3 "/>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="shift down" onClick={() => {handleShiftVertical(-1)}}>
                <svg fill="#000000" viewBox="0 0 512 512" enableBackground="new 0 0 512 512" >
                    <polygon points="289.7,341.3 289.7,0 204.3,0 204.3,341.3 33.7,170.7 33.7,298.7 247,512 460.3,298.7 460.3,170.7 "/>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="shift left" onClick={() => {handleShiftHorizontal(-1)}}>
                <svg viewBox="2 2 20 20" fill="none">
                    <path d="M5 12L11 6M5 12L11 18M5 12H19" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="shift right" onClick={() => {handleShiftHorizontal(1)}}>
                <svg viewBox="0 -6.5 38 38">
                    <g id="icons" stroke="none" strokeWidth="1" fill="none">
                        <g transform="translate(-1511.000000, -158.000000)" fill="#1C1C1F">
                            <g id="1" transform="translate(1350.000000, 120.000000)">
                                <path d="M187.812138,38.5802109 L198.325224,49.0042713 L198.41312,49.0858421 C198.764883,49.4346574 198.96954,49.8946897 199,50.4382227 L198.998248,50.6209428 C198.97273,51.0514917 198.80819,51.4628128 198.48394,51.8313977 L198.36126,51.9580208 L187.812138,62.4197891 C187.031988,63.1934036 185.770571,63.1934036 184.990421,62.4197891 C184.205605,61.6415481 184.205605,60.3762573 184.990358,59.5980789 L192.274264,52.3739093 L162.99947,52.3746291 C161.897068,52.3746291 161,51.4850764 161,50.3835318 C161,49.2819872 161.897068,48.3924345 162.999445,48.3924345 L192.039203,48.3917152 L184.990421,41.4019837 C184.205605,40.6237427 184.205605,39.3584519 184.990421,38.5802109 C185.770571,37.8065964 187.031988,37.8065964 187.812138,38.5802109 Z" id="right-arrow"/>
                            </g>
                        </g>
                    </g>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="reverse" onClick={() => {handleReverse()}}>
                <svg viewBox="0 0 20 20">
                    <path d="m5.66116524 3.36827202c5.18469776-.47094658 8.51890836 1.5289737 9.99999996 6-2.8248102-3.14044041-6.34158528-3.71816233-9.99999996-2v2.99999998l-5-4.99999998 5-5z" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" transform="translate(2.839 4.132)"/>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="delete steps" onClick={() => handleDeleteSteps()}>
                <svg fill="#000000" viewBox="4 4 50 50">
                    <path d="M 44.5235 48.6602 L 46.1407 14.3945 L 48.4844 14.3945 C 49.4454 14.3945 50.2187 13.5976 50.2187 12.6367 C 50.2187 11.6758 49.4454 10.8555 48.4844 10.8555 L 38.2422 10.8555 L 38.2422 7.3398 C 38.2422 3.9883 35.9688 1.8086 32.3595 1.8086 L 23.5938 1.8086 C 19.9844 1.8086 17.7344 3.9883 17.7344 7.3398 L 17.7344 10.8555 L 7.5391 10.8555 C 6.6016 10.8555 5.7813 11.6758 5.7813 12.6367 C 5.7813 13.5976 6.6016 14.3945 7.5391 14.3945 L 9.8829 14.3945 L 11.5000 48.6836 C 11.6641 52.0586 13.8907 54.1914 17.2657 54.1914 L 38.7579 54.1914 C 42.1095 54.1914 44.3595 52.0351 44.5235 48.6602 Z M 21.4844 7.5742 C 21.4844 6.2383 22.4688 5.3008 23.8751 5.3008 L 32.1016 5.3008 C 33.5313 5.3008 34.5157 6.2383 34.5157 7.5742 L 34.5157 10.8555 L 21.4844 10.8555 Z M 17.6173 50.6758 C 16.2579 50.6758 15.2500 49.6445 15.1797 48.2852 L 13.5391 14.3945 L 42.3907 14.3945 L 40.8438 48.2852 C 40.7735 49.6680 39.7891 50.6758 38.4063 50.6758 Z M 34.9610 46.5508 C 35.7344 46.5508 36.3204 45.9180 36.3438 45.0273 L 37.0469 20.2773 C 37.0704 19.3867 36.4610 18.7305 35.6641 18.7305 C 34.9376 18.7305 34.3282 19.4102 34.3048 20.2539 L 33.6016 45.0273 C 33.5782 45.8711 34.1641 46.5508 34.9610 46.5508 Z M 21.0626 46.5508 C 21.8595 46.5508 22.4454 45.8711 22.4219 45.0273 L 21.7188 20.2539 C 21.6954 19.4102 21.0626 18.7305 20.3360 18.7305 C 19.5391 18.7305 18.9532 19.3867 18.9766 20.2773 L 19.7032 45.0273 C 19.7266 45.9180 20.2891 46.5508 21.0626 46.5508 Z M 29.4298 45.0273 L 29.4298 20.2539 C 29.4298 19.4102 28.7969 18.7305 28.0235 18.7305 C 27.2500 18.7305 26.5938 19.4102 26.5938 20.2539 L 26.5938 45.0273 C 26.5938 45.8711 27.2500 46.5508 28.0235 46.5508 C 28.7735 46.5508 29.4298 45.8711 29.4298 45.0273 Z"/>
                </svg>
            </button>
        </div>
    )
}

export default NotesBar
