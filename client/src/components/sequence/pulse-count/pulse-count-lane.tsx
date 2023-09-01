import React, {useEffect, useState} from 'react'
import '../lanes/lanes.css'
import {useSequenceStore} from "../../../app/state/sequence-store";
import {Sequence, ControllerEntry, IStepFilterEditor} from "../../../player/sequence";
import Dragger from "../../../components/dragger/dragger"
import {PulseCountFilter} from './pulse-count-filter';

type PulseCountLaneProps = {
    entry: ControllerEntry;
    key: string;
}

const PulseCountLane = (props: PulseCountLaneProps) => {

    var presetAddress = props.entry.presetAddress

    const sequence: Sequence = useSequenceStore(state => state.sequence)
    const updateProgram = useSequenceStore(state => state.updateProgram)
    const program = sequence.getProgram(presetAddress)

    const filter: PulseCountFilter = new PulseCountFilter()

    useEffect(() => {
        console.log(`PulseCountLane: program changed to ${JSON.stringify(program)}`)
    }, [program.steps])

    console.log(`pulse count lane: program.steps ${JSON.stringify(program.steps)}`)

    const steps = program.steps.slice(0, sequence.numSteps)

    const handleDragBars = (offset: number, index: number) => {
        var newsteps : Array<number> = [...program.steps]
        var newValue = steps[index] + offset * filter.getStepValueIncrement()
        newValue = Math.min(newValue, filter.getMaxStepValue())
        newValue = Math.max(newValue, filter.getMinStepValue())
        newsteps[index] = newValue
        console.log(`PulseCountLane.handleValueChange: index ${index} value ${newValue} ==> ${JSON.stringify(newsteps)}`)
        updateProgram(presetAddress, { ...program, steps: newsteps })
    }

    return (
        <>
            <div className="step-lane">
                <div className="spacer"/>
                {steps.map((value: number, index: number) => {
                    return (
                        <div className="step-lane-item" key={index} onClick={() => console.log(value)}>
                            {steps[index]}
                            <Dragger onDragY={(dragYVal: number) => { handleDragBars(dragYVal, index) }} />
                        </div>
                    )
                })}
                <div className="spacer"/>
            </div>
        </>
    )
}

export default PulseCountLane
