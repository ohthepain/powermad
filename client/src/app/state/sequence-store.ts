import create from 'zustand'
import {temporal} from 'zundo';
import {
    Envelope,
    EnvelopePoint,
    MidiSettings,
    Pack, PackTypeCollection, Preset,
    Sequence,
    SequenceStep,
    Skin,
    ControllerEntry,
    PresetAddress,
    ViewSettings,
    IStepFilterEditor,
} from '../../player/sequence'
import {getStepFilterEditor} from "../../components/sequence/lanes/lane-editor-factory"
import {ControllerInfo} from "../../services/device-service";
import {searchEnvelopeByController} from "../../util/sequence-util"
import {produce} from "immer"
import {MidiDevicePreferences, PreferencesState} from "../../preferences/preferences-store"
import { ScaleSettings } from '../../player/scales'

interface SequenceState {  //extends UndoState {
    sequence: Sequence,
    setTempo: (tempo: number) => void,
    setDivision: (division: number) => void,
    setLength: (length: number) => void,
    loadSequence: (sequence: Sequence) => void,
    loadMidiDevicePreferences: (midiDevicePreferences: MidiDevicePreferences) => void;
    setName: (name: string) => void,
    setText: (text: string) => void,
    setNumSteps: (numSteps: number) => void,
    setEnvelopeLength: (envelopeId: string, length: number) => void,
    setSkin: (skin: Skin) => void;
    setMidiSettings: (midiSettings: MidiSettings) => void,
    setEnvelopeLocked: (envelopeId: string, locked: boolean) => void,
    setEnvelopePoints: (envelopeId: string, points: Array<EnvelopePoint>, newEnvelopeLength: number) => void,
    setStepNote: (stepNum: number, noteNum: number) => void,
    setStepGateLength: (stepNum: number, gateLength: number) => void,
    setStepVelocity: (stepNum: number, velocity: number) => void,
    setStep: (stepNum: number, noteNum: number, velocity: number, gateLength: number) => void,
    setSteps: (steps: Array<SequenceStep>) => void,
    createEnvelope: (controller: ControllerInfo, initValue?: number) => void,
    deleteEnvelope: (envelopeId: string) => void,
    deleteFilter: (instanceId: string) => void,
    setCurrentEnvelopeId: (envelopeId: string) => void,
    setCurrentPanelId: (panelId: string) => void,
    setEnvelopeValue: (envelopeId: string, controller: ControllerInfo, value: number) => void,
    addEnvelopePoint: (envelopeId: string, time: number, value: number) => void,
    deleteEnvelopePoint: (envelopeId: string, time: number, value: number) => void,
    moveEnvelopePoint: (envelopeId: string, pointnum: number, time: number, value: number) => void,
    // setStepControllerValue: (stepControllerId: string, stepNum: number, value: number) => void,
    updatePreset: (presetAddress: PresetAddress, preset: Preset ) => void,
    setRandomizerPreset: (presetAddress: PresetAddress, preset: Preset ) => void,
    updateProgram: (presetAddress: PresetAddress, program: any ) => void,
    addFilter: (typeId: string, presetAddress: PresetAddress, instanceId: string) => void,
    reverse: () => void,
    setScaleSettings: (scaleSettings: ScaleSettings) => void,
    enableScaleNote: (notenum: number, enable: boolean) => void,
    setDeviceFamilyId: (deviceFamilyId: string) => void,
    setViewSettings: (viewSettings: ViewSettings) => void,
    setPlayOrder: (playOrder: string) => void,
    randomizeSteps: (program: any, startStep: number, endStep: number) => void,
    unRandomizeSteps: () => void,
    // setProgramSysex: (presetAddress: any, programSysex: ArrayBuffer) => void,
}

function setSteps(sequence: Sequence, steps: Array<SequenceStep>) : void {
    sequence.steps = [...steps]
    sequence.rawSteps = [...steps]
    sequence.numSteps = steps.length
    checkStepFilters(sequence)
}

