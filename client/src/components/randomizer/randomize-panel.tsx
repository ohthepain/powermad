import React, {useEffect, useState} from 'react'
import {Sequence, Preset, PresetAddress, ViewSettings} from "../../player/sequence";
import {useSequenceStore} from "../../app/state/sequence-store"
import {useBoundStore} from "../../app/state/bound-store";
import RandomizeValuesPanel from './randomize-values-panel'
import './randomize-panel.css'
import {OnOffTextButton as OnOffTextButton} from "../ui/onoff-text-button"

type RandomizePanelProps = {
    presetAddress: PresetAddress;
}

const RandomizePanel = (props: RandomizePanelProps) => {
    const [presetAddress, setPresetAddress] = useState(props.presetAddress)
    const sequence: Sequence = useSequenceStore(state => state.sequence)
    // console.log(`RandomizePanel: sequence.randomizerPresetAddress == ${JSON.stringify(sequence.randomizerPresetAddress)}`)
    const [preset, setPreset] = useState<Preset | null>(sequence.randomizerPresetAddress == undefined ? null : sequence.getPreset(sequence.randomizerPresetAddress, false));
    const [program, setProgram] = useState<any>(preset?.program);
    console.log(`RandomizePanel.program ${JSON.stringify(program)}`)
    const updatePreset = useSequenceStore(state => state.updatePreset)
    const updateProgram = useSequenceStore(state => state.updateProgram)
    const setRandomizerPreset = useSequenceStore(state => state.setRandomizerPreset)
    const randomizeSteps = useSequenceStore(state => state.randomizeSteps)
    const unRandomizeSteps = useSequenceStore(state => state.unRandomizeSteps)
    const setSteps = useSequenceStore(state => state.setSteps)

    const [panelId, setPanelId] = useState<string>(sequence.viewSettings.randomizerPanel)
    const [turingMode, setTuringMode] = useState<boolean>(program ? program.turingMode : false)
    const [autoScaleMode, setAutoScaleMode] = useState<boolean>(program ? program.autoScaleMode: false)

    const viewSettings: ViewSettings = useSequenceStore(state => state.sequence.viewSettings)
    const setViewSettings = useSequenceStore(state => state.setViewSettings)

    // useEffect(() => {
    //     console.log(`Preset got edited ${JSON.stringify(preset)}`)
    // }, [preset])

    // useEffect(() => {
    //     console.log(`Program got edited ${JSON.stringify(program)}`)
    // }, [program])

    const defaultProgram: any = {
        tie: [100, 0],
        silence: [0, 0, 0, 0, 0, 0],
        length: [0, 0, 0, 100, 0, 0],
        octave: [0, 0, 100, 0, 0],
        note: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        velocity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 100],
        strengths: { tie: 1, silence: 1, length: 1, octave: 1, note: 1, velocity: 1 },
        mirrors: { tie: 0, silence: 0, length: 0, octave: 0, note: 0, velocity: 0 },
        turingMode: false,
        autoScaleMode: false,
        randomSeed: 0,
    }

    const getStrength = (panelId: string) => {
        if (program.strengths && panelId in program.strengths) {
            return program.strengths[panelId]
        } else {
            return 1
        }
    }

    const getMirror = (panelId: string) => {
        if (program.mirrors && panelId in program.mirrors) {
            return program.mirrors[panelId]
        } else {
            return 1
        }
    }

    const handleClose = () => {
        unRandomizeSteps()
        setViewSettings({ ...sequence.viewSettings, randomizerVisible: false})
    }

    const setRandomizerPanel = (panelId: string) => {
        setPanelId(panelId)
        setViewSettings({ ...sequence.viewSettings, randomizerPanel: panelId})
    }

    const onTapOpenPanel = (e: any) => {
        console.log(`onTapOpenPanel: presetAddress == ${JSON.stringify(presetAddress)}`)
        // if (preset === null) {
        //     // get rid of warnings
        //     return
        // }

        console.log(`onTapOpenPanel: preset == ${JSON.stringify(preset)}`)

        if (presetAddress === undefined) {
            console.log(`onTapOpenPanel: no presetAddress`)
            var newPreset = new Preset(crypto.randomUUID(), 'randomize settings', defaultProgram)

            setPreset(newPreset)

            const presetAddress = new PresetAddress('localpack', 'randomizer', newPreset.id)
            setRandomizerPreset(presetAddress, newPreset)
            setPresetAddress(presetAddress)
            setProgram(newPreset.program)
            if (!sequence.viewSettings.randomizerPanel) {
                setRandomizerPanel("note")
                setPanelId("note")
            }
        } else {
            if (preset === null) {
                throw Error('no preset address')
            }

            var newPreset = new Preset(preset.id, preset.name, {...program})
            var dirty = false
            for (const key in defaultProgram) {
                console.log(`onTapOpenPanel: duzz we can haz ${key}`)
                if (preset && !(key in program)) {
                    console.log(`onTapOpenPanel: we duzz not can haz ${key}`)
                    // preset.program[key] = defaultProgram[key]
                    newPreset.program[key] = defaultProgram[key]
                    dirty = true
                }
            }

            if (dirty) {
                console.log(`onTapOpenPanel: duzz new preset == ${JSON.stringify(newPreset)}`)
                updatePreset(props.presetAddress, newPreset)
                setProgram(newPreset.program)
            }
        }

        console.log(`onTapOpenPanel: preset == ${JSON.stringify(preset)}`)
        setViewSettings({ ...sequence.viewSettings, randomizerVisible: !sequence.viewSettings.randomizerVisible})
    }
    
    const setValues = (values: Array<number>, panelId: string) => {
        console.log(`setValues: ${panelId} to ${JSON.stringify(values)}`)
        if (preset === null) {
            throw Error('randomize panel has no preset')
        }

        var newProgram = {...program}
        newProgram[panelId] = values
        var newPreset: Preset = new Preset(preset.id, preset.name, newProgram)

        console.log(`setValues: newPreset ${JSON.stringify(newPreset)}`)
        setProgram(newProgram)

        updatePreset(props.presetAddress, newPreset)

        const selectedStepNumStart = useBoundStore.getState().selectedStepNumStart
        const selectedStepNumEnd = useBoundStore.getState().selectedStepNumEnd    
        randomizeSteps(newProgram, selectedStepNumStart, selectedStepNumEnd)
    }

    const setStrength = (strength: number, panelId: string) => {
        console.log(`setStrength: ${panelId} = ${strength}`)
        if (preset === null) {
            throw Error('randomize panel has no preset')
        }

        var strengths: any = program.strengths || {}
        strengths = { ...strengths, [panelId]: strength }
        const newProgram = {...program, strengths: strengths}
        const newPreset: Preset = new Preset(preset.id, preset.name, newProgram)

        console.log(`setStrength: newPreset ${JSON.stringify(newPreset)}`)
        setProgram(newProgram)

        updatePreset(props.presetAddress, newPreset)
        const selectedStepNumStart = useBoundStore.getState().selectedStepNumStart
        const selectedStepNumEnd = useBoundStore.getState().selectedStepNumEnd    
        randomizeSteps(newProgram, selectedStepNumStart, selectedStepNumEnd)
    }

    const setMirror = (mirror: number, panelId: string) => {
        console.log(`setMirror: ${panelId} = ${mirror}`)
        if (preset === null) {
            throw Error('randomize panel has no preset')
        }

        var mirrors: any = program.mirrors || {}
        mirrors = { ...mirrors, [panelId]: mirror }
        const newProgram = {...program, mirrors: mirrors}
        const newPreset: Preset = new Preset(preset.id, preset.name, newProgram)

        console.log(`setMirror: newPreset ${JSON.stringify(newPreset)}`)
        setProgram(newProgram)

        updatePreset(props.presetAddress, newPreset)
        const selectedStepNumStart = useBoundStore.getState().selectedStepNumStart
        const selectedStepNumEnd = useBoundStore.getState().selectedStepNumEnd    
        randomizeSteps(newProgram, selectedStepNumStart, selectedStepNumEnd)
    }

    const handleSaveButton = () => {
        console.log(`handleSeedButton:`)
        if (preset === null) {
            throw Error('randomize pael has no preset')
        }

        setSteps(sequence.steps)
    }

    const handleTuringMode = () => {
        console.log(`handleTuringMode:`)
        if (preset === null) {
            throw Error('randomize panel has no preset')
        }

        updateProgram(props.presetAddress, {...program, turingMode: !turingMode} )
        setTuringMode(!turingMode)
    }

    const handleAutoScaleMode = () => {
        console.log(`handleAutoScaleMode:`)
        if (preset === null) {
            throw Error('randomize panel has no preset')
        }

        updateProgram(props.presetAddress, {...program, autoScaleMode: !autoScaleMode} )
        setAutoScaleMode(!autoScaleMode)
    }

    const handleSeedButton = () => {
        console.log(`handleSeedButton:`)
        if (preset === null) {
            throw Error('randomize pael has no preset')
        }

        var newProgram = {...program}
        newProgram.randomSeed = Math.trunc(Math.random() * 10000000000000)
        var newPreset: Preset = new Preset(preset.id, preset.name, newProgram)

        console.log(`handleSeedButton: newPreset ${JSON.stringify(newPreset)}`)
        setProgram(newProgram)
        updatePreset(props.presetAddress, newPreset)

        const selectedStepNumStart = useBoundStore.getState().selectedStepNumStart
        const selectedStepNumEnd = useBoundStore.getState().selectedStepNumEnd    
        randomizeSteps(newProgram, selectedStepNumStart, selectedStepNumEnd)
    }

    if (!viewSettings.randomizerVisible) {
        return (<>
                <div className="randomize-panel Stack-vertical">
                    <button className="menu-button zen-mode-transition" type="button" title="cut in half" onClick={onTapOpenPanel}>
                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none">
                            <path d="M15.25 8.75H15.255M8.75 15.25H8.755M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21ZM15.5 8.75C15.5 8.88807 15.3881 9 15.25 9C15.1119 9 15 8.88807 15 8.75C15 8.61193 15.1119 8.5 15.25 8.5C15.3881 8.5 15.5 8.61193 15.5 8.75ZM9 15.25C9 15.3881 8.88807 15.5 8.75 15.5C8.61193 15.5 8.5 15.3881 8.5 15.25C8.5 15.1119 8.61193 15 8.75 15C8.88807 15 9 15.1119 9 15.25Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                </>)
    }

    console.log(`onTapOpenPanel: viewSettings.randomizerVisible! sequence.randomizerPresetAddress == ${JSON.stringify(sequence.randomizerPresetAddress)}`)

    if (!preset || !program) {
        return (<>
            <strong>Waiting for preset or program</strong>
        </>)
    }

    return (
        <div className="randomize-panel Stack-vertical Island">
            <div className="randomize-bar Stack-horizontal Island">
                <button className="menu-button-borderless zen-mode-transition" type="button" title="close" onClick={handleClose}>
                    <svg viewBox="2 2 20 20" fill="none">
                        <path clipRule="evenodd" d="m7.53033 6.46967c-.29289-.29289-.76777-.29289-1.06066 0s-.29289.76777 0 1.06066l4.46963 4.46967-4.46963 4.4697c-.29289.2929-.29289.7677 0 1.0606s.76777.2929 1.06066 0l4.46967-4.4696 4.4697 4.4696c.2929.2929.7677.2929 1.0606 0s.2929-.7677 0-1.0606l-4.4696-4.4697 4.4696-4.46967c.2929-.29289.2929-.76777 0-1.06066s-.7677-.29289-1.0606 0l-4.4697 4.46963z" fill="#000000" fillRule="evenodd"/>
                    </svg>
                </button>
                <button className={(autoScaleMode ? "menu-button zen-mode-transition flex-end on" : "menu-button zen-mode-transition flex-end off")} type="button" title="save" onClick={handleAutoScaleMode}>
                    <svg fill="#000000" viewBox="12 12 500 500">
                            <path d="M492.44,112.521H19.56C8.572,112.521,0,121.358,0,132.347v111.04c0,9.822,7.144,17.962,15.479,19.583v123.316
                                c0,7.326,6.605,13.194,13.93,13.194h82.677h95.943h95.943h95.943h82.677c7.326,0,13.93-5.868,13.93-13.194V262.969
                                c8.335-1.622,15.479-9.761,15.479-19.583v-111.04C512,121.358,503.428,112.521,492.44,112.521z M100.019,373.284H42.865V164.912
                                h30.958v127.006c0,10.988,8.705,20.641,19.693,20.641h6.502V373.284z M195.274,373.284h-69.06v-60.726h4.443
                                c10.988,0,20.562-9.653,20.562-20.641V164.912h19.051v127.006c0,10.988,8.2,20.641,19.189,20.641h5.815V373.284z M290.53,373.284
                                h-69.06v-60.726h5.128c10.989,0,19.876-9.653,19.876-20.641V164.912h19.051v127.006c0,10.988,8.887,20.641,19.876,20.641h5.128
                                V373.284z M385.786,373.284h-69.06v-60.726h5.815c10.988,0,19.189-9.653,19.189-20.641V164.912h19.051v127.006
                                c0,10.988,9.574,20.641,20.562,20.641h4.443V373.284z M469.135,373.284h-57.154v-60.726h6.502
                                c10.989,0,19.693-9.653,19.693-20.641V164.912h30.958V373.284z"/>
                    </svg>
                </button>
                {/* <OnOffTextButton className="on-off-button" value={turingMode} label="TM" onToggle={handleTuringMode}/> */}
                <button className={(turingMode ? "menu-button zen-mode-transition flex-end on" : "menu-button zen-mode-transition flex-end off")} type="button" title="turing machine" onClick={handleTuringMode}>
                    <svg fill="#000000" version="1.1" viewBox="0 0 32 32">
                        <path d="M29.36,15.695v-3.389c0.575-0.159,1-0.681,1-1.305c0-0.75-0.61-1.36-1.36-1.36
                            c-0.191,0-0.372,0.04-0.537,0.111l-2.365-2.956C26.261,6.572,26.36,6.298,26.36,6c0-0.75-0.61-1.36-1.36-1.36
                            c-0.401,0-0.758,0.177-1.007,0.454l-3.659-1.83C20.351,3.179,20.36,3.091,20.36,3c0-0.75-0.61-1.36-1.36-1.36
                            c-0.625,0-1.147,0.425-1.306,1h-4.389c-0.159-0.575-0.681-1-1.305-1c-0.75,0-1.36,0.61-1.36,1.36c0,0.091,0.01,0.179,0.027,0.264
                            l-2.66,1.33C7.758,4.318,7.401,4.14,7,4.14c-0.75,0-1.36,0.61-1.36,1.36c0,0.273,0.082,0.526,0.221,0.739L3.598,8.785
                            C3.417,8.695,3.216,8.64,3,8.64c-0.75,0-1.36,0.61-1.36,1.36c0,0.625,0.425,1.146,1,1.305v3.389c-0.575,0.159-1,0.681-1,1.305
                            c0,0.75,0.61,1.36,1.36,1.36c0.546,0,1.014-0.325,1.231-0.791l3.424,0.571C7.726,17.824,8.298,18.36,9,18.36
                            c0.091,0,0.179-0.01,0.264-0.027l0.83,1.659C9.818,20.242,9.64,20.599,9.64,21c0,0.75,0.61,1.36,1.36,1.36
                            c0.47,0,0.885-0.24,1.13-0.604l3.518,1.173C15.646,22.953,15.64,22.976,15.64,23c0,0.625,0.425,1.147,1,1.306v3.388
                            c-0.575,0.159-1,0.681-1,1.306c0,0.75,0.61,1.36,1.36,1.36s1.36-0.61,1.36-1.36c0-0.624-0.425-1.147-1-1.306v-3.389
                            c0.575-0.159,1-0.681,1-1.306c0-0.452-0.224-0.85-0.564-1.098l0.682-1.82l3.163,0.904c0,0.005-0.001,0.01-0.001,0.015
                            c0,0.624,0.425,1.147,1,1.306v5.389c-0.575,0.159-1,0.681-1,1.306c0,0.75,0.61,1.36,1.36,1.36s1.36-0.61,1.36-1.36
                            c0-0.624-0.425-1.147-1-1.306v-5.389c0.575-0.159,1-0.681,1-1.306c0-0.149-0.03-0.29-0.074-0.424l3.828-2.553
                            C28.353,18.231,28.66,18.36,29,18.36c0.75,0,1.36-0.61,1.36-1.36C30.36,16.376,29.935,15.854,29.36,15.695z M21.354,14.932
                            c-0.002-0.045-0.007-0.09-0.014-0.134l3.049-1.355l3.313,2.899L21.354,14.932z M20,15.64c-0.353,0-0.64-0.287-0.64-0.64
                            s0.287-0.64,0.64-0.64s0.64,0.287,0.64,0.64S20.353,15.64,20,15.64z M20,13.64c-0.75,0-1.36,0.61-1.36,1.36
                            c0,0.452,0.224,0.85,0.564,1.097l-1.166,3.11l-1.902-0.543l-1.465-5.126l5.463-3.756l0.628,0.489l3.028,2.65l-2.745,1.22
                            C20.796,13.838,20.423,13.64,20,13.64z M9.131,15.653L8.122,9.85l3.612-0.361V9.485C11.93,9.995,12.421,10.36,13,10.36
                            c0.005,0,0.009-0.001,0.014-0.001l0.823,2.879l-3.966,2.726C9.666,15.792,9.412,15.681,9.131,15.653z M13,9.64
                            c-0.353,0-0.64-0.287-0.64-0.64S12.647,8.36,13,8.36S13.64,8.647,13.64,9S13.353,9.64,13,9.64z M10.28,16.557l3.765-2.589
                            l1.275,4.463l-4.962-1.418c0-0.005,0.001-0.009,0.001-0.014C10.36,16.844,10.328,16.697,10.28,16.557z M24.129,7.036
                            C24.366,7.235,24.667,7.36,25,7.36c0.191,0,0.372-0.04,0.537-0.111l2.365,2.955C27.739,10.428,27.64,10.702,27.64,11
                            c0,0.069,0.01,0.135,0.02,0.201l-3.144,1.397l-3.295-2.883l-0.464-0.361L24.129,7.036z M28.251,15.866l-3.138-2.745l2.841-1.262
                            c0.176,0.213,0.412,0.371,0.686,0.446v3.389C28.501,15.733,28.369,15.789,28.251,15.866z M29.64,11c0,0.353-0.287,0.64-0.64,0.64
                            s-0.64-0.287-0.64-0.64s0.287-0.64,0.64-0.64S29.64,10.647,29.64,11z M25,5.36c0.353,0,0.64,0.287,0.64,0.64S25.353,6.64,25,6.64
                            S24.36,6.353,24.36,6S24.647,5.36,25,5.36z M19,2.36c0.353,0,0.64,0.287,0.64,0.64S19.353,3.64,19,3.64S18.36,3.353,18.36,3
                            S18.647,2.36,19,2.36z M19,4.36c0.401,0,0.758-0.177,1.007-0.454l3.659,1.83C23.649,5.821,23.64,5.909,23.64,6
                            c0,0.156,0.032,0.303,0.08,0.443l-3.56,2.448l-6.904-5.37c0.021-0.051,0.035-0.106,0.05-0.161h4.389
                            C17.853,3.935,18.375,4.36,19,4.36z M12,2.36c0.353,0,0.64,0.287,0.64,0.64S12.353,3.64,12,3.64S11.36,3.353,11.36,3
                            S11.647,2.36,12,2.36z M10.993,3.906C11.242,4.182,11.599,4.36,12,4.36c0.304,0,0.583-0.104,0.81-0.274l6.728,5.232l-5.075,3.489
                            l-0.757-2.65C14.096,9.918,14.36,9.491,14.36,9c0-0.75-0.61-1.36-1.36-1.36c-0.673,0-1.229,0.492-1.337,1.135V8.772L7.998,9.138
                            l-0.42-2.412C8.039,6.508,8.36,6.042,8.36,5.5c0-0.091-0.01-0.179-0.027-0.264L10.993,3.906z M4.265,9.511
                            C4.231,9.423,4.19,9.339,4.139,9.261l2.263-2.546c0.143,0.071,0.3,0.115,0.467,0.132L7.28,9.21L4.265,9.511z M7,4.86
                            c0.353,0,0.64,0.287,0.64,0.64S7.353,6.14,7,6.14S6.36,5.853,6.36,5.5S6.647,4.86,7,4.86z M2.36,10c0-0.353,0.287-0.64,0.64-0.64
                            S3.64,9.647,3.64,10S3.353,10.64,3,10.64S2.36,10.353,2.36,10z M3,16.64c-0.353,0-0.64-0.287-0.64-0.64S2.647,15.36,3,15.36
                            S3.64,15.647,3.64,16C3.64,16.353,3.353,16.64,3,16.64z M7.769,16.43l-3.424-0.571c-0.059-0.561-0.455-1.018-0.986-1.165v-3.389
                            c0.503-0.139,0.888-0.556,0.977-1.077l3.067-0.307l1.018,5.853C8.135,15.91,7.904,16.142,7.769,16.43z M8.36,17
                            c0-0.353,0.287-0.64,0.64-0.64S9.64,16.647,9.64,17S9.353,17.64,9,17.64S8.36,17.353,8.36,17z M11,21.64
                            c-0.353,0-0.64-0.287-0.64-0.64s0.287-0.64,0.64-0.64s0.64,0.287,0.64,0.64S11.353,21.64,11,21.64z M12.353,21.071
                            c0.001-0.024,0.007-0.047,0.007-0.071c0-0.75-0.61-1.36-1.36-1.36c-0.091,0-0.179,0.01-0.264,0.027l-0.83-1.659
                            c0.098-0.088,0.182-0.189,0.251-0.302l5.396,1.541l0.742,2.596c-0.168,0.103-0.315,0.238-0.425,0.402L12.353,21.071z M17.64,29
                            c0,0.353-0.287,0.64-0.64,0.64c-0.353,0-0.64-0.287-0.64-0.64s0.287-0.64,0.64-0.64C17.353,28.36,17.64,28.647,17.64,29z M17,23.64
                            c-0.353,0-0.64-0.287-0.64-0.64s0.287-0.64,0.64-0.64c0.353,0,0.64,0.287,0.64,0.64S17.353,23.64,17,23.64z M17.121,21.652
                            C17.08,21.648,17.041,21.64,17,21.64c-0.005,0-0.009,0.001-0.014,0.001l-0.618-2.162l1.416,0.404L17.121,21.652z M18.732,19.406
                            l1.147-3.059c0.041,0.004,0.08,0.012,0.121,0.012c0.519,0,0.967-0.296,1.196-0.725l6.451,1.433c0.006,0.124,0.03,0.243,0.068,0.356
                            l-3.828,2.553C23.647,19.769,23.34,19.64,23,19.64c-0.491,0-0.918,0.264-1.158,0.655L18.732,19.406z M23.64,29
                            c0,0.353-0.287,0.64-0.64,0.64s-0.64-0.287-0.64-0.64s0.287-0.64,0.64-0.64S23.64,28.647,23.64,29z M23,21.64
                            c-0.353,0-0.64-0.287-0.64-0.64s0.287-0.64,0.64-0.64s0.64,0.287,0.64,0.64S23.353,21.64,23,21.64z M29,17.64
                            c-0.353,0-0.64-0.287-0.64-0.64c0-0.353,0.287-0.64,0.64-0.64s0.64,0.287,0.64,0.64C29.64,17.353,29.353,17.64,29,17.64z"/>
                    </svg>
                </button>
                <button className="menu-button zen-mode-transition" type="button" title="roll" onClick={() => {handleSeedButton()}}>
                    <svg viewBox="2 2 20 20" fill="none">
                        <path d="M15.25 8.75H15.255M8.75 15.25H8.755M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21ZM15.5 8.75C15.5 8.88807 15.3881 9 15.25 9C15.1119 9 15 8.88807 15 8.75C15 8.61193 15.1119 8.5 15.25 8.5C15.3881 8.5 15.5 8.61193 15.5 8.75ZM9 15.25C9 15.3881 8.88807 15.5 8.75 15.5C8.61193 15.5 8.5 15.3881 8.5 15.25C8.5 15.1119 8.61193 15 8.75 15C8.88807 15 9 15.1119 9 15.25Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <div className="Stack-horizontal flexbox-item">
                <div>
                    <strong onClick={() => {handleSeedButton()}}>
                        Seed:
                    </strong>
                </div>
                <button className="text-button" onClick={handleSeedButton}>{program.randomSeed}</button>
                </div>
                <div className="randomizer-panel-name">{panelId.toUpperCase()}</div>
                <button className="menu-button zen-mode-transition flex-end" type="button" title="save" onClick={() => {handleSaveButton()}}>
                    <svg viewBox="2 2 20 20" fill="none">
                        <path d="M4 6C4 4.89543 4.89543 4 6 4H12H14.1716C14.702 4 15.2107 4.21071 15.5858 4.58579L19.4142 8.41421C19.7893 8.78929 20 9.29799 20 9.82843V12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 4H13V7C13 7.55228 12.5523 8 12 8H9C8.44772 8 8 7.55228 8 7V4Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 15C7 13.8954 7.89543 13 9 13H15C16.1046 13 17 13.8954 17 15V20H7V15Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
            {/* <div className="randomizer-panel-name">{panelId}</div> */}
            <RandomizeValuesPanel panelId="tie"      values={program.tie}      strength={getStrength("tie")}      mirror={getMirror("tie")}      onEditValues={setValues} onEditStrength={setStrength} onEditMirror={setMirror}/>
            <RandomizeValuesPanel panelId="silence"  values={program.silence}  strength={getStrength("silence")}  mirror={getMirror("silence")}  onEditValues={setValues} onEditStrength={setStrength} onEditMirror={setMirror}/>
            <RandomizeValuesPanel panelId="length"   values={program.length}   strength={getStrength("length")}   mirror={getMirror("length")}   onEditValues={setValues} onEditStrength={setStrength} onEditMirror={setMirror}/>
            <RandomizeValuesPanel panelId="octave"   values={program.octave}   strength={getStrength("octave")}   mirror={getMirror("octave")}   onEditValues={setValues} onEditStrength={setStrength} onEditMirror={setMirror}/>
            <RandomizeValuesPanel panelId="note"     values={program.note}     strength={getStrength("note")}     mirror={getMirror("note")}     onEditValues={setValues} onEditStrength={setStrength} onEditMirror={setMirror}/>
            <RandomizeValuesPanel panelId="velocity" values={program.velocity} strength={getStrength("velocity")} mirror={getMirror("velocity")} onEditValues={setValues}/>
            <div className="Stack-horizontal">
                <button className="text-button" onClick={() => setRandomizerPanel("note")}>NOTE</button>
                <button className="text-button" onClick={() => setRandomizerPanel("silence")}>SILENCE</button>
                <button className="text-button" onClick={() => setRandomizerPanel("length")}>LENGTH</button>
                <button className="text-button" onClick={() => setRandomizerPanel("octave")}>OCTAVE</button>
                <button className="text-button" onClick={() => setRandomizerPanel("velocity")}>VELOCITY</button>
                <button className="text-button" onClick={() => setRandomizerPanel("tie")}>TIE</button>
                {/* <OnOffTextButton className="device-setting-track" label="VELOCITY" value={panelId === "velocity"} onToggle={(x) => setRandomizerPanel("velocity")}/> */}
            </div>
        </div>
    )
}

export default RandomizePanel
