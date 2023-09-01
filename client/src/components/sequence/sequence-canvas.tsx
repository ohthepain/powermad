import React, {useEffect, useMemo, useRef} from 'react';
import * as PIXI from 'pixi.js'
import SongPlayer from "../../player/song-player";
import throttle from "../../util/throttle";
import MidiDeviceDataService, {ControllerInfo, MidiChart, MidiChartDataService} from "../../services/device-service"
import {Sequence, Envelope, EnvelopePoint, SequenceStep} from "../../player/sequence";
import {findMidiChart} from "../../util/midi-utils";
import {useSequenceStore} from "../../app/state/sequence-store";
import {useBoundStore} from "../../app/state/bound-store";
import { usePositionStore } from '../../app/state/position-store';
import {NavigationInfo} from "../../app/state/nav-store";
import TempoService from "../../services/tempo-service";
import { RecordMode } from '../../app/state/edit-state-slice';
import {BitmapText} from "pixi.js";
import { WebMidi } from 'webmidi';

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
const backgroundLightColorSelected = 0xbfe9ff
const backgroundDarkColorSelected = 0xb2d9ee
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
    SelectionArea: 5,
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

const turnAKnobTextStyle = new PIXI.TextStyle({
    align: "center",
    fill: "#000000",
    fontFamily: "Helvetica",
    fontSize: 36,
});

const noteNames = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
]

