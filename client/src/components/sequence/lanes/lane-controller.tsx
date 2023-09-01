import React, {useEffect, useMemo, useState} from 'react'
import './lane-controller.css'
import {useSequenceStore} from "../../../app/state/sequence-store";
import {Sequence, Preset} from "../../../player/sequence";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrashCan, faCaretRight, faCaretDown} from "@fortawesome/free-solid-svg-icons";

export const LaneController = (props: any) => {

    const instanceId = props.entry.instanceId

    const sequence: Sequence = useSequenceStore(state => state.sequence)
    const deleteFilter = useSequenceStore(state => state.deleteFilter)

    const [expanded, setExpanded] = useState(false)

    const expand = () => {
        console.log(`expand ${instanceId}`)
        setExpanded(!expanded)
    }

    return (
        <>
            <div className="lane-controller">
                <div className="item">
                    <button title="delete lane" onClick={() => {deleteFilter(instanceId)}}>
                        <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                </div>
                <div className="item">{props.entry.typeId}</div>
                <div className="item">
                    <button title="expand" onClick={() => {expand()}}>
                        <FontAwesomeIcon icon={expanded ? faCaretDown : faCaretRight} />
                    </button>
                </div>
            </div>
        </>
    )
}
