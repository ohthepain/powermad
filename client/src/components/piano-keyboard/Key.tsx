import React, {useState} from 'react'
import MidiNumbers from './MidiNumbers'
import classNames from 'classnames'
import './styles.css'

type KeyProps = {
    midiNoteNumber: number,
    noteRange: any,
    naturalKeyWidth: number, // Width as a ratio between 0 and 1
    gliss: boolean,
    useTouchEvents: boolean,
    accidental: boolean,
    active: boolean,
    disabled: boolean,
    onPlayNoteInput?: (note: number) => void,
    onStopNoteInput?: (note: number) => void,
    accidentalWidthRatio?: number,
    pitchPositions?: any,
    children?: React.ReactNode,
};

const Key = (props: KeyProps) => {

    const [accidentalWidthRatio] = useState(props.accidentalWidthRatio || 0.65)
    const [pitchPositions] = useState(props.pitchPositions || {
        C: 0,
        Db: 0.55,
        D: 1,
        Eb: 1.8,
        E: 2,
        F: 3,
        Gb: 3.5,
        G: 4,
        Ab: 4.7,
        A: 5,
        Bb: 5.85,
        B: 6,
    })

    // const onPlayNoteInput = () => {
    //     props?.onPlayNoteInput(props.midiNumber);
    // };

    // const onStopNoteInput = () => {
    //     props?.onStopNoteInput(props.midiNumber);
    // };

    // Key position is represented by the number of natural key widths from the left
    const getAbsoluteKeyPosition = (midiNumber: number) => {
        const OCTAVE_WIDTH = 7;
        const { octave, pitchName } = MidiNumbers.getAttributes(midiNumber);
        const pitchPosition = pitchPositions[pitchName];
        const octavePosition = OCTAVE_WIDTH * octave;
        return pitchPosition + octavePosition;
    }

    const getRelativeKeyPosition = (midiNumber: number) => {
        return (
            getAbsoluteKeyPosition(midiNumber) -
            getAbsoluteKeyPosition(props.noteRange.first)
        );
    }

    // console.log(`accidentalWidthRatio ${accidentalWidthRatio} ${ratioToPercentage(accidentalWidthRatio)} left ${ratioToPercentage(getRelativeKeyPosition(props.midiNumber) * props.naturalKeyWidth)}`)

    return (
        <div
            className={classNames({
                'ReactPiano__Key': true,
                'ReactPiano__Key--accidental': props.accidental,
                'ReactPiano__Key--natural': !props.accidental,
                'ReactPiano__Key--disabled': props.disabled,
                'ReactPiano__Key--active': props.active,
            })}
            style={{
                left: ratioToPercentage(getRelativeKeyPosition(props.midiNoteNumber) * props.naturalKeyWidth),
                width: ratioToPercentage(accidentalWidthRatio * props.naturalKeyWidth),
            }}
            onMouseDown={e => props.onPlayNoteInput && props.onPlayNoteInput(props.midiNoteNumber + props.noteRange.first)}
            onMouseUp={e => props.onStopNoteInput && props.onStopNoteInput(props.midiNoteNumber + props.noteRange.first)}
            onMouseEnter={e => { props.gliss && props.onPlayNoteInput && props.onPlayNoteInput(props.midiNoteNumber + props.noteRange.first) }}
            onMouseLeave={e => props.onStopNoteInput && props.onStopNoteInput(props.midiNoteNumber + props.noteRange.first)}
            onTouchStart={e => { props.useTouchEvents && props.onPlayNoteInput && props.onPlayNoteInput(props.midiNoteNumber + props.noteRange.first)}}
            onTouchCancel={e => {props.onStopNoteInput && props.onStopNoteInput(props.midiNoteNumber + props.noteRange.first)}}
            onTouchEnd={e => {props.onStopNoteInput && props.onStopNoteInput(props.midiNoteNumber + props.noteRange.first)}}
            >
            <div className="ReactPiano__NoteLabelContainer">{props.children}</div>
        </div>
    )
}

function ratioToPercentage(ratio: number) {
    return `${ratio * 100}%`;
}

export default Key;