const SequenceCanvas = React.forwardRef((props: any, ref) => {

    const sequence: Sequence = useSequenceStore(state => { return state.sequence} )
    const setStepNote = useSequenceStore(state => state.setStepNote)
    const setStepVelocity = useSequenceStore(state => state.setStepVelocity)
    const setStepGateLength = useSequenceStore(state => state.setStepGateLength)
    const addEnvelopePoint = useSequenceStore(state => state.addEnvelopePoint)
    const moveEnvelopePoint = useSequenceStore(state => state.moveEnvelopePoint)
    const deleteEnvelopePoint = useSequenceStore(state => state.deleteEnvelopePoint)
    const deleteEnvelope = useSequenceStore(state => state.deleteEnvelope)
    const currentPulseNum = usePositionStore(state => state.pulseNum)
    const currentPulseTime = usePositionStore(state => state.pulseTime)
    const currentPulseDuration = usePositionStore(state => state.pulseDuration)
    const currentStepNum = usePositionStore(state => state.currentStepNum)
    const selectSteps = useBoundStore(state => state.selectSteps)

    const navigationInfo = useBoundStore(state => state.navigationInfo)
    const setViewEnd64th = useBoundStore(state => state.setViewEnd64th)
    const getViewEnd64th = useBoundStore(state => state.getViewEnd64th)
    const getViewRange64ths = useBoundStore(state => state.getViewRange64ths)
    const recordMode = useBoundStore(state => state.recordMode)
    const currentEditStepNum = useBoundStore(state => state.currentEditStepNum)
    const selectedStepNumStart = useBoundStore(state => state.selectedStepNumStart)
    const selectedStepNumEnd = useBoundStore(state => state.selectedStepNumEnd)

    const canvasRef = useRef(null)
    const sequenceRef = useRef<Sequence>(sequence);
    const currentStepNumRef = useRef(currentStepNum)
    const currentPulseNumRef = useRef(currentPulseNum)
    const currentPulseTimeRef = useRef(currentPulseTime)
    const currentPulseDurationRef = useRef(currentPulseDuration)
    const recordModeRef = useRef(recordMode)
    const currentEditStepNumRef = useRef(currentEditStepNum)
    const navigationInfoRef = useRef<NavigationInfo>(navigationInfo)

    // const [midiLearnMode, setMidiLearnMode] = useState(false)

    const fontHelveticaBold : PIXI.BitmapFont = useMemo<PIXI.BitmapFont>(() => {
        return PIXI.BitmapFont.from('Bitmap Helvetica Bold',
            { fontFamily: 'Helvetica', fontSize: 10, fontWeight: 'bold', fill: ['#f9a248'],},
            { chars: "0123456789:"})
    }, [])
    const fontHelvetica : PIXI.BitmapFont = useMemo<PIXI.BitmapFont>(() => {
        return PIXI.BitmapFont.from('Bitmap Helvetica', { fontFamily: 'Helvetica', fontSize: 10, fill: ['#f9a248'],})
    }, [])

    useEffect(() => {
        recordModeRef.current = recordMode
    }, [recordMode])

    useEffect(() => {
        currentEditStepNumRef.current = currentEditStepNum
    }, [currentEditStepNum])

    useEffect(() => {
        currentStepNumRef.current = currentStepNum
    }, [currentStepNum])

    useEffect(() => {
        currentPulseNumRef.current = currentPulseNum
    }, [currentPulseNum])

    useEffect(() => {
        currentPulseTimeRef.current = currentPulseTime
    }, [currentPulseTime])

    useEffect(() => {
        currentPulseDurationRef.current = currentPulseDuration
    }, [currentPulseDuration])

    useEffect(() => {
        console.log(`selectedStepNumStart ${selectedStepNumStart}`)
    }, [selectedStepNumStart])

    useEffect(() => {
        console.log(`selectedStepNumEnd ${selectedStepNumEnd}`)
    }, [selectedStepNumEnd])

    useEffect(() => {
        console.log(`useEffect(sequence-canvas): []`)
        const unsubscribe = useSequenceStore.subscribe((oldState, newState) => {
            // This seems to be called before the state change
            // console.log(`sequence-canvas: sequence-store state change ${newState.sequence.numSteps} ${sequence.numSteps} <---`)
            // drawSequenceCanvas()
        });

        const unsubscribe2 = useBoundStore.subscribe((oldState, newState) => {
            // console.log(`sequence-canvas: position store change`)
            // drawSequenceCanvas()
        });

        const unsubscribe3 = useBoundStore.subscribe((newState, oldState) => {
            // console.log(`🍕useNavStore - change: newState ${JSON.stringify(newState)} ${sequence.numSteps} <---`)
            // console.log(`🍕useNavStore - change: ourstate ${startBar}:xxx:${startSixtyFourth} to ${endBar}:xxx:${endSixtyFourth}`)
            // console.log(`🍕useNavStore - change: storestate ${useNavStore.getState().startBar}:${useNavStore.getState()}.xxx:${useNavStore.getState().startSixtyfourth} to ${useNavStore.getState().endBar}:xxx:${useNavStore.getState().endSixtyfourth}`)

            // drawSequenceCanvas()
        });

        return () => {
            console.log(`sequence-canvas: unsubscribe from store state changes`)
            unsubscribe3()
            unsubscribe2()
            unsubscribe()
        }
    }, [])

    useEffect(() => {
        console.log(`useEffect(sequence-canvas): []`)
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
        // fix? kept drawing black
        drawSequenceCanvas() 
    }, [])

    useEffect( () => {
        console.log(`useEffect(sequence-canvas): []`)
        addHandlers()

        return () => {
            console.log(`useEffect(sequence-canvas): [] - removeAllListeners`)
            parentContainer.removeAllListeners()

            TempoService.eventsEmitter.removeListener('MIDI pulse', handleMidiPulse)
        }
    }, [])

    const handleMidiPulse = (e:any) => {
        // console.log(`SequenceCanvas - MIDI pulse`)
        drawSequenceCanvas()
    }

    const addHandlers = () : void => {
        console.log(`addHandlers: new mouse handlers: numsteps ${sequence.numSteps}`)
        parentContainer.removeAllListeners()
        parentContainer.on('pointerdown', (e: any) => {
            handlePointerDown(e)
        })
        // parentContainer.on('dblclick', (e: any) => {
        //     handleDoubleClick(e)
        // })
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
        console.log(`useEffect(sequence-canvas): [sequence]`)
        sequenceRef.current = sequence
        if (sequence) {
            drawSequenceCanvas()
        }
    }, [sequence, recordMode, currentEditStepNum]);

    useEffect(() => {
        console.log(`useEffect(sequence-canvas): [navigationInfo] ${JSON.stringify(navigationInfo)}`)
        navigationInfoRef.current = navigationInfo
        if (sequence) {
            console.log(`selected steps: ${selectedStepNumStart} to ${selectedStepNumEnd}`)    
            console.log(`useEffect(sequence-canvas): [navigationInfo] - drawSequenceCanvas`)
            drawSequenceCanvas()
        }
    }, [selectedStepNumStart, selectedStepNumEnd]);

    // useEffect(() => {
    //     console.trace(`useEffect(sequence-canvas): [useNavStore()] ${JSON.stringify(navigationInfo)}`)
    //     navigationInfoRef.current = navigationInfo
    //     if (sequence) {
    //         console.log(`useEffect(sequence-canvas): [useNavStore()] - drawSequenceCanvas`)
    //         drawSequenceCanvas()
    //     }
    // }, [useBoundStore()]);

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
        return x
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
        var x = e.data.global.x
        var y = e.data.global.y
        dragStartPos = { x: x, y: y, }

        // if (sequence.currentEnvelopeId == "notes") 
        {
            dragStepNum = getStepNumAtX(sequence, x)

            console.log(`handlePointerDown: (notes) x,y = ${x},${y} dragStepNum ${dragStepNum} target ${dragTarget} tapPointNum ${tapPointNum}`)
            var step: any = undefined
            var velocityBarHeight : number = 0
            if (dragStepNum != -1) {
                step = sequence.steps[dragStepNum]
                velocityBarHeight = height - bottomBorderHeight - getValueY(step.velocity, 0, 127);
                // height - bottomBorderHeight - getValueY(step.velocity, 0, 127)
                console.log(`note bottom: ${getNoteBottom(step.note)} top: ${getNoteTop(step.note)}`)
                console.log(`note ${y} < bottom: ${dragStartPos.y < getNoteBottom(step.note)} > top: ${dragStartPos.y > getNoteTop(step.note)}`)
                // console.log(`handlePointerDown: (notes) step ${JSON.stringify(step)}`);
            }

            if (step && dragStartPos.y > height - bottomBorderHeight) {
                console.log(`handlePointerDown: note box: step ${dragStepNum} note ${step.note} target ${dragTarget}`)
                dragTarget = DragTargets.NoteBox
            } else if (step && dragStepNum != -1 && dragStartPos.y < getNoteBottom(step.note) && dragStartPos.y > getNoteTop(step.note)) {
                console.log(`handlePointerDown: octave box: step ${dragStepNum} note ${step.note} target ${dragTarget}`)
                dragTarget = DragTargets.OctaveBox
            } else if (step && dragStepNum != -1 && dragStartPos.y > bottomBorderHeight && dragStartPos.y > getValueY(step.velocity, 0, 127)) {
                // console.log(`handlePointerDown: velocity box y = ${dragStartPos.y} > ${velocityBarHeight}: step ${dragStepNum} note ${step.note} target ${dragTarget}`)
                dragTarget = DragTargets.VelocityBox
            } else {
                console.log(`handlePointerDown: selection area`)
                dragTarget = DragTargets.SelectionArea
            }
        }
        //  else {
        //     // console.log(`handlePointerDown: (envelope/not notes) ${x},${y} dragStepNum ${dragStepNum} note ${sequence.steps[dragStepNum].note} target ${dragTarget} tapPointNum ${tapPointNum}`)
        //     const envelope = findEnvelope(sequence, sequence.currentEnvelopeId);
        //     const newTapPointNum = getEnvelopePointNumAtPos(envelope, x, y)

        //     if (waitingForDoubleClick && x === dragStartPos.x && y === dragStartPos.y) {
        //         waitingForDoubleClick = false;
        //         if (tapPointNum === -1 || tapPointNum === newTapPointNum) {
        //             // If first tap was on a point then second must be on the same point
        //             return handleDoubleClick(e);
        //         }
        //     }

        //     tapPointNum = newTapPointNum
        //     if (tapPointNum !== -1) {
        //         dragTarget = DragTargets.EnvelopePoint
        //     }
        // }

        waitingForDoubleClick = true
        setTimeout(() => { waitingForDoubleClick = false; }, 600);

        // console.log(`handlePointerDown ${mouseIsDown} ${JSON.stringify(e.data)}`)
        mouseIsDown = true;
    }

    const handlePointerUp = (e: any) => {
        console.log(`handlePointerUp ${mouseIsDown}`)
        mouseIsDown = false;
        dragStepNum = -1
        isDraggingVertical = false;
        isDraggingHorizontal = false;
        var x = e.data.global.x
        // var y = e.data.global.y

        if (dragStartPos.x === x) {
            selectSteps(-1, -1)
        }

        //
        // setTimeout(() => {
        //     addHandlers()
        // }, 100)
    }

    const handlePointerMove = (e: any) => {
        if (mouseIsDown) {
            waitingForDoubleClick = false
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
                if (dragTarget === DragTargets.OctaveBox) {
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
                else if (dragTarget === DragTargets.SelectionArea) {
                    var startStepNum = getStepNumAtX(sequenceRef.current, dragStartPos.x)
                    var endStepNum = getStepNumAtX(sequenceRef.current, x)
                    if (dragStartPos.x !== x) {
                        selectSteps(Math.min(startStepNum, endStepNum), Math.max(startStepNum, endStepNum))
                    }
                }
            }
        }
    }

    // const handleDoubleClick = (e: any) => {
    //     var x = e.data.global.x
    //     var y = e.data.global.y
    //     const sequence = sequenceRef.current
    //     console.log(`🖼️ handleDblClick ${x},${y} sequence.currentEnvelopeId ${sequence.currentEnvelopeId}`);
    //     const envelope = findEnvelope(sequence, sequence.currentEnvelopeId);
    //     console.log(`🖼️ handleDblClick envelope ${JSON.stringify(envelope)}`)
    //     if (envelope) {
    //         const [min, max] = getControllerMinMax(sequence, envelope.controller)
    //         const time = getXTime64ths(sequence, navigationInfo, x)
    //         const value = getYValue(sequence, y, min, max)
    //         var found = false
    //         for(const point of envelope.points) {
    //             if (Math.abs(point.time64ths - time) < 0.2 && Math.abs(point.value - value) < Math.abs(max - min) / 50) {
    //                 if (envelope.points.length == 1) {
    //                     deleteEnvelope(envelope.id)
    //                 } else {
    //                     deleteEnvelopePoint(envelope.id, point.time64ths, point.value);
    //                 }
    //                 found = true;
    //                 break;
    //                 console.log(`found point`);
    //             }
    //         }

    //         if (!found) {
    //             console.log(`🖼️ new point time ${time} value ${value}`)
    //             addEnvelopePoint(sequence.currentEnvelopeId, time, value);
    //         }
    //     }
    // }

    // function getEnvelopePointNumAtPos(envelope: Envelope, x: number, y: number) : number {
    //     const sequence = sequenceRef.current
    //     if (envelope) {
    //         const [controllerMin, controllerMax] = getControllerMinMax(sequence, envelope.controller)
    //         console.log(`getEnvelopePointNumAtPos: looking for ${x} ${y} in ${JSON.stringify(envelope.points)}`)
    //         let n = 0
    //         if (envelope) {
    //             for (const point of envelope.points) {
    //                 const pointx = getTime64thsX(sequence, navigationInfo, point.time64ths)
    //                 const pointy = getValueY(point.value, controllerMin, controllerMax)
    //                 console.log(`getEnvelopePointNumAtPos: try ${point.time64ths},${point.value} at ${pointx},${pointy}`)
    //                 if (Math.abs(x - pointx) <= 3.0 && Math.abs(y - pointy) <= 3.0) {
    //                     // if (Math.abs(point.time - time) < 0.15 && Math.abs(point.value - value) < Math.abs(controllerInfo.max - controllerInfo.min) / 50) {
    //                     console.log(`getEnvelopePointNumAtPos: found it (tapPointNum) ${n}`)
    //                     return n
    //                 }
    //                 ++n
    //             }
    //         }
    //     }

    //     console.log(`getEnvelopePointNumAtPos: not found(tapPointNum)`)
    //     return -1;
    // }

    function getStepNumAtX(sequence: Sequence, x: number) : number {
        // console.log(`getStepNumAtX: x ${x} numsteps ${sequence.numSteps}`)
        for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
            var stepleft = getStepLeft(sequence, stepNum);
            if (x > stepleft && x < getStepLeft(sequence, stepNum+1)) {
            // if (x > stepleft && x < getStepRight(sequence, stepNum)) {
                // console.log(`tapped step ${stepNum}. stepleft ${stepleft} stepRight ${getStepRight(sequence, stepNum)}`)
                return stepNum
            }
        }

        return -1
    }

    const drawSequenceCanvas = () => {
        // console.log(`drawSequenceCanvas: currentStepNumRef.current ${currentStepNumRef.current}`)
        const radius = 8
        const sequence: Sequence = sequenceRef.current
        const sequencePlayer = SongPlayer.searchSequencePlayer(sequence._id)

        if (container) {
            container.destroy({ children: true })
        }

        container = new PIXI.Container();
        parentContainer.addChild(container);
        // container.clear();

        // Background - this does not seem to be necessary
        var bar = new PIXI.Graphics();
        // bar.lineStyle(2, 0x00FFFF, 1);
        bar.beginFill(0xff0000, 1);
        bar.drawRect(0, 0, width, height);
        bar.endFill();
        container.addChild(bar);
        // bar.clear()

        const start64th = navigationInfo.startBar * 64 + navigationInfo.startSixtyfourth
        const end64th = navigationInfo.endBar * 64 + navigationInfo.endSixtyfourth
        const num64ths = end64th - start64th + 1

        const num64thsPerStep = 64 / sequence.division

        // Beat backgrounds - compute per step
        var bar = new PIXI.Graphics();
        var dark: boolean = true
        const num64thsPerBeat = 64 / sequence.getTimeSignatureDivisionForBar(navigationInfo.startBar)
        const beatWidth = getBarStride(sequence, navigationInfo, navigationInfo.startBar) / 64 * num64thsPerBeat
        const stepWidth = getBarStride(sequence, navigationInfo, navigationInfo.startBar) / 64 * num64thsPerStep
        const startX = getBarX(sequence, navigationInfo, navigationInfo.startBar)
        var stepNum = getStepNumAtX(sequenceRef.current, startX+1)
        var barNum
        for (var x = startX; x < width; x += stepWidth) {
            barNum = Math.floor(stepNum / sequence.division)
            dark = barNum % 1 == 0
            // console.log(`bar background ${x} ${beatWidth}`)
            // bar.beginFill(dark ? 0x9f9f9f : 0xa5a5a5, 1);
            // console.log(`draw step ${stepNum}`)
            if (stepNum >= selectedStepNumStart && stepNum <= selectedStepNumEnd) {
                console.log(`draw selected background stepNum ${stepNum} x ${x}, top ${topBorderHeight}, width ${stepWidth}, height ${height - topBorderHeight - bottomBorderHeight}`)
                bar.beginFill(dark ? backgroundDarkColorSelected : backgroundLightColorSelected, 1)
            } else {
                bar.beginFill(dark ? backgroundDarkColor : backgroundLightColor, 1)
            }
            // bar.beginFill(dark ? backgroundDarkColorSelected : backgroundLightColorSelected, 1)
            bar.drawRect(x, topBorderHeight, stepWidth, height - topBorderHeight - bottomBorderHeight);
            bar.endFill();
            ++stepNum
        }
        container.addChild(bar);

        // Beat backgrounds
        // bar = new PIXI.Graphics();
        // for (var x = getBarX(sequence, navigationInfo, navigationInfo.startBar); x < width; x += beatWidth) {
        //     // console.log(`bar background ${x} ${beatWidth}`)
        //     // bar.beginFill(dark ? 0x9f9f9f : 0xa5a5a5, 1);
        //     bar.beginFill(dark ? backgroundDarkColor : backgroundLightColor, 1)
        //     // bar.beginFill(dark ? backgroundDarkColorSelected : backgroundLightColorSelected, 1)
        //     bar.drawRect(x, topBorderHeight, beatWidth, height - topBorderHeight - bottomBorderHeight);
        //     console.log(`draw background x ${x}, top ${topBorderHeight}, width ${beatWidth}, height ${height - topBorderHeight - bottomBorderHeight}`)
        //     bar.endFill();

        //     dark = !dark
        // }
        // container.addChild(bar);

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
        lines.lineStyle(1, 0x565656, 1) //0x989898
        const divisor = getViewRange64ths() >= 128 ? 4 : 1;
        const startx = getBarX(sequence, navigationInfo, navigationInfo.startBar)
        const barStride = getBarStride(sequence, navigationInfo, navigationInfo.startBar)
        for (var n = 0; n < num64ths; n += divisor) {
            const x = startx + n * barStride / 64
            // console.log(x)
            lines.moveTo(x, bottomBorderHeight)
                .lineTo(x, height - topBorderHeight)
        }
        container.addChild(lines);

        // console.log(`sequence.currentEnvelopeId ${sequence.currentEnvelopeId}`)
        // var drawNotes: boolean = sequence.currentEnvelopeId === 'notes'
        // if (!drawNotes) {
        //     const envelope : Envelope | undefined = sequence.envelopes.find((envelope: any) => envelope.id === sequence.currentEnvelopeId);
        //     if (envelope) {
        //         drawNotes = envelope.locked
        //     }
        // }

        const drawNotes: boolean = true
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
                var barHeight = height - bottomBorderHeight - getValueY(step.velocity, 0, 127)
                const x = getStepLeft(sequence, stepNum)
                const y = height - bottomBorderHeight - barHeight
                const width = getStepWidth(sequence, navigationInfo, stepNum)
                // console.log(`draw velocity bar at ${x},${y} w/h ${width}/${barHeight}`)
                bar.drawRect(x, y, width, barHeight);
                bar.endFill();
                container.addChild(bar);
            }
        }

        // Bar lines
        lines = new PIXI.Graphics();
        lines.lineStyle(2, 0x868686, 1)
        for (barNum = navigationInfo.startBar; barNum <= navigationInfo.endBar; barNum++) {
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
        for (barNum = navigationInfo.startBar; barNum <= navigationInfo.endBar + 1; barNum++) {
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
                        const t = new PIXI.BitmapText(`${barNum+1}:${beatNum+1}`, {fontName: 'Bitmap Helvetica Bold'});
                        t.anchor.set(0, 1.5);
                        t.x = x;
                        t.y = topBorderHeight;
                        text.addChild(t);
                    }

                    if (show16ths) {
                        for (var snum = 4; snum < 16; snum += 4) {
                            const sx = x + snum / getViewRange64ths() * (width - (borderWidth * 2))
                            const t = new PIXI.BitmapText(`${barNum+1}:${beatNum+1}:${snum}`, {fontName: 'Bitmap Helvetica Bold'});
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
            for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
                const step = sequence.steps[stepNum]
                if (step.velocity > 0) {
                    const bar = new PIXI.Graphics();
                    const inPulse = WebMidi.time >= currentPulseTimeRef.current && WebMidi.time <= currentPulseTimeRef.current + 100 //currentPulseDurationRef.current
                    barColor = inPulse && sequencePlayer && stepNum === currentStepNumRef.current ? brightRed : brightGreen;
                    // sequencePlayer && stepNum === currentStepNumRef.current && console.log(`draw currentStepNumRef.current ${currentStepNumRef.current}`)
                    bar.beginFill(barColor, 1);
                    bar.drawRoundedRect(getStepLeft(sequence, stepNum), getNoteTop(step.note), getStepWidth(sequence, navigationInfo, stepNum), getNoteHeight(), radius);
                    bar.endFill();
                    container.addChild(bar);

                    const noteName = noteNames[step.note % 12]
                    const noteText = new PIXI.Text(noteName, noteBarTextStyle)
                    noteText.anchor.set(0.5);
                    // noteText.width = getStepStride(sequence)
                    noteText.x = getStepLeft(sequence, stepNum) + getStepWidth(sequence, navigationInfo, stepNum) / 2
                    noteText.y = getNoteTop(step.note) + getNoteHeight() / 2
                    container.addChild(noteText)
                }
            }

            // Slides
            stepNum = 0;
            for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
                if (stepNum === sequence.numSteps - 1) {
                    // we can't show ties for the final step yet
                    break;
                }
                const step = sequence.steps[stepNum]
                const nextStep = sequence.steps[stepNum + 1]
                if (step.velocity > 0 && step.gateLength === 1) {
                    const bar = new PIXI.Graphics();
                    const inPulse = WebMidi.time >= currentPulseTimeRef.current && WebMidi.time <= currentPulseTimeRef.current + 100 //currentPulseDurationRef.current
                    barColor = inPulse && sequencePlayer && stepNum === currentStepNumRef.current ? brightRed : brightGreen;
                    // barColor = blue
                    // sequencePlayer && stepNum === currentStepNumRef.current && console.log(`draw currentStepNumRef.current ${currentStepNumRef.current}`)
                    const stepWidth = getStepWidth(sequence, navigationInfo, stepNum)
                    // const x1 = getStepLeft(sequence, stepNum)
                    const x2 = getStepLeft(sequence, stepNum+1)
                    // const x3 = (getStepLeft(sequence, stepNum) + getStepLeft(sequence, stepNum+1)) / 2
                    const y1 = getNoteBottom(step.note)
                    const y2 = getNoteBottom(nextStep.note)
                    const points = new Array<PIXI.Point>()
                    if (step.note > nextStep.note) {
                        // Going down
                        points.push(new PIXI.Point(x2 - radius / 4, getNoteTop(step.note) + 2))
                        var x = getStepLeft(sequence, stepNum + 1) + stepWidth / 2 * Math.min(nextStep.gateLength, 0.5)
                        points.push(new PIXI.Point(x, getNoteTop(nextStep.note)))
                        x = getStepLeft(sequence, stepNum + 1)
                        points.push(new PIXI.Point(x + 2, getNoteBottom(nextStep.note)))
                        var x = getStepLeft(sequence, stepNum + 1) - stepWidth / 2 * Math.min(nextStep.gateLength, 0.5)
                        points.push(new PIXI.Point(x, getNoteBottom(step.note)))
                    } else {
                        // Going up
                        points.push(new PIXI.Point(x2 - stepWidth / 4 * Math.min(nextStep.gateLength, 0.5), getNoteTop(step.note)))
                        points.push(new PIXI.Point(x2 + 2, getNoteTop(nextStep.note)))
                        points.push(new PIXI.Point(x2 + stepWidth / 4 * Math.min(nextStep.gateLength, 0.5), getNoteBottom(nextStep.note)))
                        points.push(new PIXI.Point(x2 - 2, getNoteBottom(step.note)))
                    }
                    bar.beginFill(barColor, 1);
                    bar.drawPolygon(points);
                    bar.endFill();
                    container.addChild(bar);

                    const noteName = noteNames[step.note % 12]
                    const noteText = new PIXI.Text(noteName, noteBarTextStyle)
                    noteText.anchor.set(0.5);
                    // noteText.width = getStepStride(sequence)
                    noteText.x = getStepLeft(sequence, stepNum) + getStepWidth(sequence, navigationInfo, stepNum) / 2
                    noteText.y = getNoteTop(step.note) + getNoteHeight() / 2
                    container.addChild(noteText)
                }
            }

            // Bottom bars
            stepNum = 0;
            barColor = green;
            const stride = getStepStride(sequence, navigationInfo)
            for (var stepNum = 0; stepNum < sequence.numSteps; stepNum++) {
                const step = sequence.steps[stepNum]
                const bar = new PIXI.Graphics();
                const barColor = recordModeRef.current === RecordMode.Step && stepNum === currentEditStepNumRef.current ? 0xff4421 : 0x707481
                bar.beginFill(barColor, 1);
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
        //     DrawEnvelopes(container, sequence)
        // }
    }

    // function DrawEnvelopes(container: any, sequence: Sequence) {
    //     if (sequence.currentEnvelopeId) {
    //         // console.log(`DrawEnvelopes: ${sequence.currentEnvelopeId}`)
    //         if (sequence.currentEnvelopeId === "notes") {
    //             // don't draw envelopes
    //         // } else if (midiLearnMode) {
    //         //     const bar = new PIXI.Graphics();
    //         //     bar.beginFill(white, 0.5);
    //         //     bar.drawRect(0, 0, width, height);
    //         //     bar.endFill();
    //         //     container.addChild(bar);
    //         //
    //         //     const turnAKnobText = new PIXI.Text("Turn a knob to map", turnAKnobTextStyle)
    //         //     turnAKnobText.anchor.set(0.5);
    //         //     turnAKnobText.width = width / 2
    //         //     turnAKnobText.x = width / 2
    //         //     turnAKnobText.y = height / 2
    //         //     container.addChild(turnAKnobText)
    //         } else {
    //             // console.log(`DrawEnvelopes: ${JSON.stringify(sequence.envelopes)}`)
    //             for (const envelope of sequence.envelopes) {
    //                 // console.log(`DrawEnvelopes: ${JSON.stringify(envelope)}`)
    //                 if (envelope.id === sequence.currentEnvelopeId) {
    //                     DrawEnvelope(container, sequence, envelope)
    //                 }
    //             }
    //         }
    //     }
    // }

    // function DrawEnvelope(container: any, sequence: Sequence, envelope: Envelope) {
    //     // console.log(`✉️ DrawEnvelope: ${JSON.stringify(envelope)}, sequence.midiSettings ${JSON.stringify(sequence.midiSettings)}`)

    //     const [min, max] = getControllerMinMax(sequence, envelope.controller)

    //     // const midiOutputDeviceName : string = sequence.midiSettings.midiOutputDeviceName
    //     // const midiChart:MidiChart | undefined = findMidiChart(midiOutputDeviceName)
    //     // // console.log(`✉️ midiChart instanceof MidiChart ${midiChart instanceof MidiChart} <${JSON.stringify(midiChart)}>`)
    //     // const controller: ControllerInfo = MidiDeviceDataService.getControllerInfo(midiChart, envelope.controller)
    //     // console.log(`DrawEnvelope controller instanceof ControllerInfo ? ${controller instanceof ControllerInfo}`)
    //     //
    //     // console.log(`DrawEnvelope: ${envelope.controller} - envelope.controller ${JSON.stringify(envelope.controller)}`)
    //     // console.log(`DrawEnvelope: ${envelope.controller} - midi chart ${JSON.stringify(midiChart)}`)
    //     // console.log(`DrawEnvelope: ${envelope.controller} - controller info ${JSON.stringify(controller)}`)

    //     if (envelope.controller !== "notes") {
    //         // console.log(`DrawEnvelope: envelope.controller is ${envelope.controller}`)
    //         // console.log(`DrawEnvelope: ${sequence.envelopes}/${sequence.envelopes.length}`)

    //         if (envelope.controller == null) {
    //         } else {
    //             const points = envelope.points
    //             // console.log(`DrawEnvelope: We have ${envelope.controllers.length} controllers with points ${JSON.stringify(points)}`)
    //             // console.log(`DrawEnvelope: point 0 ${JSON.stringify(points[0])}`)

    //             // Lines
    //             const lineColor = envelopeLineColor;
    //             var lines = new PIXI.Graphics();
    //             lines.position.set(0, 0);
    //             lines.lineStyle(1, lineColor, 1)
    //             var y = getValueY(points[0].value, min, max)
    //             lines.moveTo(0, y)
    //             points.forEach((point: EnvelopePoint) => {
    //                 var x = getTime64thsX(sequence, navigationInfo, point.time64ths)
    //                 y = getValueY(point.value, min, max)
    //                 // console.log(`point ${JSON.stringify(point)} draw line to time ${point.time} value ${point.value} ${x},${y}`)
    //                 lines.lineTo(x, y)
    //             })

    //             lines.lineTo(width, y);

    //             // Play cursor
    //             var x = getTime64thsX(sequence, navigationInfo, TempoService.getElapsed64ths() % envelope.length64ths);
    //             // console.log(`DrawEnvelope: draw line ${x} for time ${Math.floor(TempoService.getElapsed64ths())} -> ${Math.floor(TempoService.getElapsed64ths() % envelope.length)}`)
    //             lines.moveTo(x, 0);
    //             lines.lineTo(x, height);
    //             // console.log(`line`)

    //             // Dots
    //             (lines as any).fillStyle = { color: lineColor, alpha: 0.5, visible: true };
    //             lines.beginFill(lineColor)
    //             points.forEach((point: any) => {
    //                 var x = getTime64thsX(sequence, navigationInfo, point.time64ths)
    //                 y = getValueY(point.value, min, max)
    //                 // console.log(`point ${JSON.stringify(point)} draw dot ${point.time64ths} value ${point.value} ${x},${y}`)
    //                 lines.drawCircle(x, y, 4)
    //             })

    //             container.addChild(lines);
    //         }
    //     }
    // }

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

// export {SequenceCanvas, drawSequenceCanvas};
export {SequenceCanvas};