function setNumSteps(sequence: Sequence, numSteps: number) : void {
    var envelope: Envelope | undefined
    var setSequenceLength:boolean = sequence.currentPanelId === "ARP"
    if (!setSequenceLength) {
        envelope = sequence.envelopes.find((envelope: any) => envelope.id === sequence.currentEnvelopeId);
        if (!envelope) {
            throw Error('sequence current envelope is undefined 1')
        }
        else {
            console.log(`found envelope`)
        }
        setSequenceLength = envelope.locked
    }

    if (setSequenceLength) {
        console.log(`🍕setNumSteps - sequence - ${numSteps}`);
        if (numSteps > sequence.steps.length) {
            console.log(`🍕extend steps array`);
            var newSteps: any[] = [...sequence.steps];
            for (var n = sequence.steps.length; n <= sequence.numSteps; n++) {
                newSteps = newSteps.concat(new SequenceStep(60, 100, 0.9));
                console.log(`added step - now ${newSteps.length} steps`)
            }
            // const newStepsArray = sequence.steps.concat(newSteps);
            console.log(`🍕handleNumStepsChange: ${newSteps.length} newStepsArray -> ${JSON.stringify(newSteps)}`)
            sequence.steps = newSteps
            sequence.rawSteps = sequence.steps
        }

        sequence.numSteps = numSteps
        console.log(`🍕setNumSteps ${sequence.numSteps} (now ${sequence.steps.length} steps)`);
    } else {
        console.log(`🍕setNumSteps - envelope - ${numSteps}`);
        if (!envelope) {
            throw Error('sequence current envelope is undefined 2')
        }
        // var envelopes = [...sequence.envelopes]
        // envelope = sequence.envelopes.find((envelope: any) => envelope.id === sequence.currentEnvelopeId);
        if (envelope) {
            envelope.length64ths++
        }
        // console.log(`envelopes is now ${JSON.stringify(envelopes)}`)
        // sequence.envelopes = envelopes
    }

    checkStepFilters(sequence)
}

const loadMidiDevicePreferences = (sequence: Sequence, midiDevicePreferences: MidiDevicePreferences) => {
    sequence.midiDevicePreferences = midiDevicePreferences
}

function setEnvelopeLength(sequence: Sequence, envelopeId: string, length: number) : void {
    var envelope: Envelope | undefined = sequence.envelopes.find((envelope: any) => envelope.id === sequence.currentEnvelopeId);
    if (!envelope) {
        throw Error('setEnvelopeLength: envelope is undefined')
    }
    else {
        console.log(`found envelope`)
    }
    envelope.length64ths = length;
}

function setStepNote(sequence: Sequence, stepNum: number, noteNum: number) {
    sequence.steps[stepNum].note = noteNum
}

function setStepVelocity(sequence: Sequence, stepNum: number, velocity: number) {
    sequence.steps[stepNum].velocity = velocity
}

function setStepGateLength(sequence: Sequence, stepNum: number, gateLength: number) {
    sequence.steps[stepNum].gateLength = gateLength
}

// When we do any operation that affects sequence length, check the step filters' lengths
const checkStepFilters = (sequence: Sequence) => {
    for (const stepFilter of sequence.stepFilters) {
        var stepFilterEditor : IStepFilterEditor = getStepFilterEditor(stepFilter.typeId)
        const preset: Preset = sequence.getPreset(stepFilter.presetAddress)
        const lastValue: any = preset.program.steps.at(-1)
        console.log(`checkStepFilters: need ${sequence.numSteps} steps. ${stepFilter.typeId} preset is ${JSON.stringify(preset)}. lastValue is ${JSON.stringify(lastValue)}`)
        while (preset.program.steps.length < sequence.numSteps) {
            console.log(`checkStepFilters : too short ${preset.program.steps.length} < ${sequence.numSteps}`)
            preset.program.steps.push(lastValue)
        }
        console.log(`checkStepFilters: ==> ${stepFilter.typeId} preset is ${JSON.stringify(preset)}`)

        // stepFilter.onEditSequence(sequence, preset)
    }
}

function setStep(sequence: Sequence, stepNum: number, noteNum: number, velocity: number, gateLength: number) {
    console.log(`sequence-store.setStep: stepNum ${stepNum} of ${sequence.numSteps}`)
    if (stepNum >= sequence.numSteps) {
        console.log(`sequence-store.setStep: extend sequence to ${stepNum + 1} steps`)
        setNumSteps(sequence, stepNum + 1)
    }

    console.log(`setStep: ${noteNum} ${velocity} ${gateLength}`)
    sequence.steps[stepNum].note = noteNum
    sequence.steps[stepNum].velocity = velocity
    sequence.steps[stepNum].gateLength = gateLength

    // checkStepFilters(sequence)
}

