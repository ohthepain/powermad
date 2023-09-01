import React, { useEffect, useRef, useState, MouseEvent } from "react";
import { useMeasure } from "react-use"
import "./navigation.css"
import { useBoundStore } from "../../app/state/bound-store";
import { useSequenceStore } from "../../app/state/sequence-store";
import { NavigationInfo } from "../../app/state/nav-store";
import { Envelope } from "../../player/sequence";
import { getEnvelopeById } from "../../util/sequence-util";

const Navigation = (props: any) => {

    const sequence = props.sequence
    const envelopeId = props.envelopeId

    const navigationInfo = useBoundStore(state => state.navigationInfo)
    const currentEditStepNum = useBoundStore(state => state.currentEditStepNum)
    const getViewStart64th = useBoundStore(state => state.getViewStart64th)
    const getViewEnd64th = useBoundStore(state => state.getViewEnd64th)
    const getViewRange64ths = useBoundStore(state => state.getViewRange64ths)
    const setEnvelopeLength = useSequenceStore(state => state.setEnvelopeLength)
    const setViewEnd64th = useBoundStore(state => state.setViewEnd64th)

    const currentEditStepNumRef = useRef(currentEditStepNum)
    const navigationInfoRef = useRef<NavigationInfo>(navigationInfo)

    const [navRef, { width }] = useMeasure<HTMLDivElement>();
    const [startEnvelopeLength, setStartEnvelopeLength] = useState<number>()
    const [startEnvelopeStart, setStartEnvelopeStart] = useState<number>()
    const [startDragScreenX, setStartDragScreenX] = useState<number>()

    enum MouseState { 
        Up,
        DragMain,
        DragStart,
        DragEnd,
    }

    const [mouseState, setMouseState] = useState<MouseState>(MouseState.Up)

    useEffect(() => {
        console.log(`navigationInfo changed`)
        navigationInfoRef.current = navigationInfo
    }, [navigationInfo])

    const envelope: Envelope | undefined = sequence.currentEnvelopeId != "notes" ? getEnvelopeById(sequence, sequence.currentEnvelopeId) : undefined
    const envelopeEnd64ths = envelope ? envelope.length64ths : sequence.numSteps * 64 / sequence.division
    const envelopeStart64ths = 0
    const viewStart64ths = getViewStart64th()
    const viewEnd64ths = getViewEnd64th()
    const viewWidth64ths = viewEnd64ths - viewStart64ths + 1
    const leftFr = viewStart64ths >= envelopeStart64ths ? 0 : (envelopeStart64ths - viewStart64ths) * 100 / viewWidth64ths
    const rightFr = viewEnd64ths <= envelopeEnd64ths ? 0 : (viewEnd64ths - envelopeEnd64ths) * 100 / viewWidth64ths
    const middleFr = 100 - leftFr - rightFr

    console.log(`navigation: viewStart64ths ${viewStart64ths} viewEnd64ths ${viewEnd64ths} - envelopeEnd64ths ${envelopeEnd64ths} / viewWidth64ths ${viewWidth64ths}  ((sequenceLength ${sequence.numSteps} division ${sequence.division}))`)
    console.log(`navigation: leftFr ${leftFr} middleFr ${middleFr} rightFr ${rightFr}`)

    function getXTime64ths(x: number) {
        const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
        const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
        const span64ths = end64th - start64th

        // we should refactor to no borders and use an html border, not canvas
        const borderWidth = 0;
        const time64ths = start64th + (x - borderWidth) / (width - borderWidth - borderWidth) * span64ths
        return time64ths
    }

    const handleMouseDown = (event: MouseEvent<HTMLDivElement>, element: string) => {
        // Handle mouse up event here
        event.stopPropagation()
        setStartEnvelopeLength(envelope?.length64ths)
        setStartEnvelopeStart(0)
    
        if (element === 'main') {
            setStartDragScreenX(event.screenX)
            if (mouseState === MouseState.Up) {
                // Start and end have priority so do nothing if mouse is not down
                setMouseState(MouseState.DragMain)
            }
        }
        if (element === 'start') {
            setMouseState(MouseState.DragStart)
        }
        if (element === 'end') {
            setMouseState(MouseState.DragEnd)
        }

        console.log(`Mouse down ${event.clientX} -> ${getXTime64ths(event.clientX)}`)
    };

    const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
        // Handle mouse up event here
        event.stopPropagation();
        console.log('Mouse up');
        setMouseState(MouseState.Up)
    };
    
    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        // Handle mouse up event here
        event.stopPropagation();

        if (mouseState === MouseState.DragMain) {
            handleDragMain(event)
        }
        else if (mouseState === MouseState.DragStart) {
            handleDragStart(event)
        }
        else if (mouseState === MouseState.DragEnd) {
            handleDragEnd(event)
        }
    };

    const handleDragMain = (event: MouseEvent<HTMLDivElement>) => {
        console.log("drag main")
    }
    
    const handleDragStart = (event: MouseEvent<HTMLDivElement>) => {
        console.log("drag start")
    }
    
    const handleDragEnd = (event: MouseEvent<HTMLDivElement>) => {
        if (envelope) {
            const clientX = event.currentTarget.getBoundingClientRect().left;
            const mouseTime64ths = getXTime64ths(event.clientX - clientX)
            const divisor = getViewRange64ths() >= 128 ? 4 : 1;
            const quantizedMouseTime64ths = Math.floor(mouseTime64ths / divisor) * divisor
            console.log(`handleDragEnd ${event.clientX} -> ${mouseTime64ths} -> quantizedMouseTime64ths ${quantizedMouseTime64ths} vs orig ${envelopeEnd64ths}`)

            // Are grid lines on 64ths or 16ths?
            const beatsPerBar : number = sequence.getTimeSignatureBeatsForBar(0)
            const beatLength : number = 64 / beatsPerBar
            const barLength = beatsPerBar * beatLength

            const length : number = envelope.length64ths
            console.log(`handleDragEnd `)
            setEnvelopeLength(sequence.currentEnvelopeId, length)

            // setViewEnd64th(length)
        }
    }
    
    return (
        <div className="navigation-area" ref={navRef}>
            <div className="drag-bar-outside" style={{flex: `${leftFr}`}}/>
            <div className="drag-bar" style={{flex: `${middleFr}`}} onMouseDown={(e) => handleMouseDown(e, 'main')} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
                <div className="drag-button" onMouseDown={(e) => {handleMouseDown(e, "start")}}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M7 18.005C7 19.1078 7.9 20 9 20C10.1 20 11 19.1078 11 18.005C11 16.9023 10.1 16 9 16C7.9 16 7 16.9023 7 18.005Z" fill="#000000"/>
                        <path d="M7 12.005C7 13.1078 7.9 14 9 14C10.1 14 11 13.1078 11 12.005C11 10.9023 10.1 10 9 10C7.9 10 7 10.9023 7 12.005Z" fill="#000000"/>
                        <path d="M7 6.00501C7 7.10777 7.9 8 9 8C10.1 8 11 7.10777 11 6.00501C11 4.90226 10.1 4 9 4C7.9 4 7 4.90226 7 6.00501Z" fill="#000000"/>
                        <path d="M13 6.00501C13 7.10777 13.9 8 15 8C16.1 8 17 7.10777 17 6.00501C17 4.90226 16.1 4 15 4C13.9 4 13 4.90226 13 6.00501Z" fill="#000000"/>
                        <path d="M13 12.005C13 13.1078 13.9 14 15 14C16.1 14 17 13.1078 17 12.005C17 10.9023 16.1 10 15 10C13.9 10 13 10.9023 13 12.005Z" fill="#000000"/>
                        <path d="M13 18.005C13 19.1078 13.9 20 15 20C16.1 20 17 19.1078 17 18.005C17 16.9023 16.1 16 15 16C13.9 16 13 16.9023 13 18.005Z" fill="#000000"/>
                    </svg>
                </div>
                <div className="drag-button" onMouseDown={(e) => {handleMouseDown(e, "end")}}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M7 18.005C7 19.1078 7.9 20 9 20C10.1 20 11 19.1078 11 18.005C11 16.9023 10.1 16 9 16C7.9 16 7 16.9023 7 18.005Z" fill="#000000"/>
                        <path d="M7 12.005C7 13.1078 7.9 14 9 14C10.1 14 11 13.1078 11 12.005C11 10.9023 10.1 10 9 10C7.9 10 7 10.9023 7 12.005Z" fill="#000000"/>
                        <path d="M7 6.00501C7 7.10777 7.9 8 9 8C10.1 8 11 7.10777 11 6.00501C11 4.90226 10.1 4 9 4C7.9 4 7 4.90226 7 6.00501Z" fill="#000000"/>
                        <path d="M13 6.00501C13 7.10777 13.9 8 15 8C16.1 8 17 7.10777 17 6.00501C17 4.90226 16.1 4 15 4C13.9 4 13 4.90226 13 6.00501Z" fill="#000000"/>
                        <path d="M13 12.005C13 13.1078 13.9 14 15 14C16.1 14 17 13.1078 17 12.005C17 10.9023 16.1 10 15 10C13.9 10 13 10.9023 13 12.005Z" fill="#000000"/>
                        <path d="M13 18.005C13 19.1078 13.9 20 15 20C16.1 20 17 19.1078 17 18.005C17 16.9023 16.1 16 15 16C13.9 16 13 16.9023 13 18.005Z" fill="#000000"/>
                    </svg>
                </div>
            </div>
            <div className="drag-bar-outside" style={{flex: `${rightFr}`}}/>
        </div>
    )
}

export default Navigation
