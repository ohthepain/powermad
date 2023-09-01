import React, {useContext, useState, useEffect, useRef} from "react"
import './sequence-view.css'
import SequenceDataService from "../../services/sequence-service"
import axios from "axios"
import MidiDeviceDataService, {MidiChartDataService} from "../../services/device-service"
import {MidiChart, ControllerInfo} from "../../services/device-service"
import {useParams} from "react-router-dom"
import {UserContext } from "../../App"
import {SequenceCanvas} from "../sequence/sequence-canvas"
import SequencePanel from "./sequence-panel";
import SongPlayer from '../../player/song-player'
import {MidiNote} from '../../player/sequence-player'
import StringList from "../string-list";
import MidiSelector from "./midi-selector"
import {WebMidi} from "webmidi";
import {findMidiChart} from "../../util/midi-utils";
import {findEnvelope, getEnvelopeById, searchEnvelopeByController} from "../../util/sequence-util";
import {Envelope, Sequence, Skin} from "../../player/sequence";
import {useSequenceStore} from "../../app/state/sequence-store";
import {useBoundStore} from "../../app/state/bound-store";
import {NavigationInfo} from "../../app/state/nav-store";

// import Navigation from "../navigation/navigation"
import EnvelopeBar from "../sequence/envelope-bar"
import NotesBar from "../sequence/notes-bar"
import PulseCountLane from "../sequence/pulse-count/pulse-count-lane"
import SkipFilterLane from "../sequence/step-filters/skip-filter-lane"
import ProbabilityLane from "../sequence/step-filters/probability-lane"
import FilterTypeList from "./filter-type-list"
import {Transport} from "./transport/transport"
import {LaneController} from "../sequence/lanes/lane-controller"
import {EnvelopeCanvas} from "../sequence/envelope-canvas"
import EnvelopeList from "../sequence/lanes/envelope-list-lane"
import MidiService from "../../services/midi-service"
// import Floater from "./floater" 
import KeyboardMonitor from "../keyboard-monitor/keyboard-monitor"
// import songPlayer from "../../player/song-player"
import RandomizePanel from "../randomizer/randomize-panel"
import PanelSelector from "../navigation/panel-selector"