function setEnvelopeLocked(sequence: Sequence, envelopeId: string, locked: boolean) {
    var envelopes = [...sequence.envelopes]
    for (var envelope of envelopes) {
        if (envelope.id === envelopeId) {
            envelope.locked = locked
            if (locked) {
                envelope.length64ths = sequence.numSteps * 64 / sequence.division
            }
            // } else {
            //     console.log(`setEnvelopeLocked: length is now ${envelope.length64ths}`)
            //     for (const point of envelope.points) {
            //         envelope.length64ths = Math.max(envelope.length64ths, point.time64ths)
            //     }
            //     console.log(`setEnvelopeLocked: length is now ${envelope.length64ths}`)
            // }
        }
    }
    sequence.envelopes = envelopes
}

function setEnvelopePoints(sequence: Sequence, envelopeId: string, points: Array<EnvelopePoint>, newEnvelopeLength: number) {
    for (var envelope of sequence.envelopes) {
        if (envelope.id === envelopeId) {
            envelope.points = points
            // envelope.length64ths = newEnvelopeLength
            break
        }
    }
}

function createEnvelope(sequence: Sequence, controller: ControllerInfo, initValue?: number) : void {

    if (sequence.envelopes) {
        var envelope = searchEnvelopeByController(sequence, controller);
        if (envelope) {
            console.log(`createEnvelope - waiting - we already have an envelope for this controller`)
            // return new Sequence({...sequence, currentEnvelopeId: envelope.id })
            // return sequence
        }
    }

    console.log(`createEnvelope - creating`)
    envelope = new Envelope()
    envelope.id = crypto.randomUUID()
    envelope.controller = controller.name
    envelope.points = [new EnvelopePoint(0, initValue || 0)]

    var envelopes = [envelope]
    if (sequence.envelopes) {
        console.log(`createEnvelope - creating 1 - now have ${sequence.envelopes.length} envelopes`)
        envelopes = [...sequence.envelopes, envelope]
        console.log(`createEnvelope - creating 1 - now have ${sequence.envelopes.length} envelopes`)
        // return new Sequence({...sequence, envelopes: envelopes})
    }

    console.log(`createEnvelope - envelopes ${JSON.stringify(envelopes)}`)
    sequence.envelopes = envelopes
    sequence.currentEnvelopeId = envelope.id
    // return new Sequence({...sequence, envelopes: envelopes, currentEnvelopeId: envelope.id})
}

function deleteEnvelope(sequence: Sequence, envelopeId: string) : void {
    // if (sequence.currentEnvelopeId !== "learn") {
        var envelopes = sequence.envelopes.filter(envelope => envelope.id !== envelopeId)
        sequence.envelopes = envelopes
        sequence.currentEnvelopeId = ""
        if (envelopes.length > 0) {
            sequence.currentEnvelopeId = sequence.envelopes[0].id
        }
    // }
    // sequence.currentEnvelopeId = "learn"
}

function setEnvelopeValue(sequence: Sequence, envelopeId: string, controller: ControllerInfo, value: number) {
    // var envelope: Envelope = findEnvelopeByController(sequence, controller)
    var envelope = sequence.envelopes.find((envelope: any) => envelope.id === envelopeId);
    if (!envelope) {
        throw Error(`setEnvelopeValue: could not find envelope ${envelopeId}`)
    }
    envelope.points[0].value = value
}

function moveEnvelopePoint(sequence: Sequence, envelopeId: string, pointnum: number, time: number, value: number) : void {
    var envelope = sequence.envelopes.find((envelope: any) => envelope.id === envelopeId);
    if (!envelope) {
        throw Error(`setEnvelopeValue: could not find envelope ${envelopeId}`)
    }
    envelope.points[pointnum] = new EnvelopePoint(time, value)

    // if (time > envelope.length) {
    //     envelope.length = time;
    // }

    // var maxPointTime = 0
    // envelope.points.forEach(point => {
    //     maxPointTime = Math.max(maxPointTime, point.time64ths)
    // })

    // envelope.length64ths = maxPointTime
}

function addEnvelopePoint(sequence: Sequence, envelopeId: string, time: number, value: number) {
    var envelope = sequence.envelopes.find((envelope: any) => envelope.id === envelopeId);
    if (!envelope) {
        throw Error(`setEnvelopeValue: could not find envelope ${envelopeId}`)
    }
    var newPoints = [...envelope.points, new EnvelopePoint(time, value)]
    newPoints = newPoints.sort((a,b) => { return a.time64ths - b.time64ths })
    envelope.points = newPoints
}

