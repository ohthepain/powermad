import React, { useState } from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import {useSequenceStore} from "../../app/state/sequence-store";
 import {Preset, PresetAddress} from "../../player/sequence"

const FilterTypeList = (props: any) => {

    const sequence = useSequenceStore(state => state.sequence)
    const updatePreset = useSequenceStore(state => state.updatePreset)
    const addFilter = useSequenceStore(state => state.addFilter)

    const [values, setValues] = useState(['pulse-count', 'gate-type', 'skip', 'probability'])

    const tapItem = (e: any) => {
        const typeId = e
        // console.log(`tap step lane type <${JSON.stringify(e)}> ${JSON.stringify(sequence)}`)
        var preset = new Preset(crypto.randomUUID(), 'filter type list', {
            steps: new Array(sequence.numSteps).fill(1)
        })

        const presetAddress = new PresetAddress('localpack', typeId, preset.id)
        updatePreset(presetAddress, preset)
        const instanceId = crypto.randomUUID()
        addFilter(typeId, presetAddress, instanceId)
    }

    return (
        <div className="filter-type-list">
            {values.map(filtertype => {
                return (
                    <div className="flexbox-item genre" key={filtertype}>
                        <button onClick={() => tapItem(filtertype)}><FontAwesomeIcon icon={faPlus}/> {filtertype}</button>
                    </div>
                )
            })}
        </div>
    );
}

export default FilterTypeList;
