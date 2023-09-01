import React, {useEffect, useMemo, useRef, useState} from 'react';
import * as PIXI from 'pixi.js'
import SongPlayer from "../../player/song-player";
import throttle from "../../util/throttle";
import MidiDeviceDataService, {ControllerInfo, MidiChart, MidiChartDataService} from "../../services/device-service"
import {Sequence, Envelope, EnvelopePoint, SequenceStep} from "../../player/sequence";
import {findMidiChart} from "../../util/midi-utils";
import {useSequenceStore} from "../../app/state/sequence-store";
import TempoService from "../../services/tempo-service";
import {NavigationInfo} from "../../app/state/nav-store";
import {useBoundStore} from "../../app/state/bound-store";
import {usePositionStore} from '../../app/state/position-store';
import { getEnvelopeById } from '../../util/sequence-util';

function minmax(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

var pixiapp;
var container: any;
var parentContainer: any;
var renderer;

var height: number;
var width: number;
var mouseIsDown = false;
var waitingForDoubleClick = false;
var isDraggingVertical = false
var isDraggingHorizontal = false
const dragThresholdVertical = 10
const dragThresholdHorizontal = 10

const grey = 0x404040
const darkgrey = 0x707070
const green = 0x10a010
const brightRed = 0xdb5660
const brightGreen = 0x56db60
const blue = 0x0000ff
const borderColor = 0x444444
const envelopeLineColor = 0xff0000
const backgroundLightColor = 0xaaaaaa
const backgroundDarkColor = 0x9f9f9f
const dividerSuperLightColor = 0x9b9b9b
const dividerLightColor = 0x8f8f8f
const dividerDarkColor = 0x808080
// bar.beginFill(dark ? 0x9f9f9f : 0xa5a5a5, 1);
// bar.beginFill(dark ? 0x414141 : 0x343434, 1);

const darkgreen = 0x107010
const red = 0xff0000
const white = 0xffffff;
const colorVelocityBar = 0x5e5f68;

const middleNote = 60;
const minNote = middleNote - 24;
const maxNote = middleNote + 24;
const borderWidth = 0;
const bottomBorderHeight = 20;
const topBorderHeight = 20;
// const gapWidth = 4;
// const barWidth = 50;
// const numSteps = 16;
const lineThickness = 0.005;

const DragTargets = {
    None: 0,
    NoteBox: 1,
    OctaveBox: 2,
    VelocityBox: 3,
    EnvelopePoint: 4,
}

const DragDirections = {
    None: 0,
    Vertical: 1,
    Horizontal: 2,
}

var dragTarget: any
// var dragDirection
var dragStepNum = -1
var tapPointNum = -1
var dragStartPos = { x: -1, y: -1, }

const noteBarTextStyle = new PIXI.TextStyle({
    align: "center",
    fill: "#000000",
    fontFamily: "Helvetica",
    fontSize: 12
});

const midiLearnTextStyle = new PIXI.TextStyle({
    align: "center",
    fill: "#000000",
    fontFamily: "Helvetica",
    fontSize: 24
});

const turnAKnobTextStyle = new PIXI.TextStyle({
    align: "center",
    fill: "#000000",
    fontFamily: "Helvetica",
    fontSize: 36,
});

const noteName = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
]