function deleteEnvelopePoint(sequence: Sequence, envelopeId: string, time: number, value: number) {
    console.log(`deleteEnvelopePoint: point ${time}/${value}`)
    var envelopes = [...sequence.envelopes]
    var envelope = sequence.envelopes.find((envelope: any) => envelope.id === envelopeId);
    if (!envelope) {
        throw Error(`setEnvelopeValue: could not find envelope ${envelopeId}`)
    }
    envelope.points = [...envelope.points]
    for (var n = 0; n < envelope.points.length; n++) {
        if (envelope.points[n].time64ths === time && envelope.points[n].value === value) {
            envelope.points.splice(n, 1)
            console.log('deleteEnvelopePoint: found it')
            console.log(`deleteEnvelopePoint: envelope ${JSON.stringify(envelope)} ${envelope.points.length}`)
            break;
        }
    }
    sequence.envelopes = envelopes
}

function loadSequence(sequenceArg: Sequence) : Sequence {
    // console.trace(`sequence-store.loadSequence: ${JSON.stringify(sequenceArg)}`)
    var sequence = new Sequence(sequenceArg)
    if (!sequence.skin) {
        sequence.skin = new Skin()
    }
    // console.trace(`sequence-store.loadSequence - the object: ${JSON.stringify(sequence)}`)
    // console.trace(`sequence-store.loadSequence - the sysex: ${JSON.stringify(sequence.getSysexProgram())}`)
    return sequence;
}

// function addStepController(sequence: Sequence, controllerId: string) : ControllerEntry {
//     var stepController: ControllerEntry | undefined = sequence.searchStepController(controllerId)
//     if (!stepController) {
//         stepController = new ControllerEntry({controllerId: controllerId})
//         sequence.stepFilters.push(stepController)
//     }

//     return stepController
// }

function updatePreset(sequence: Sequence, presetAddress: PresetAddress, preset: Preset) {
    const packId: string = presetAddress.packId
    const typeId: string = presetAddress.typeId
    const presetId: string = presetAddress.presetId

    console.log(`updatePreset: packId ${packId} from presetAddress ${JSON.stringify(presetAddress)}`)

    var pack : Pack;
    const packIndex: number = sequence.packs.findIndex(pack => pack.id === packId)
    console.log(`packIndex: packId ${packIndex}`)
    if (packIndex !== -1) {
        pack = sequence.packs[packIndex]
    } else {
        pack = new Pack()
        sequence.packs.push(pack)
    }

    console.log(`packIndex: there are now ${sequence.packs.length} packs`)

    var packTypeCollection: PackTypeCollection;
    const typeIndex: number = pack.packTypeCollections.findIndex(packTypeCollection => packTypeCollection.typeId === typeId)
    if (typeIndex !== -1) {
        packTypeCollection = pack.packTypeCollections[typeIndex]
    } else {
        packTypeCollection = new PackTypeCollection()
        packTypeCollection.typeId = typeId
        pack.packTypeCollections.push(packTypeCollection)
    }

    // var preset: Preset;
    const presetIndex: number = packTypeCollection.presets.findIndex(preset => preset.id === presetId)
    console.log(`presetId ${presetId} presetIndex: ${presetIndex} typeIndex ${typeIndex} typeId ${typeId}`)
    if (presetIndex !== -1) {
        packTypeCollection.presets[presetIndex] = preset;
    } else {
        packTypeCollection.presets.push(preset)
    }
}

function setRandomizerPreset(sequence: Sequence, presetAddress: PresetAddress, preset: Preset) {
    sequence.randomizerPresetAddress = presetAddress
    updatePreset(sequence, presetAddress, preset)
}

function reverse(sequence: Sequence) : void {
    console.log(`reverse ${sequence.numSteps} ${JSON.stringify(sequence.steps)}`)
    var steps: Array<SequenceStep> = sequence.steps.slice(0, sequence.numSteps)
    steps = steps.reverse()
    // setSteps(steps)
    sequence.steps = [...steps]
    sequence.rawSteps = sequence.steps

    sequence.stepFilters.forEach((controllerEntry: ControllerEntry) => {
        let presetAddress = controllerEntry.presetAddress
        let preset = sequence.getPreset(presetAddress)
        let program: any = preset.program
        console.log(`handleReverse stepFilter ${JSON.stringify(program.steps)} presetAddress ${JSON.stringify(presetAddress)} program ${JSON.stringify(program)}`)
        program.steps.reverse()
        console.log(`handleReverse stepFilter ${JSON.stringify(sequence.getPreset(presetAddress).program.steps)}`)
        sequence.getPreset(presetAddress).program = program
    })
}

