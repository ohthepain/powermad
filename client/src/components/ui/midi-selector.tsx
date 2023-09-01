import React from "react"
import { WebMidi } from "webmidi";
import {useSequenceStore} from "../../app/state/sequence-store";
import MidiInputSelector from "../device-selector/midi-input-selector"
import MidiOutputSelector from "../device-selector/midi-output-selector"
import MidiChannelSelector from "../device-selector/midi-channel-selector"

export default function  MidiSelector() {

    const setMidiSettings = useSequenceStore(state => state.setMidiSettings)
    const midiSettings = useSequenceStore((state) => state.sequence.midiSettings)
    
    const getInputDeviceName = (deviceId: string) => {
        for (var n=0; n<WebMidi.inputs.length; n++) {
            const input = WebMidi.inputs[n]
            if (input.id === deviceId) {
                return input.name
            }
        }
        throw `getDeviceName could not find the device with id ${deviceId}`
    }

    const getOutputDeviceName = (deviceId: string) => {
        for (var n=0; n<WebMidi.outputs.length; n++) {
            const input = WebMidi.outputs[n]
            if (input.id === deviceId) {
                return input.name
            }
        }
        throw `getDeviceName could not find the device with id ${deviceId}`
    }

    const onChangeMidiInputDeviceId = (deviceIdOrName: string) => {
        //console.log(`MidiSelector.onChangeMidiInputDeviceId ${JSON.stringify(deviceIdOrName)} into ${JSON.stringify(midiSettings)}`)
        const newSettings = {...midiSettings, midiInputDeviceId : deviceIdOrName, midiInputDeviceName : getInputDeviceName(deviceIdOrName)}
        setMidiSettings(newSettings)
    }

    const onChangeMidiRemoteDeviceId = (deviceIdOrName: string) => {
        //console.log(`MidiSelector.onChangeMidiRemoteDeviceId ${JSON.stringify(deviceIdOrName)} into ${JSON.stringify(midiSettings)}`)
        const newSettings : any = {...midiSettings, midiRemoteDeviceId : deviceIdOrName, midiRemoteDeviceName : getInputDeviceName(deviceIdOrName)}
        setMidiSettings(newSettings)
    }

    const onChangeMidiOutputDeviceId = (deviceIdOrName: string) => {
        console.log(`MidiSelector.onChangeMidiOutputDeviceId ${deviceIdOrName}} into ${JSON.stringify(midiSettings)}`)
        const newSettings = {...midiSettings, midiOutputDeviceId : deviceIdOrName, midiOutputDeviceName: getOutputDeviceName(deviceIdOrName)}
        setMidiSettings(newSettings)
    }

    const onChangeMidiInputChannelNum = (value: number) => {
        //console.log(`MidiSelector.onChangeMidiInputChannelNum ${value} into ${JSON.stringify(midiSettings)}`)
        const newSettings = {...midiSettings, midiInputChannelNum : value}
        //console.log(`MidiSelector.onChangeMidiInputChannelNum ----> ${JSON.stringify(newSettings)}`)
        setMidiSettings(newSettings)
    }

    const onChangeMidiRemoteChannelNum = (value: number) => {
        //console.log(`MidiSelector.onChangeMidiRemoteChannelNum ${value} into ${JSON.stringify(midiSettings)}`)
        const newSettings = {...midiSettings, midiRemoteChannelNum : value}
        //console.log(`MidiSelector.onChangeMidiRemoteChannelNum ----> ${JSON.stringify(newSettings)}`)
        setMidiSettings(newSettings)
    }

    const onChangeMidiOutputChannelNum = (value: any) => {
        //console.log(`MidiSelector.onChangeMidiOutputChannelNum ${value} into ${JSON.stringify(midiSettings)}`)
        const newSettings = {...midiSettings, midiOutputChannelNum : parseInt(value)}
        setMidiSettings(newSettings)
    }

    //console.log(`midi-selector: midiSettings are ${JSON.stringify(midiSettings)}`)

    return (
        <div className="flexbox-row Island">
            <div className="flexbox-item">Tracking Input:</div>
            <MidiInputSelector 
                showTrackingInputs={true}
                showRemoteInputs={false}
                deviceId={midiSettings.midiInputDeviceId} 
                deviceName={midiSettings.midiInputDeviceName}
                onChange={deviceId => onChangeMidiInputDeviceId(deviceId)}/>
            <MidiChannelSelector
                channelNum={midiSettings.midiInputChannelNum}
                onChange={channelNum => onChangeMidiInputChannelNum(channelNum)}/>
            <div className="flexbox-item">Remote:</div>
            <MidiInputSelector 
                showTrackingInputs={false}
                showRemoteInputs={true}
                deviceId={midiSettings.midiRemoteDeviceId} 
                deviceName={midiSettings.midiRemoteDeviceName}
                onChange={deviceId => onChangeMidiRemoteDeviceId(deviceId)}/>
            <MidiChannelSelector
                channelNum={midiSettings.midiRemoteChannelNum}
                onChange={channelNum => onChangeMidiRemoteChannelNum(channelNum)}/>
            <div className="flexbox-item">Output to:</div>
            <MidiOutputSelector
                showTrackingOutputs={true}
                showRemoteOutputs={false}
                deviceId={midiSettings.midiOutputDeviceId} 
                deviceName={midiSettings.midiOutputDeviceName}
                onChange={deviceId => onChangeMidiOutputDeviceId(deviceId)}/>
            <MidiChannelSelector
                channelNum={midiSettings.midiOutputChannelNum}
                onChange={channelNum => onChangeMidiOutputChannelNum(channelNum)}/>
        </div>
    )
}
