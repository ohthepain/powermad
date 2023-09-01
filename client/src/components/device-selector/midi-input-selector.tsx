import React, {useEffect, useState} from "react"
import { WebMidi } from "webmidi";
import Select from 'react-select'
import {useSequenceStore} from "../../app/state/sequence-store";

type MidiInputSelectorProps = {
    deviceId?: string;
    deviceName?: string;
    showTrackingInputs: boolean;
    showRemoteInputs: boolean;
    onChange: (deviceId: string, deviceName: string) => void;
}

export default function  MidiInputSelector(props: MidiInputSelectorProps) {

    const sequence = useSequenceStore((state) => state.sequence)

    const getMidiInputOptions:any = (showTrackingInputs: boolean = props.showTrackingInputs, showRemoteInputs: boolean = props.showRemoteInputs) => {
        if (showRemoteInputs) {
            console.log(`MidiInputSelector: getMidiInputOptions: showTrackingInputs ${showTrackingInputs} showRemoteInputs ${showRemoteInputs}`)
        }
        var options = []
        options.push({ value: "omni", label: "All Inputs"})
        // TODO: Only show inputs with tracking enabled in preferences
        WebMidi.inputs.map(input => {
            if ((showTrackingInputs && sequence.midiDevicePreferences.isTrackingEnabledForMidiInputId(input.id))
              || (showRemoteInputs && sequence.midiDevicePreferences.isRemoteEnabledForMidiInputId(input.id))) {
                if (showRemoteInputs)
                    console.log(`MidiInputSelector: getMidiInputOptions: input name ${input.name}`)
                options.push({ value: input.id, label: input.name })
            }
        })
        // console.log(`MidiInputSelector: getMidiInputOptions: options are ${JSON.stringify(options)}`)
        return options
    }

    const [midiInputOptions, setMidiInputOptions] = useState(getMidiInputOptions())

    // useEffect(() => {
    //     console.log(`useEffect: midiInputOptions: ${JSON.stringify(midiInputOptions)}`)
    // }, [midiInputOptions])

    navigator.requestMIDIAccess().then((access) => {
        access.onstatechange = (event) => {
            console.log(event.port.name, event.port.manufacturer, event.port.state);
            // TODO: throttle
            setMidiInputOptions(getMidiInputOptions())
        }
    })

    return (
        <div className="flexbox-item min-width-150">
            <Select options={midiInputOptions}
                    value={{value: props.deviceId, label: props.deviceName} }
                    onChange={e => props.onChange(e!.value || "", e!.label || "")}
                    />
        </div>
    )
}