function updateProgram(sequence: Sequence, presetAddress: PresetAddress, program: any) {
    sequence.getPreset(presetAddress).program = program
}

function addFilter(sequence: Sequence, typeId: string, presetAddress: PresetAddress, instanceId: string) {
    var controllerEntry = new ControllerEntry({ typeId: typeId, presetAddress: presetAddress, instanceId: crypto.randomUUID() })
    sequence.stepFilters.push(controllerEntry)
    checkStepFilters(sequence)
}

function deleteFilter(sequence: Sequence, instanceId: string) : void {
    console.log(`sequenceStore.deleteFilter ${instanceId}`)
    // const index = sequence.stepFilters.findIndex(controllerEntry => controllerEntry.instanceId === instanceId)
    sequence.stepFilters = sequence.stepFilters.filter(controllerEntry => controllerEntry.instanceId !== instanceId)
}

function setScaleSettings(sequence: Sequence, scaleSettings: ScaleSettings) : void {
    console.log(`sequenceStore.deleteFilter ${JSON.stringify(scaleSettings)}`)
    sequence.scaleSettings = scaleSettings
}

function enableScaleNote(sequence: Sequence, notenum: number, enable: boolean) : void {
    notenum %= 12
    console.log(`toggleScaleSettingsNote: notenum ${notenum}`)
    sequence.scaleSettings.enableNote(notenum, enable)
    sequence.scaleSettings.scaleType = "Custom"
}

function setDeviceFamilyId(sequence: Sequence, deviceFamilyId: string) : void {
    sequence.deviceFamilyId = deviceFamilyId
}

function setViewSettings(sequence: Sequence, viewSettings: ViewSettings) : void {
    sequence.viewSettings = viewSettings
}

function setPlayOrder(sequence: Sequence, playOrder: string) : void {
    sequence.playOrder = playOrder
}

function weighted_random(weights: Array<number>, rand: any, strength: number) {

    const sum = weights.reduce((partialSum, a) => partialSum + a, 0)
    var random = rand.range(sum)
    if (rand.random() > strength) {
        // We have to do this at the end so that the number of random numbers generated doesn't change for different weights
        // otherwise the sequences are completely randomized every time you change a weight
        return -1
    }

    const numOptions = weights.reduce((count, val) => count += val !== 0 ? 1 : 0, 0)
    // console.log(`numOptions ${numOptions} from ${JSON.stringify(weights)}`)
    if (numOptions === 0) {
        return -1
    }
    
    if (numOptions === 1) {
        i = weights.findIndex(element => element != 0)
    } else {
        for (var i = 0; i < weights.length; i++) {
            if (random < weights[i]) {
                break;
            }

            random -= weights[i]
        }
    }
    
    // console.log(`random test: sum of ${JSON.stringify(weights)} is ${sum}. random is ${random} ===> chose index ${i}`)
    // console.log(`strength ${strength}`)

    return i;
}

function unRandomizeSteps(sequence: Sequence) : void {
    console.log(`unRandomizeSteps: rawSteps ${JSON.stringify(sequence.rawSteps)}`)
    sequence.steps = [...sequence.rawSteps]
}

const getRandomizerStrength = (program: any, panelId: string) => {
    if (program.strengths && panelId in program.strengths) {
        return program.strengths[panelId]
    } else {
        return 1
    }
}

const getRandomizerMirror = (program: any, panelId: string) => {
    if (program.mirrors && panelId in program.mirrors) {
        return program.mirrors[panelId]
    } else {
        return 0
    }
}

