import MidiService from "../services/midi-service"
import {WebMidi} from "webmidi"
import TempoService from "../services/tempo-service"
import {Sequence, Envelope, SequenceStep, ControllerEntry} from "./sequence"
import {getEnvelopeValue} from "./envelope-utils"
import MidiDeviceDataService, {ControllerInfo} from "../services/device-service"
import {useSequenceStore} from "../app/state/sequence-store"
import {usePositionStore} from "../app/state/position-store"
import {PulseCountFilter} from "../components/sequence/pulse-count/pulse-count-filter"
import {SkipFilter} from "../components/sequence/step-filters/skip-filter"
import {ProbabilityFilter} from "../components/sequence/step-filters/probability-filter"
import { faPauseCircle } from "@fortawesome/free-solid-svg-icons"

// TODO: Add locks
export class Pulse {
    step: SequenceStep
    note: number
    velocity: number
    durationMsec: number
    stepNum: number;
    pulseTime: number
    scheduledAtMsec: number = 0

    constructor(step: SequenceStep, note: number, velocity: number, durationMsec: number, stepNum: number, pulseTime : number) {
        this.step = step
        this.note = note
        this.velocity = velocity
        this.durationMsec = durationMsec
        this.stepNum = stepNum
        this.pulseTime = pulseTime
    }
}

export class MidiNote {
    note: number
    velocity: number

    constructor(note: number, velocity: number) {
        this.note = note;
        this.velocity = velocity;
    }
}

abstract class IMidiFilter {
    channel: number;

    constructor(channel: number) {
        this.channel = channel
    }

    // abstract filter(message) : message
}

export interface ISequencePlayer {

    getSequence() : Sequence;
    controllerEntry: ControllerEntry;

    nextStepNum: number;

    start(notes: Array<MidiNote>) : void;
    stop() : void;
    handlePulse() : void;
    setCurrentStepNum(stepNum: number) : void;

    // getType() : string;
}


export interface IStepProcessor {
    getPulses(sequencePlayer: ISequencePlayer, program: any, pulses: Pulse[], controllerEntry: ControllerEntry, stepNum: number) : Pulse[];
}

class SequencePlayer implements ISequencePlayer {
    controllerEntry: any
    sequenceId: string
    activeNotes: Array<MidiNote> = []
    noteNum: number = 0
    currentStepNumHint: number
    nextStepNum: number
    nextStepTime: number
    nextPulseNum: number
    nextPulseTime: any
    pulses: Pulse[]
    lastMsb: number = -1
    isPlaying: boolean = false
    startTime: number = -1

    constructor(sequenceId: string) {
        console.log(`SequencePlayer.ctor: sequenceId ${sequenceId}`)
        this.sequenceId = sequenceId
        // this.spp = 0
        this.currentStepNumHint = 0
        this.nextStepNum = 0
        this.nextStepTime = 0
        this.nextPulseNum = 0
        this.nextPulseTime = 0
        this.activeNotes = []
        this.pulses = []

        this.createFilters()
    }

    //ISequencePlayer

    getSequence(): Sequence {
        return useSequenceStore.getState().sequence
    }

    start(notes: Array<MidiNote>) : void {
        console.log(`SequencePlayer.start: notes ${JSON.stringify(notes)} at WebMidi.time ${WebMidi.time}`)
        this.isPlaying = true
        this.addNotes(notes)
        this.noteNum = 0
        this.nextPulseNum = 0
        this.currentStepNumHint = -1
        this.nextStepNum = 0
        // this.nextPulseTime = WebMidi.time
        this.nextStepTime = WebMidi.time
        this.startTime = WebMidi.time
        // this.handleStep()
        this.handlePulse()
        TempoService.eventsEmitter.addListener('MIDI pulse', this.handleMidiPulse )
        TempoService.eventsEmitter.addListener('SPP', this.handleSpp )
        console.log(`SequencePlayer.start: dunn handleSpp`)
    }

    setCurrentStepNum(stepNum: number) : void {
        console.log(`setCurrentStepNum ${stepNum}`)
        this.currentStepNumHint = stepNum
        this.nextStepNum = stepNum
    }

    addNotes(notes: Array<MidiNote>) : void {
        console.log(`SequencePlayer.addNotes: notes ${JSON.stringify(notes)}`)

        if (this.isPlaying) {
            notes.forEach(note => {
                if (note.velocity > 0) {
                    this.activeNotes.push(note)
                }
            })
        } else {
            this.start(notes)
        }
    }

