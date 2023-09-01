import React from 'react'
import Select from "react-select";
import {useSequenceStore} from "../../app/state/sequence-store";
import {useBoundStore} from "../../app/state/bound-store";
import {getEnvelopeOption, getEnvelopeOptions} from "../../player/envelope-utils"
import {findEnvelope, getEnvelopeById, searchEnvelopeByController} from "../../util/sequence-util";
import { Envelope } from '../../player/sequence';

const EnvelopeSelector = () => {

    const sequence = useSequenceStore(state => state.sequence)
    const setCurrentEnvelopeId = useSequenceStore(state => state.setCurrentEnvelopeId)
    const setView = useBoundStore(state => state.setView)

    return (
        <div className="flexbox-item">
            <Select options={getEnvelopeOptions(sequence)} value={getEnvelopeOption(sequence, sequence.currentEnvelopeId)} onChange={e => {
                if (e) {
                    console.log(`EnvelopeSelector: e ${JSON.stringify(e)}`)
                    const envelopeId: string = e.value
                    console.log(`EnvelopeSelector: currentEnvelopeId ${envelopeId}`)
                    const envelope: Envelope = getEnvelopeById(sequence, envelopeId)
                    console.log(`EnvelopeSelector: envelope ${JSON.stringify(envelope)}`)
                    setView(0, 0, 0, envelope.length64ths || 64)
                    setCurrentEnvelopeId(envelopeId)
                }
            }}></Select>
        </div>
    )
}

export default EnvelopeSelector