function randomizeSteps(sequence: Sequence, program: any, startStep: number, endStep: number) : void {
    console.log(`SequencePlayer.handleStep: randomize! hallooo`)
    startStep = startStep === -1 ? 0 : startStep
    endStep = endStep === -1 ? sequence.numSteps - 1 : endStep
    var rand = require('random-seed').create(program.randomSeed);

    const values: any = {
        tie: [0, 1],
        silence: [1, 2, 3, 4, 5, 6],
        length: [0.25, 0.5, 0.75, 1, 2, 4],
        //octave: [0, 1, 2, 3, 4],
        // note: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        velocity: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 127],
    }

    var stepnum = startStep
    while (stepnum <= endStep) {

        // Choose note
        var notenum = weighted_random(program.note, rand, getRandomizerStrength(program, "note"))
        console.log(`randomizeSteps: randomize! note strength is ${getRandomizerStrength(program, "note")} --> notenum ${notenum}`)
        if (notenum === -1) {
            // compensate for octave randomization below
            notenum = sequence.rawSteps[stepnum].note - 48
            console.log(`randomizeSteps: randomize! stepnum ${stepnum} is now ${notenum}`)
        }

        var octave = weighted_random(program.octave, rand, getRandomizerStrength(program, "octave"))
        console.log(`randomizeSteps: octave index ${octave} strength ${getRandomizerStrength(program, "octave")}`)
        octave = octave === -1 ? 2 : octave
        notenum += octave * 12 + 24

        var i = weighted_random(program.velocity, rand, 1)
        console.log(`randomizeSteps: velocity index ${i}`)
        const velocity = i === -1 ? sequence.rawSteps[stepnum].velocity : values.velocity[i]

        i = weighted_random(program.length, rand, getRandomizerStrength(program, "length"))
        // console.log(`randomizeSteps: noteLength index ${i}`)
        var noteLength = i === -1 ? sequence.rawSteps[stepnum].gateLength : values.length[i]
        const tie = values.tie[weighted_random(program.tie, rand, getRandomizerStrength(program, "tie"))]
        if (tie == 1) {
            noteLength = Math.max(noteLength, 1)
        } else if (noteLength >= 1) {
            noteLength -= 0.1
        }

        sequence.steps[stepnum] = new SequenceStep(notenum, velocity, noteLength)
        console.log(`randomizeSteps: stepnum  (${stepnum}) ${JSON.stringify(sequence.steps[stepnum])}`)

        ++stepnum
        if (noteLength > 1) {
            stepnum += noteLength - 1
        }
    }

    // Add silence
    const totalWeight = program.silence.reduce((partialSum: number, a: number) => partialSum + a, 0)
    var strength: number = Math.min(totalWeight, 100) / 100
    if (totalWeight > 0) {
        var stepnum = startStep
        while (stepnum <= endStep) {

            var i = weighted_random(program.silence, rand, strength * getRandomizerStrength(program, "silence"))
            const silenceLength = i === -1 ? 0 : values.silence[i]
            if (silenceLength > 0) {

                for (var n=stepnum; n < stepnum + silenceLength && n < sequence.numSteps; n++) {
                    sequence.steps[n] = new SequenceStep(60, 0, 0.5)
                }

                stepnum += silenceLength
            } else {
                ++stepnum;
            }
        }
    }

    // Mirror note
    var mirror = getRandomizerMirror(program, "note")
    var stepnum = Math.ceil((startStep + endStep) / 2)
    var mirrorStepNum = Math.floor((startStep + endStep) / 2)
    while (stepnum <= endStep) {

        if (rand.random() < mirror) {
            sequence.steps[stepnum].note = sequence.steps[mirrorStepNum].note
        }

        ++stepnum;
        --mirrorStepNum;
    }

    // Mirror octave
    mirror = getRandomizerMirror(program, "octave")
    var stepnum = Math.ceil((startStep + endStep) / 2)
    var mirrorStepNum = Math.floor((startStep + endStep) / 2)
    while (stepnum <= endStep) {
        if (rand.random() < mirror) {
            console.log(`mirror octave step ${stepnum} ${sequence.steps[stepnum].note}`)
            sequence.steps[stepnum].note %= 12
            console.log(`mirror octave step ${stepnum} --> ${sequence.steps[stepnum].note}`)
            while (sequence.steps[stepnum].note / 12 < sequence.steps[mirrorStepNum].note / 12) {
                sequence.steps[stepnum].note += 12
                console.log(`mirror octave step ${stepnum} --> --> ${sequence.steps[stepnum].note}`)
            }
        }
        ++stepnum;
        --mirrorStepNum;
    }

    // Mirror velocity and silence
    // mirror = getRandomizerMirror(program, "velocity")
    const silenceMirror = getRandomizerMirror(program, "silence")
    var stepnum = Math.ceil((startStep + endStep) / 2)
    var mirrorStepNum = Math.floor((startStep + endStep) / 2)
    // console.log(`Mirror velocity and silence: mirror ${mirror} silenceMirror ${silenceMirror} from stepnum ${stepnum} to endStep ${endStep}`)
    while (stepnum <= endStep) {

        if (sequence.steps[stepnum].velocity > 0) {
            // if (rand.random() < mirror) {
            //     sequence.steps[stepnum].velocity = sequence.steps[mirrorStepNum].velocity
            // }
        } else {
            // TODO: This doesn't really work
            if (rand.random() < silenceMirror) {
                sequence.steps[stepnum].velocity = sequence.steps[mirrorStepNum].velocity
            }
        }

        ++stepnum;
        --mirrorStepNum;
    }

    // Mirror length and tie
    mirror = getRandomizerMirror(program, "length")
    const tieMirror = getRandomizerMirror(program, "tie")
    var stepnum = Math.ceil((startStep + endStep) / 2)
    var mirrorStepNum = Math.floor((startStep + endStep) / 2)
    while (stepnum <= endStep) {

        if (Number.isInteger(sequence.steps[stepnum].gateLength)) {
            if (rand.random() < tieMirror) {
                sequence.steps[stepnum].gateLength = sequence.steps[mirrorStepNum].gateLength
            }
        } else {
            if (rand.random() < mirror) {
                sequence.steps[stepnum].gateLength = sequence.steps[mirrorStepNum].gateLength
            }
        }

        ++stepnum;
        --mirrorStepNum;
    }

    console.log(`randomizeSteps: steps ${JSON.stringify(sequence.steps)}`)
}

