import React, { useEffect, useState } from 'react';
import {WebMidi} from "webmidi";
import "./preferences.css"
import {OnOffTextButton} from "../components/ui/onoff-text-button";
import {MidiDevicePreferences, MidiDeviceSettings, usePreferencesStore} from "./preferences-store";
import {useSequenceStore} from "../app/state/sequence-store";

export function MidiPreferences(props: any) {

    const onClickOutside = props.clickOutside

    const midiDevicePreferences: MidiDevicePreferences = usePreferencesStore((state) => state.midiDevicePreferences)
    const loadMidiDevicePreferences = usePreferencesStore((state) => state.loadMidiDevicePreferences)
    const setMidiInputDeviceSettings = usePreferencesStore(state => state.setMidiInputDeviceSettings)
    const setMidiOutputDeviceSettings = usePreferencesStore(state => state.setMidiOutputDeviceSettings)
    const sequence = useSequenceStore((state) => state.sequence)

    loadMidiDevicePreferences(sequence.midiDevicePreferences)

    function getMidiInputs() : Array<any> {
        var options: Array<any> = []
        WebMidi.inputs.forEach((input) => {
            options.push({ id: input.id, label: input.name })
        })
        return options
    }

    function getMidiOutputs() : Array<any> {
        var options: Array<any> = []
        WebMidi.outputs.forEach((output) => {
            options.push({ id: output.id, label: output.name })
        })
        return options
    }

    const [midiInputs, setMidiInputs] = useState(getMidiInputs())
    const [midiOutputs, setMidiOutputs] = useState(getMidiOutputs())

    useEffect(() => {
        console.log(`useEffect: midiInputs`)
    }, [midiInputs])
    
    useEffect(() => {
        console.log(`useEffect: midiOutputs`)
    }, [midiOutputs])

    navigator.requestMIDIAccess().then((access) => {
        access.onstatechange = (event) => {
            console.log(event.port.name, event.port.manufacturer, event.port.state);
            // TODO: throttle
            setMidiInputs(getMidiInputs())
            setMidiOutputs(getMidiOutputs())
            console.log(`finished loading`)
        }
    })

    function getMidiInputDeviceSettings(deviceId: string, deviceName: string) : MidiDeviceSettings {
        const midiDeviceSettings : MidiDeviceSettings | undefined =  midiDevicePreferences.getMidiInputDevicePreferences(deviceId, deviceName)
        if (midiDeviceSettings) {
            return midiDeviceSettings
        } else {
            var settings = new MidiDeviceSettings()
            settings.deviceId = deviceId
            settings.deviceName = deviceName
            return settings
        }
    }

    function getMidiOutputDeviceSettings(deviceId: string, deviceName: string) : MidiDeviceSettings {
        const midiDeviceSettings : MidiDeviceSettings | undefined =  midiDevicePreferences.getMidiOutputDevicePreferences(deviceId, deviceName)
        if (midiDeviceSettings) {
            return midiDeviceSettings
        } else {
            var settings = new MidiDeviceSettings()
            settings.deviceId = deviceId
            settings.deviceName = deviceName
            return settings
        }
    }

    const handleToggleInputTrack = (enable: boolean, input: any) => {
        const midiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
        setMidiInputDeviceSettings({...midiDeviceSettings, track: enable})
    }

    const handleToggleInputSync = (enable: boolean, input: any) => {
        const midiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
        setMidiInputDeviceSettings({...midiDeviceSettings, sync: enable})
    }

    const handleToggleInputRemote = (enable: boolean, input: any) => {
        const midiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
        setMidiInputDeviceSettings({...midiDeviceSettings, remote: enable})
    }

    const handleToggleOutputTrack = (enable: boolean, output: any) => {
        const midiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
        setMidiOutputDeviceSettings({...midiDeviceSettings, track: enable})
    }

    const handleToggleOutputSync = (enable: boolean, output: any) => {
        const midiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
        setMidiOutputDeviceSettings({...midiDeviceSettings, sync: enable})
    }

    const handleToggleOutputRemote = (enable: boolean, output: any) => {
        const midiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
        setMidiOutputDeviceSettings({...midiDeviceSettings, remote: enable})
    }

    const handleClick = (e : any) => {
        const target = document.querySelector('#menupopup')
        console.log(`------------------ ${target}`)
        if (target != null) {
            const withinBoundaries = e.composedPath().includes(target)

            if (withinBoundaries) {
                console.log('Click happened inside element')
            } else {
                console.log('Click happened **OUTSIDE** element')
                onClickOutside()
                // setShow(false)
            }
        }
    }

    useEffect(() => {
        console.log(`MidiPreferences init hook`)
        document.addEventListener("click", handleClick)

        return () => {
            console.log(`MidiPreferences shutdown hook`)
            document.removeEventListener("click", handleClick)
        }
    })

    console.log(`lets list the outputs: ${JSON.stringify(midiOutputs)}`)

    return (
        <>
            <div className="Island modalpopup" id="menupopup">
                <div className="midi-preferences">
                    <h2>MIDI Inputs</h2>
                    {midiInputs.map(input => {
                        // console.log(`Preferences.getMidiInputs: ${JSON.stringify(input)}`)
                        const midiDeviceSettings : MidiDeviceSettings = getMidiInputDeviceSettings(input.id, input.label)
                        // console.log(`Preferences.getMidiInputs: ${input.label} => ${JSON.stringify(midiDeviceSettings)}`)
                        return (
                            <div key={input.label}>
                                <div className="device-name">{input.label}</div>
                                <OnOffTextButton className="device-setting-track"  value={midiDeviceSettings.track}  onToggle={(value: boolean) => handleToggleInputTrack(value, input)} label="track"></OnOffTextButton>
                                <OnOffTextButton className="device-setting-sync"   value={midiDeviceSettings.sync}   onToggle={(value: boolean) => handleToggleInputSync(value, input)} label="sync"></OnOffTextButton>
                                <OnOffTextButton className="device-setting-remote" value={midiDeviceSettings.remote} onToggle={(value: boolean) => handleToggleInputRemote(value, input)} label="remote"></OnOffTextButton>
                            </div>
                        );
                    })}
                    <h2>MIDI Outputs</h2>
                    {midiOutputs.map(output => {
                        // console.log(`Preferences.getMidiOutputs: ${JSON.stringify(output)}`)
                        const midiDeviceSettings : MidiDeviceSettings = getMidiOutputDeviceSettings(output.id, output.label)
                        console.log(`Preferences.getMidiOutputs: ${output.label} => ${JSON.stringify(midiDeviceSettings)}`)
                        return (
                            <div key={output.label}>
                                <div className="device-name">{output.label}</div>
                                <OnOffTextButton className="device-setting-track"  value={midiDeviceSettings.track}  onToggle={(value: boolean) => handleToggleOutputTrack(value, output)} label="track"></OnOffTextButton>
                                <OnOffTextButton className="device-setting-sync"   value={midiDeviceSettings.sync}   onToggle={(value: boolean) => handleToggleOutputSync(value, output)} label="sync"></OnOffTextButton>
                                <OnOffTextButton className="device-setting-remote" value={midiDeviceSettings.remote} onToggle={(value: boolean) => handleToggleOutputRemote(value, output)} label="remote"></OnOffTextButton>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    )
}