const EnvelopeCanvas = React.forwardRef((props: any, ref) => {

    const sequence: Sequence = useSequenceStore(state => { return state.sequence} )
    const setStepNote = useSequenceStore(state => state.setStepNote)
    const setStepVelocity = useSequenceStore(state => state.setStepVelocity)
    const setStepGateLength = useSequenceStore(state => state.setStepGateLength)
    const addEnvelopePoint = useSequenceStore(state => state.addEnvelopePoint)
    const moveEnvelopePoint = useSequenceStore(state => state.moveEnvelopePoint)
    const deleteEnvelopePoint = useSequenceStore(state => state.deleteEnvelopePoint)
    const deleteEnvelope = useSequenceStore(state => state.deleteEnvelope)

    const navigationInfo = useBoundStore(state => state.navigationInfo)
    const setViewEnd64th = useBoundStore(state => state.setViewEnd64th)
    const getViewEnd64th = useBoundStore(state => state.getViewEnd64th)
    const getViewRange64ths = useBoundStore(state => state.getViewRange64ths)
    const midiLearnMode = useBoundStore(state => state.midiLearnMode)

    const isPlaying = usePositionStore(state => state.isPlaying)
    const currentStepNum = usePositionStore(state => state.currentStepNum)

    const canvasRef = useRef(null)
    const sequenceRef = useRef<Sequence>(sequence);
    const currentStepNumRef = useRef(currentStepNum)
    const navigationInfoRef = useRef<NavigationInfo>(navigationInfo)
    const isPlayingRef = useRef(isPlaying)

    const fontHelveticaBold : PIXI.BitmapFont = useMemo<PIXI.BitmapFont>(() => {
        return PIXI.BitmapFont.from('Bitmap Helvetica Bold',
            { fontFamily: 'Helvetica', fontSize: 10, fontWeight: 'bold', fill: ['#f9a248'],},
            { chars: "0123456789:"})
    }, [])
    const fontHelvetica : PIXI.BitmapFont = useMemo<PIXI.BitmapFont>(() => {
        return PIXI.BitmapFont.from('Bitmap Helvetica', { fontFamily: 'Helvetica', fontSize: 10, fill: ['#f9a248'],})
    }, [])

    useEffect(() => {
        currentStepNumRef.current = currentStepNum
    }, [currentStepNum])

    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    useEffect(() => {
        console.log(`useEffect(envelope-canvas): []`)
        const unsubscribe = useSequenceStore.subscribe((oldState, newState) => {
            // This seems to be called before the state change
            // console.log(`envelope-canvas: sequence-store state change ${newState.sequence.numSteps} ${sequence.numSteps} <---`)
            // drawEnvelopeCanvas()
        });

        const unsubscribe2 = useBoundStore.subscribe((oldState, newState) => {
            // console.log(`envelope-canvas: position store change`)
            // drawEnvelopeCanvas()
        });

        const unsubscribe3 = useBoundStore.subscribe((newState, oldState) => {
            // console.log(`useBoundStore - change: newState ${JSON.stringify(newState)} ${sequence.numSteps} <---`)
            // console.log(`useBoundStore - change: ourstate ${startBar}:xxx:${startSixtyFourth} to ${endBar}:xxx:${endSixtyFourth}`)
            // console.log(`useBoundStore - change: storestate ${useNavStore.getState().startBar}:${useNavStore.getState()}.xxx:${useNavStore.getState().startSixtyfourth} to ${useNavStore.getState().endBar}:xxx:${useNavStore.getState().endSixtyfourth}`)

            // drawEnvelopeCanvas()
        });

        return () => {
            console.log(`envelope-canvas: unsubscribe from store state changes`)
            unsubscribe3()
            unsubscribe2()
            unsubscribe()
        }
    }, [])

    useEffect( () => {
        console.log(`useEffect(envelope-canvas): []`)
        width = props.width;
        height = props.height;
        if (canvasRef.current == null) {
            throw Error("Canvas ref is null")
        }

        console.log(`new PIXI.Application: canvasRef.current ${canvasRef.current}`)
        pixiapp = new PIXI.Application({
            view: canvasRef.current as HTMLCanvasElement,
            powerPreference: 'high-performance',
            backgroundAlpha: 0,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            width: width,
            height: height
        });

        renderer = PIXI.autoDetectRenderer();

        parentContainer = new PIXI.Container();
        parentContainer.interactive = true
        pixiapp.stage.addChild(parentContainer);

        // don't draw until we have nav info
        // fix: screen kept drawing black
        drawEnvelopeCanvas()
    }, [])

    useEffect( () => {
        console.log(`useEffect(envelope-canvas): []`)
        addHandlers()

        return () => {
            console.log(`useEffect(envelope-canvas): [] - removeAllListeners`)
            parentContainer.removeAllListeners()

            TempoService.eventsEmitter.removeListener('MIDI pulse', handleMidiPulse)
        }
    }, [])

    const handleMidiPulse = (e:any) => {
        drawEnvelopeCanvas()
    }

    const addHandlers = () : void => {
        console.log(`addHandlers: new mouse handlers: numsteps ${sequence.numSteps}`)
        parentContainer.removeAllListeners()
        parentContainer.on('pointerdown', (e: any) => {
            handlePointerDown(e)
        })
        parentContainer.on('dblclick', (e: any) => {
            handleDoubleClick(e)
        })
        parentContainer.on('pointerup', (e: any) => {
            handlePointerUp(e)
        })
        parentContainer.on('mouseupoutside', (e: any) => {
            handlePointerUp(e)
        })
        parentContainer.on('pointermove', (e: any) => {
            handlePointerMove(e)
        })

        TempoService.eventsEmitter.addListener('MIDI pulse', handleMidiPulse)
    }

    useEffect(() => {
        console.log(`useEffect(envelope-canvas): [sequence, currentStepNum]`)
        sequenceRef.current = sequence
        if (sequence) {
            drawEnvelopeCanvas()
        }
    }, [sequence]);

    useEffect(() => {
        console.log(`useEffect(envelope-canvas): [navigationInfo] ${JSON.stringify(navigationInfo)}`)
        navigationInfoRef.current = navigationInfo
        if (sequence) {
            console.log(`useEffect(envelope-canvas): [navigationInfo] - drawEnvelopeCanvas`)
            drawEnvelopeCanvas()
        }
    }, [navigationInfo]);

    // useEffect(() => {
    //     console.log(`useEffect(envelope-canvas): [useNavStore()] ${JSON.stringify(navigationInfo)}`)
    //     navigationInfoRef.current = navigationInfo
    //     if (sequence) {
    //         console.log(`useEffect(envelope-canvas): [useNavStore()] - drawEnvelopeCanvas`)
    //         drawEnvelopeCanvas()
    //     }
    // }, [useNavStore()]);

    function getValueY(value: number, minValue: number, maxValue: number) {
        return height - bottomBorderHeight - (value - minValue) / (maxValue - minValue) * (height - bottomBorderHeight - topBorderHeight);
    }

    function getYValue(sequence: Sequence, y: number, minValue: number, maxValue: number) {
        // console.log(`getYValue: y ${y} minValue ${minValue} maxValue ${maxValue}`)
        var value = maxValue - (maxValue - minValue) * (y - bottomBorderHeight) / (height - bottomBorderHeight - topBorderHeight);
        // console.log(`getValueForY ${y} : ${getValueY(value, minValue, maxValue)} (value is ${value})`)
        value = Math.max(value, minValue)
        value = Math.min(value, maxValue)
        return value
    }

    function getTime64thsX(sequence: Sequence, navigationInfo: NavigationInfo, time64ths: number) {
        const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
        const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
        const span64ths = end64th - start64th
        // const maxTime = sequence.steps.length * sequence.tempo / 60 / sequence.division

        const x =  borderWidth + (time64ths - start64th) / span64ths * (width - borderWidth - borderWidth)
        // console.log(`getTime64thsX ${time64ths} / ${span64ths} * ${(width - borderWidth - borderWidth)} => ${x} (span is ${span64ths} 64ths`)
        return x
    }

    function getXTime64ths(sequence: Sequence, navigationInfo: NavigationInfo, x: number) {
        const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
        const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
        const span64ths = end64th - start64th

        // console.log(`getXTime64ths: sequence.steps ${sequence.steps.length} * sequence.tempo ${sequence.tempo} / 60 / sequence.division ${sequence.division}`)
        // const maxTime = sequence.steps.length * sequence.tempo / 60 / sequence.division
        const time64ths = start64th + (x - borderWidth) / (width - borderWidth - borderWidth) * span64ths
        // console.log(`getXTime64ths ${x} => ${time64ths} : ${getTime64thsX(sequence, navigationInfo, time64ths)}`)
        return time64ths
    }

    function getXTimeSeconds(sequence: Sequence, x: number) {
        const time = (x - borderWidth) / (width - borderWidth - borderWidth) * sequence.steps.length //maxTime
        return time
    }

    function getNoteTop(note: number) {
        return height - bottomBorderHeight - (note + 12 - minNote) / (maxNote - minNote + 12) * (height - bottomBorderHeight - topBorderHeight);
    }

    function getNoteBottom(note: number) {
        return getNoteTop(note - 12) + lineThickness;
        // return bottomBorderHeight - lineThickness + (note - minNote) / (maxNote - minNote + 12) * (1 - bottomBorderHeight - topBorderHeight);
    }

    function getNoteHeight() {
        return (height - bottomBorderHeight - topBorderHeight) * 12 / (maxNote - minNote + 12);
    }

    function getStepLeft(sequence: Sequence, stepNum: number) {
        const timeSignatureNumerator = sequence.getTimeSignatureBeatsForBar(0)
        const timeSignatureDivision = sequence.getTimeSignatureDivisionForBar(0)
        const numStepsPerBar = sequence.division * timeSignatureNumerator / timeSignatureDivision
        const barNum = Math.floor(stepNum / numStepsPerBar)
        const stepsRemaining = stepNum - (barNum * numStepsPerBar)
        const remaining64ths = stepsRemaining * 64 / sequence.division

        const barX = getBarX(sequence, navigationInfo, barNum)
        const barStride = getBarStride(sequence, navigationInfo, barNum)
        const x = barX + remaining64ths * barStride / 64
        // console.log(`getStepLeft: stepNum ${stepNum} numStepsPerBar ${numStepsPerBar} barNum ${barNum} barStride ${barStride} barDivision ${timeSignatureDivision} stepsRemaining ${stepsRemaining} remaining64ths ${remaining64ths} barX ${barX}`)
        return x
        // var stride = getStepStride(sequence)
        // // console.log(`getStepLeft: borderWidth ${borderWidth} num steps ${sequence.steps.length} stride ${stride}`)
        // return borderWidth + stepNum * stride;
    }

    function getStepRight(sequence: Sequence, stepNum: number) {
        var stride = getStepStride(sequence, navigationInfo)
        var step = sequence.steps[stepNum];
        return getStepLeft(sequence, stepNum) + stride * step.gateLength - lineThickness;
    }

    function getBarX(sequence: Sequence, navigationInfo: NavigationInfo, barNum: number) {
        var x: number = borderWidth - navigationInfo.startSixtyfourth * getBarStride(sequence, navigationInfo, barNum) / 64;
        for (var bar = navigationInfo.startBar; bar < barNum; bar++) {
            x += getBarStride(sequence, navigationInfo, bar)
        }
        return x
    }

    function getBeatX(sequence: Sequence, navigationInfo: NavigationInfo, barNum: number, beatNum: number) {
        var x: number = getBarX(sequence, navigationInfo, barNum)
        const beatStride: number = getBeatStride(sequence, navigationInfo, barNum)
        x += beatStride * beatNum
        return x
    }

    function getBarStride(sequence: Sequence, navigationInfo: NavigationInfo, barNum: number) {
        const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
        const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
        const span64ths = end64th - start64th
        const stride = 64 / span64ths * (width - (borderWidth * 2)) * sequence.getTimeSignatureBeatsForBar(barNum) / 4
        // console.log(`getBarStride: span64ths ${span64ths} => stride ${stride}`)
        return stride
    }

    function getBeatStride(sequence: Sequence, navigationInfo: NavigationInfo, barNum: number) {
        const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
        const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
        const span64ths = end64th - start64th
        const stride = 64 / sequence.getTimeSignatureDivisionForBar(barNum) / span64ths * (width - (borderWidth * 2))
        // console.log(`getBeatStride: span64ths ${span64ths} => stride ${stride}`)
        return stride
    }

    function getStepStride(sequence: Sequence, navigationInfo: NavigationInfo) {
        const start64th = navigationInfo.startSixtyfourth + navigationInfo.startBar * 64
        const end64th = navigationInfo.endSixtyfourth + navigationInfo.endBar * 64
        const span64ths = end64th - start64th
        const stride = 64 / sequence.division / span64ths * (width - (borderWidth * 2))
        return stride
    }

    function getStepWidth(sequence: Sequence, navigationInfo: NavigationInfo, stepNum: number) {
        var stride = getStepStride(sequence, navigationInfo);
        var step = sequence.steps[stepNum];
        return stride * step.gateLength;
    }

    const handlePointerDown = (e: any) => {
        const sequence: Sequence = sequenceRef.current
        console.log(`handlePointerDown: numsteps ${sequence.numSteps} ${JSON.stringify(sequence.envelopes)}`)

        if (midiLearnMode) {
            return
        }

        var x = e.data.global.x
        var y = e.data.global.y

        // if (sequence.currentEnvelopeId == "notes") {
        //     dragStepNum = getStepNumAtX(sequence, x)

        //     console.log(`handlePointerDown: ${x},${y} dragStepNum ${dragStepNum} target ${dragTarget} tapPointNum ${tapPointNum}`)
        //     console.log(`handlePointerDown: step ${JSON.stringify(sequence.steps[dragStepNum])}`);

        //     if (dragStartPos.y > height - bottomBorderHeight) {
        //         dragTarget = DragTargets.NoteBox
        //     } else if (dragStartPos.y < getNoteBottom(sequence.steps[dragStepNum].note) && dragStartPos.y > getNoteTop(sequence.steps[dragStepNum].note)) {
        //         dragTarget = DragTargets.OctaveBox
        //     } else if (dragStartPos.y > bottomBorderHeight && dragStartPos.y < height - topBorderHeight) {
        //         console.log(`drag velocity box y = ${dragStartPos.y}`)
        //         dragTarget = DragTargets.VelocityBox
        //     }

        //     console.log(`handlePointerDown: step ${dragStepNum} target ${dragTarget}`)
        // } else {
            const envelope = findEnvelope(sequence, sequence.currentEnvelopeId);
            const newTapPointNum = getEnvelopePointNumAtPos(envelope, x, y)

            if (waitingForDoubleClick && x === dragStartPos.x && y === dragStartPos.y) {
                waitingForDoubleClick = false;
                if (tapPointNum === -1 || tapPointNum === newTapPointNum) {
                    // If first tap was on a point then second must be on the same point
                    return handleDoubleClick(e);
                }
            }

            tapPointNum = newTapPointNum
            if (tapPointNum !== -1) {
                dragTarget = DragTargets.EnvelopePoint
            }
        // }

        waitingForDoubleClick = true
        setTimeout(() => { waitingForDoubleClick = false; }, 600);

        // console.log(`handlePointerDown ${mouseIsDown} ${JSON.stringify(e.data)}`)
        mouseIsDown = true;
        dragStartPos = { x: x, y: y, }
    }

    const handlePointerUp = (e: any) => {
        console.log(`handlePointerUp ${mouseIsDown}`)
        mouseIsDown = false;
        dragStepNum = -1
        isDraggingVertical = false;
        isDraggingHorizontal = false;
        //
        // setTimeout(() => {
        //     addHandlers()
        // }, 100)
    }

    const handlePointerMove = (e: any) => {
        if (mouseIsDown) {
            handleThrottledPointerMove(e)
        }
    }

    const handleThrottledPointerMove = throttle((e: any) => {
        handlePointerMoveImp(e)
    }, 60)

    const getControllerMinMax = (sequence: Sequence, controller: string) => {
        // console.trace(`sequence.midiSettings.midiOutputDeviceName ${sequence.midiSettings.midiOutputDeviceName}`)
        const midiOutputDeviceName : string = sequence.midiSettings.midiOutputDeviceName
        const midiChart:MidiChart | undefined = findMidiChart(midiOutputDeviceName)

        var controllerMin = 0
        var controllerMax = 127
        if (midiChart) {
            const controllerInfo: ControllerInfo = MidiDeviceDataService.getControllerInfo(midiChart, controller)
            controllerMin = controllerInfo.min
            controllerMax = controllerInfo.max
        }

        return [controllerMin, controllerMax]
    }

    const handlePointerMoveImp = (e: any) => {
        const sequence = sequenceRef.current
        const navigationInfo = navigationInfoRef.current

        if (mouseIsDown) {
            var x = e.data.global.x
            var y = e.data.global.y
            if (x !== null && y !== null && x !== Infinity && y !== Infinity) {
                // console.log(`drag ${JSON.stringify(e.data)}`)
                if (dragTarget === DragTargets.EnvelopePoint) {
                    console.log(`handlePointerMoveImp ${x},${y} - drag target is EnvelopePoint - tapPointNum ${tapPointNum}`)
                    const envelope = findEnvelope(sequence, sequence.currentEnvelopeId);

                    const [controllerMin, controllerMax] = getControllerMinMax(sequence, envelope.controller)

                    if (envelope) {
                        // const point = envelope.points[tapPointNum]
                        const quantize64ths = 1
                        var time = Math.max(getXTime64ths(sequence, navigationInfo, x), 0)
                        time = Math.floor((time + 0.5) / quantize64ths) * quantize64ths
                        if (tapPointNum > 0) {
                            time = Math.max(time, envelope.points[tapPointNum - 1].time64ths)
                        }
                        if (tapPointNum < envelope.points.length - 1) {
                            time = Math.min(time, envelope.points[tapPointNum + 1].time64ths)
                        }
                        const value: number = getYValue(sequence, y, controllerMin, controllerMax)
                        const isLastPoint = tapPointNum < envelope.points.length - 1
                        if (isLastPoint) {
                            console.log(`handlePointerMoveImp - drag EnvelopePoint to ${time}/${value} - envelope.length <${envelope.length64ths}>`)
                            if (time > 16 && time > envelope.length64ths && x >= width) {
                                console.log(`nav expand time ${time} > ${envelope.length64ths}`)
                                var viewEnd64th = Math.max(Math.floor(time) + 1, 32)
                                if (envelope.locked) {
                                    viewEnd64th = Math.max(viewEnd64th, sequence.numSteps * 64 / sequence.division)
                                }
                                setViewEnd64th(viewEnd64th)
                            } else if (x < width * 0.25 && getViewEnd64th() > 32 && envelope.length64ths < getViewEnd64th() - 10) {
                                console.log(`nav shrink - envelope.length ${envelope.length64ths} < getViewEnd64th() ${getViewEnd64th() - 10}`)
                                var viewEnd64th = getViewEnd64th() - 8
                                if (envelope.locked) {
                                    viewEnd64th = Math.max(viewEnd64th, sequence.numSteps * 64 / sequence.division)
                                }
                                setViewEnd64th(viewEnd64th)
                            }
                        }
                        moveEnvelopePoint(sequence.currentEnvelopeId, tapPointNum, time, value)
                    }
                }
                else if (dragTarget === DragTargets.OctaveBox) {
                    // Detect direction before we start editing
                    if (!isDraggingVertical && !isDraggingHorizontal) {
                        if (Math.abs(y - dragStartPos.y) > dragThresholdVertical) {
                            console.log(`dragging direction vertical`)
                            isDraggingVertical = true;
                        }
                        else if (Math.abs(x - dragStartPos.x) > dragThresholdHorizontal) {
                            console.log(`dragging direction horizontal`)
                            isDraggingHorizontal = true;
                        }
                        else {
                            return
                        }
                    }

                    if (isDraggingVertical) {
                        // console.log(`drag note: ${sequence.steps[dragStepNum].note} ${x},${y} `);
                        const notenum = sequence.steps[dragStepNum].note;
                        if (y < getNoteTop(notenum)) {
                            console.log(`drag y ${y} < ${getNoteTop(notenum)} getNoteTop note for note ${notenum}, dragStepNum ${dragStepNum}`)
                            setStepNote(dragStepNum, notenum + 12)
                        } else if (y > getNoteBottom(notenum)) {
                            console.log(`drag y ${y} > ${getNoteBottom(notenum)} getNoteBottom for note ${notenum}, dragStepNum ${dragStepNum}`)
                            setStepNote(dragStepNum, notenum - 12)
                        }
                    }
                    else {
                        // var stride = getStepStride(sequence);
                        console.log(`dragging step ${dragStepNum}`)
                        var newGateLength = (x - getStepLeft(sequence, dragStepNum)) / getStepStride(sequence, navigationInfo)
                        if (x < getStepLeft(sequence, dragStepNum)) {
                            newGateLength = 0;
                        } else if (x > getStepLeft(sequence, dragStepNum) + getStepStride(sequence, navigationInfo)) {
                            newGateLength = 1.0
                        }
                        console.log(`dragging step ${dragStepNum} to newGateLength ${newGateLength} --- ${JSON.stringify(sequence.steps[dragStepNum])}`)
                        setStepGateLength(dragStepNum, newGateLength)
                    }
                }
                else if (dragTarget === DragTargets.NoteBox) {
                    const notenum = sequence.steps[dragStepNum].note;
                    if (y - dragStartPos.y > bottomBorderHeight) {
                        setStepNote(dragStepNum, notenum - 1)
                        dragStartPos.y = y
                    } else if (y - dragStartPos.y < -bottomBorderHeight) {
                        setStepNote(dragStepNum, notenum + 1)
                        dragStartPos.y = y
                    }
                }
                else if (dragTarget === DragTargets.VelocityBox) {
                    // const velocity = sequence.steps[dragStepNum].velocity;
                    y = minmax(y, topBorderHeight, height - bottomBorderHeight);
                    const newVelocity = 127 - (127 * (y - topBorderHeight) / (height - topBorderHeight - bottomBorderHeight))
                    console.log(`drag velocitybox ${y} => ${newVelocity}`)
                    setStepVelocity(dragStepNum, newVelocity)
                }
            }
        }
    }

    const handleDoubleClick = (e: any) => {
        var x = e.data.global.x
        var y = e.data.global.y
        const sequence = sequenceRef.current
        console.log(`🖼️ handleDblClick ${x},${y} sequence.currentEnvelopeId ${sequence.currentEnvelopeId}`);
        const envelope = findEnvelope(sequence, sequence.currentEnvelopeId);
        console.log(`🖼️ handleDblClick envelope ${JSON.stringify(envelope)}`)
        if (envelope) {
            const [min, max] = getControllerMinMax(sequence, envelope.controller)
            const time = getXTime64ths(sequence, navigationInfo, x)
            const value = getYValue(sequence, y, min, max)
            var found = false
            for(const point of envelope.points) {
                if (Math.abs(point.time64ths - time) < 0.2 && Math.abs(point.value - value) < Math.abs(max - min) / 50) {
                    if (envelope.points.length == 1) {
                        deleteEnvelope(envelope.id)
                    } else {
                        deleteEnvelopePoint(envelope.id, point.time64ths, point.value);
                    }
                    found = true;
                    break;
                    console.log(`found point`);
                }
            }

            if (!found) {
                console.log(`🖼️ new point time ${time} value ${value}`)
                addEnvelopePoint(sequence.currentEnvelopeId, time, value);
            }
        }
    }

    function getEnvelopePointNumAtPos(envelope: Envelope, x: number, y: number) : number {
        const sequence = sequenceRef.current
        if (envelope) {
            const [controllerMin, controllerMax] = getControllerMinMax(sequence, envelope.controller)
            console.log(`getEnvelopePointNumAtPos: looking for ${x} ${y} in ${JSON.stringify(envelope.points)}`)
            let n = 0
            if (envelope) {
                for (const point of envelope.points) {
                    const pointx = getTime64thsX(sequence, navigationInfo, point.time64ths)
                    const pointy = getValueY(point.value, controllerMin, controllerMax)
                    console.log(`getEnvelopePointNumAtPos: try ${point.time64ths},${point.value} at ${pointx},${pointy}`)
                    if (Math.abs(x - pointx) <= 4.0 && Math.abs(y - pointy) <= 4.0) {
                        // if (Math.abs(point.time - time) < 0.15 && Math.abs(point.value - value) < Math.abs(controllerInfo.max - controllerInfo.min) / 50) {
                        console.log(`getEnvelopePointNumAtPos: found it (tapPointNum) ${n}`)
                        return n
                    }
                    ++n
                }
            }
        }

        console.log(`getEnvelopePointNumAtPos: not found(tapPointNum)`)
        return -1;
    }

    function getStepNumAtX(sequence: Sequence, x: number) : number {
        console.log(`getStepNumAtX: x ${x} numsteps ${sequence.numSteps}`)
        for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
            var stepleft = getStepLeft(sequence, stepNum);
            if (x > stepleft && x < getStepRight(sequence, stepNum)) {
                console.log(`tapped step ${stepNum}. stepleft ${stepleft} stepRight ${getStepRight(sequence, stepNum)}`)
                return stepNum
            }
        }

        return -1
    }

    const drawEnvelopeCanvas = () => {
        const sequence: Sequence = sequenceRef.current
        const sequencePlayer = SongPlayer.searchSequencePlayer(sequence._id)

        if (container) {
            container.destroy({ children: true })
        }

        container = new PIXI.Container();
        parentContainer.addChild(container);

        if (midiLearnMode) {
            // Background
            var bar = new PIXI.Graphics()
            // bar.lineStyle(2, 0x00FFFF, 1);
            bar.beginFill(backgroundLightColor, 1)
            bar.drawRect(0, 0, width, height)
            bar.endFill()
            container.addChild(bar)

            const text = new PIXI.Graphics();
            const t = new PIXI.Text(`MIDI Learn. Waiting for MIDI Input ...`, midiLearnTextStyle)
            // const t = new PIXI.BitmapText(`MIDI Learn`, { fontName: 'Bitmap Helvetica Bold'})
            t.anchor.set(0.5, 0.5)
            t.x = width / 2
            t.y = height / 2
            text.addChild(t)
            bar.addChild(text)
    
            return
        }

        const start64th = navigationInfo.startBar * 64 + navigationInfo.startSixtyfourth
        const end64th = navigationInfo.endBar * 64 + navigationInfo.endSixtyfourth
        const num64ths = end64th - start64th + 1

        // // Bar backgrounds
        // var bar = new PIXI.Graphics();
        // for (var barNum = startBar; barNum <= endBar; barNum++) {
        //     const x = getBarX(sequence, barNum)
        //     const w = getBarStride(sequence, barNum)
        //     console.log(`bar background ${x} ${w}`)
        //     bar.beginFill(Math.floor(barNum % 2) == 0 ? 0x9f9f9f : 0xa5a5a5, 1);
        //     bar.drawRect(x, topBorderHeight, w, height - topBorderHeight - bottomBorderHeight);
        //     bar.endFill()
        // }
        // container.addChild(bar);

        console.log(`gonna get sequence.currentEnvelopeId ${sequence.currentEnvelopeId}`)
        const envelope: Envelope = getEnvelopeById(sequence, sequence.currentEnvelopeId)
        const envelopeEndX = getTime64thsX(sequence, navigationInfo, envelope.length64ths)

        // Beat backgrounds
        var bar = new PIXI.Graphics();
        const num64thsPerBeat = 64 / sequence.getTimeSignatureDivisionForBar(navigationInfo.startBar)
        const beatWidth = getBarStride(sequence, navigationInfo, navigationInfo.startBar) / 64 * num64thsPerBeat
        // var dark: boolean = true
        var saveLastX = -1
        for (var x = getBarX(sequence, navigationInfo, navigationInfo.startBar); x < width; x += beatWidth) {
            const beatNum = Math.round(x / beatWidth)
            const dark = beatNum % 2 === 0

            // console.log(`bar background ${x} ${beatWidth}`)
            // const color = x < envelopeEndX ? (dark ? backgroundDarkColor : backgroundLightColor) : (dark ? dividerDarkColor : dividerDarkColor)
            var color = dark ? backgroundDarkColor : backgroundLightColor
            if (x > envelopeEndX) {
                color -= 0x202020
                if (saveLastX === -1) {
                    saveLastX = x
                }
            }
            bar.beginFill(color, 1);
            bar.drawRect(x, topBorderHeight, beatWidth, height - topBorderHeight - bottomBorderHeight);
            bar.endFill();

            // dark = !dark
        }
        // Extra rect if the envelope ends part way through a bar
        if (saveLastX !== -1) {
            const beatNum = Math.round(x / beatWidth)
            const dark = beatNum % 2 !== 0
            var color = dark ? backgroundDarkColor : backgroundLightColor
            color -= 0x202020
            bar.beginFill(color, 1);
            bar.drawRect(saveLastX, topBorderHeight, envelopeEndX - (saveLastX), height - topBorderHeight - bottomBorderHeight);
            bar.endFill();
        }
        container.addChild(bar);

        // Top border
        bar = new PIXI.Graphics();
        bar.beginFill(borderColor, 1);
        // @ts-expect-error TS(2554): Expected 4 arguments, but got 5.
        bar.drawRect(0, 0, width, topBorderHeight, 16);
        bar.endFill();
        container.addChild(bar);

        // Bottom border
        bar = new PIXI.Graphics();
        bar.beginFill(borderColor, 1);
        bar.drawRect(0, height-bottomBorderHeight, width, bottomBorderHeight);
        bar.endFill();
        container.addChild(bar);

        // Sides
        bar = new PIXI.Graphics();
        bar.beginFill(borderColor, 1);
        bar.drawRect(0, topBorderHeight, borderWidth, height - bottomBorderHeight - topBorderHeight);
        bar.drawRect(width - borderWidth, topBorderHeight, borderWidth, height - bottomBorderHeight - topBorderHeight);
        bar.endFill();
        container.addChild(bar);

        // Horizontal grid lines
        const lineColor = 0x676767 //0x868686;
        var lines = new PIXI.Graphics();
        // console.log(`minnote ${minNote} ${getNoteTop(minNote)} ${getNoteTop(minNote - 12)}`)
        // lines.position.set(borderWidth, getNoteTop(minNote - 12));
        lines.lineStyle(1, lineColor, 1)
            .moveTo(borderWidth, getNoteTop(minNote - 12))
            .lineTo(width - borderWidth, getNoteTop(minNote - 12))
            .moveTo(borderWidth, getNoteTop(minNote))
            .lineTo(width - borderWidth, getNoteTop(minNote))
            .moveTo(borderWidth, getNoteTop(minNote + 12))
            .lineTo(width - borderWidth, getNoteTop(minNote + 12))
            .moveTo(borderWidth, getNoteTop(minNote + 24))
            .lineTo(width - borderWidth, getNoteTop(minNote + 24))
            .moveTo(borderWidth, getNoteTop(minNote + 36))
            .lineTo(width - borderWidth, getNoteTop(minNote + 36))
            .moveTo(borderWidth, getNoteTop(minNote + 48))
            .lineTo(width - borderWidth, getNoteTop(minNote + 48))
        container.addChild(lines);

        // 16th or 64th lines
        lines = new PIXI.Graphics();
        const divisor = getViewRange64ths() >= 128 ? 4 : 1;
        const startx = getBarX(sequence, navigationInfo, navigationInfo.startBar)
        const barStride = getBarStride(sequence, navigationInfo, navigationInfo.startBar)
        for (var n = 0; n < num64ths; n += divisor) {
            lines.lineStyle(1, n % 2 == 0 ? dividerSuperLightColor : dividerLightColor, 1)
            const x = startx + n * barStride / 64
            // console.log(x)
            lines.moveTo(x, bottomBorderHeight)
                .lineTo(x, height - topBorderHeight)
        }
        container.addChild(lines);

        // Beat lines
        lines.lineStyle(1, dividerDarkColor, 1)
        for (var barNum = navigationInfo.startBar; barNum <= navigationInfo.endBar + 1; barNum++) {
            for (var beatNum = 0; beatNum < sequence.getTimeSignatureBeatsForBar(barNum); beatNum ++) {
                const xx = getBeatX(sequence, navigationInfo, barNum, beatNum);
                // console.log(`beat line ${beatNum} line at ${xx}`)
                if (xx > width) {
                    break;
                }
                lines.moveTo(xx, bottomBorderHeight)
                    .lineTo(xx, height - topBorderHeight)
            }
            container.addChild(lines);
        }

        // var drawNotes: boolean = sequence.currentEnvelopeId === 'notes'
        // if (!drawNotes) {
        //     const envelope : Envelope | undefined = sequence.envelopes.find((envelope: any) => envelope.id === sequence.currentEnvelopeId);
        //     if (envelope) {
        //         drawNotes = envelope.locked
        //     }
        // }

        const drawNotes: boolean = envelope && envelope.locked
        if (drawNotes) {
            // Velocity bars
            var stepNum = 0;
            var barColor = colorVelocityBar;
            barColor = sequence.skin.velocityColor;
            // sequence.steps.forEach((step: SequenceStep) => {
            for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
                const step = sequence.steps[stepNum]
                const bar = new PIXI.Graphics();
                //  bar.lineStyle(2, 0xFF00FF, 1);
                bar.beginFill(barColor, 1);
                var barHeight = height - bottomBorderHeight - getValueY(step.velocity, 0, 127);
                const x = getStepLeft(sequence, stepNum)
                const y = height - bottomBorderHeight - barHeight
                const width = getStepWidth(sequence, navigationInfo, stepNum)
                // console.log(`draw velocity bar at ${x},${y} w/h ${width}/${barHeight}`)
                bar.drawRect(x, y, width, barHeight);
                bar.endFill();
                container.addChild(bar);
            }
        }

        // Bar lines - dark on bars, else alternate light and superlight
        lines = new PIXI.Graphics();
        lines.lineStyle(2, dividerDarkColor, 1)
        for (var barNum = navigationInfo.startBar; barNum <= navigationInfo.endBar; barNum++) {
            const x = getBarX(sequence, navigationInfo, barNum)
            lines.moveTo(x, bottomBorderHeight)
                .lineTo(x, height - topBorderHeight)
        }
        container.addChild(lines);

        // const style = new PIXI.TextStyle({
        //     fontFamily: 'Helvetica',
        //     fontSize: 10,
        //     fontWeight: 'bold',
        //     fill: ['#f9a248'],
        // });
        //
        // var text = new PIXI.Graphics();
        // for (var barNum = navigationInfo.startBar; barNum <= navigationInfo.endBar; barNum++) {
        //     const t = new PIXI.Text(barNum, style);
        //     t.anchor.set(0.5, 1.11);
        //     t.x = getBarX(sequence, navigationInfo, barNum);
        //     t.y = topBorderHeight;
        //     container.addChild(t);
        // }

        // const style = new PIXI.TextStyle({
        //     fontName: 'Bitmap Helvetica Bold',
        //     fontSize: 10,
        //     fontWeight: 'bold',
        //     fill: ['#f9a248'],
        // });

        const showBeats: boolean = getViewRange64ths() < (64 * 4)
        const showHalves: boolean = getViewRange64ths() < (64 * 8)
        const increment = (showHalves && !showBeats) ? 2 : 1
        const show16ths: boolean = getViewRange64ths() < (64)
        var text = new PIXI.Graphics();
        for (var barNum = navigationInfo.startBar; barNum <= navigationInfo.endBar + 2; barNum++) {
            // console.log(`DrawEnvelope: barNum ${barNum}`)
            const t = new PIXI.BitmapText(`${barNum+1}`, { fontName: 'Bitmap Helvetica Bold'});
            t.anchor.set(0, 1.5);
            t.x = getBarX(sequence, navigationInfo, barNum);
            t.y = topBorderHeight;
            text.addChild(t);

            // Beats
            if (showBeats || showHalves) {
                for (var beatNum = 0; beatNum < sequence.getTimeSignatureBeatsForBar(barNum); beatNum += increment) {
                    const x = getBeatX(sequence, navigationInfo, barNum, beatNum);
                    if (x > width) {
                        break;
                    }
                    if (beatNum != 0) {
                        const t = new PIXI.BitmapText(`|${barNum+1}:${beatNum+1}`, {fontName: 'Bitmap Helvetica Bold'});
                        t.anchor.set(0, 1.5);
                        t.x = x;
                        t.y = topBorderHeight;
                        text.addChild(t);
                    }

                    if (show16ths) {
                        for (var snum = 4; snum < 16; snum += 4) {
                            const sx = x + snum / getViewRange64ths() * (width - (borderWidth * 2))
                            const t = new PIXI.BitmapText(`${barNum+1}:${beatNum+1}:${snum+1}`, {fontName: 'Bitmap Helvetica Bold'});
                            t.anchor.set(0, 1.5);
                            t.x = sx;
                            t.y = topBorderHeight;
                            text.addChild(t);
                        }
                    }
                }
            }
        }
        container.addChild(text)

        if (drawNotes) {
            // Note bars
            stepNum = 0;
            // const currentStepNum: number = useBoundStore.getState().currentStepNum
            for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
                const step = sequence.steps[stepNum]
                const bar = new PIXI.Graphics();
                barColor = sequencePlayer && stepNum === currentStepNumRef.current ? brightRed : brightGreen;
                bar.beginFill(barColor, 1);
                bar.drawRoundedRect(getStepLeft(sequence, stepNum), getNoteTop(step.note), getStepWidth(sequence, navigationInfo, stepNum), getNoteHeight(), 8);
                bar.endFill();
                container.addChild(bar);

                const noteText = new PIXI.Text(noteName[step.note % 12], noteBarTextStyle)
                noteText.anchor.set(0.5);
                // noteText.width = getStepStride(sequence)
                noteText.x = getStepLeft(sequence, stepNum) + getStepWidth(sequence, navigationInfo, stepNum) / 2
                noteText.y = getNoteTop(step.note) + getNoteHeight() / 2
                container.addChild(noteText)
            }

            // Bottom bars
            stepNum = 0;
            barColor = green;
            const stride = getStepStride(sequence, navigationInfo)
            for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
                const step = sequence.steps[stepNum]
                const bar = new PIXI.Graphics();
                bar.beginFill(0x707481, 1);
                const x = getStepLeft(sequence, stepNum)
                const width = getStepWidth(sequence, navigationInfo, stepNum)
                bar.drawRoundedRect(x, height - bottomBorderHeight, width, bottomBorderHeight, 4);
                bar.endFill();
                container.addChild(bar);

                const noteText = new PIXI.Text((step.note % 12), noteBarTextStyle)
                noteText.anchor.set(0.5);
                // noteText.width = getStepStride(sequence)
                noteText.x = getStepLeft(sequence, stepNum) + width / 2
                noteText.y = height - bottomBorderHeight + 10
                container.addChild(noteText)
            }
        }

        // if (sequence.currentEnvelopeId !== 'notes') {
            DrawEnvelopes(container, sequence)
        // }

        // Play cursor
        if (isPlayingRef.current) {
            const envelope = findEnvelope(sequence, sequence.currentEnvelopeId);
            var x = getTime64thsX(sequence, navigationInfo, TempoService.getElapsed64ths() % envelope.length64ths);
            // console.log(`DrawEnvelope: draw line ${x} for time ${Math.floor(TempoService.getElapsed64ths())} -> ${Math.floor(TempoService.getElapsed64ths() % envelope.length)}`)
            lines.lineStyle(2, 0x000000, 1)
            lines.moveTo(x, 0);
            lines.lineTo(x, height);
        }
    }

    function DrawEnvelopes(container: any, sequence: Sequence) {
        // if (sequence.currentEnvelopeId) {
            // console.log(`DrawEnvelopes: ${sequence.currentEnvelopeId}`)
            // if (sequence.currentEnvelopeId === "notes") {
            //     // don't draw envelopes
            // } else 
            if (midiLearnMode) {
                const bar = new PIXI.Graphics();
                bar.beginFill(white, 0.5);
                bar.drawRect(0, 0, width, height);
                bar.endFill();
                container.addChild(bar);

                const turnAKnobText = new PIXI.Text("Turn a knob to map", turnAKnobTextStyle)
                turnAKnobText.anchor.set(0.5);
                turnAKnobText.width = width / 2
                turnAKnobText.x = width / 2
                turnAKnobText.y = height / 2
                container.addChild(turnAKnobText)
            } else {
                // console.log(`DrawEnvelopes: ${JSON.stringify(sequence.envelopes)}`)
                for (const envelope of sequence.envelopes) {
                    // console.log(`DrawEnvelopes: ${JSON.stringify(envelope)}`)
                    if (envelope.id === sequence.currentEnvelopeId) {
                        DrawEnvelope(container, sequence, envelope)
                    }
                }
            }
        // }
    }

    function DrawEnvelope(container: any, sequence: Sequence, envelope: Envelope) {
        // console.log(`✉️ DrawEnvelope: ${JSON.stringify(envelope)}, sequence.midiSettings ${JSON.stringify(sequence.midiSettings)}`)

        const [min, max] = getControllerMinMax(sequence, envelope.controller)

        // const midiOutputDeviceName : string = sequence.midiSettings.midiOutputDeviceName
        // const midiChart:MidiChart | undefined = findMidiChart(midiOutputDeviceName)
        // // console.log(`✉️ midiChart instanceof MidiChart ${midiChart instanceof MidiChart} <${JSON.stringify(midiChart)}>`)
        // const controller: ControllerInfo = MidiDeviceDataService.getControllerInfo(midiChart, envelope.controller)
        // console.log(`DrawEnvelope controller instanceof ControllerInfo ? ${controller instanceof ControllerInfo}`)
        //
        // console.log(`DrawEnvelope: ${envelope.controller} - envelope.controller ${JSON.stringify(envelope.controller)}`)
        // console.log(`DrawEnvelope: ${envelope.controller} - midi chart ${JSON.stringify(midiChart)}`)
        // console.log(`DrawEnvelope: ${envelope.controller} - controller info ${JSON.stringify(controller)}`)

        // if (envelope.controller !== "notes") {
            // console.log(`DrawEnvelope: envelope.controller is ${envelope.controller}`)
            // console.log(`DrawEnvelope: ${sequence.envelopes}/${sequence.envelopes.length}`)

            if (envelope.controller == null) {
            } else {
                const points = envelope.points
                // console.log(`DrawEnvelope: We have ${envelope.controllers.length} controllers with points ${JSON.stringify(points)}`)
                // console.log(`DrawEnvelope: point 0 ${JSON.stringify(points[0])}`)

                // Lines
                const lineColor = envelopeLineColor;
                var lines = new PIXI.Graphics();
                lines.position.set(0, 0);
                lines.lineStyle(1, lineColor, points.length > 1 ? 1 : 0.35)
                var y = getValueY(points[0].value, min, max)
                lines.moveTo(0, y)
                points.forEach((point: EnvelopePoint) => {
                    var x = getTime64thsX(sequence, navigationInfo, point.time64ths)
                    y = getValueY(point.value, min, max)
                    // console.log(`point ${JSON.stringify(point)} draw line to time ${point.time} value ${point.value} ${x},${y}`)
                    lines.lineTo(x, y)
                })

                lines.lineTo(width, y);

                // Play cursor
                // var x = getTime64thsX(sequence, navigationInfo, TempoService.getElapsed64ths() % envelope.length);
                // // console.log(`DrawEnvelope: draw line ${x} for time ${Math.floor(TempoService.getElapsed64ths())} -> ${Math.floor(TempoService.getElapsed64ths() % envelope.length)}`)
                // lines.moveTo(x, 0);
                // lines.lineTo(x, height);
                // console.log(`line`)

                // Dots
                (lines as any).fillStyle = { color: lineColor, alpha: 0.5, visible: true };
                lines.beginFill(lineColor)
                points.forEach((point: any) => {
                    var x = getTime64thsX(sequence, navigationInfo, point.time64ths)
                    y = getValueY(point.value, min, max)
                    // console.log(`point ${JSON.stringify(point)} draw dot ${point.time64ths} value ${point.value} ${x},${y}`)
                    lines.drawCircle(x, y, 4)
                })

                container.addChild(lines);
            }
        // }
    }

    const findEnvelope = (sequence: Sequence, id: string) => {
        // console.log(`findEnvelope: ${id} in ${JSON.stringify(sequence)}`)
        if (sequence.envelopes != null) {
            for (const envelope of sequence.envelopes) {
                if (envelope.id === id) {
                    // console.log(`findEnvelope: ${id} => found ${JSON.stringify(envelope)}`)
                    return envelope
                }
            }
        }
        throw Error(`findEnvelope: ${id} not found`)
    }

    return (
        <div className="sequence-canvas-outline">
            <div className="sequence-canvas">
                <canvas {...props} ref={canvasRef}>
                    Your browser does not support the HTML canvas tag.
                </canvas>
            </div>
        </div>
    );
})

// export {EnvelopeCanvas, drawEnvelopeCanvas};
export {EnvelopeCanvas};