    removeNotes(notes: Array<MidiNote>) : void {
        console.log(`SequencePlayer.removeNotes: notes before ${JSON.stringify(this.activeNotes)}`)
        // if (this.activeNotes.length > 0) 
        {
            notes.forEach(note => {
                console.log(`SequencePlayer.removeNotes: remove note ${note.note}`)
                this.activeNotes = this.activeNotes.filter(midiNote => midiNote.note !== note.note)
            })

            if (this.activeNotes.length === 0) {
                console.log(`SequencePlayer.removeNotes: stop`)
                this.stop()
            }

            if (this.noteNum >= this.activeNotes.length) {
                this.noteNum = 0
            }

            console.log(`SequencePlayer.removeNotes: notes after ${JSON.stringify(this.activeNotes)}`)
        }
    }

    stop() : void {
        this.isPlaying = false
        this.activeNotes = []
        TempoService.eventsEmitter.removeListener('MIDI pulse', this.handleMidiPulse )
        TempoService.eventsEmitter.removeListener('SPP', this.handleSpp )
    }

    createFilters() {
        // const sequence: Sequence = useSequenceStore.getState().sequence
        // var nextFilter: ISequencePlayer | null = null;
        // for (const controllerEntry of sequence.stepFilters.reverse()) {
        //     // const patch: any = sequence.getPreset(controllerEntry.presetAddress)
        //     switch (controllerEntry.typeId) {
        //         case 'pulse-count':
        //             console.log(`calculateStepList: sequence.stepFilters pulse-count`)
        //             nextFilter = new PulseCountFilter(sequence, controllerEntry, nextFilter)
        //             break
        //         default:
        //             console.error(`SequencePlayer.calculateStepList: unrecognized step filter type ${controllerEntry.typeId}`)
        //     }
        // }

        // this.nextFilter = nextFilter
        // console.log(`SequencePlayer.createFilters: out`)
    }

    updateEnvelope(envelope: Envelope, sequence: Sequence) {
        // Get ccid from controller via midiChart
        const midiChart = MidiDeviceDataService.getMidiChart(sequence.midiSettings.midiOutputDeviceName)
        if (midiChart) {
            const controller: ControllerInfo = MidiDeviceDataService.getControllerInfo(midiChart, envelope.controller)

            const elapsed64ths = TempoService.getElapsed64ths()
            const pos64ths = elapsed64ths % envelope.length64ths
            // console.log(`pos64ths ${pos64ths} of envelope.length ${envelope.length} at tempo service bpm ${TempoService.bpm}`)

            const value: number = getEnvelopeValue(envelope, pos64ths)
            // console.log(`posMsec ${posMsec} = time ${posSteps} steps -> value ${value}`)
            const msb: number = Math.floor(value / ((controller.max + 1) / 128))
            // const msb : number = value % 128
            // const lsb : number = value / 128
            if (msb !== this.lastMsb) {
                // console.log(`updateEnvelope: MIDI ctrlr ${controller.ccMsb} value ${msb} pos64ths ${pos64ths}`)
                MidiService.sendControlChange(sequence.midiSettings, controller.ccMsb, msb);
                this.lastMsb = msb;
            }
        }
        // MidiService.sendControlChange(sequence.midiSettings, controller.ccLsb, lsb);
    }

    dumpPulses(preamble: string = "pulsedump:\n") : string {
        var s: string = preamble
        for (var n = 0; n < this.pulses.length; n++) {
            const pulse = this.pulses[n]
            s += ` pulse ${n} at ${Math.floor(pulse.pulseTime - this.startTime)}\n`
        }
        return s
    }

