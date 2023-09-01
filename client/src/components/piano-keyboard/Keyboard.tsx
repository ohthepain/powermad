import React from 'react';
import {useMeasure} from "react-use"
import Key from './Key';
import MidiNumbers from './MidiNumbers';
import './styles.css'

type KeyboardProps = {
    // className: string,
    noteRange: any,
    activeNotes: Array<number>,
    onPlayNoteInput?: (note: number) => void,
    onStopNoteInput?: (note: number) => void,
    // isNoteEnabled?: (note: number) => boolean,
    enabledNotes: Array<boolean>,
    renderNoteLabel: boolean,
    keyWidthToHeight: number,
    disabled: boolean,
    gliss: boolean,
    useTouchEvents: boolean,
    // If width is not provided, must have fixed width and height in parent container
    // width: number,
};

const Keyboard = (props: KeyboardProps) => {

    console.log(`Keyboard: enabled notes : ${JSON.stringify(props.enabledNotes)}`)

    const [myRef, { width, height }] = useMeasure<HTMLDivElement>();

    var midiNoteNumbers = new Array<number>
    for (var notenum=props.noteRange.first; notenum <= props.noteRange.last; notenum++) {
        midiNoteNumbers.push(notenum)
    }

    function getNaturalKeyCount() {
        return midiNoteNumbers.filter((number) => {
            const { isAccidental } = MidiNumbers.getAttributes(number);
            return !isAccidental;
        }).length;
    }

    // Returns a ratio between 0 and 1
    function getNaturalKeyWidth() {
        return 1 / getNaturalKeyCount();
    }

    const naturalKeyWidth = getNaturalKeyWidth();

    return (
        <div className="full-width full-height ReactPiano__Keyboard" ref={myRef}>
            {midiNoteNumbers.map((noteNum) => {
                const { note, isAccidental } = MidiNumbers.getAttributes(noteNum);
                return (
                    <Key
                        naturalKeyWidth={naturalKeyWidth}
                        midiNoteNumber={noteNum}
                        noteRange={props.noteRange}
                        active={!props.disabled && props.activeNotes.includes(noteNum + props.noteRange.first)}
                        accidental={isAccidental}
                        disabled={!props.enabledNotes[noteNum % 12]}
                        onPlayNoteInput={props.onPlayNoteInput}
                        onStopNoteInput={props.onStopNoteInput}
                        gliss={props.gliss}
                        useTouchEvents={props.useTouchEvents}
                        key={noteNum}
                    />
                );
            })}
        </div>
    )

    // function isNaturalMidiNumber(value: number) {
    //     if (typeof value !== 'number') {
    //         return false;
    //     }
    //     return MidiNumbers.NATURAL_MIDI_NUMBERS.includes(value);
    // }

    // function noteRangePropType(props: any, propName: string, componentName: string) {
    //     const { first, last } = props[propName];
    //     if (!first || !last) {
    //         return new Error(
    //             `Invalid prop ${propName} supplied to ${componentName}. ${propName} must be an object with .first and .last values.`,
    //         );
    //     }
    //     if (!isNaturalMidiNumber(first) || !isNaturalMidiNumber(last)) {
    //         return new Error(
    //             `Invalid prop ${propName} supplied to ${componentName}. ${propName} values must be valid MIDI numbers, and should not be accidentals (sharp or flat notes).`,
    //         );
    //     }
    //     if (first >= last) {
    //         return new Error(
    //             `Invalid prop ${propName} supplied to ${componentName}. ${propName}.first must be smaller than ${propName}.last.`,
    //         );
    //     }
}

export default Keyboard;