function SequenceInternal() {
    const sequence = useSequenceStore(state => state.sequence)
    const sequenceRef = useRef<Sequence>(sequence);

    const setDivision = useSequenceStore(state => state.setDivision)
    const setText = useSequenceStore(state => state.setText)
    const setNumSteps = useSequenceStore(state => state.setNumSteps)
    const setEnvelopeValue = useSequenceStore(state => state.setEnvelopeValue)
    // const setEnvelopeLength = useSequenceStore(state => state.setEnvelopeLength)
    // const setEnvelopeLocked = useSequenceStore(state => state.setEnvelopeLocked)
    const createEnvelope = useSequenceStore(state => state.createEnvelope)
    const setViewSettings = useSequenceStore(state => state.setViewSettings)

    const navigationInfo = useBoundStore(state => state.navigationInfo)
    const navigationInfoRef = useRef<NavigationInfo>(navigationInfo)
    const setViewRangeSteps = useBoundStore(state => state.setViewRangeSteps)
    // const setView = useBoundStore(state => state.setView)
    const setMidiLearnMode = useBoundStore(state => state.setMidiLearnMode)
    const midiLearnMode = useBoundStore(state => state.midiLearnMode)

    // const envelope: Envelope | undefined = (sequence.currentEnvelopeId && sequence.currentEnvelopeId !== "notes")
    //     ? getEnvelopeById(sequence, sequence.currentEnvelopeId)
    //     : undefined

    const user = useContext(UserContext);
    // console.log(`user ${user && (user as any).id}`);
    // console.log(`user ${JSON.stringify(user)}`)
    // const app = new Realm.App({id: "powermad-hsulz"});
    const sequenceCanvasRef = useRef<HTMLCanvasElement>(null)
    const inputMidiChart = useRef<MidiChart>()
    const outputMidiChart = useRef<MidiChart>()
    const midiLearnModeRef = useRef<Boolean>(midiLearnMode)
    // const [waitForEnvelopeController, setWaitForEnvelopeController] = useState<ControllerInfo | null>(null)

    const [activeNotes, setActiveNotes] = useState<Array<number>>([])
    // const currentPanelId = useState<string>(sequence.currentPanelId)
    // const activeNotesRef = useRef(activeNotes)

    useEffect(() => {
        console.log(`activeNotes: useEffect ${JSON.stringify(activeNotes)}`)
        // activeNotesRef.current = activeNotes
    }, [activeNotes])

    useEffect(() => {
        midiLearnModeRef.current = midiLearnMode
        console.log(`sequence-view: midiLearn is now ${midiLearnModeRef.current}`)
    }, [midiLearnMode])

    useEffect(() => {
        console.count(`useEffect(sequence-view): []`);
        const element = document.querySelector('div')
        console.dir(element)
    }, [])

    // useEffect(() => {
    //     console.count(`useEffect(sequence-view): [sequence.currentEnvelopeId] ${sequence.currentEnvelopeId}`);
    //     // selectEnvelope(sequence.currentEnvelopeId)
    // }, [sequence.currentEnvelopeId]);

    // useEffect(() => {
    //     console.count(`useEffect(sequence-view): [sequence]`);
    //     sequenceRef.current = sequence
    //     selectEnvelope(sequence.currentEnvelopeId)
    // }, [sequence.currentEnvelopeId]);

    useEffect(() => {
        // console.count(`useEffect(sequence-view): [useBoundStore()]`);
        navigationInfoRef.current = navigationInfo
        // console.log(`useEffect: 📍navstore`);
    }, [useBoundStore()]);

    useEffect(() => {
        console.count(`useEffect(sequence-view): [sequence.midiSettings] ${JSON.stringify(sequence.midiSettings)}`);
        if (MidiChartDataService.midiCharts) {
            // stopMidiListeners()
            if (sequence.midiSettings) {
                outputMidiChart.current = findMidiChart(sequence.midiSettings.midiOutputDeviceName)
            }
            if (sequence.midiSettings) {
                inputMidiChart.current = findMidiChart(sequence.midiSettings.midiInputDeviceName)
            }
            startMidiListeners()
        }
    }, [sequence.midiSettings])

    useEffect(() => {
        startMidiListeners()

        return () => {
            stopMidiListeners()
        }
    }, [])

    const stopMidiListeners = () => {
        console.log(`sequence-view.stopMidiListeners`)
        for (var inputNum = 0; inputNum < WebMidi.inputs.length; inputNum++) {
            WebMidi.inputs[inputNum].removeListener()
        }
    }

    const startMidiListeners = () => {
        // stopMidiListeners()
        console.log(`🎹sequence-view.startMidiListeners: sequence.midisettings: ${JSON.stringify(sequence.midiSettings)}`);

        // Start listening for cc's on the one input
        var inputNum = 0;
        const inputMidiChart: MidiChart | undefined = MidiChartDataService.midiCharts && sequence.midiSettings && findMidiChart(sequence.midiSettings.midiInputDeviceName)
        inputNum = 0;
        for (; inputNum < WebMidi.inputs.length; inputNum++) {
            console.log(`🎹sequence-view.startMidiListeners: Test input: <${WebMidi.inputs[inputNum].name}>`);
            if (WebMidi.inputs[inputNum].name === sequence.midiSettings.midiInputDeviceName) {
                console.log(`🎹sequence-view.startMidiListeners: Found: <${WebMidi.inputs[inputNum].name}> at input number ${inputNum}`);
                break;
            }
        }

        console.log(`🎹startMidiListeners: got input num ${inputNum} sequence.midiSettings.midiInputChannelNum ${sequence.midiSettings.midiInputChannelNum}`);
        const channels = sequence.midiSettings.midiInputChannelNum && sequence.midiSettings.midiInputChannelNum != -1 ? {channels: [sequence.midiSettings.midiInputChannelNum]} : undefined
        if (inputNum < WebMidi.inputs.length) {
            console.log(`🎹sequence-view.startMidiListeners: start 1 MIDI listener for inputnum ${inputNum}`);
            WebMidi.inputs[inputNum].addListener("controlchange", e => {
                console.log(`🎹sequence-view.startMidiListeners: cc ${e.channel} port ${e.port} ${(e.target as any).name}`);
                handleMidiControlChange(inputMidiChart, e);
            }, channels)
            WebMidi.inputs[inputNum].addListener("nrpn", e => {
                console.log(`🎹sequence-view.startMidiListeners: nrpn ${e.channel} port ${e.port} parameter ${e.parameter} ${e.parameterMsb}/${e.parameterLsb} ${(e.target as any).name}`);
            }, channels)
            WebMidi.inputs[inputNum].addListener("rpn", e => {
                console.log(`🎹sequence-view.startMidiListeners: rpn ${e.channel} port ${e.port} parameter ${e.parameter} ${e.parameterMsb}/${e.parameterLsb} ${(e.target as any).name}`);
            }, channels)

            // Just for monitoring active notes 
            WebMidi.inputs[inputNum].addListener("noteon", e => {
                // console.log(`activeNotes: add note ${e.message.dataBytes[0]} to ${JSON.stringify(activeNotesRef.current)}`)
                // var anotes = [...activeNotesRef.current, e.message.dataBytes[0]]
                // console.log(`activeNotes: now ${JSON.stringify(activeNotesRef.current)}`)
                setActiveNotes(anotes => [...anotes, e.message.dataBytes[0]])
            }, channels)
            WebMidi.inputs[inputNum].addListener("noteoff", e => {
                // console.log(`activeNotes: remove note ${e.message.dataBytes[0]} from ${JSON.stringify(activeNotes)}`)
                // setActiveNotes(activeNotesRef.current.filter(note => note !== e.message.dataBytes[0]))
                setActiveNotes(anotes => anotes.filter(note => note !== e.message.dataBytes[0]))
            }, channels)
       }
    }

    if (!MidiChartDataService.midiCharts) {
        return (<h2>Waiting for MIDI Charts</h2>)
    }

    // if (!routeParams.id || !sequence) {
    if (!sequence) {
        return (
            <div>
                <br/>
                No sequence selected
            </div>
        )
    }

    outputMidiChart.current = sequence.midiSettings && findMidiChart(sequence.midiSettings.midiOutputDeviceName)
    inputMidiChart.current = sequence.midiSettings && findMidiChart(sequence.midiSettings.midiInputDeviceName)
    // startMidiListeners()

    function updateGenres(genres: any) {
        console.log(`updateGenres ${JSON.stringify(updateGenres)}`)
        // sequence.genres = genres
    }

    const divisionOptions = [
        {value: 1, label: 'Whole'},
        {value: 2, label: 'Half'},
        {value: 4, label: 'Quarter'},
        {value: 8, label: 'Eighth'},
        {value: 16, label: 'Sixteenth'},
        {value: 32, label: '32nd'},
        {value: 64, label: '64th'},
    ]

    function getDivisionOption(divisionValue: any) {
        for (const divisionOption of divisionOptions) {
            if (divisionOption.value === divisionValue) {
                return divisionOption;
            }
        }
    }

    const handleNumSteps = (e: any) => {
        console.log(`SequenceView.handleNumSteps: ${e.target.value}`)
        const numSteps: number = e.target.value
        const sequence = sequenceRef.current
        // if (isCurrentEnvelopeUnlocked()) {
        //     // This means we are on an envelope and the envelope has its own length
        //     const envelope: Envelope = getCurrentEnvelope()
        //     const n64thsPerStep = 64 / sequence.division
        //     const length : number = envelope.length64ths
        //     setEnvelopeLength(envelope.id, length + n64thsPerStep)
        // } else {
            setNumSteps(numSteps)
        // }
        // TODO: try doing this from sequence store
        setViewRangeSteps(sequence, 0, numSteps)
    }

    // const handleLocked = (e: any) => {
    //     // console.log(`handleLocked: ${JSON.stringify(e.value)}`)
    //     if (envelope) {
    //         setEnvelopeLocked(envelope.id, !envelope.locked)
    //     }
    // }

    const handleDivisionChange = (e: any) => {
        console.log(`handleDivisionChange: ${JSON.stringify(e)}`)
        setDivision(e.value)
        setViewRangeSteps(sequence, 0, sequence.numSteps)
    }

    const handleText = (e: any) => {
        setText(e.currentTarget.textContent)
    }

    // function getCurrentEnvelope() : Envelope {
    //     const envelope: Envelope | undefined = sequence.envelopes.find(envelope => envelope.id === sequence.currentEnvelopeId)
    //     if (!envelope) {
    //         throw Error(`getCurrentEnvelope: Current envelope <${sequence.currentEnvelopeId}> is undefined`)
    //     }
    //     return envelope
    // }

    // const isCurrentEnvelopeUnlocked = () : boolean => {
    //     if (sequence.currentEnvelopeId !== "notes" || midiLearnModeRef.current) {
    //         const envelope: Envelope = getCurrentEnvelope()
    //         return !envelope.locked
    //     }
    //     return  false
    // }

    const handleMidiControlChange = (midiChart: MidiChart | undefined, e: any) => {
        console.log(`handleMidiControlChange: hi: midiLearn (ref) is now ${midiLearnModeRef.current}`)

        if (midiLearnModeRef.current && midiChart) {
            const ccid = e.controller.number;

            if (ccid === midiChart.globalLsbCcNumber) {
                return;
            }

            const controllerInfo: ControllerInfo | undefined = midiChart.getMidiController(ccid);
            if (controllerInfo && controllerInfo.name === "IGNORE") {
                console.log(`🛎️handleMidiControlChange: MIDI learn - IGNORE`)
                return
            }

            console.log(`🛎️handleMidiControlChange: MIDI learn - cc - setMidiLearn false`)
            setMidiLearnMode(false)
            midiLearnModeRef.current = false
            const controller: ControllerInfo = MidiDeviceDataService.getMidiCcInfo(midiChart, e.controller.number)
            var envelope : Envelope | null = findEnvelope(sequence, ccid)
            if (envelope) {
                throw Error(`handleMidiControlChange: envelope already exists for controller ${ccid} / ${controller.name}`)
            }

            console.log(`handleMidiControlChange - Create envelope`)
            // console.log(`handleMidiControlChange - Create envelope - 1- envelopes ${JSON.stringify(sequence.envelopes)}`)
            createEnvelope(controller, e.rawValue)
        } else {
            console.log(`🛎️MIDI learn - not`)
            handleMidiControlChangeImp(midiChart, e)
        }
    }

    const handleMidiControlChangeImp = (midiChart: MidiChart | undefined, e: any) => {

        // TODO: Generic MIDI chart
        if (!midiChart) {
            return
        }

        // console.log(`handleMidiControlChangeImp: midiChart ${JSON.stringify(midiChart)}`)
        console.log(`cc ${e.controller.name}/${e.controller.number}/${e.rawValue} port ${e.port.name}`)
        const ccid = e.controller.number;
        const controller:ControllerInfo = MidiDeviceDataService.getMidiCcInfo(midiChart, e.controller.number)
        var envelope = findEnvelope(sequence, ccid)
        // console.log(`handleMidiControlChangeImp: envelope: ${JSON.stringify(envelope)}`)
        // console.log(`handleMidiControlChangeImp: midiChart: ${JSON.stringify(midiChart)}`)
        // console.log(`handleMidiControlChangeImp: returned ${JSON.stringify(controller)}`)
        if (controller) {
            // cc is mapped for this input device
            console.log(`handleMidiControlChangeImp: 1 ccid ${ccid} currentEnvelopeId ${sequence.currentEnvelopeId}`)
            if (sequence.currentEnvelopeId === "notes") {
                console.log(`handleMidiControlChangeImp: do nothing`)
                // do nothing
            } else {
                console.log(`handleMidiControlChangeImp: edit first point`)
                // We know the envelope exists - edit the first point
                // console.log(`6 - lets find envelope for ${currentEnvelopeId} in ${JSON.stringify(sequence)}`)
                // envelope = sequence.envelopes[currentEnvelopeId]
                if (ccid === controller.ccMsb) {
                    console.log(`handleMidiControlChangeImp: 7 - ccid ${ccid} envelope <${JSON.stringify(envelope)}>`)
                    console.log(`got msb ${e.rawValue}, controller.max ${controller.max} from ${JSON.stringify(controller)}`)
                    const value = e.rawValue * ((controller.max + 1) / 128)
                    setEnvelopeValue(sequence.currentEnvelopeId, ccid, value)
                }
            }
        } else {
            console.log(`unsupported controller`)
        }
    }

    return (
        <UserContext.Provider value={user}>
            {/* <Floater/> */}
            <div>
                <MidiSelector/>
                <div className='sequence-grid-container'>
                    {sequence.currentPanelId === "ARP" ?
                        (<NotesBar/>) :
                        (<EnvelopeBar/>)
                    }
                    {/* <PanelSelector sequence={sequence} envelopeId={sequence.currentEnvelopeId}/> */}
                    <PanelSelector/>
                    {/* <Navigation sequence={sequence} envelopeId={sequence.currentEnvelopeId}/> */}
                    {/* {sequence.currentEnvelopeId === "notes" ?
                        (<SequenceCanvas ref={sequenceCanvasRef} width="780" height="300"/>) :
                        <EnvelopeCanvas ref={sequenceCanvasRef} width="780" height="300"/>
                    } */}

                    {sequence.currentPanelId === "ARP" &&
                        (<SequenceCanvas ref={sequenceCanvasRef} width="780" height="300"/>)
                    }
                    {sequence.currentPanelId === "SEQ" &&
                        <EnvelopeCanvas ref={sequenceCanvasRef} width="780" height="300"/>
                    }
                    {sequence.currentPanelId === "ENV" &&
                        <EnvelopeCanvas ref={sequenceCanvasRef} width="780" height="300"/>
                    }

                    { sequence.stepFilters.map(entry => {
                        console.log(`stepfilters entry ${JSON.stringify(entry)}`)
                        if (entry.typeId == "pulse-count") {
                            return (<PulseCountLane entry={entry} key={entry.instanceId}/>)
                        } else if (entry.typeId === "probability") {
                            return (<ProbabilityLane entry={entry} key={entry.instanceId}/>)
                        }
                        else {
                            return (<SkipFilterLane entry={entry} key={entry.instanceId}/>)
                        }
                    })}
                    <FilterTypeList/>
                    <EnvelopeList onSetLearn={(on: boolean) => { setMidiLearnMode(on); console.log(`midi learn`) }}/>
                    {midiLearnMode && <h2 className="filter-type-list">Waiting for Midi input ...</h2>}
                    <Transport/>
                    <SequencePanel></SequencePanel>
                    {sequence.stepFilters.map(entry => {
                        console.log(`stepfilters entry ${JSON.stringify(entry)}`)
                        return (<LaneController entry={entry} key={entry.instanceId}/>)
                    })}
                    <RandomizePanel presetAddress={sequence.randomizerPresetAddress}/>
                </div>
                <div>
                    <strong>Genres: </strong>
                    <span suppressContentEditableWarning={true} contentEditable="true"
                          onBlur={event => handleText(event) }>
                        {sequence.text}
                    </span>
                    <StringList onUpdateList={(e: any) => updateGenres(e)}></StringList>
                </div>
                { sequence.viewSettings.monitorKeyboardVisible ? (
                    <KeyboardMonitor
                        onPlayNoteInput={(notenum) => {
                            SongPlayer.addNote(sequence._id, new MidiNote(notenum, 100))
                            // setActiveNotes(songPlayer.getActiveNotes())
                            setActiveNotes([...activeNotes, notenum])
                        }}
                        onStopNoteInput={(notenum) => {
                            if (activeNotes.includes(notenum)) {
                                SongPlayer.removeNote(sequence._id, new MidiNote(notenum, 100))
                                // setActiveNotes(songPlayer.getActiveNotes())
                                setActiveNotes(activeNotes.filter(note => note !== notenum))
                            }
                        }}
                        activeNotes={activeNotes}
                    />
                ) : (
                    <>
                        <button className="menu-button zen-mode-transition" type="button" title="cut in half" onClick={() => { setViewSettings({ ...sequence.viewSettings, monitorKeyboardVisible: !sequence.viewSettings.monitorKeyboardVisible})}}>
                            <svg fill="#000000" viewBox="12 12 500 500">
                                {/* <g> */}
                                    <path d="M492.44,112.521H19.56C8.572,112.521,0,121.358,0,132.347v111.04c0,9.822,7.144,17.962,15.479,19.583v123.316
                                        c0,7.326,6.605,13.194,13.93,13.194h82.677h95.943h95.943h95.943h82.677c7.326,0,13.93-5.868,13.93-13.194V262.969
                                        c8.335-1.622,15.479-9.761,15.479-19.583v-111.04C512,121.358,503.428,112.521,492.44,112.521z M100.019,373.284H42.865V164.912
                                        h30.958v127.006c0,10.988,8.705,20.641,19.693,20.641h6.502V373.284z M195.274,373.284h-69.06v-60.726h4.443
                                        c10.988,0,20.562-9.653,20.562-20.641V164.912h19.051v127.006c0,10.988,8.2,20.641,19.189,20.641h5.815V373.284z M290.53,373.284
                                        h-69.06v-60.726h5.128c10.989,0,19.876-9.653,19.876-20.641V164.912h19.051v127.006c0,10.988,8.887,20.641,19.876,20.641h5.128
                                        V373.284z M385.786,373.284h-69.06v-60.726h5.815c10.988,0,19.189-9.653,19.189-20.641V164.912h19.051v127.006
                                        c0,10.988,9.574,20.641,20.562,20.641h4.443V373.284z M469.135,373.284h-57.154v-60.726h6.502
                                        c10.989,0,19.693-9.653,19.693-20.641V164.912h30.958V373.284z"/>
                                {/* </g> */}
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </UserContext.Provider>
    );
}

function SequenceView() {

    const loadSequence = useSequenceStore(state => state.loadSequence)
    // const sequence = useSequenceStore(state => state.sequence)

    const routeParams = useParams();
    console.log(JSON.stringify(routeParams))
    const [loading, setLoading] = useState(true)

    const setView = useBoundStore(state => state.setView)

    useEffect(() => {
        console.count(`useEffect(sequence-view): [routeParams.id] = ${routeParams.id}`)
        const getSequence = (id: any) => {
            console.log(`useEffect/sequence-view from routeParams: id ${id}`)
            axios.get(`http://localhost:8080/sequence/${id}`)
            .then(response => {
                console.log(`received response data ${JSON.stringify(response.data)}`)
                setLoading(false)
                // console.log(`SequenceView: getter from useEffect.getSequence -> ${JSON.stringify(response.data)}`)
                loadSequence(response.data)
                const sequence: Sequence = useSequenceStore.getState().sequence

                const kludgeStartStep = 0
                const startSixtyfourths = Math.round(kludgeStartStep * 64 / sequence.division)
                const endSixtyfourths = Math.round((kludgeStartStep + sequence.numSteps) * 64 / sequence.division)
                setView(0, 0, startSixtyfourths, endSixtyfourths)

                MidiService.sendCurrentProgramDataDump(sequence)
                const numSteps = sequence.numSteps
            }).catch(e => {
                console.error(e);
            })

            // SequenceDataService.get(id)
            //     .then(response => {
            //         setLoading(false)
            //         // console.log(`SequenceView: getter from useEffect.getSequence -> ${JSON.stringify(response.data)}`)
            //         loadSequence(response.data)
            //         const sequence: Sequence = useSequenceStore.getState().sequence

            //         const kludgeStartStep = 0
            //         const startSixtyfourths = Math.round(kludgeStartStep * 64 / sequence.division)
            //         const endSixtyfourths = Math.round((kludgeStartStep + sequence.numSteps) * 64 / sequence.division)
            //         setView(0, 0, startSixtyfourths, endSixtyfourths)

            //         MidiService.sendCurrentProgramDataDump(sequence)
            //         const numSteps = sequence.numSteps
            //         // setViewRangeSteps(sequence,0, numSteps)
            //     })
            //     .catch(e => {
            //         console.error(e);
            //     });
        }

        if (routeParams.id) {
            getSequence(routeParams.id);
        } else {
            const sequence: Sequence = useSequenceStore.getState().sequence
            console.log(`sequence with no id is ${JSON.stringify(sequence)}`)
            // setViewRangeSteps(sequence,0, sequence.numSteps)
        }
    }, [routeParams.id]);

    // useEffect(() => {
    //     setLoading(false)
    // }, [sequence])

    console.log(`sequence-view - lets render. loading? ${loading}`)

    return (
        <div>
            <div>
                {loading === false ? (
                    <SequenceInternal/>
                ) : (
                    <div>Loading ...</div>
                )
                }
            </div>
        </div>
    )
}

export default SequenceView;