// function setProgramSysex(sequence: Sequence, presetAddress: any, programSysex: ArrayBuffer) : void {
//     console.log(`sequenceStore.setProgramSysex ${JSON.stringify(presetAddress)}`)
//     let preset: Preset = new Preset()
//     preset.id = "0"
//     preset.name = "sysex"
//     preset.program = programSysex
//     updatePreset(sequence, presetAddress, preset)
// }

// function setStepControllerValue(sequence: Sequence, controllerId: string, stepNum: number, value: any) {
//     var stepController: StepControllerEntry = addStepController(sequence, controllerId)
//     if (!stepController) {
//         stepController = new StepControllerEntry({controllerId: controllerId})
//     }
//
//     stepController.steps[stepNum] = value
// }

export const useSequenceStore = create<SequenceState>()(
    temporal(
        (set) => ({
        sequence: new Sequence({}),
        setTempo: (tempo: number) => set(produce(draft => { draft.sequence.tempo = tempo })),
        setDivision: (division: number) => set(produce(draft => {draft.sequence.division = division})),
        setLength: (length: number) => set(produce(draft => { draft.sequence.length = length })),
        loadMidiDevicePreferences: (midiDeviceSettings: MidiDevicePreferences) => set(produce(draft => {draft.sequence.midiDevicePreferences = midiDeviceSettings})),
        loadSequence: (sequence: Sequence) => set( state => ({ sequence: loadSequence(sequence) })),
        setName: (name: string) => set(produce(draft => { draft.sequence.name = name })),
        setText: (text: string) => set(produce(draft => { draft.sequence.text = text })),
        setNumSteps: (numSteps: number) => set(produce(draft => {setNumSteps(draft.sequence, numSteps)})),
        setSteps: (steps: Array<SequenceStep>) => set(produce(draft => {setSteps(draft.sequence, steps)})),
        setEnvelopeLength: (envelopeId: string, length: number) => set(produce(draft => {setEnvelopeLength(draft.sequence, envelopeId, length)})),
        setSkin: (skin: Skin) => set(produce(draft => {draft.sequence.skin = skin})),
        setMidiSettings: (midiSettings: MidiSettings) => set(produce(draft => { draft.sequence.midiSettings = {...midiSettings}})),
        setEnvelopeLocked: (envelopeId: string, locked: boolean) => set(produce(draft => {setEnvelopeLocked(draft.sequence, envelopeId, locked)})),
        setEnvelopePoints: (envelopeId: string, points: Array<EnvelopePoint>, newEnvelopeLength: number) => set(produce(draft => setEnvelopePoints(draft.sequence, envelopeId, points, newEnvelopeLength))),
        setStepNote: (stepNum: number, noteNum: number) => set(produce(draft => { setStepNote(draft.sequence, stepNum, noteNum)})),
        setStepVelocity: (stepNum: number, velocity: number) => set(produce(draft => { setStepVelocity(draft.sequence, stepNum, velocity)})),
        setStepGateLength: (stepNum: number, gateLength: number) => set(produce(draft => { setStepGateLength(draft.sequence, stepNum, gateLength)})),
        setStep: (stepNum: number, noteNum: number, velocity: number, gateLength: number) => set(produce(draft => { setStep(draft.sequence, stepNum, noteNum, velocity, gateLength)})),
        // stepControllerValue: (state: any, payloadAction) => {
        // createEnvelope: (controller: ControllerInfo) => set(produce(state => {createEnvelope(state.sequence, controller)})),
        setCurrentEnvelopeId: (envelopeId: string) => set(produce(draft => { draft.sequence.currentEnvelopeId = envelopeId} )),
        setCurrentPanelId: (panelId: string) => set(produce(draft => { draft.sequence.currentPanelId = panelId} )),
        createEnvelope: (controller: ControllerInfo, initValue?: number) => set(produce(draft => {createEnvelope(draft.sequence, controller, initValue)})),
        deleteEnvelope: (envelopeId) => set(produce(draft => deleteEnvelope(draft.sequence, envelopeId))),
        deleteEnvelopePoint: (envelopeId: string, time: number, value: number) => set(produce(draft => { deleteEnvelopePoint(draft.sequence, envelopeId, time, value)})),
        addEnvelopePoint: (envelopeId: string, time: number, value: number) => set(produce(draft => {addEnvelopePoint(draft.sequence, envelopeId, time, value)})),
        moveEnvelopePoint: (envelopeId: string, pointnum: number, time: number, value: number) => set(produce(draft => {moveEnvelopePoint(draft.sequence, envelopeId, pointnum, time, value)})),
        setEnvelopeValue: (envelopeId: string, controller: ControllerInfo, value: number) => set(produce(draft => {setEnvelopeValue(draft.sequence, envelopeId, controller, value)})),
        updatePreset: (presetAddress: PresetAddress, record: any) => set(produce(draft => {updatePreset(draft.sequence, presetAddress, record)})),
        setRandomizerPreset: (presetAddress: PresetAddress, record: any) => set(produce(draft => {setRandomizerPreset(draft.sequence, presetAddress, record)})),
        // setStepControllerValue: (controllerId: string, stepNum: number, value: number) => set(produce(draft => {setStepControllerValue(draft.sequence, controllerId, stepNum, value)})),
        updateProgram: (presetAddress: PresetAddress, patch: any) => set(produce(draft => updateProgram(draft.sequence, presetAddress, patch))),
        addFilter: (typeId: string, presetAddress: PresetAddress, instanceId: string) => set(produce(draft => {addFilter(draft.sequence, typeId, presetAddress, instanceId)})),
        deleteFilter: (instanceId) => set(produce(draft => deleteFilter(draft.sequence, instanceId))),
        reverse: () => set(produce(draft => reverse(draft.sequence))),
        setScaleSettings: (scaleSettings: ScaleSettings) => set(produce(draft => setScaleSettings(draft.sequence, scaleSettings))),
        enableScaleNote: (notenum: number, enable: boolean) => set(produce(draft => enableScaleNote(draft.sequence, notenum, enable))),
        setDeviceFamilyId: (deviceFamilyId: string) => set(produce(draft => setDeviceFamilyId(draft.sequence, deviceFamilyId))),
        setViewSettings: (viewSettings: ViewSettings) => set(produce(draft => {setViewSettings(draft.sequence, viewSettings)})),
        setPlayOrder: (playOrder: string) => set(produce(draft => setPlayOrder(draft.sequence, playOrder))),
        randomizeSteps: (program: any, startStep: number, endStep: number) => set(produce(draft => randomizeSteps(draft.sequence, program, startStep, endStep))),
        unRandomizeSteps: () => set(produce(draft => unRandomizeSteps(draft.sequence)))
        // setProgramSysex: (presetAddress: any, programSysex: ArrayBuffer) => set(produce(draft => setProgramSysex(draft.sequence, presetAddress, programSysex))),
    }))
);
