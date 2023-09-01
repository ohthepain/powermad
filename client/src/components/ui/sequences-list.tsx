import React, { useState, useEffect } from "react"
import SequenceDataService from "../../services/sequence-service"
import {Link, useNavigate} from "react-router-dom"
import * as Realm from "realm-web"
import axios from "axios"
import {WebMidi, Input} from "webmidi"
import "../../services/tempo-service"
import '../../css/index.css'
import SongPlayer from "../../player/song-player"
import {useSequenceStore} from "../../app/state/sequence-store"
import {Sequence} from "../../player/sequence";
import MidiDeviceDataService, {MidiChart} from "../../services/device-service";
import MidiService from "../../services/midi-service"
import SequenceCard from "./sequence-card"
import { MidiNote } from '../../player/sequence-player'
import KeyboardMonitor from "../keyboard-monitor/keyboard-monitor"

const SequencesList = (props: any) => {
    const [sequences, setSequences] = useState([]);
    const [searchName, setSearchName] = useState("")
    const [searchZip, setSearchZip] = useState("");
    const [searchGenre, setSearchGenre] = useState("")
    const [genres, setGenres] = useState(["All Genres"]);
    const [searchTempoMin, setSearchTempoMin] = useState(50)
    const [searchTempoMax, setSearchTempoMax] = useState(250)
    const [searchHints, setSearchHints] = useState({})
    const [midiOutputDeviceId, setMidiOutputDeviceId] = useState("")
    const [midiOutputChannelNum, setMidiOutputChannelNum] = useState(0)
    const [monitorKeyboardVisible, setMonitorKeyboardVisible] = useState(false)
    // const [currentSequenceId, setCurrentSequenceId] = useState(undefined)

    const app = new Realm.App({ id: "powermad-hsulz" });

    const loadSequence = useSequenceStore(state => state.loadSequence)
    const navigate = useNavigate();

    // console.log(`useMidiMaps ${JSON.stringify(useMidiMaps())}`)

    useEffect(() => {
        retrieveSequences();
        retrieveGenres();
    }, []);

    useEffect(() => {
        console.log(`🎹transport init hook`)
        // document.addEventListener("keydown", handleKeyDown)
        startMidiListeners()

        return () => {
            console.log(`🎹transport shutdown hook`)
            stopMidiListeners()
            // document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    // useEffect(() => {
    //     console.log(`sequence midiSettings changed: ${JSON.stringify(sequence.midiSettings)}`)
    //     startMidiListeners()
    // }, [sequence.midiSettings])

    function updateGenres(genres: any) {
        setGenres(genres)
        console.log(`updateGenres: now ${JSON.stringify(genres)}`)
        retrieveSequences()
    }

    const createSequence = (e: any) => {
        console.log('createSequence');
        // console.log(`${JSON.stringify(app.currentUser)}`);
        var defaultSequence = {
            // _id: new ObjectID(),
            name: "New Sequence",
            midiSettings : { midiInputChannelNum:-1, midiRemoteChannelNum:-1, midiOutputChannelNum:0, midiInputDeviceId : "", midiRemoteDeviceId : "", midiOutputDeviceId : "", midiInputDeviceName : "omni", midiOutputDeviceName : "none"},
            genres: ["techno", "house"],
            // @ts-expect-error TS(2531): Object is possibly 'null'.
            user_name: app.currentUser.profile.email,
            // @ts-expect-error TS(2531): Object is possibly 'null'.
            user_id: app.currentUser.id,
            currentEnvelopeId: "notes",
            steps: [
                {note: 60, velocity: 100, gateLength: 0.5, },
                {note: 60, velocity: 100, gateLength: 0.5, },
                {note: 72, velocity: 100, gateLength: 0.5, },
            ],
            tempo: 120,
            length: 3,
            numSteps: 3,
            division: 8,
            reviews: [],
        };

        const sequence: Sequence = new Sequence(defaultSequence)
        console.log(`new sequence: ${JSON.stringify(sequence)}`)
        sequence.searchHints = searchHints
        // loadSequence(sequence)
        // console.log(`new sequence: ${JSON.stringify(useSequenceStore.getState().sequence)}`)
        // navigate("/sequence")

        axios.post(`http://localhost:8080/sequence`, sequence)
        .then(response => {
            console.log(`received response data ${JSON.stringify(response.data)}`)
            console.log(`received response sequences ${JSON.stringify(response.data.sequences)}`)
            const sequences = response.data.sequences
            setSequences(sequences)
            navigate(`/sequence/${response.data}`)
        })


        // SequenceDataService.createSequence(sequence)
        //     .then(response => {
        //         console.log(`Created sequence ${JSON.stringify(defaultSequence)}`);
        //         console.log(`new sequence id: ${JSON.stringify(response.data.insertedId)}`);
        //         // Navigate to new sequence
        //         // loadSequence(response.data)
        //         // MidiService.sendCurrentProgramDataDump(sequence);
        //         navigate(`/sequence/${response.data.insertedId}`)
        //     })
        //     .catch(e => {
        //         console.error(e);
        //     })
    }

    const onChangeSearchName = (e: any) => {
        setSearchName(e.target.value);
    }

    const onChangeSearchTempoMin = (e: any) => {
        setSearchTempoMin(e.target.value);
        setSearchTempoMax(Math.max(e.target.value, searchTempoMax));
    }

    const onChangeSearchTempoMax = (e: any) => {
        setSearchTempoMax(e.target.value);
        setSearchTempoMin(Math.min(e.target.value, searchTempoMin));
    }

    const onChangeSearchZip = (e: any) => {
        setSearchZip(e.target.value);
    }

    const onChangeSearchGenre = (e: any) => {
        setSearchGenre(e.target.value);
    };

    const onChangeMidiInputDeviceId = (e: any) => {
        console.log(`onChangeMidiInputDeviceId ${e.target.value}`)
        setMidiOutputDeviceId(e.target.value)
        startMidiListeners()
        // Get midi chart?
        // setSearchHints.deviceFamily = 
        // MidiService.setMidiInputDeviceId(e.target.value)
    }

    const onChangeMidiRemoteDeviceId = (e: any) => {
        console.log(`onChangeMidiRemoteDeviceId ${e.target.value}`)
        setMidiOutputDeviceId(e.target.value)
        startMidiListeners()
        // Get midi chart?
        // setSearchHints.deviceFamily = 
        // MidiService.setMidiRemoteDeviceId(e.target.value)
    }

    const onChangeMidiOutputDeviceId = (e: any) => {
        console.log(`onChangeMidiOutputDeviceId ${e.target.value}`)
        setMidiOutputDeviceId(e.target.value)
        const deviceId = e.target.value
        var midiChart: MidiChart | undefined = MidiDeviceDataService.getMidiChartForDeviceId(deviceId)
        if (midiChart) {
            console.log(`onChangeMidiOutputDeviceId: got midi chart ${midiChart.familyName}`)
            setSearchHints({...searchHints, deviceFamily: midiChart.familyName})
        } else {
            console.log(`onChangeMidiOutputDeviceId: no midi chart found`)
        }

        // Get midi chart
        // Get deviceFamily
        // MidiService.setMidiOutputDeviceId(e.target.value)
    }

    const onChangeMidiInputChannel = (e: any) => {
        console.log(`onChangeMidiInputChannel ${e.target.value}`)
        // MidiService.setMidiInputChannel(parseInt(e.target.value))
    }

    const onChangeMidiRemoteChannel = (e: any) => {
        console.log(`onChangeMidiRemoteChannel ${e.target.value}`)
        // MidiService.setMidiRemoteChannel(parseInt(e.target.value))
    }

    const onChangeMidiOutputChannel = (e: any) => {
        console.log(`onChangeMidiOutputChannel ${e.target.value}`)
        setMidiOutputChannelNum(e.target.value)
        // MidiService.setMidiOutputChannel(parseInt(e.target.value))
    }

    const retrieveSequences = () => {
        axios.get(`http://localhost:8080/sequences\?tempoMin\=${searchTempoMin}\&tempoMax\=${searchTempoMax}\&sequencesPerPage\=20\&page\=0`)
        .then(response => {
            console.log(`received response data ${response.data}`)
            console.log(`received response sequences ${response.data.sequences}`)
            const sequences = response.data.sequences
            setSequences(sequences)
        })

        // SequenceDataService.getAll(0, searchTempoMin, searchTempoMax)
        //     .then(response => {
        //         // console.log(`SequencesList.retrieveSequences : sequences ${JSON.stringify(response.data.sequences)}`);
        //         setSequences(response.data.sequences);
        //     })
        //     .catch(e => {
        //         console.log(e);
        //     });
    }

    const retrieveGenres = () => {
        SequenceDataService.getGenres()
            .then(response => {
                console.log(`SequencesList.retrieveGenres : response ${JSON.stringify(response.data)}`);
                setGenres(["All Genres"].concat(response.data));
            })
            .catch(e => {
                console.log(e);
            });
    }

    const refreshList = () => {
        retrieveSequences();
    }

    // const find = (query: any, by: any) => {
    //     console.log(`SequencesList.find by ${by} ${query} `)
    //     SequenceDataService.find(query, by)
    //         .then(response => {
    //             console.log(`SequencesList.find : sequences ${JSON.stringify(response.data.sequences)}`);
    //             setSequences(response.data.sequences);
    //         })
    //         .catch( e => {
    //             console.log(e);
    //         });
    // }

    // const findByName = (query: any) => {
    //     console.log('SequencesList.findByName')
    //     find(searchName, "name");
    // }

    // const findByZipcode = (query: any) => {
    //     find(searchZip, "zipcode");
    // }

    // const findByGenre = (query: any) => {
    //     console.log(`findByGenre ${searchGenre} query = ${query}`)
    //     if (searchGenre === "All Genres") {
    //         console.log(`findByGenre - All Genres`)
    //         return refreshList();
    //     } else {
    //         console.log(`findByGenre genre - query = ${query}`)
    //         return find(searchGenre, "genre");
    //     }
    // }

    const startSequence = (sequenceId: any) => {
        console.log(`sequences-list.startSequence - ${sequenceId.name}`)
        // const sequence = SequenceDataService.get(sequenceId)
        SongPlayer.startSequence(sequenceId, [60])
    }

    const handleMidiEvent = (e:any) => {
        console.log(`🎹handleMidiEvent - midiOutputDeviceId ${midiOutputDeviceId}`)
        // Be careful where you get state in these handlers
        if (e.message.type === "noteon") {
            const note = e.message.dataBytes[0]
            const velocity = e.message.dataBytes[1]
            if (SongPlayer.isPlaying) {
                SongPlayer.addNoteGlobal(new MidiNote(note, velocity))
            } else {
                // send note straight to output
                if (midiOutputDeviceId) {
                    console.log(`🎹handleMidiEvent: add note - straight to midiOutputDeviceId ${midiOutputDeviceId} midiOutputChannelNum ${midiOutputChannelNum}`)
                    MidiService.playNote({ midiOutputDeviceId: midiOutputDeviceId, midiOutputChannelNum: midiOutputChannelNum }, note, velocity / 127);
                }
            }
        } else if (e.message.type === "noteoff") {
            const note = e.message.dataBytes[0]
            const velocity = e.message.dataBytes[1]
            // if (currentSequenceId) {
            if (SongPlayer.isPlaying) {
                SongPlayer.removeNoteGlobal(new MidiNote(note, velocity))
            } else {
                if (midiOutputDeviceId) {
                    MidiService.playNote({ midiOutputDeviceId: midiOutputDeviceId, midiOutputChannelNum: midiOutputChannelNum }, note, 0);
                }
            }
        }
    }

    const startMidiListeners = () => {
        console.log(`🎹transport.startMidiListeners - midiDevicePreferences: ${JSON.stringify(MidiService.getMidiInputs())}`)
        stopMidiListeners()

        var toStart : Set<Input> = new Set<Input>()
        for (const midiInput of MidiService.getMidiInputs()) {
            console.log(`🎹startMidiListeners: add input device ${midiInput.label}`)
            toStart.add(midiInput)
            console.log(`🎹startMidiListeners - try input toStart: ${JSON.stringify(toStart)}`);
        }

        toStart.forEach((input: Input) => {
            console.log(`🎹from toStart set ${input.id}`)
        })

        var recordListeners: Array<any> = []
        for (var inputNum = 0; inputNum < WebMidi.inputs.length; inputNum++) {
            console.log(`🎹startMidiListeners: start input ${inputNum}`)
            var listeners = WebMidi.inputs[inputNum].addListener("noteon", handleMidiEvent);
            recordListeners.push(listeners)
            listeners = WebMidi.inputs[inputNum].addListener("noteoff", handleMidiEvent);
            recordListeners.push(listeners)
        }
    }

    const stopMidiListeners = () => {
        console.log(`🎹transport.stopMidiListeners`)
        for (const input of WebMidi.inputs) {
            input.removeListener(WebMidi.eventMap.midimessage, handleMidiEvent)
        }
    }
    
    return (
        <div>
            <div className="Island pl-2 pt-2 pb-2">
                <div className="row pb-2">
                    <div className="input-group col-lg-4">
                        MIDI In:
                        <select onChange={onChangeMidiInputDeviceId}>
                            <option value={""}> {"All MIDI devices"} </option>
                            {WebMidi.inputs.map(input => {
                                return (
                                    <option value={input.id} key={input.id}> {input.name.substring(0, 40)} </option>
                                )
                            })}
                        </select>
                        <select onChange={onChangeMidiInputChannel}>
                            <option value={""}> {"All channels"} </option>
                            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => {
                                return (
                                    <option key={n} value={n}> {n} </option>
                                )
                            })}
                        </select>
                    </div>
                </div>
                <div className="row pb-1">
                    <div className="input-group col-lg-4">
                        MIDI Out:
                        <select onChange={onChangeMidiOutputDeviceId}>
                            <option value={""}> {"No MIDI device"} </option>
                            {WebMidi.outputs.map(output => {
                                return (
                                    <option key={output.id} value={output.id}> {output.name.substring(0, 40)} </option>
                                )
                            })}
                        </select>
                        <select onChange={onChangeMidiOutputChannel}>
                            <option value={""}> {"All channels"} </option>
                            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => {
                                return (
                                    <option key={n} value={n}> {n} </option>
                                )
                            })}
                        </select>
                    </div>
                </div>
            </div>
            <div className="flexbox-column Island pt-2 pl-2">
                <div className="flexbox-row pb-1">
                    <span className="flexbox-item">Device</span>
                    <select onChange={onChangeMidiInputDeviceId}>
                        {/* <option value={""}> {"All MIDI devices"} </option> */}
                        {["Minilogue / Minilogue XD"].map(input => {
                            return (
                                <option value={input} key={input}> {input.substring(0, 40)} </option>
                            )
                        })}
                    </select>
                </div>
                <div className="flexbox-row pb-1">
                    <div className="flexbox-item"><p>Tempo</p></div>
                    <div className="flexbox-item"><input type="number" value={searchTempoMin} onChange={onChangeSearchTempoMin} onBlur={refreshList}></input></div>
                    <div className="flexbox-item"><input type="range" className="form-range" id="searchTempoMin" min="20" max="250" value={searchTempoMin} onChange={onChangeSearchTempoMin} onMouseUp={refreshList}></input></div>
                    <div className="flexbox-item">to</div>
                    <div className="flexbox-item"><input type="range" className="form-range" id="searchTempoMax" min="20" max="250" value={searchTempoMax} onChange={onChangeSearchTempoMax} onMouseUp={refreshList}></input></div>
                    <div className="flexbox-item"><input type="number" value={searchTempoMax} onChange={onChangeSearchTempoMax} onBlur={refreshList}></input></div>
                </div>
                {/* <StringList onUpdateList={(e: any) => updateGenres(e)}></StringList> */}
                <div className="row pb-1">
                {/* <div className="input-group col-lg-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name"
                        value={searchName}
                        onChange={onChangeSearchName}
                    />
                    <div className="input-group-append">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={findByName}
                        >
                            Search
                        </button>
                    </div>
                </div> */}
                <div className="input-group col-lg-4">
                    {/* <select onChange={onChangeSearchGenre}>
                        {genres.map(genre => {
                            return (
                                <option key={genre} value={genre}> {genre.substring(0, 20)} </option>
                            )
                        })}
                    </select> */}
                    {/* <div className="input-group-append">
                        <button onClick={findByGenre} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Search
                        </button>
                    </div> */}
                </div>
            </div>
                {/* <div className="input-group col-lg-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by zipcode"
                        value={searchZip}
                        onChange={onChangeSearchZip}
                    />
                    <div className="input-group-append">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={findByZipcode}
                        >
                            Search
                        </button>
                    </div>
                </div> */}

            </div>
            <div className="flexbox-row">
                <button className="menu-button zen-mode-transition" type="button" title="New Sequence" onClick={createSequence}>
                    <svg viewBox="0 0 16 16" fill="none">
                        <g fill="#000000">
                            <path fillRule="evenodd" d="M11.436 1.005A1.75 1.75 0 0113.902.79l.702.589a1.75 1.75 0 01.216 2.465l-5.704 6.798a4.75 4.75 0 01-1.497 1.187l-2.572 1.299a.75.75 0 01-1.056-.886l.833-2.759a4.75 4.75 0 01.908-1.68l5.704-6.798zm1.502.934a.25.25 0 00-.353.03l-.53.633 1.082.914.534-.636a.25.25 0 00-.031-.352l-.703-.59zm-.765 2.726l-1.082-.914-4.21 5.016a3.25 3.25 0 00-.621 1.15L5.933 11l1.01-.51a3.249 3.249 0 001.024-.812l4.206-5.013z" clipRule="evenodd"/>
                            <path d="M3.25 3.5a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h9.5a.75.75 0 00.75-.75V9A.75.75 0 0115 9v4.75A2.25 2.25 0 0112.75 16h-9.5A2.25 2.25 0 011 13.75v-9.5A2.25 2.25 0 013.25 2H6a.75.75 0 010 1.5H3.25z"/>
                        </g>
                    </svg>
                </button>

                { monitorKeyboardVisible ? (
                    <KeyboardMonitor
                        onPlayNoteInput={(notenum) => {
                            // SongPlayer.addNote(sequence._id, new MidiNote(notenum, 100))
                            // // setActiveNotes(songPlayer.getActiveNotes())
                            // setActiveNotes([...activeNotes, notenum])
                        }}
                        onStopNoteInput={(notenum) => {
                            // if (activeNotes.includes(notenum)) {
                            //     SongPlayer.removeNote(sequence._id, new MidiNote(notenum, 100))
                            //     // setActiveNotes(songPlayer.getActiveNotes())
                            //     setActiveNotes(activeNotes.filter(note => note !== notenum))
                            // }
                        }}
                        // activeNotes={activeNotes}
                    />
                ) : (
                    <>
                        <button className="menu-button zen-mode-transition" type="button" title="cut in half" onClick={() => { 
                            setMonitorKeyboardVisible(!monitorKeyboardVisible)
                        }}>
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
            <div className="grid-container">
                {sequences.map(sequence => {
                    return (<div className="Island" key={(sequence as any)._id}>
                            <SequenceCard sequence={new Sequence(sequence)} />
                        </div>);
                })}
            </div>
        </div>
    );
};

export default SequencesList;
