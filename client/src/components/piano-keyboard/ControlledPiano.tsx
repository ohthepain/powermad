import React, { useEffect, useState } from 'react';
// import difference from 'lodash';
import Keyboard from './Keyboard';
import './styles.css'

type ControlledPianoProps = {
    noteRange: any,
    activeNotes: Array<number>,
    playNote: (n: number) => void,
    stopNote: (n: number) => void,
    onPlayNoteInput: (n: number) => void,
    onStopNoteInput: (n: number) => void,
    renderNoteLabel: boolean,
    className: string,
    disabled: boolean,
    width: number,
    keyWidthToHeight: number,
    // keyboardShortcuts: PropTypes.arrayOf(
    //   PropTypes.shape({
    //     key: PropTypes.string.isRequired,
    //     midiNumber: PropTypes.number.isRequired,
    //   }),
    // ),
  };

const ControlledPiano = (props: ControlledPianoProps) => {

//   static defaultProps = {
//     renderNoteLabel: ({ keyboardShortcut, midiNumber, isActive, isAccidental }) =>
//       keyboardShortcut ? (
//         <div
//           className={classNames('ReactPiano__NoteLabel', {
//             'ReactPiano__NoteLabel--active': isActive,
//             'ReactPiano__NoteLabel--accidental': isAccidental,
//             'ReactPiano__NoteLabel--natural': !isAccidental,
//           })}
//         >
//           {keyboardShortcut}
//         </div>
//       ) : null,
//   };

    const [isMouseDown, setIsMouseDown] = useState(false)
    const [useTouchEvents, setUseTouchEvents] = useState(false)

    useEffect(() => {
        // window.addEventListener('keydown', onKeyDown);
        // window.addEventListener('keyup', onKeyUp);

        return () => {
            // window.removeEventListener('keydown', onKeyDown);
            // window.removeEventListener('keyup', onKeyUp);
        }
    }, [])

    // const componentDidUpdate = (prevProps, prevState) => {
        // if (props.activeNotes !== prevProps.activeNotes) {
        //     handleNoteChanges({
        //         prevActiveNotes: prevProps.activeNotes || [],
        //         nextActiveNotes: props.activeNotes || [],
        //     });
        // }
    // }

    // This function is responsible for diff'ing activeNotes
    // and playing or stopping notes accordingly.
    // const handleNoteChanges = (prevActiveNotes: Array<number>, nextActiveNotes: Array<number>) => {
    //     if (props.disabled) {
    //         return;
    //     }
    //     const notesStopped = difference(prevActiveNotes, nextActiveNotes);
    //     const notesStarted = difference(nextActiveNotes, prevActiveNotes);
    //     notesStarted.forEach((midiNumber: number) => {
    //         props.playNote(midiNumber);
    //     });
    //     notesStopped.forEach((midiNumber: number) => {
    //         props.stopNote(midiNumber);
    //     });
    // };

    // getMidiNumberForKey = (key) => {
    //     if (!props.keyboardShortcuts) {
    //         return null;
    //     }
    //     const shortcut = props.keyboardShortcuts.find((sh) => sh.key === key);
    //     return shortcut && shortcut.midiNumber;
    // };

    // getKeyForMidiNumber = (midiNumber) => {
    //     if (!props.keyboardShortcuts) {
    //         return null;
    //     }
    //     const shortcut = props.keyboardShortcuts.find((sh) => sh.midiNumber === midiNumber);
    //     return shortcut && shortcut.key;
    // };

    // onKeyDown = (event) => {
    //     // Don't conflict with existing combinations like ctrl + t
    //     if (event.ctrlKey || event.metaKey || event.shiftKey) {
    //         return;
    //     }
    //     const midiNumber = getMidiNumberForKey(event.key);
    //     if (midiNumber) {
    //         onPlayNoteInput(midiNumber);
    //     }
    // };

    // onKeyUp = (event) => {
    //     // This *should* also check for event.ctrlKey || event.metaKey || event.ShiftKey like onKeyDown does,
    //     // but at least on Mac Chrome, when mashing down many alphanumeric keystrokes at once,
    //     // ctrlKey is fired unexpectedly, which would cause onStopNote to NOT be fired, which causes problematic
    //     // lingering notes. Since it's fairly safe to call onStopNote even when not necessary,
    //     // the ctrl/meta/shift check is removed to fix that issue.
    //     const midiNumber = getMidiNumberForKey(event.key);
    //     if (midiNumber) {
    //         onStopNoteInput(midiNumber);
    //     }
    // };

    const onPlayNoteInput = (midiNumber: number) => {
        if (props.disabled) {
            return;
        }
        // Pass in previous activeNotes for recording functionality
        props.onPlayNoteInput(midiNumber);
    };

    const onStopNoteInput = (midiNumber: number) => {
        if (props.disabled) {
            return;
        }
        // Pass in previous activeNotes for recording functionality
        props.onStopNoteInput(midiNumber);
    };

    const onMouseDown = (e: any) => {
        setIsMouseDown(true)
    };

    const onMouseUp = (e: any) => {
        setIsMouseDown(false)
    };

    const onTouchStart = () => {
        setUseTouchEvents(true)
    };

    // renderNoteLabel = ({ midiNumber, isActive, isAccidental }) => {
    // const keyboardShortcut = getKeyForMidiNumber(midiNumber);
    // return props.renderNoteLabel({ keyboardShortcut, midiNumber, isActive, isAccidental });
    // };

    return (
        <div
            // style={{ width: '100%', height: '100%' }}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            data-testid="container"
        >
            <Keyboard
                noteRange={{first: 60, last: 72}}
                onPlayNoteInput={onPlayNoteInput}
                onStopNoteInput={onStopNoteInput}
                activeNotes={props.activeNotes}
                disabled={props.disabled}
                enabledNotes={[true, true, true, true, true, true, true, true, true, true, true, true]}
                // width={props.width}
                keyWidthToHeight={props.keyWidthToHeight}
                gliss={isMouseDown}
                useTouchEvents={useTouchEvents}
                renderNoteLabel={props.renderNoteLabel}
            />
        </div>
    );
}

export default ControlledPiano;
