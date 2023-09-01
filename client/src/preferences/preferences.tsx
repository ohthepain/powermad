// import React, { useState } from 'react';
// import Button from 'react-bootstrap/Button';
// import Modal from 'react-bootstrap/Modal';
// import {WebMidi} from "webmidi";
// import "./preferences.css"
// import {OnOffTextButton} from "../components/ui/onoff-button";
// import {MidiDeviceSettings, usePreferencesStore} from "./preferences-store";
// import {useSequenceStore} from "../app/sequence-store";

// export function Preferences() {

//     const midiDevicePreferences = usePreferencesStore((state) => state.midiDevicePreferences)
//     const loadMidiDevicePreferences = usePreferencesStore((state) => state.loadMidiDevicePreferences)
//     const setMidiInputDeviceSettings = usePreferencesStore(state => state.setMidiInputDeviceSettings)
//     const setMidiOutputDeviceSettings = usePreferencesStore(state => state.setMidiOutputDeviceSettings)
//     const movePreferencesToSequence = useSequenceStore((state) => state.loadMidiDevicePreferences)
//     const sequence = useSequenceStore((state) => state.sequence)

//     const [show, setShow] = useState(false);
//     const handleClose = () => {
//         movePreferencesToSequence(midiDevicePreferences)
//         setShow(false);
//     }
    
//     const handleShow = () => {
//         console.log(`Preferences.handleShow: ${JSON.stringify(sequence.midiDevicePreferences)}`)
//         loadMidiDevicePreferences(sequence.midiDevicePreferences)
//         setShow(true);
//     }

//     function getMidiInputs() : Array<any> {
//         var options: Array<any> = []
//         WebMidi.inputs.map(input => {
//             options.push({ id: input.id, label: input.name })
//         })
//         return options
//     }

//     function getMidiOutputs() : Array<any> {
//         var options: Array<any> = []
//         WebMidi.outputs.map(output => {
//             options.push({ id: output.id, label: output.name })
//         })
//         return options
//     }

//     function getMidiInputDeviceSettings(deviceId: string, deviceName: string) : MidiDeviceSettings {
//         const midiDeviceSettings : MidiDeviceSettings | undefined =  midiDevicePreferences.getMidiInputDevicePreferences(deviceId, deviceName)
//         if (midiDeviceSettings) {
//             return midiDeviceSettings
//         } else {
//             var settings = new MidiDeviceSettings()
//             settings.deviceId = deviceId
//             settings.deviceName = deviceName
//             return settings
//         }
//     }

//     function getMidiOutputDeviceSettings(deviceId: string, deviceName: string) : MidiDeviceSettings {
//         const midiDeviceSettings : MidiDeviceSettings | undefined =  midiDevicePreferences.getMidiOutputDevicePreferences(deviceId, deviceName)
//         if (midiDeviceSettings) {
//             return midiDeviceSettings
//         } else {
//             var settings = new MidiDeviceSettings()
//             settings.deviceId = deviceId
//             settings.deviceName = deviceName
//             return settings
//         }
//     }

//     const handleToggleInputTrack = (enable: boolean, input: any) => {
//         const midiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
//         setMidiInputDeviceSettings({...midiDeviceSettings, track: enable})
//     }

//     const handleToggleInputSync = (enable: boolean, input: any) => {
//         const midiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
//         setMidiInputDeviceSettings({...midiDeviceSettings, sync: enable})
//     }

//     const handleToggleInputRemote = (enable: boolean, input: any) => {
//         const midiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
//         setMidiInputDeviceSettings({...midiDeviceSettings, remote: enable})
//     }

//     const handleToggleOutputTrack = (enable: boolean, output: any) => {
//         const midiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
//         setMidiOutputDeviceSettings({...midiDeviceSettings, track: enable})
//     }

//     const handleToggleOutputSync = (enable: boolean, output: any) => {
//         const midiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
//         setMidiOutputDeviceSettings({...midiDeviceSettings, sync: enable})
//     }

//     const handleToggleOutputRemote = (enable: boolean, output: any) => {
//         const midiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
//         setMidiOutputDeviceSettings({...midiDeviceSettings, remote: enable})
//     }

//     return (
//         <>
//             <Button onClick={handleShow}>
//                 Preferences
//             </Button>

//             <Modal
//                 show={show}
//                 onHide={handleClose}
//             >
//                 <Modal.Header closeButton>
//                     <Modal.Title>Preferences</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     <div className="midi-preferences">
//                         {getMidiInputs().map(input => {
//                             // console.log(`Preferences.getMidiInputs: ${JSON.stringify(input)}`)
//                             const midiDeviceSettings : MidiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
//                             // console.log(`Preferences.getMidiInputs: ${JSON.stringify(input)} => ${JSON.stringify(midiDeviceSettings)}`)
//                             return (<>
//                                     <div className="device-name">Input: {input.label}</div>
//                                     <OnOffTextButton className="device-setting-track" value={midiDeviceSettings.track} onToggle={(value: boolean) => handleToggleInputTrack(value, input)} label="track"></OnOffTextButton>
//                                     <OnOffTextButton className="device-setting-sync" value={midiDeviceSettings.sync} onToggle={(value: boolean) => handleToggleInputSync(value, input)} label="sync"></OnOffTextButton>
//                                     <OnOffTextButton className="device-setting-remote" value={midiDeviceSettings.remote} onToggle={(value: boolean) => handleToggleInputRemote(value, input)} label="remote"></OnOffTextButton>
//                                 </>
//                             );
//                         })}
//                         {getMidiOutputs().map(output => {
//                             // console.log(`Preferences.getMidiOutputs: ${JSON.stringify(output)}`)
//                             const midiDeviceSettings : MidiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
//                             // console.log(`Preferences.getMidiOutputs: ${JSON.stringify(output)} => ${JSON.stringify(midiDeviceSettings)}`)
//                             return (<>
//                                     <div className="device-name">Output: {output.label}</div>
//                                     <OnOffTextButton className="device-setting-track" value={midiDeviceSettings.track} onToggle={(value: boolean) => handleToggleOutputTrack(value, output)} label="track"></OnOffTextButton>
//                                     <OnOffTextButton className="device-setting-sync" value={midiDeviceSettings.sync} onToggle={(value: boolean) => handleToggleOutputSync(value, output)} label="sync"></OnOffTextButton>
//                                     <OnOffTextButton className="device-setting-remote" value={midiDeviceSettings.remote} onToggle={(value: boolean) => handleToggleOutputRemote(value, output)} label="remote"></OnOffTextButton>
//                                 </>
//                             );
//                         })}
//                     </div>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleClose}>
//                         Close
//                     </Button>
//                     {/*<Button variant="primary"onClick={handleClose}>Understood</Button>*/}
//                 </Modal.Footer>
//             </Modal>
//         </>
//     );
// }
