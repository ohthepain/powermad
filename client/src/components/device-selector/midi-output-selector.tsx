import React, {useEffect, useState} from "react"
import { WebMidi } from "webmidi";
import Select from 'react-select'
import {useSequenceStore} from "../../app/state/sequence-store";

type MidiOutputSelectorProps = {
    deviceId?: string;
    deviceName?: string;
    showTrackingOutputs: boolean;
    showRemoteOutputs: boolean;
    onChange: (deviceId: string, deviceName: string) => void;
}

export default function  MidiOutputSelector(props: MidiOutputSelectorProps) {

    const sequence = useSequenceStore((state) => state.sequence)
    // const setMidiSettings = useSequenceStore(state => state.setMidiSettings)
    // const midiSettings = useSequenceStore((state) => state.sequence.midiSettings)

    const getMidiOutputOptions:any = (showTrackingOutputs: boolean = props.showTrackingOutputs, showRemoteOutputs: boolean = props.showRemoteOutputs) => {
        if (showRemoteOutputs) {
            console.log(`MidiOutputSelector: getMidiOutputOptions: showTrackingOutputs ${showTrackingOutputs} showRemoteOutputs ${showRemoteOutputs}`)
        }
        var options: any = []
        options.push({ value: "none", label: "No MIDI Output"})
        // TODO: Only show output with tracking enabled in preferences
        WebMidi.outputs.map(output => {
            if ((showTrackingOutputs && sequence.midiDevicePreferences.isTrackingEnabledForMidiOutputId(output.id))
                || (showRemoteOutputs && sequence.midiDevicePreferences.isRemoteEnabledForMidiOutputId(output.id))) {
                if (showRemoteOutputs)
                    console.log(`MidiOutputSelector: getMidiOutputOptions: Output name ${output.name}`)
                options.push({ value: output.id, label: output.name })
            }
        })
        // console.log(`getMidiOutputOptions: ${JSON.stringify(options)}`)
        return options
    }

    const [midiOutputOptions, setMidiOutputOptions] = useState(getMidiOutputOptions)

    navigator.requestMIDIAccess().then((access) => {
        access.onstatechange = (event) => {
            console.log(`MidiOutputSelector: name {event.port.name}, manufacturer {event.port.manufacturer}, state {event.port.state}`);
            // TODO: throttle as we get a callback for each new Output/output
            setMidiOutputOptions(getMidiOutputOptions())
        }
    })

    // const onChangeMidiOutputDeviceId = (item: any) => {
    //     console.log(`MidiOutputSelector.onChangeMidiOutputDeviceId ${item.value} into ${JSON.stringify(midiSettings)}`)
    //     const newSettings = {...midiSettings, midiOutputDeviceId : item.value, midiOutputDeviceName: item.label}
    //     console.log(`MidiOutputSelector.onChangeMidiOutputDeviceId ${JSON.stringify(item)} now ${JSON.stringify(newSettings)}`)
    //     setMidiSettings(newSettings)
    // }

    return (
        <div className="flexbox-item min-width-150">
            <Select options={midiOutputOptions}
                value={{ value: props.deviceId, label: props.deviceName}}
                onChange={e => props.onChange(e!.value || "", e!.label || "")}
            />
        </div>
    )
}
