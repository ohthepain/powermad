import React, {useEffect, useState} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus, faMinus} from "@fortawesome/free-solid-svg-icons";
import {useSequenceStore} from "../../../app/state/sequence-store";
import {useBoundStore} from "../../../app/state/bound-store";
import { Envelope } from "../../../player/sequence";
import { getEnvelopeById } from "../../../util/sequence-util";

const EnvelopeList = (props: any) => {

    const sequence = useSequenceStore(state => state.sequence)
    const midiLearnMode = useBoundStore(state => state.midiLearnMode)
    const setCurrentEnvelopeId = useSequenceStore(state => state.setCurrentEnvelopeId)
    const setView = useBoundStore(state => state.setView)
    const setCurrentPanelId = useSequenceStore(state => state.setCurrentPanelId)

    const tapItem = (envelopeId: string) => {
        console.log(`EnvelopeList.tapItem envelopeId ${envelopeId}`)
        console.log(`EnvelopeList.tapItem sequence ${JSON.stringify(sequence)}`)
        const envelope: Envelope | undefined = getEnvelopeById(sequence, envelopeId)
        
        setView(0, 0, 0, envelope.length64ths)
        console.log(`EnvelopeList.tapItem envelope.length64ths ${envelope.length64ths}`)
        setCurrentEnvelopeId(envelopeId)
        console.log(`EnvelopeList.tapItem controller ${envelope.controller} envelopeId ${sequence.currentEnvelopeId}`)
        if (envelope === undefined) {
            throw Error(`EnvelopeList.tapItem controller has no envelope`)
        }

        setCurrentPanelId("ENV")

        console.log(`EnvelopeList.tapItem envelope.length64ths ${envelope.length64ths}`)
    }

    const handleNewEnvelopeButton = () => {
        console.log(`envelope-list-lane: Hi from new envelope button`)
        setCurrentPanelId("ENV")
        if (props.onSetLearn) {
            props.onSetLearn(true)
            // startListeners()
        } else {
            alert(`Please set the onSetLearn handler on your EnvelopeList tag`)
        }
    }

    const handleCancelNewEnvelopeButton = () => {
        console.log(`envelope-list-lane: Hi from cancel envelope button`)
        if (props.onSetLearn) {
            props.onSetLearn(false)
            // stopListeners()
        } else {
            alert(`Please set the onSetLearn handler on your EnvelopeList tag`)
        }
    }

    return (
        <div className="filter-type-list">
            <div className="flexbox-item genre" key={'+'}>
                {midiLearnMode ? (
                    <button onClick={handleCancelNewEnvelopeButton}>
                        <FontAwesomeIcon icon={faMinus}/> {}
                    </button>
                ) : (
                    <button onClick={handleNewEnvelopeButton}>
                        <FontAwesomeIcon icon={faPlus}/> {}
                    </button>
                )}
            </div>
            {sequence.envelopes.map(envelope => {
                return (
                    <div className="flexbox-item genre" key={envelope.controller}>
                        <button onClick={() => tapItem(envelope.id)}> {envelope.controller}</button>
                    </div>
                )
            })}
        </div>
    );
}

export default EnvelopeList
