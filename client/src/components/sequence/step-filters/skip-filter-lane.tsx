import React, {useEffect, useState} from 'react'
import '../lanes/lanes.css'
import {useSequenceStore} from "../../../app/state/sequence-store";
import {Sequence, ControllerEntry} from "../../../player/sequence";
import Dragger from "../../../components/dragger/dragger"
import {SkipFilter} from './skip-filter';

type SkipFilterLaneProps = {
    entry: ControllerEntry;
    key: string;
}

const SkipFilterLane = (props: SkipFilterLaneProps) => {

    var presetAddress = props.entry.presetAddress

    const sequence: Sequence = useSequenceStore(state => state.sequence)
    const updateProgram = useSequenceStore(state => state.updateProgram)
    const program = sequence.getProgram(presetAddress)

    const filter: SkipFilter = new SkipFilter()

    useEffect(() => {
        console.log(`SkipFilterLane: program changed to ${JSON.stringify(program)}`)
    }, [program.steps])

    console.log(`pulse count lane: program.steps ${JSON.stringify(program.steps)}`)

    const steps = program.steps.slice(0, sequence.numSteps)

    const handleDragBars = (offset: number, index: number) => {
        var newsteps : Array<number> = [...program.steps]
        var newValue = steps[index] + offset * filter.getStepValueIncrement()
        newValue = Math.min(newValue, filter.getMaxStepValue())
        newValue = Math.max(newValue, filter.getMinStepValue())
        newsteps[index] = newValue
        console.log(`SkipFilterLane.handleValueChange: index ${index} value ${newValue} ==> ${JSON.stringify(newsteps)}`)
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

export default SkipFilterLane
