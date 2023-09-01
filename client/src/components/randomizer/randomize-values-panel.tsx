import React, {useState} from 'react'
import {Sequence, Preset} from "../../player/sequence";
import {useSequenceStore} from "../../app/state/sequence-store"

type RandomizeValuesPanelProps = {
    panelId: string;
    values: Array<number>;
    strength: number;
    mirror: number;
    onEditValues: (values: Array<number>, panelId: string) => void;
    onEditStrength?: (strength: number, panelId: string) => void | undefined;
    onEditMirror?: (mirror: number, panelId: string) => void | undefined;
}

const RandomizeValuesPanel = (props: RandomizeValuesPanelProps) => {
    const sequence: Sequence = useSequenceStore(state => state.sequence)
    const onEditValues = props.onEditValues
    const onEditStrength = props.onEditStrength
    const onEditMirror = props.onEditMirror
    // console.log(`RandomizeValuesPanel: props: ${JSON.stringify(props)} sequence.viewSettings.randomizerPanel = ${sequence.viewSettings.randomizerPanel}`)

    const [values, setValues] = useState<Array<number>>(props.values)
    const [strength, setStrength] = useState<number>(props.strength)
    const [mirror, setMirror] = useState<number>(props.mirror)

    const setValue = (index: number, value: number, panelId: string) => {
        // console.log(`RandomizeValuesPanel.setValue: index ${index} value ${value}`)
        var newValues = [...values]
        newValues[index] = value
        setValues(newValues)
        onEditValues(newValues, panelId)
    }

    const updateStrength = (strength: number, panelId: string) => {
        console.log(`RandomizeValuesPanel.updateStrength: strength ${strength} value ${panelId}`)
        if (onEditStrength) {
            setStrength(strength)
            onEditStrength(strength, panelId)
        }
    }

    const updateMirror = (mirror: number, panelId: string) => {
        console.log(`RandomizeValuesPanel.updateMirror: mirror ${mirror} value ${panelId}`)
        if (onEditMirror) {
            setMirror(mirror)
            onEditMirror(mirror, panelId)
        }
    }

    if (values && sequence.viewSettings.randomizerPanel == props.panelId) {
        return (
            <div className='randomize-inner-panel'>
                {values.map((v, i) => { 
                    return (
                        <div key={`item${i}`}>
                            <div className="grid">
                                <input type="range" className="grid-overlay superslider" value={v} onChange={(e) => {setValue(i, e.target.valueAsNumber, props.panelId)}}>
                                </input>
                                <div className='grid-overlay supervalue'>
                                    {v}
                                </div>
                            </div>
                        </div>
                    )
                })}
            {((onEditStrength || onEditMirror) &&     
                <div className='Island randomize-settings-panel Stack-vertical'>                    
                    {(onEditStrength && 
                    <>
                        <div className='Stack-horizontal'>
                            <strong>Strength</strong>
                            {Math.floor(props.strength * 100)}
                        </div>
                        <div className="strength-slider">
                            <input type="range" className="strength-slider" value={props.strength * 100} onChange={(e) => {updateStrength(e.target.valueAsNumber / 100, props.panelId)}}>
                            </input>
                            <div className='supervalue'>
                                {props.strength}
                            </div>
                        </div>
                    </>)}
                    {(onEditMirror && 
                    <>
                        <div className='Stack-horizontal'>
                            <strong>Mirror</strong>
                            {Math.floor(props.mirror * 100)}
                        </div>
                        <div className="strength-slider">
                            <input type="range" className="strength-slider" value={props.mirror * 100} onChange={(e) => {updateMirror(e.target.valueAsNumber / 100, props.panelId)}}>
                            </input>
                            <div className='supervalue'>
                                {props.mirror}
                            </div>
                        </div>
                    </>)}
                </div>
            )}
            </div>
        )
    }

    return (<></>)
}

export default RandomizeValuesPanel

