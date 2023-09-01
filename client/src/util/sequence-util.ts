import {Sequence, Envelope} from "../player/sequence"
import {ControllerInfo} from "../services/device-service"

function findEnvelope(sequence: Sequence, ccid: number) : Envelope | null {
    if (sequence.envelopes != null) {
        sequence.envelopes.forEach((envelopeId: any, envelope: any) => {
            if (envelope.ccMsb === ccid || envelope.ccLsb === ccid) {
                // TODO: Does this actually work?
                return envelope
            }
        })
    }
    console.log(`findEnvelope - could not find envelope for ccid ${ccid}`)
    return null
}

function searchEnvelopeByController(sequence: Sequence, controller: ControllerInfo) : Envelope | null {
    if (sequence.envelopes != null) {
        for (const envelope of sequence.envelopes) {
            if (envelope.controller === controller.name) {
                return envelope
            }
        }
    }
    
    return null
}

function getEnvelopeById(sequence: Sequence, envelopeId : string) : Envelope {
    if (envelopeId === "learn" || envelopeId === "notes") {
        throw Error(`getEnvelopeById - returning null because envelopeId === ${envelopeId}`)
    }

    if (sequence.envelopes != null) {
        for (const envelope of sequence.envelopes) {
            if (envelope.id === envelopeId) {
                console.log(`getEnvelopeById: envelope.length64ths ${envelope.length64ths}`)
                return envelope
            }
        }
    }

    throw Error(`getEnvelope - could not find envelope id ${envelopeId}`)
}


export { findEnvelope, getEnvelopeById, searchEnvelopeByController }
