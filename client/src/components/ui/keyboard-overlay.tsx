import React, {useState} from "react"
// import Keyboard from "../piano-keyboard/Keyboard"
import KeyboardMonitor from "../keyboard-monitor/keyboard-monitor"
import SongPlayer from "../../player/song-player"
import { MidiNote } from "../../player/sequence-player"
import "../../css/index.css"
import { useBoundStore } from "../../app/state/bound-store"

const KeyboardOverlay = () => {

    const setCurrentSequenceId = useBoundStore(state => state.setCurrentSequenceId)
    const [currentSequenceId] = useState(useBoundStore(state => state.currentSequenceId))

    const [keyboardVisible, setKeyboardVisible] = useState(true)
    const [activeNotes, setActiveNotes] = useState<Array<number>>([])

    return (
        <div className="overlay Island">
        { keyboardVisible ? (
            <div className="flex flex-row">
                <div className="flex flex-column">
                    <button className="menu-button zen-mode-transition" type="button" title="cut in half" onClick={() => { 
                            setKeyboardVisible(!keyboardVisible)
                        }}>
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
                    </div>
                <div className="flex-1">
            <KeyboardMonitor
                onPlayNoteInput={(notenum) => {
                    SongPlayer.addNote(currentSequenceId, new MidiNote(notenum, 100))
                    setActiveNotes(SongPlayer.getActiveNotes())
                    setActiveNotes([...activeNotes, notenum])
                }}
                onStopNoteInput={(notenum) => {
                    // if (activeNotes.includes(notenum)) {
                        SongPlayer.removeNote(currentSequenceId, new MidiNote(notenum, 100))
                        setActiveNotes(SongPlayer.getActiveNotes())
                    //     setActiveNotes(activeNotes.filter(note => note !== notenum))
                    // }
                }}
                // activeNotes={activeNotes}
            />
            </div>
            </div>
        ) : (
            <>
                <button className="menu-button zen-mode-transition" type="button" title="cut in half" onClick={() => { 
                        setKeyboardVisible(!keyboardVisible)
                    }}>
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
            </>
        )}
        </div>
    )
}

export default KeyboardOverlay