    // Call this as soon as we run out of pulses
    handleStep() : void {
        //console.log(`handleStep: at ${WebMidi.time - this.startTime}`)
        this.nextPulseNum = 0
        //console.log(`SequencePlayer.handleStep nsn ${this.nextStepNum} nst ${Math.floor(this.nextStepTime - this.startTime)} npt ${Math.floor(this.nextPulseTime)} ${JSON.stringify(this.pulses)} timenow ${WebMidi.time - this.startTime}`)
        const sequence: Sequence = useSequenceStore.getState().sequence
        this.pulses = []

        if (this.nextStepNum === 0) {
            const sequence: Sequence = useSequenceStore.getState().sequence
            console.log(`SequencePlayer.handleStep: randomize! sequence.randomizerPresetAddress ${sequence.randomizerPresetAddress}`)
            if (sequence.randomizerPresetAddress) {
                var randomizeProgram = sequence.getProgram(sequence.randomizerPresetAddress)
                if (randomizeProgram.turingMode) {
                    randomizeProgram = {...randomizeProgram, randomSeed: Math.trunc(Math.random() * 10000000000000)}
                    useSequenceStore.getState().randomizeSteps(randomizeProgram, 0, sequence.numSteps)
                    // useSequenceStore.getState().setSteps(useSequenceStore.getState().sequence.steps)
                }                
            }
        }

        while (this.pulses.length === 0)
        {
            const step = sequence.steps[this.nextStepNum];
            //console.log(`SequencePlayer.handleStep: step ${this.nextStepNum} is ${JSON.stringify(step)}`)
            var durationMsec = sequence.tempo / 60 / sequence.division * step.gateLength * 1000
            if (Number.isInteger(step.gateLength)) {
                // Tie
                durationMsec += 10;
            }

            let pulse: Pulse = new Pulse(step, step.note, step.velocity, durationMsec, this.nextStepNum, this.nextStepTime)
            this.pulses.push(pulse)

            const beatsPerBar = sequence.getTimeSignatureBeatsForBar(0)
            this.nextPulseTime = this.nextPulseTime +=  60000 * beatsPerBar / sequence.tempo / sequence.division;

            for (const controllerEntry of sequence.stepFilters) {
                switch (controllerEntry.typeId) {
                    case 'pulse-count': {
                        //console.log(`SequencePlayer.handleStep: calculateStepList: sequence.stepFilters pulse-count`)
                        var nextFilter: IStepProcessor = new PulseCountFilter()
                        const program: any = sequence.getPreset(controllerEntry.presetAddress).program
                        this.pulses = nextFilter.getPulses(this, program, this.pulses, controllerEntry, this.nextStepNum)
                        break
                    }
                    case 'probability': {
                        //console.log(`SequencePlayer.handleStep: calculateStepList: sequence.stepFilters probability`)
                        var nextFilter: IStepProcessor = new ProbabilityFilter()
                        const program: any = sequence.getPreset(controllerEntry.presetAddress).program
                        this.pulses = nextFilter.getPulses(this, program, this.pulses, controllerEntry, this.nextStepNum)
                        break
                    }
                    case 'skip': {
                        //console.log(`SequencePlayer.handleStep: calculateStepList: sequence.stepFilters skip`)
                        var nextFilter: IStepProcessor = new SkipFilter()
                        const program: any = sequence.getPreset(controllerEntry.presetAddress).program
                        this.pulses = nextFilter.getPulses(this, program, this.pulses, controllerEntry, this.nextStepNum)
                        break
                    }
                }
            }

            //console.log(`SequencePlayer.handleStep(${this.nextStepNum}): pulses ${this.dumpPulses()} time now ${WebMidi.time - this.startTime}`)
    
            switch (sequence.playOrder) {
                case "forward":
                    ++this.nextStepNum
                    this.nextStepNum %= sequence.numSteps
                    break;
                case "reverse":
                    --this.nextStepNum
                    if (this.nextStepNum < 0) {
                        this.nextStepNum = sequence.numSteps - 1
                    }
                    break;
                case "stationary":
                    if (this.nextStepNum < 0) {
                        this.nextStepNum = 0
                    }
                    if (this.nextStepNum >= sequence.numSteps) {
                        this.nextStepNum = sequence.numSteps - 1
                    }
                    break;
                case "random":
                    this.nextStepNum = Math.floor(Math.random() * sequence.numSteps)
                    break;
            }
        }

        // Calculate nextStepTime
        const beatsPerBar = sequence.getTimeSignatureBeatsForBar(0)
        const lastPulseTime = this.pulses[this.pulses.length - 1].pulseTime
//        console.log(`lastPulseTime ${lastPulseTime} wtf ${this.pulses.length} ${JSON.stringify(this.pulses)}`)
        //console.log(`SequencePlayer.handleStep --> lastPulseTime ${Math.floor(lastPulseTime - this.startTime)} nextStepTime ${this.nextStepTime - this.startTime} ${this.dumpPulses()}`)
        // + 1 is a bit silly but the step needs to be after the last pulse
        while (this.nextStepTime <= lastPulseTime + 1) {
            this.nextStepTime += 60000 * beatsPerBar / sequence.tempo / sequence.division;
            // //console.log(`SequencePlayer.handleStep: step ${this.nextStepNum} will start at ${Math.floor(this.nextStepTime - this.startTime)}`)
        }
        //console.log(`SequencePlayer.handleStep: pulses ${JSON.stringify(this.pulses)}`)
        //console.log(`SequencePlayer.handleStep: next step ${this.nextStepNum} will start at ${Math.floor(this.nextStepTime - this.startTime)}`)
   }

