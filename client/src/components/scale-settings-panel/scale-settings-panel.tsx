import React, {useMemo} from "react"
import {useSequenceStore} from "../../app/state/sequence-store"
import {ScaleSettings, getNoteOptions, getNoteOption, getScaleTypes, getScaleTypeOption} from "../../player/scales"
import Select from 'react-select'
import Keyboard from "../../components/piano-keyboard/Keyboard"

type ScaleSettingsProps = {
    scaleSettings: ScaleSettings
}

const ScaleSettingsPanel = (props: ScaleSettingsProps) => {

    const enableScaleNote = useSequenceStore(state => state.enableScaleNote)
    const setScaleSettings = useSequenceStore(state => state.setScaleSettings)

    const enabledNotes = useMemo(() => { return props.scaleSettings.getNoteList() }, [props.scaleSettings])

    const onChangeRoot = (item: any) => {
        console.log(`onChangeRoot ${JSON.stringify(item)}`)
        const newScaleSettings = new ScaleSettings({ scaleType: props.scaleSettings.scaleType, root: item.value, isCustom: false})
        console.log(`onChangeRoot: new scaleSettings ${JSON.stringify(newScaleSettings)}`)
        setScaleSettings(newScaleSettings)
    }

    const onChangeScaleType = (item: any) => {
        console.log(`onChangeScaleType ${JSON.stringify(item)}`)
        const newScaleSettings = new ScaleSettings({ scaleType: item.label, root: props.scaleSettings.root, isCustom: false})
        console.log(`onChangeScaleType: new scaleSettings ${JSON.stringify(newScaleSettings)}`)
        setScaleSettings(newScaleSettings)
    }

    const handlePlayNote = (notenum: number) => {
        console.log(`handlePlayNote ${notenum}`)
        enableScaleNote(notenum, !props.scaleSettings.isNoteInScale(notenum))
    }

    const handleStopNote = (notenum: number) => {
        // console.log(`handleStopNote ${notenum}`)
    }

    return (
        <div className="flexbox-column Island">
            <div className="flexbox-row">
                <div className="flexbox-item">Root</div>
                <div className="flexbox-item">
                    <Select options={getNoteOptions()}
                            styles={{
                                menu: (baseStyles, state) => ({
                                    ...baseStyles,
                                    // cover keyboard - it uses to z-index to put black keys on top of white
                                    zIndex: 2,
                                }),
                            }}
                            value={getNoteOption(props.scaleSettings.root)}
                            onChange={e => onChangeRoot(e!)}/>
                </div>
                <div className="flexbox-item">
                    <Select options={getScaleTypes()}
                            styles={{
                                menu: (baseStyles, state) => ({
                                    ...baseStyles,
                                    // cover keyboard - it uses to z-index to put black keys on top of white
                                    zIndex: 2,
                                }),
                            }}
                            value={getScaleTypeOption(props.scaleSettings.scaleType)}
                            onChange={e => onChangeScaleType(e!)}/>
                </div>
            </div>
                <div className='keyboard-container'>
                <Keyboard
                        noteRange={{ first: 60, last: 71 }}
                        // disabled={false}
                        onPlayNoteInput={(note: number) => {handlePlayNote(note)}}
                        onStopNoteInput={(note: number) => {handleStopNote(note)}}
                        activeNotes={[]}
                        disabled={false}
                        enabledNotes={enabledNotes}
                        // isNoteEnabled={(notenum) => {return scaleSettings.isNoteInScale(notenum)}}
                        keyWidthToHeight={0.33}
                        gliss={false}
                        useTouchEvents={false}
                        renderNoteLabel={false}
                        />
            </div>
        </div>
    )
}

export default ScaleSettingsPanel
