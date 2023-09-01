import React from 'react'
import { useBoundStore } from '../../app/state/bound-store';
import {useSequenceStore} from "../../app/state/sequence-store";
import {Envelope, EnvelopePoint, Sequence} from "../../player/sequence";
import {getEnvelopeById} from "../../util/sequence-util";
import EnvelopeSelector from "./envelope-selector";
import { Location } from '../location/location';
import { PanelButton } from '../controls/panel-button/panel-button';

const EnvelopeBar = () => {

    const sequence = useSequenceStore(state => state.sequence)
    const deleteEnvelope = useSequenceStore(state => state.deleteEnvelope)
    const setEnvelopeLocked = useSequenceStore(state => state.setEnvelopeLocked)
    const setEnvelopePoints = useSequenceStore(state => state.setEnvelopePoints)
    const setEnvelopeLength = useSequenceStore(state => state.setEnvelopeLength)
    const setCurrentEnvelopeId = useSequenceStore(state => state.setCurrentEnvelopeId)
    const setViewRangeSteps = useBoundStore(state => state.setViewRangeSteps)
    const setViewRange64ths = useBoundStore(state => state.setViewRange64ths)
    const setMidiLearnMode =  useBoundStore(state => state.setMidiLearnMode)
    const midiLearnMode : boolean = useBoundStore(state => state.midiLearnMode)
    const setCurrentPanelId = useSequenceStore(state => state.setCurrentPanelId)

    const envelope: Envelope | undefined = sequence.currentEnvelopeId ? getEnvelopeById(sequence, sequence.currentEnvelopeId) : undefined

    const handleHalf = () => {
        console.log(`handleHalf`)
        const envelope: Envelope = getEnvelopeById(sequence, sequence.currentEnvelopeId)
        if (envelope.locked) {
            alert(`Envelope is locked`)
        } else {
            var newPoints: Array<EnvelopePoint> = []
            var lastPoint: EnvelopePoint | undefined = undefined
            var afterPoint: EnvelopePoint | undefined = undefined
            for (var point of envelope.points) {
                if (point.time64ths <= envelope.length64ths / 2) {
                    newPoints.push(new EnvelopePoint(point.time64ths, point.value))
                    lastPoint = point
                } else {
                    if (afterPoint === undefined) {
                        afterPoint = point
                    }
                }
            }

            if (!lastPoint) {
                throw Error(`no last point. that should not be possible unless the envelope has not points`)
            }

            if (lastPoint.time64ths < envelope.length64ths / 2) {
                if (afterPoint) {
                    const prop : number = (afterPoint.time64ths - envelope.length64ths / 2) / (afterPoint.time64ths - lastPoint.time64ths)
                    const value : number = lastPoint.value + (afterPoint.value - lastPoint.value) * prop
                    const time : number = envelope.length64ths / 2
                    newPoints.push(new EnvelopePoint(time, value))
                } else {
                    newPoints.push(new EnvelopePoint(envelope.length64ths / 2, lastPoint.value ))
                }
            }

            setEnvelopePoints(envelope.id, newPoints, envelope.length64ths / 2)
        }
    }

    const handleDouble = () => {
        console.log(`handleDouble`)
        const envelope: Envelope = getEnvelopeById(sequence, sequence.currentEnvelopeId)
        if (envelope.locked) {
            alert(`Envelope is locked`)
        } else {
            var newPoints: Array<EnvelopePoint> = []
            for (var point of envelope.points) {
                newPoints.push(new EnvelopePoint(point.time64ths, point.value));
            }
            for (var point of envelope.points) {
                newPoints.push(new EnvelopePoint(point.time64ths + envelope.length64ths, point.value));
            }
            setEnvelopePoints(envelope.id, newPoints, envelope.length64ths * 2)
        }
    }

    const handleExpand = () => {
        console.log(`handleExpand`)
        const envelope: Envelope = getEnvelopeById(sequence, sequence.currentEnvelopeId)
        if (envelope.locked) {
            alert(`Envelope is locked`)
        } else {
            var newPoints: Array<EnvelopePoint> = []
            for (var point of envelope.points) {
                newPoints.push(new EnvelopePoint(point.time64ths * 2, point.value));
            }
            setEnvelopePoints(envelope.id, newPoints, envelope.length64ths * 2)
        }
    }

    const handleMirror = () => {
        console.log(`handleMirror`)
        const envelope: Envelope = getEnvelopeById(sequence, sequence.currentEnvelopeId)
        if (envelope.locked) {
            alert(`Envelope is locked`)
        } else {
            var newPoints: Array<EnvelopePoint> = []
            for (var point of envelope.points) {
                newPoints.push(new EnvelopePoint(point.time64ths, point.value));
            }
            for (var point of envelope.points) {
                newPoints.push(new EnvelopePoint(envelope.length64ths * 2 - point.time64ths, point.value));
            }
            newPoints.sort((a,b) => { return a.time64ths - b.time64ths })
            setEnvelopePoints(envelope.id, newPoints, envelope.length64ths * 2)
        }
    }

    const handleCompress = () => {
        console.log(`handleCompress`)
        const envelope: Envelope = getEnvelopeById(sequence, sequence.currentEnvelopeId)
        if (envelope.locked) {
            alert(`Envelope is locked`)
        } else {
            var newPoints: Array<EnvelopePoint> = []
            for (var point of envelope.points) {
                newPoints.push(new EnvelopePoint(point.time64ths / 2, point.value));
            }
            setEnvelopePoints(envelope.id, newPoints, envelope.length64ths / 2)
        }
    }

    const handleRotate = (amount: number) => {
        console.log(`handleRotate ${amount}`)
        const envelope: Envelope = getEnvelopeById(sequence, sequence.currentEnvelopeId)
        if (envelope.locked) {
            alert(`Envelope is locked`)
        } else {
            var newPoints: Array<EnvelopePoint> = [...envelope.points]
            for (var from = 0; from < newPoints.length; from++) {
                const to: number = (from + amount + envelope.points.length) % envelope.points.length
                // console.log(`handleRotate: ${envelope.points.length} points. from ${from} to ${to}`)
                newPoints[to] = {...newPoints[to], time64ths: envelope.points[from].time64ths }
            }
            newPoints.sort((a,b) => { return a.time64ths - b.time64ths })
            setEnvelopePoints(envelope.id, newPoints, envelope.length64ths)
        }
    }

    const handleClose = () => {
        // We currently have to set the view range before the view
        setViewRangeSteps(sequence, 0, sequence.numSteps)
        setCurrentEnvelopeId("notes")
    }

    // const handleEditStart = (args: any) => {
    //     console.log(`handleEditStart ${JSON.stringify(args)}`)
    // }

    // const handleEditLength = (index: number, offset: number) => {
    //     console.log(`handleEditLength ${index} ${offset}`)
    //     setEnvelopeLength(sequence.currentEnvelopeId, length)

    //     setViewRange64ths(sequence, 0, length)
    // }

    const handleEditLengthLocation = (loc : Array<number>) => {
        if (envelope) {
            const beatsPerBar : number = sequence.getTimeSignatureBeatsForBar(0)
            const beatLength : number = 64 / beatsPerBar
            const barLength = beatsPerBar * beatLength

            const bars : number = loc[0]
            const beats : number = loc[1]
            const sixtyfourths : number = loc[2]
            const length : number = bars * barLength + beats * beatLength + sixtyfourths
            console.log(`handleEditLengthLocation ${JSON.stringify(loc)} -> ${bars} bars, ${beats} beats, ${sixtyfourths} divisions -> length ${length} 64ths`)
            setEnvelopeLength(sequence.currentEnvelopeId, length)

            setViewRange64ths(sequence, 0, length)
        }
    }

    const handleDeleteEnvelope = () => {
        deleteEnvelope(sequence.currentEnvelopeId)
        setCurrentPanelId("ARP")
        setViewRangeSteps(sequence, 0, sequence.numSteps)
    }

    console.log(`envelope-bar: envelope : length ${envelope != null ? envelope.length64ths : 0} ${JSON.stringify(envelope)}`)

    const beatsPerBar : number = sequence.getTimeSignatureBeatsForBar(0)
    const beatLength : number = 64 / beatsPerBar
    const barLength = beatsPerBar * beatLength
    // console.log(`envelope-bar: envelope : length: beatsPerBar ${beatsPerBar} beatLength ${beatLength} barLength ${barLength}`)
    const lengthBars = envelope ? Math.floor(envelope.length64ths / barLength) : 0
    const lengthBeats = envelope ? Math.floor((envelope.length64ths - lengthBars * barLength) / beatLength) : 0
    const length64ths = envelope ? envelope.length64ths % beatLength : 0
    console.log(`envelope-bar: envelope : length: ${lengthBars}.${lengthBeats}.${length64ths}`)

    if (midiLearnMode) {
        return (
            <div className="notes-envelope-bar Island">
                <div>Waiting for MIDI Input ...</div>
            </div>
        )
    }

    return (
        <div className="notes-envelope-bar Island">
            {/* <button className="menu-button-borderless zen-mode-transition" type="button" title="close" onClick={() => {handleClose()}}>
                <svg viewBox="2 2 20 20" fill="none">
                    <path clipRule="evenodd" d="m7.53033 6.46967c-.29289-.29289-.76777-.29289-1.06066 0s-.29289.76777 0 1.06066l4.46963 4.46967-4.46963 4.4697c-.29289.2929-.29289.7677 0 1.0606s.76777.2929 1.06066 0l4.46967-4.4696 4.4697 4.4696c.2929.2929.7677.2929 1.0606 0s.2929-.7677 0-1.0606l-4.4696-4.4697 4.4696-4.46967c.2929-.29289.2929-.76777 0-1.06066s-.7677-.29289-1.0606 0l-4.4697 4.46963z" fill="#000000" fillRule="evenodd"/>
                </svg>
            </button> */}
            {/* <button className="menu-button zen-mode-transition" type="button" title="compress envelope" onClick={() => {handleClose()}}>
                <svg viewBox="0 0 24 24" fill="none">
                    <path clipRule="evenodd" d="m7.53033 6.46967c-.29289-.29289-.76777-.29289-1.06066 0s-.29289.76777 0 1.06066l4.46963 4.46967-4.46963 4.4697c-.29289.2929-.29289.7677 0 1.0606s.76777.2929 1.06066 0l4.46967-4.4696 4.4697 4.4696c.2929.2929.7677.2929 1.0606 0s.2929-.7677 0-1.0606l-4.4696-4.4697 4.4696-4.46967c.2929-.29289.2929-.76777 0-1.06066s-.7677-.29289-1.0606 0l-4.4697 4.46963z" fill="#000000" fillRule="evenodd"/>
                </svg>
            </button> */}
            <EnvelopeSelector/>
            { envelope != null ? (
                <>
                    {/* <div className="flexbox-column">
                        <div className="bar-item"><strong>from:</strong></div>
                        <div className="bar-item"><strong>length:</strong></div>
                    </div> */}
                    <div className="flexbox-column">
                        <PanelButton 
                            enabled={envelope != undefined} 
                            selected={envelope && !envelope.locked} 
                            label={envelope && envelope.locked ? "Linked" : "Unlinked"}
                            onClick={() => { setEnvelopeLocked(envelope.id, !envelope.locked)}}/>
                        {/* <Location id="foo" bars="5" beats="1" divisions="1" enabled={envelope && !envelope.locked} onEdit={(args: any) => {handleEditStart(args)}}/> */}
                        <Location id="bar" enabled={envelope && !envelope.locked} 
                            onEditLocation={(s: Array<number>) => handleEditLengthLocation(s)} 
                            onEditString={(s: string) => {}}
                            values={[lengthBars, lengthBeats, length64ths]}
                            // bars={`${lengthBars}`}
                            // beats={`${lengthBeats}`}
                            // divisions={`${length64ths}`}
                        />
                    </div>
                </> ) : (<>no envelope</>)
            }
            <div className="item">
                { envelope?.locked ? (
                    <button className="menu-button zen-mode-transition" type="button" title="unlock" onClick={() => {setEnvelopeLocked(envelope.id, !envelope.locked)}}>
                        <svg fill="#000000" viewBox="0 0 512 512" enableBackground="new 0 0 512 512">
                            <path d="M418.4,232.7h-23.3v-93.1C395.1,62.5,332.6,0,255.5,0S115.9,62.5,115.9,139.6v93.1H92.6c-12.8,0-23.3,10.4-23.3,23.3v232.7
                                c0,12.9,10.4,23.3,23.3,23.3h325.8c12.8,0,23.3-10.4,23.3-23.3V256C441.7,243.1,431.2,232.7,418.4,232.7z M348.6,232.7H162.4v-93.1
                                c0-51.4,41.7-93.1,93.1-93.1s93.1,41.7,93.1,93.1V232.7z"/>
                        </svg>
                    </button>
                ) : (
                    <button className="menu-button zen-mode-transition" type="button" title="lock" onClick={() => {envelope && setEnvelopeLocked(envelope.id, !envelope.locked)}}>
                        <svg fill="#000000" viewBox="0 0 512 512" >
                            <path d="M141.373,221.612v-61.134c0-63.205,51.422-114.627,114.627-114.627s114.627,51.422,114.627,114.627h45.851
                                C416.478,71.99,344.487,0,256,0S95.522,71.99,95.522,160.478v61.134H57.313V512h397.373V221.612H141.373z"/>
                        </svg>
                    </button>
                )}
            </div>
            <button className="menu-button zen-mode-transition" type="button" title="delete envelope" onClick={() => {handleDeleteEnvelope()}}>
                <svg fill="#000000" viewBox="4 4 50 50">
                    <path d="M 44.5235 48.6602 L 46.1407 14.3945 L 48.4844 14.3945 C 49.4454 14.3945 50.2187 13.5976 50.2187 12.6367 C 50.2187 11.6758 49.4454 10.8555 48.4844 10.8555 L 38.2422 10.8555 L 38.2422 7.3398 C 38.2422 3.9883 35.9688 1.8086 32.3595 1.8086 L 23.5938 1.8086 C 19.9844 1.8086 17.7344 3.9883 17.7344 7.3398 L 17.7344 10.8555 L 7.5391 10.8555 C 6.6016 10.8555 5.7813 11.6758 5.7813 12.6367 C 5.7813 13.5976 6.6016 14.3945 7.5391 14.3945 L 9.8829 14.3945 L 11.5000 48.6836 C 11.6641 52.0586 13.8907 54.1914 17.2657 54.1914 L 38.7579 54.1914 C 42.1095 54.1914 44.3595 52.0351 44.5235 48.6602 Z M 21.4844 7.5742 C 21.4844 6.2383 22.4688 5.3008 23.8751 5.3008 L 32.1016 5.3008 C 33.5313 5.3008 34.5157 6.2383 34.5157 7.5742 L 34.5157 10.8555 L 21.4844 10.8555 Z M 17.6173 50.6758 C 16.2579 50.6758 15.2500 49.6445 15.1797 48.2852 L 13.5391 14.3945 L 42.3907 14.3945 L 40.8438 48.2852 C 40.7735 49.6680 39.7891 50.6758 38.4063 50.6758 Z M 34.9610 46.5508 C 35.7344 46.5508 36.3204 45.9180 36.3438 45.0273 L 37.0469 20.2773 C 37.0704 19.3867 36.4610 18.7305 35.6641 18.7305 C 34.9376 18.7305 34.3282 19.4102 34.3048 20.2539 L 33.6016 45.0273 C 33.5782 45.8711 34.1641 46.5508 34.9610 46.5508 Z M 21.0626 46.5508 C 21.8595 46.5508 22.4454 45.8711 22.4219 45.0273 L 21.7188 20.2539 C 21.6954 19.4102 21.0626 18.7305 20.3360 18.7305 C 19.5391 18.7305 18.9532 19.3867 18.9766 20.2773 L 19.7032 45.0273 C 19.7266 45.9180 20.2891 46.5508 21.0626 46.5508 Z M 29.4298 45.0273 L 29.4298 20.2539 C 29.4298 19.4102 28.7969 18.7305 28.0235 18.7305 C 27.2500 18.7305 26.5938 19.4102 26.5938 20.2539 L 26.5938 45.0273 C 26.5938 45.8711 27.2500 46.5508 28.0235 46.5508 C 28.7735 46.5508 29.4298 45.8711 29.4298 45.0273 Z"/>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="expand" onClick={() => {handleExpand()}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8" />
                    <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
                    <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
                    <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="cut in half" onClick={() => {handleHalf()}}>
                <svg fill="#000000" viewBox="2 2 32 32">
                    <path className="clr-i-outline clr-i-outline-path-1" d="M34,16.78a2.22,2.22,0,0,0-1.29-4l-9-.34a.23.23,0,0,1-.2-.15L20.4,3.89a2.22,2.22,0,0,0-4.17,0l-3.1,8.43a.23.23,0,0,1-.2.15l-9,.34a2.22,2.22,0,0,0-1.29,4l7.06,5.55a.22.22,0,0,1,.08.24L7.35,31.21A2.23,2.23,0,0,0,9.49,34a2.22,2.22,0,0,0,1.24-.38l7.46-5a.22.22,0,0,1,.25,0l7.46,5a2.22,2.22,0,0,0,3.38-2.45l-2.45-8.64a.23.23,0,0,1,.08-.24ZM18.33,26.62h0a2.21,2.21,0,0,0-1.24.38L9.62,32a.22.22,0,0,1-.34-.25l2.45-8.64A2.21,2.21,0,0,0,11,20.76L3.9,15.21a.22.22,0,0,1,.13-.4l9-.34A2.22,2.22,0,0,0,15,13l3.1-8.43a.2.2,0,0,1,.21-.15h0Z"></path>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="double" onClick={() => {handleDouble()}}>
                <svg viewBox="0 0 14 14">
                    <g stroke="none" strokeWidth="1" fill="none">
                        <g transform="translate(-1, 2)" fill="#434343">
                            <path d="M11.83,4.999 L8.086,10 L12.025,10 L15.969,4.999 L11.927,0.03 L8.009,0.03 L7.998,0.041 L11.83,4.999 Z" className="si-glyph-fill"></path>
                            <path d="M4.047,4.999 L0.096,10 L4.034,10 L8,4.999 L3.935,0.03 L0.018,0.03 L0.008,0.041 L4.047,4.999 Z" className="si-glyph-fill"></path>
                        </g>
                    </g>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="mirror" onClick={() => {handleMirror()}}>
            <svg viewBox="2 2 14 14">
                <g stroke="none" strokeWidth="1" fill="none">
                    <g transform="translate(1.000000, 5.000000)" fill="#434343">
                        <path d="M4.125,0.229 C3.863,-0.035 3.44,-0.035 3.179,0.229 C2.918,0.493 2.918,0.919 3.179,1.183 L4.532,3.011 L1,3.011 C0.447,3.011 0,3.455 0,4.003 C0,4.551 0.447,4.995 1,4.995 L4.594,4.995 L3.21,6.812 C2.947,7.075 2.947,7.5 3.21,7.764 C3.34,7.896 3.512,7.962 3.682,7.962 C3.854,7.962 4.026,7.896 4.157,7.764 L6.976,4.024 L4.125,0.229 L4.125,0.229 Z" className="si-glyph-fill"></path>
                        <path d="M11.821,0.229 C12.084,-0.035 12.507,-0.035 12.768,0.229 C13.03,0.493 13.03,0.919 12.768,1.183 L11.44,3.011 L14.971,3.011 C15.524,3.011 15.971,3.455 15.971,4.003 C15.971,4.551 15.524,4.995 14.971,4.995 L11.518,4.995 L12.784,6.812 C13.046,7.075 13.046,7.5 12.784,7.764 C12.653,7.896 12.482,7.962 12.311,7.962 C12.139,7.962 11.968,7.896 11.837,7.764 L8.999,4.024 L11.821,0.229 L11.821,0.229 Z" className="si-glyph-fill"></path>
                    </g>
                </g>
            </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="compress envelope" onClick={() => {handleCompress()}}>
                <svg fill="#000000" viewBox="0 0 24 24" >
                    <path d="M10.38,13.08A1,1,0,0,0,10,13H6a1,1,0,0,0,0,2H7.59l-5.3,5.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L9,16.41V18a1,1,0,0,0,2,0V14a1,1,0,0,0-.08-.38A1,1,0,0,0,10.38,13.08ZM10,5A1,1,0,0,0,9,6V7.59L3.71,2.29A1,1,0,0,0,2.29,3.71L7.59,9H6a1,1,0,0,0,0,2h4a1,1,0,0,0,.38-.08,1,1,0,0,0,.54-.54A1,1,0,0,0,11,10V6A1,1,0,0,0,10,5Zm3.62,5.92A1,1,0,0,0,14,11h4a1,1,0,0,0,0-2H16.41l5.3-5.29a1,1,0,1,0-1.42-1.42L15,7.59V6a1,1,0,0,0-2,0v4a1,1,0,0,0,.08.38A1,1,0,0,0,13.62,10.92ZM16.41,15H18a1,1,0,0,0,0-2H14a1,1,0,0,0-.38.08,1,1,0,0,0-.54.54A1,1,0,0,0,13,14v4a1,1,0,0,0,2,0V16.41l5.29,5.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Z"/>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="rotate left" onClick={() => {handleRotate(-1)}}>
                <svg viewBox="2 2 20 20" fill="none">
                    <path d="M5 12L11 6M5 12L11 18M5 12H19" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                </svg>
            </button>
            <button className="menu-button zen-mode-transition" type="button" title="rotate right" onClick={() => {handleRotate(1)}}>
                <svg viewBox="0 -6.5 38 38">
                    <g id="icons" stroke="none" strokeWidth="1" fill="none">
                        <g transform="translate(-1511.000000, -158.000000)" fill="#1C1C1F">
                            <g id="1" transform="translate(1350.000000, 120.000000)">
                                <path d="M187.812138,38.5802109 L198.325224,49.0042713 L198.41312,49.0858421 C198.764883,49.4346574 198.96954,49.8946897 199,50.4382227 L198.998248,50.6209428 C198.97273,51.0514917 198.80819,51.4628128 198.48394,51.8313977 L198.36126,51.9580208 L187.812138,62.4197891 C187.031988,63.1934036 185.770571,63.1934036 184.990421,62.4197891 C184.205605,61.6415481 184.205605,60.3762573 184.990358,59.5980789 L192.274264,52.3739093 L162.99947,52.3746291 C161.897068,52.3746291 161,51.4850764 161,50.3835318 C161,49.2819872 161.897068,48.3924345 162.999445,48.3924345 L192.039203,48.3917152 L184.990421,41.4019837 C184.205605,40.6237427 184.205605,39.3584519 184.990421,38.5802109 C185.770571,37.8065964 187.031988,37.8065964 187.812138,38.5802109 Z" id="right-arrow"/>
                            </g>
                        </g>
                    </g>
                </svg>
            </button>
        </div>
    )
}

export default EnvelopeBar
