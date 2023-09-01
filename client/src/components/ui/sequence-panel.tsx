import React, {useEffect, useState} from 'react'
import {Sequence, Preset} from "../../player/sequence";
import './sequence-panel.css'
import {useSequenceStore} from "../../app/state/sequence-store"
import MidiSelector from "./midi-selector";
import MidiService from "../../services/midi-service"
import DeviceSelector from "../device-selector/device-selector"
import ScaleSettingsPanel from '../scale-settings-panel/scale-settings-panel'
import Select from 'react-select'

const SequencePanel = (props: any) => {
    const sequence: Sequence = useSequenceStore(state => state.sequence)
    const setTempo = useSequenceStore(state => state.setTempo)
    const setName = useSequenceStore(state => state.setName)
    const updateProgram  = useSequenceStore(state => state.updateProgram)
    const setPlayOrder = useSequenceStore(state => state.setPlayOrder)

    const [preset] = useState<Preset>(sequence.getPreset(sequence.sysexPresetAddress, true));
    const [program, setProgram] = useState(preset.program);

    const handleTempo = (tempo: number) => {
        setTempo(tempo)
    }

    const handleName = (e: any) => {
        setName(e.currentTarget.textContent)
    }

    async function handleGetPreset() {
        // console.log(`handleGetPreset : hi. program ${JSON.stringify(program)}`)
       
        await MidiService.requestCurrentProgramDataDump(sequence)
            .then(sysexBuffer => {
                // console.log(`handleGetPreset: sysex buffer type ${typeof(sysexBuffer)} === ${JSON.stringify(sysexBuffer)}`)
                // TODO: i think this should be useEffect
                setProgram({sysex: sysexBuffer})
                // console.log(`handleGetPreset: ${JSON.stringify(program)}`)
                updateProgram(sequence.sysexPresetAddress, {sysex: sysexBuffer})
            })
            .catch(error => console.error(error))

        console.log(`handleGetPreset: bye`)
    }

    const handleSendPreset = () => {
        console.log(`handleSendPreset`)
        MidiService.sendCurrentProgramDataDump(sequence);
        // sysexProgram: ArrayBuffer = new ArrayBuffer(0)
    }

    const handleRemovePreset = () => {
        console.log(`handleRemovePreset`)
    }

    const getPlayOrderOptions = () => {
        return [
            {value: "forward", label: "Forward"},
            {value: "reverse", label: "Reverse"},
            {value: "random",  label: "Random"},
            {value: "stationary",  label: "Stationary"},
        ]
    }

    return (
        <div className="sequence-panel Stack-vertical Island">
            <div className="Island">
                <h1 suppressContentEditableWarning={true} id="name" contentEditable="true"
                    onBlur={event => handleName(event) }>
                    {sequence.name}
                </h1>
                <DeviceSelector sequence={sequence}/>
            </div>
            {/* <MidiSelector/> */}
            <div>
                <strong>Tempo: </strong>
                <input type="number" value={sequence.tempo} onChange={e => handleTempo(Number(e.target.value)) }></input>
            </div>
            <div className="Stack-horizontal">
                <strong>Patch Sysex</strong>
                <button className="text-button" onClick={() => handleGetPreset()}>Get</button>
                <button className="text-button" onClick={() => handleSendPreset()}>Send</button>
                <button className="text-button" onClick={() => handleRemovePreset()}>Remove</button>
            </div>
            <div className="Stack-horizontal">
                <strong>Play Order: </strong>
                <Select options={getPlayOrderOptions()} 
                    value={{value: sequence.playOrder, label: sequence.playOrder}} 
                    onChange={value => setPlayOrder(value ? value.label : "forward")}
                    />
            </div>
            <ScaleSettingsPanel scaleSettings={sequence.scaleSettings}/>
        </div>
    )
}

export default SequencePanel;
