import React, {useState} from 'react';
import ControlledPiano from './ControlledPiano';
import Keyboard from './Keyboard';
import './styles.css'

type PianoProps = {
    noteRange: any,
    activeNotes: Array<number>,
    playNote: (n: number) => void,
    stopNote: (n: number) => void,
    onPlayNoteInput: (n: number, activeNotes: Array<number>) => void,
    onStopNoteInput: (n: number, activeNotes: Array<number>) => void,
    renderNoteLabel: boolean,
    className: string,
    disabled: boolean,
    width: number,
    keyWidthToHeight: number,
}

const Piano = (props: PianoProps) => {

    const [activeNotes, setActiveNotes] = useState<Array<number>>([])

    // componentDidUpdate(prevProps) {
    //     if (
    //         prevProps.activeNotes !== props.activeNotes &&
    //         state.activeNotes !== props.activeNotes
    //     ) {
    //     setState({
    //         activeNotes: props.activeNotes || [],
    //     });
    //     }
    // }

    const handlePlayNoteInput = (midiNumber: number) => {
        if (activeNotes.includes(midiNumber)) {
            return null;
        }

        setActiveNotes([...activeNotes, midiNumber])

        props.onPlayNoteInput && props.onPlayNoteInput(midiNumber, activeNotes)
    };

    const handleStopNoteInput = (midiNumber: number) => {
        if (!activeNotes.includes(midiNumber)) {
            return null;
        }

        props.onStopNoteInput && props.onStopNoteInput(midiNumber, activeNotes)

        setActiveNotes(activeNotes.filter(note => midiNumber != note))
    };

    const { onPlayNoteInput, onStopNoteInput, ...otherProps } = props;
    return (
        <ControlledPiano
            // activeNotes={activeNotesProp}
            onPlayNoteInput={handlePlayNoteInput}
            onStopNoteInput={handleStopNoteInput}
            {...otherProps}
        />
    )
}

export default Piano;
