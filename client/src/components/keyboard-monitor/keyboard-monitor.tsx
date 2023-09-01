import React, {useState} from "react"
import Keyboard from "../piano-keyboard/Keyboard"
import MidiInputSelector from '../device-selector/midi-input-selector'
import MidiOutputSelector from "../device-selector/midi-output-selector"
import MidiChannelSelector from "../device-selector/midi-channel-selector"
import {ViewSettings} from "../../player/sequence";
import {useSequenceStore} from "../../app/state/sequence-store";
import {WebMidi, NoteMessageEvent} from "webmidi"
import { useBoundStore } from "../../app/state/bound-store"

type KeyboardMonitorProps = {
    noteRange? : any;
    onPlayNoteInput? : (notenum: number) => void;
    onStopNoteInput? : (notenum: number) => void;
    activeNotes? : Array<number>;
}

const KeyboardMonitor = (props: KeyboardMonitorProps) => {

    const viewSettings: ViewSettings = useSequenceStore(state => state.sequence.viewSettings)
    const setViewSettings = useSequenceStore(state => state.setViewSettings)
    // const keyboardMonitorSequenceId = useState(useBoundStore(state => state.currentSequenceId))
    const currentSequenceId = useBoundStore(state => state.currentSequenceId)
    const keyboardMonitorSequenceId = useState("wtf")

    const handleClose = () => {
        setViewSettings({ ...viewSettings, monitorKeyboardVisible: false})
    }

    const startInputMonitor = (deviceId: string, deviceName?: string) => {
        console.log(`startInputMonitor ${deviceId} ${deviceName || "no name!"}`)
        WebMidi.inputs.forEach(input => {
            console.log(`startInputMonitor try ${input.id} ${input.name}`)
            if (input.id === deviceId) {
                console.log(`startInputMonitor start ${input.id} ${input.name}`)
                input.addListener('noteon', (event: NoteMessageEvent) => {
                    console.log(`startInputMonitor got note ${event.note.name} ${event.note.number}`)
                    const inNote: any = {
                        channel: event.channel,
                        name: event.note.name,
                        octave: event.note.octave,
                        number: event.note.number,
                        //velocity: event.note.velocity,
                    }
                })
            }
        })
    }

    // no such thing!
    const startOutputMonitor = (deviceId: string, deviceName?: string) => {
    //     console.log(`startOutputMonitor ${deviceId} ${deviceName || "no name!"}`)
    //     WebMidi.outputs.forEach(output => {
    //         console.log(`startOutputMonitor try ${output.id} ${output.name}`)
    //         if (output.id === deviceId) {
    //             console.log(`startOutputMonitor start ${output.id} ${output.name}`)
    //             output.addListener(EventEmitter.ANY_EVENT, (event: PortEvent) => {
    //                 console.log(`startOutputMonitor got note ${event.port.} ${event.note.number}`)
    //                 const inNote: any = {
    //                     channel: event.channel,
    //                     name: event.note.name,
    //                     octave: event.note.octave,
    //                     number: event.note.number,
    //                     //velocity: event.note.velocity,
    //                 }
    //             })
    //         }
    //     })
    }

    return (
        <div className="Stack-vertical Island big-island">
            <div className="flexbox-row Island">
                <button className="menu-button-borderless zen-mode-transition" type="button" title="close" onClick={() => {handleClose()}}>
                    <svg viewBox="2 2 20 20" fill="none">
                        <path clipRule="evenodd" d="m7.53033 6.46967c-.29289-.29289-.76777-.29289-1.06066 0s-.29289.76777 0 1.06066l4.46963 4.46967-4.46963 4.4697c-.29289.2929-.29289.7677 0 1.0606s.76777.2929 1.06066 0l4.46967-4.4696 4.4697 4.4696c.2929.2929.7677.2929 1.0606 0s.2929-.7677 0-1.0606l-4.4696-4.4697 4.4696-4.46967c.2929-.29289.2929-.76777 0-1.06066s-.7677-.29289-1.0606 0l-4.4697 4.46963z" fill="#000000" fillRule="evenodd"/>
                    </svg>
                </button>
                <div className="flexbox-item">Monitor Input:</div>
                <MidiInputSelector 
                    showTrackingInputs={true}
                    showRemoteInputs={false}
                    deviceId={viewSettings.monitorKeyboardInputMidiDeviceId}
                    deviceName={viewSettings.monitorKeyboardInputMidiDeviceName}
                    onChange={(deviceId, deviceName) => {
                        setViewSettings({ ...viewSettings, monitorKeyboardInputMidiDeviceId: deviceId, monitorKeyboardInputMidiDeviceName: deviceName})
                        startInputMonitor(deviceId, deviceName)}
                        }/>
                <MidiChannelSelector
                    channelNum={viewSettings.monitorKeyboardInputMidiChannelNum}
                    onChange={channelNum => {
                        setViewSettings({ ...viewSettings, monitorKeyboardInputMidiChannelNum: channelNum})
                    }}/>
                <div className="flexbox-item">Monitor output:</div>
                <MidiOutputSelector
                    showTrackingOutputs={true}
                    showRemoteOutputs={false}
                    deviceId={viewSettings.monitorKeyboardOutputMidiDeviceId}
                    deviceName={viewSettings.monitorKeyboardOutputMidiDeviceName}
                    onChange={(deviceId, deviceName) => {
                        setViewSettings({ ...viewSettings, monitorKeyboardOutputMidiDeviceId: deviceId, monitorKeyboardOutputMidiDeviceName: deviceName})
                        startOutputMonitor(deviceId, deviceName)}
                        }/>
                <MidiChannelSelector
                    channelNum={viewSettings.monitorKeyboardOutputMidiChannelNum}
                    onChange={channelNum => {
                        setViewSettings({ ...viewSettings, monitorKeyboardOutputMidiChannelNum: channelNum})
                    }}/>
                <div className="flexbox-item">{"foo"}</div>
            </div>
            <div className="keyboard-holder">
                <Keyboard
                    noteRange={props.noteRange || { first: 24, last: 84 }}
                    // disabled={false}
                    onPlayNoteInput={props.onPlayNoteInput}
                    onStopNoteInput={props.onStopNoteInput}
                    activeNotes={props.activeNotes || []}
                    disabled={false}
                    enabledNotes={[true, true, true, true, true, true, true, true, true, true, true, true, ]}
                    // isNoteEnabled={(notenum) => {return scaleSettings.isNoteInScale(notenum)}}
                    keyWidthToHeight={0.33}
                    gliss={false}
                    useTouchEvents={false}
                    renderNoteLabel={false}
                />
            </div>
        </div>
    )
}

export default KeyboardMonitor
