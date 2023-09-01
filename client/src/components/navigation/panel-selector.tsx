import React from "react";
import { useSequenceStore } from "../../app/state/sequence-store";
import "./panel-selector.css"
import { useBoundStore } from "../../app/state/bound-store";

const PanelSelector = (props: any) => {

    const sequence = useSequenceStore(state => state.sequence)
    const setCurrentPanelId = useSequenceStore(state => state.setCurrentPanelId)
    const setCurrentEnvelopeId = useSequenceStore(state => state.setCurrentEnvelopeId)
    const setMidiLearnMode = useBoundStore(state => state.setMidiLearnMode)
    const setViewRange64ths = useBoundStore(state => state.setViewRange64ths)
    const setViewRangeSteps = useBoundStore(state => state.setViewRangeSteps)

    const selectPanel = (panelId: string) => {
        console.log(`selected ${panelId}, currentPanelId === ${sequence.currentPanelId} sequence.currentEnvelopeId === ${sequence.currentEnvelopeId}`)

        if (panelId === "ENV") {
            if (sequence.currentEnvelopeId) {
                setViewRange64ths(sequence, 0, sequence.envelopes[0].length64ths)
            } else {
                if (sequence.envelopes.length > 0) {
                    setCurrentEnvelopeId(sequence.envelopes[0].id)
                } else {
                    setMidiLearnMode(true)
                }
            }
        } else {
            setMidiLearnMode(false)

            if (panelId === "ARP") {
                setViewRangeSteps(sequence, 0, sequence.numSteps)
            }
        }

        setCurrentPanelId(panelId)
    }

    const getClassName = (panelId: string) => {
        return panelId === sequence.currentPanelId ? "button selected" : "button"
    }
   
    console.log(`PanelSelector render sequence.currentPanelId === ${sequence.currentPanelId}`)

    return (
        <div className="panel-selector">
            <div className={getClassName("ARP")} onClick={(event) => {selectPanel("ARP")}}>
                ARP
            </div>
            {/* <div className={getClassName("SEQ")} onClick={(event) => {selectPanel("SEQ")}}>
                STEP SEQ
            </div> */}
            <div className={getClassName("ENV")} onClick={(event) => {selectPanel("ENV")}}>
                MOD ENV
            </div>
        </div>
    )
}

export default PanelSelector