    handlePulse() : void {
        // Visual update: Since pulses are schedule in advance we calculate a hint as to when the next step starts
        // console.log(`this.nextStepNum ${this.nextStepNum} at this.nextStepTime ${this.nextStepTime}`)
        // if (this.currentStepNumHint != this.nextStepNum && WebMidi.time >= this.nextStepTime) {
        //     this.currentStepNumHint = this.nextStepNum
        //     console.log(`currentStepNumHint ${this.currentStepNumHint}`)
        //     usePositionStore.getState().setCurrentStepNum(this.currentStepNumHint)
        // }

        if (this.nextPulseNum < this.pulses.length) {
            const pulse = this.pulses[this.nextPulseNum];
            if (WebMidi.time >= pulse.pulseTime - 20 && pulse.scheduledAtMsec == 0) {
                //console.log(`SequencePlayer.handlePulse(${this.nextPulseNum}): ${WebMidi.time} > pulse.pulseTime ${pulse.pulseTime} - 20`)
                var note: number = this.activeNotes[this.noteNum].note

                const sequence: Sequence = useSequenceStore.getState().sequence
                this.nextPulseTime =  pulse.pulseTime;
                // console.log(`pulse.pulseTime ${pulse.pulseTime} now ${WebMidi.time}`)
                note = sequence.scaleSettings ? sequence.scaleSettings.quantize(pulse.note + note - 60) : pulse.note + note - 60
                // //console.log(`SequencePlayer.handlePulse: Schedule pulse #${this.nextPulseNum}/${this.nextStepNum} npt ${Math.floor(this.nextPulseTime - this.startTime)} vs ${Math.floor(WebMidi.time - this.startTime)}`)
                pulse.scheduledAtMsec = WebMidi.time

                const delayMsec = pulse.pulseTime - WebMidi.time
                //console.log(`SequencePlayer.handlePulse: Scheduled pulse #${this.nextPulseNum}/${this.nextStepNum} at ${Math.floor(pulse.scheduledAtMsec - this.startTime)} delayMsec ${delayMsec} msec from ${WebMidi.time} pulse.durationMsec ${pulse.durationMsec} step ${JSON.stringify(pulse.step)} delayMsec ${delayMsec}`)
                MidiService.playNote(sequence.midiSettings, note, pulse.velocity / 127, pulse.durationMsec, delayMsec);
                // usePositionStore.getState().setCurrentStepNum(pulse.stepNum)
                usePositionStore.getState().setCurrentPulse(pulse.stepNum, this.nextPulseNum, pulse.pulseTime, pulse.durationMsec)
                ++this.nextPulseNum
            } else {
                //console.log(`SequencePlayer.handlePulse(${this.nextPulseNum}): ${WebMidi.time} < pulse.pulseTime ${pulse.pulseTime} - 20`)
            }
        }

        // Calculate next step after we play the last pulse of the previous step
        const lastpulseTime = this.pulses.length === 0 ? 0 : this.pulses[this.pulses.length - 1].pulseTime
        if (this.nextPulseNum >= this.pulses.length && WebMidi.time > lastpulseTime) {
            if (WebMidi.time >= lastpulseTime) {
                if (this.pulses.length > 0) {
                    this.noteNum++
                    if (this.noteNum >= this.activeNotes.length) {
                        this.noteNum = 0
                    } 
                }
                this.handleStep()
            }
        }
    }

    handleMidiPulse = () => {
        // console.log(`sequence-player.handleMidiPulse: time ${WebMidi.time} nextPulseTime ${this.nextPulseTime}`)
        const sequence: Sequence = useSequenceStore.getState().sequence

        // Envelopes - for each envelope, accumulate the value for thot envelope's controller
        // but how to we know which envelopes are additive? I guess they are the -1 to 1 controllers. number 1000 + cc number
        if (sequence.envelopes) {
            for (const envelope of sequence.envelopes) {
                this.updateEnvelope(envelope, sequence)
            }
        }

        // Notes
        // if (WebMidi.time >= this.nextPulseTime) {
            // console.log(`sequence-player.handleMidiPulse: time ${WebMidi.time} nextPulseTime ${this.nextPulseTime}`)
            this.handlePulse()
        // }
    }

    handleSpp = (e: any) => {
        const sequence: Sequence = useSequenceStore.getState().sequence
        // this.nextStepNum = e.spp / 16 * sequence.division
        // this.nextPulseTime = WebMidi.time
        console.log(`SequencePlayer.handleSpp nextStepNum ${this.nextStepNum} nextPulseTime (now) ${this.nextPulseTime}`)
    }
}

export default SequencePlayer;
