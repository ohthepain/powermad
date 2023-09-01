import React, {useEffect, useRef, useState} from 'react'
import './transport.css'
import {useNavigate} from "react-router-dom"
import {Sequence, Skin} from "../../../player/sequence"
import {useSequenceStore} from "../../../app/state/sequence-store"
import {useBoundStore} from "../../../app/state/bound-store"
import {usePositionStore} from '../../../app/state/position-store'
import {RecordMode} from "../../../app/state/edit-state-slice"
import SongPlayer from "../../../player/song-player"
import SequenceDataService from "../../../services/sequence-service"
import {WebMidi, Input} from "webmidi"
import MidiService from "../../../services/midi-service"
import { MidiNote } from '../../../player/sequence-player'
import midiService from '../../../services/midi-service'

class HeldNote {
    stepNum: number
    noteNum: number
    velocity: number
    noteLength: number

    constructor(stepNum: number, noteNum: number, velocity: number, noteLength: number) {
        this.stepNum = stepNum
        this.noteNum = noteNum
        this.velocity = velocity
        this.noteLength = noteLength
    }
}

export const Transport = (props: any) => {

    const sequence: Sequence = useSequenceStore(state => state.sequence)
    const navigationInfo = useBoundStore(state => state.navigationInfo)
    const setMidiLearnMode = useBoundStore(state => state.setMidiLearnMode)
    const midiLearnMode = useBoundStore(state => state.midiLearnMode)
    const setViewRangeSteps = useBoundStore(state => state.setViewRangeSteps)
    const setCurrentEditStepNum = useBoundStore(state => state.setCurrentEditStepNum)
    const setRecordMode = useBoundStore(state => state.setRecordMode)
    // const editStateInfo = useBoundStore(state => state)
    const recordMode = useBoundStore((state) => state.recordMode)
    const currentEditStepNum = useBoundStore(state => state.currentEditStepNum)
    const isPlaying = usePositionStore(state => state.isPlaying)

    // const {undo, redo} = useSequenceStore()
    const {undo, redo, clear} = useSequenceStore.temporal.getState();
    const deleteEnvelope = useSequenceStore(state => state.deleteEnvelope)
    const setStep = useSequenceStore(state => state.setStep)
    const setSkin = useSequenceStore(state => state.setSkin)
    const navigate = useNavigate();

    // const [recordMode, setRecordMode] = useState<RecordMode>(RecordMode.Off)
    // const recordModeRef = useRef(recordMode)
    const [recordListeners, setRecordListeners] = useState<Array<any>>([])

    var heldNotes: Array<HeldNote> = []
    const sequenceRef = useRef(sequence)
    const heldNotesRef = useRef(heldNotes)
    const recordModeRef = useRef(recordMode)
    const currentEditStepNumRef = useRef(currentEditStepNum)
    // var recordState = {stepNum: 0}
    // const recordStateRef = useRef(recordState)
    
    // const [heldNote, setHeldNote] = useState<number>(0)
    // const [heldVelocity, setHeldVelocity] = useState<number>(0)
    // const [stepNum, setStepNum] = useState<number>(0)

    useEffect(() => {
        console.log(`🎹transport init hook`)
        document.addEventListener("keydown", handleKeyDown)
        // startMidiListeners()

        return () => {
            console.log(`🎹transport shutdown hook`)
            stopMidiListeners()
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    useEffect(() => {
        // console.log(`sequence changed - currentEditStep ${currentEditStepNum} ${sequence.steps[currentEditStepNum].note}`)
        sequenceRef.current = sequence
    }, [sequence])

    useEffect(() => {
        console.log(`sequence midiSettings changed: ${JSON.stringify(sequence.midiSettings)}`)
        startMidiListeners()
    }, [sequence.midiSettings])

    useEffect(() => {
        recordModeRef.current = recordMode
    }, [recordMode])

    useEffect(() => {
        // console.log(`currentEditStepNum changed`)
        currentEditStepNumRef.current = currentEditStepNum
    }, [currentEditStepNum])

    const handleKeyDown = (e: any) => {
        // console.log(`🎹keyDown: ${e.key}`)

        switch (e.key) {
            case 'ArrowUp':
                console.log('arrow up')
                break;
            case 'ArrowDown':
                console.log('arrow down')
                break;
            case 'ArrowLeft':
                console.log('arrow left')
                break;
            case 'ArrowRight':
                console.log('arrow right')
                break
        }

        console.log(`handleKeyDown: ---> recordMode ${recordModeRef.current}`)

        if (recordModeRef.current === RecordMode.Step) {
            switch (e.key) {
                case 'ArrowLeft':
                    console.log(`arrow left - step record: currentEditStepNum ${currentEditStepNumRef.current}`)
                    // recordStateRef.current.stepNum--
                    setCurrentEditStepNum(Math.max(0, currentEditStepNumRef.current - 1))
                    break;
                case 'ArrowRight':
                    console.log(`arrow right - step record: currentEditStepNum ${currentEditStepNumRef.current}`)
                    // recordStateRef.current.stepNum++
                    setCurrentEditStepNum(currentEditStepNumRef.current + 1)
                    break
                case 'ArrowUp': {
                    console.log(`arrow up - step record: currentEditStepNum ${currentEditStepNumRef.current}`)
                    // recordStateRef.current.stepNum--
                    const currentStep = sequenceRef.current.steps[currentEditStepNumRef.current]
                    setStep(currentEditStepNumRef.current, currentStep.note + 1, currentStep.velocity, currentStep.gateLength)
                    break;
                }
                case 'ArrowDown':
                {
                    console.log(`arrow down - step record: currentEditStepNum ${currentEditStepNumRef.current}`)
                    // recordStateRef.current.stepNum++
                    const currentStep = sequenceRef.current.steps[currentEditStepNumRef.current]
                    setStep(currentEditStepNumRef.current, currentStep.note - 1, currentStep.velocity, currentStep.gateLength)
                    break
                }
            }
        } else {
            if (e.key === " ") {
                if (isPlaying) {
                    handleStopButton()
                } else {
                    handlePlayButton()
                }
            }
        }
    }

    const startRecordStep = (note: number, velocity: number) => {
        console.log(`🎹startRecordStep: note ${note} velocity ${velocity} => step ${currentEditStepNumRef.current}`)
        // if (recordStateRef.current.heldNote !== 0) {
        //     console.log(`🎹startRecordStep: note ${recordStateRef.current.heldNote} velocity ${recordStateRef.current.heldVelocity} 100`)
        //     setStep(recordStateRef.current.stepNum++, recordStateRef.current.heldNote, recordStateRef.current.heldVelocity, 1)
        // }

        // recordStateRef.current.heldNote = note
        // recordStateRef.current.heldVelocity = velocity

        console.log(`startRecordStep: currentEditStepNum ${currentEditStepNum} ${currentEditStepNumRef.current} held notes in: ${JSON.stringify(heldNotesRef.current)}`)
        const noteLength: number = heldNotesRef.current.length > 1 ? 1.0 : 0.5
        const newHeldNote: HeldNote = new HeldNote(currentEditStepNumRef.current, note, velocity, noteLength)
        setCurrentEditStepNum(currentEditStepNumRef.current + 1)
        // console.log(`startRecordStep: newHeldNote: ${JSON.stringify(newHeldNote)}`)
        heldNotesRef.current = [...heldNotesRef.current, newHeldNote]
        // console.log(`startRecordStep: held notes out: ${JSON.stringify(heldNotesRef.current)}`)

        // This is necessary because javascript is a joke
        heldNotesRef.current = heldNotesRef.current.filter(n => n != null)

        // console.log(`startRecordStep: held notes out: ${JSON.stringify(heldNotesRef.current)}`)
    }

    const endRecordStep = (note: number) => {
        console.log(`endRecordStep: held notes in: ${JSON.stringify(heldNotesRef.current)}`)

        // Find held note record
        const heldNote = heldNotesRef.current.find(heldNote => heldNote != null && heldNote.noteNum == note)
        if (heldNote !== undefined) {
            // console.log(`endRecordStep: found held note ${note} => ${JSON.stringify(heldNote)}`)
            // Remove held note record
            heldNotesRef.current = heldNotesRef.current.filter(heldNote => heldNote != null && heldNote.noteNum != note)

            heldNote.noteLength = heldNotesRef.current.length > 1 ? 1.0 : 0.5
            // console.log(`endRecordStep: heldNotesRef.current.length: ${JSON.stringify(heldNotesRef.current.length)} heldNote.noteLength ${heldNote.noteLength}`)

            setStep(heldNote.stepNum, heldNote.noteNum, heldNote.velocity, heldNote.noteLength)

            if (navigationInfo.endBar * 64 + navigationInfo.endSixtyfourth < (heldNote.stepNum + 1) * 64 / sequence.division) {
                console.log(`endRecordStep: navigationInfo.endSixtyfourth ${navigationInfo.endSixtyfourth} < ${JSON.stringify(heldNote)}`)
                setViewRangeSteps(sequence, 0, heldNote.stepNum + 1)
            }
        }

        // console.log(`endRecordStep: held notes out: ${JSON.stringify(heldNotesRef.current)}`)
    }

    const handleMidiEvent = (e:any) => {
        console.log(`🎹handleMidiEvent:`)
        // Be careful where you get state in these handlers
        if (e.message.type === "noteon") {
            const note = e.message.dataBytes[0]
            const velocity = e.message.dataBytes[1]
            if (recordModeRef.current === RecordMode.Step) {
                midiService.playNote(sequence.midiSettings, note, velocity / 127, 1)
                startRecordStep(note, e.message.dataBytes[1]);
            } else {
                SongPlayer.addNote(sequence._id, new MidiNote(note, velocity))
            }
        } else if (e.message.type === "noteoff") {
            const note = e.message.dataBytes[0]
            const velocity = e.message.dataBytes[1]
            if (recordModeRef.current === RecordMode.Step) {
                endRecordStep(note)
            } else {
                console.log(`🎹handleMidiEvent: ${e.message.type} ${JSON.stringify(e.message)}`)
                SongPlayer.removeNote(sequence._id, new MidiNote(note, velocity))
            }
        }
    }

    const startMidiListeners = () => {
        // console.log(`🎹transport.startMidiListeners - midiDevicePreferences: ${JSON.stringify(MidiService.getMidiInputs())}`)
        // stopMidiListeners()

        var toStart : Set<Input> = new Set<Input>()
        for (const midiInput of MidiService.getMidiInputs()) {
            if (sequence.midiDevicePreferences.isTrackingEnabledForMidiInputId(midiInput.id)) {
                // console.log(`🎹startMidiListeners: add input device ${midiInput.label}`)
                toStart.add(midiInput)
                // console.log(`🎹startMidiListeners - try input toStart: ${JSON.stringify(toStart)}`);
            } else {
                // console.log(`🎹startMidiListeners: don't add input device ${midiInput.label}`)
            }
        }

        toStart.forEach((input: Input) => {
            console.log(`🎹from toStart set ${input.id}`)
        })

        var recordListeners: Array<any> = []
        for (var inputNum = 0; inputNum < WebMidi.inputs.length; inputNum++) {
            // console.log(`🎹envelope-list-lane: startMidiListeners: Test input: <${WebMidi.inputs[inputNum].name}>`);
            if (sequence.midiDevicePreferences.isTrackingEnabledForMidiInputId(WebMidi.inputs[inputNum].id)) {
                console.log(`🎹envelope-list-lane: startMidiListeners: Found input: <${WebMidi.inputs[inputNum].name}> channel ${sequence.midiSettings.midiInputChannelNum}`);
                // var listeners = WebMidi.inputs[inputNum].addListener("noteon", handleMidiEvent, {channels: [sequence.midiSettings.midiInputChannelNum]});
                var listeners = WebMidi.inputs[inputNum].addListener("noteon", handleMidiEvent);
                recordListeners.push(listeners)

                // listeners = WebMidi.inputs[inputNum].addListener("noteoff", handleMidiEvent, {channels: [sequence.midiSettings.midiInputChannelNum]});
                listeners = WebMidi.inputs[inputNum].addListener("noteoff", handleMidiEvent);
                recordListeners.push(listeners)
            }
        }

        setRecordListeners(recordListeners)
    }

    const stopMidiListeners = () => {
        console.log(`🎹transport.stopMidiListeners - stop ${recordListeners.length} listeners`);

        for (const input of WebMidi.inputs) {
            input.removeListener(WebMidi.eventMap.midimessage, handleMidiEvent)
        }

        setRecordListeners([])
    }

    const handleRecordButton = () => {
        if (recordModeRef.current === RecordMode.Step) {
            // stopMidiListeners()
            setRecordMode(RecordMode.Off)
            heldNotesRef.current = []
        } else {
            setCurrentEditStepNum(0)
            // recordStateRef.current.heldNote = 0
            // startMidiListeners()
            setRecordMode(RecordMode.Step)
            heldNotesRef.current = []
        }
    }

    const handlePlayButton = () => {
        console.log(`🎹handlePlayButton`)
        SongPlayer.startSequence(sequence._id, [{note: 60, velocity: 100}])
    }

    const handleStopButton = () => {
        console.log(`🎹handleStopButton`)
        SongPlayer.stop()
    }

    function saveSequence() {
        console.log(`🎹saveSequence: ${JSON.stringify(sequence)}`);

        if (sequence.name == 'New Sequence') {
            window.alert("Your sequence needs a name")
        } else {
            SequenceDataService.saveSequence(sequence)
                .then(response => {
                    console.log(response.data)
                })
                .catch(e => {
                    console.error(e);
                });
        }
    }

    function handleMidiLearnButton() {
        setMidiLearnMode(!midiLearnMode)
    }

    function deleteSequence() {
        // console.log(`deleteSequence: ${JSON.stringify(sequence)}`);
        console.log(`🎹deleteSequence: ${sequence.name}`);

        if (window.confirm('Deleting a sequence is permanent and cannot be undone. Are you sure?')) {
            SequenceDataService.deleteSequence(sequence)
                .then(response => {
                    console.log(response.data);
                    navigate("/");
                })
                .catch(e => {
                    console.error(e);
                });
        }
    }

    function handleReskinButton() {
        setSkin(new Skin())
    }

    function handleTestButton() {
        console.log(`🎹handleTestButton`)
        console.log(`🎹${JSON.stringify(sequence)}`)
        console.log(`🎹${JSON.stringify(sequence.envelopes)}`)
    }

    // function handleTrashButton() {
    //     console.log(`handleTrashButton`)
    //     deleteEnvelope(sequence.currentEnvelopeId)
    // }

    return (
        <div className="transport-bar Island">
            { recordMode === RecordMode.Step ? (
                <div className="flexbox-item">
                    {/* <button onClick={handleRecordButton}>
                        <FontAwesomeIcon className="CustomColorRed" icon={faRecordVinyl}/>
                    </button> */}
                    <button className="menu-button zen-mode-transition" type="button" title="record" onClick={handleRecordButton}>
                        <svg viewBox="0 0 24 24">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="red" stroke="#000000" strokeWidth="1.5" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="flexbox-item">
                    <button className="menu-button zen-mode-transition" type="button" title="record" onClick={handleRecordButton}>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="#000000" fillOpacity=".16" stroke="#000000" strokeWidth="1.5" />
                        </svg>
                    </button>
                </div>
            )}
            { isPlaying ? (
                <div className="flexbox-item">
                    {/* <button onClick={handleStopButton}>
                        <FontAwesomeIcon icon={faStop} />
                    </button> */}
                    <button className="menu-button zen-mode-transition" type="button" title="record" onClick={handleStopButton}>
                        <svg fill="red" viewBox="0 0 56 56">
                            <path d="M 8.8984 41.9219 C 8.8984 45.1797 10.8672 47.1016 14.1719 47.1016 L 41.8281 47.1016 C 45.1328 47.1016 47.1016 45.1797 47.1016 41.9219 L 47.1016 14.0781 C 47.1016 10.8203 45.1328 8.8984 41.8281 8.8984 L 14.1719 8.8984 C 10.8672 8.8984 8.8984 10.8203 8.8984 14.0781 Z M 12.6719 41.0312 L 12.6719 14.9688 C 12.6719 13.5390 13.5156 12.6719 14.9219 12.6719 L 41.0781 12.6719 C 42.4844 12.6719 43.3281 13.5390 43.3281 14.9688 L 43.3281 41.0312 C 43.3281 42.4609 42.4844 43.3281 41.0781 43.3281 L 14.9219 43.3281 C 13.5156 43.3281 12.6719 42.4609 12.6719 41.0312 Z"/>
                        </svg>
                    </button>
                </div>
                ) : (
                <div className="flexbox-item">
                    {/* <button onClick={handlePlayButton}>
                        <FontAwesomeIcon icon={faPlay} />
                    </button> */}
                    <button className="menu-button zen-mode-transition" type="button" title="record" onClick={handlePlayButton}>
                        <svg viewBox="0 0 32 32" fill="black">
                            <path stroke="#535358" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 24.414V7.586c0-1.746 2.081-2.653 3.36-1.465l9.062 8.413a2 2 0 010 2.932l-9.061 8.413C13.08 27.067 11 26.16 11 24.414z"/>
                        </svg>
                    </button>
                </div>
            )}
            {/* <div className="flexbox-item">
                <button onClick={deleteSequence}>
                    <FontAwesomeIcon icon={faTrashCan} />
                </button>
            </div> */}
            <button className="menu-button zen-mode-transition" type="button" title="delete sequence!" onClick={deleteSequence}>
                <svg fill="#000000" viewBox="4 4 50 50">
                    <path d="M 44.5235 48.6602 L 46.1407 14.3945 L 48.4844 14.3945 C 49.4454 14.3945 50.2187 13.5976 50.2187 12.6367 C 50.2187 11.6758 49.4454 10.8555 48.4844 10.8555 L 38.2422 10.8555 L 38.2422 7.3398 C 38.2422 3.9883 35.9688 1.8086 32.3595 1.8086 L 23.5938 1.8086 C 19.9844 1.8086 17.7344 3.9883 17.7344 7.3398 L 17.7344 10.8555 L 7.5391 10.8555 C 6.6016 10.8555 5.7813 11.6758 5.7813 12.6367 C 5.7813 13.5976 6.6016 14.3945 7.5391 14.3945 L 9.8829 14.3945 L 11.5000 48.6836 C 11.6641 52.0586 13.8907 54.1914 17.2657 54.1914 L 38.7579 54.1914 C 42.1095 54.1914 44.3595 52.0351 44.5235 48.6602 Z M 21.4844 7.5742 C 21.4844 6.2383 22.4688 5.3008 23.8751 5.3008 L 32.1016 5.3008 C 33.5313 5.3008 34.5157 6.2383 34.5157 7.5742 L 34.5157 10.8555 L 21.4844 10.8555 Z M 17.6173 50.6758 C 16.2579 50.6758 15.2500 49.6445 15.1797 48.2852 L 13.5391 14.3945 L 42.3907 14.3945 L 40.8438 48.2852 C 40.7735 49.6680 39.7891 50.6758 38.4063 50.6758 Z M 34.9610 46.5508 C 35.7344 46.5508 36.3204 45.9180 36.3438 45.0273 L 37.0469 20.2773 C 37.0704 19.3867 36.4610 18.7305 35.6641 18.7305 C 34.9376 18.7305 34.3282 19.4102 34.3048 20.2539 L 33.6016 45.0273 C 33.5782 45.8711 34.1641 46.5508 34.9610 46.5508 Z M 21.0626 46.5508 C 21.8595 46.5508 22.4454 45.8711 22.4219 45.0273 L 21.7188 20.2539 C 21.6954 19.4102 21.0626 18.7305 20.3360 18.7305 C 19.5391 18.7305 18.9532 19.3867 18.9766 20.2773 L 19.7032 45.0273 C 19.7266 45.9180 20.2891 46.5508 21.0626 46.5508 Z M 29.4298 45.0273 L 29.4298 20.2539 C 29.4298 19.4102 28.7969 18.7305 28.0235 18.7305 C 27.2500 18.7305 26.5938 19.4102 26.5938 20.2539 L 26.5938 45.0273 C 26.5938 45.8711 27.2500 46.5508 28.0235 46.5508 C 28.7735 46.5508 29.4298 45.8711 29.4298 45.0273 Z"/>
                </svg>
            </button>
            {/* <div className="flexbox-item">
                <button onClick={saveSequence}>
                    <FontAwesomeIcon icon={faCloudArrowUp} />
                </button>
            </div> */}
            <button className="menu-button zen-mode-transition" type="button" title="save sequence to cloud" onClick={saveSequence}>
                <svg fill="#000000" viewBox="0 0 30 30">
                    <path d="M15.5 16c-.13.002-.26.055-.353.146l-3.994 3.995c-.464.446.26 1.17.706.707l3.64-3.642 3.64 3.642c.454.472 1.175-.257.707-.706l-3.994-3.994c-.096-.095-.218-.148-.353-.146zm0 3c.277 0 .5.223.5.5v7c0 .277-.223.5-.5.5s-.5-.223-.5-.5v-7c0-.277.223-.5.5-.5zm7 4H25c2.756 0 5-2.244 5-5 0-2.398-1.734-4.373-4.04-4.836.016-.22.04-.494.04-.664C26 7.28 21.74 3 16.5 3c-3.51.005-6.686 1.973-8.33 5.05C7.948 8.03 7.726 8 7.5 8 3.352 8 0 11.364 0 15.5S3.364 23 7.5 23h1c.663 0 .668-1 0-1h-1C3.904 22 1 19.096 1 15.5 1 11.906 3.902 9.002 7.496 9c.285.002.57.023.852.063.214.03.424-.08.52-.276C10.287 5.862 13.247 4.005 16.5 4c4.7 0 8.5 3.8 8.5 8.5-.002.322-.022.643-.06.963-.035.28.167.53.447.558C27.44 14.22 29 15.938 29 18c0 2.215-1.785 4-4 4h-2.5c-.685 0-.638 1 0 1z"/>
                </svg>
            </button>
            {/* <div className="flexbox-item">
                <button onClick={handleTestButton}>
                    <FontAwesomeIcon icon={faFlaskVial} />
                </button>
            </div> */}
            <button className="menu-button zen-mode-transition" type="button" title="test (prob just debug output)" onClick={handleTestButton}>
                <svg viewBox="0 -0.5 17 17">
                    <g stroke="none" strokeWidth="1" fill="none">
                        <path d="M12,1 L12,0.023 L6,0.023 C6,0.023 6,0.013 6,1 L7.012,1 L7.012,7 L3,15 C3,15 3,15.962 4,15.962 L14,15.962 C15,15.962 15,15 15,15 L10.958,7 L10.938,1 L12,1 L12,1 Z M14,15.031 L4,15.031 L8,7 L8,1 L10,1 L10,7 L14,15.031 L14,15.031 Z" fill="#434343"></path>
                    </g>
                </svg>
            </button>
            {/* <div className="flexbox-item">
                <button onClick={handleReskinButton}>
                    <FontAwesomeIcon icon={faShirt} />
                </button>
            </div> */}
            <button className="menu-button zen-mode-transition" type="button" title="reskin" onClick={handleReskinButton}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                </svg>
            </button>
            {/* <div className="flexbox-item">
                <button onClick={handleMidiLearnButton}>
                    <FontAwesomeIcon icon={faGraduationCap} />
                </button>
            </div> */}
            <button className="menu-button zen-mode-transition" type="button" title="MIDI learn" onClick={handleMidiLearnButton}>
                <svg viewBox="0 0 32 32">
                    <path d="M29.906,12.916c0.799-0.349,0.799-1.483,0-1.832L17.202,5.526C16.819,5.358,16.41,5.275,16,5.275
                        c-0.41,0-0.819,0.084-1.202,0.252L2.094,11.084c-0.799,0.35-0.799,1.483,0,1.832L8,15.5v3.32c0,1.136,0.642,2.175,1.658,2.683l0,0
                        C11.655,22.501,13.827,23,16,23s4.345-0.499,6.341-1.497l0,0C23.358,20.995,24,19.956,24,18.82V15.5l4-1.75V21c-0.552,0-1,0.448-1,1
                        v3c0,0.552,0.448,1,1,1h1c0.552,0,1-0.448,1-1v-3c0-0.552-0.448-1-1-1v-7.688L29.906,12.916z M23,18.82
                        c0,0.762-0.424,1.448-1.106,1.789C20.074,21.519,18.035,22,16,22s-4.074-0.481-5.894-1.391C9.424,20.268,9,19.582,9,18.82v-2.882
                        l5.798,2.536c0.383,0.168,0.793,0.252,1.202,0.252c0.41,0,0.819-0.084,1.202-0.252L23,15.937V18.82z M16.802,17.558
                        c-0.254,0.111-0.524,0.168-0.802,0.168s-0.547-0.056-0.802-0.168L2.495,12l12.703-5.558C15.453,6.331,15.722,6.275,16,6.275
                        s0.547,0.056,0.802,0.168L29.505,12l-1.118,0.489L16.894,11.57C16.732,11.235,16.396,11,16,11c-0.552,0-1,0.448-1,1
                        c0,0.552,0.448,1,1,1c0.337,0,0.621-0.178,0.802-0.434l9.646,0.772L16.802,17.558z"/>
                </svg>
            </button>
            {/* <div className="flexbox-item">
                <button onClick={e => undo()}>
                    <FontAwesomeIcon icon={faUndo} />
                </button>
            </div>
            <div className="flexbox-item">
                <button onClick={e => redo()}>
                    <FontAwesomeIcon icon={faRedo} />
                </button>
            </div> */}
            <button className="menu-button zen-mode-transition" type="button" title="undo" onClick={e => undo()}>
                <svg fill="#000000" viewBox="0 0 512 512" enableBackground="new 0 0 512 512">
                <path d="M250.6,66.8V0L136.7,111.3l113.9,111.3v-66.8c73.7,0,133.6,59.8,133.6,133.6c0,73.8-59.8,133.6-133.6,133.6
                    C176.9,423,117,363.2,117,289.4H28C28,412.3,127.7,512,250.6,512c123,0,222.6-99.7,222.6-222.6C473.2,166.4,373.6,66.8,250.6,66.8z"
                    />
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="redo" onClick={e => redo()}>
                <svg fill="#000000" viewBox="0 0 512 512">
                <path d="M389.6,289.4c0,73.8-59.8,133.6-133.6,133.6c-73.7,0-133.6-59.8-133.6-133.6c0-73.8,59.8-133.6,133.6-133.6v66.8
                    l113.9-111.3L256,0v66.8c-122.9,0-222.6,99.7-222.6,222.6C33.4,412.3,133.1,512,256,512c122.9,0,222.6-99.7,222.6-222.6H389.6z"/>
                </svg>
            </button>
        </div>
       )
}
