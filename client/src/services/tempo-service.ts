import { WebMidi } from "webmidi"
import {EventEmitter} from 'events';
import {MidiDevicePreferences, MidiDeviceSettings, usePreferencesStore} from "../preferences/preferences-store";

class TempoService {
    bpm: any;
    eventsEmitter: EventEmitter;
    lastTickTime: any;
    ppqn: any;
    pulseIntervalMsec: any;
    startTime: any;
    nextPulseNum: number = 0;
    intervalId: any;

    startSpp: number = 0;
    loopSpp: number = 0;
    currentSpp: number = 0;

    constructor() {
        console.log(`hi from TempoService:ctor`)
        this.eventsEmitter = new EventEmitter()
        this.setPpqn(24);
        this.setTempo(120)
        this.reset()
    }

    stopIntervalTimer() {
        console.log(`TempoService.stopIntervalTimer`)
        clearInterval(this.intervalId)
    }

    startIntervalTimer() {
        this.stopIntervalTimer()
        // console.groupCollapsed()
        // console.trace(`TempoService.startIntervalTimer`)
        // console.groupEnd()
        console.log(`TempoService.startIntervalTimer`)
        const pps = this.bpm * this.ppqn;
        this.pulseIntervalMsec = 60 * 1000 / pps;
        console.log(`TempoService.startIntervalTimer bpm ${this.bpm} interval ${this.pulseIntervalMsec} msec @ ${this.ppqn} = ${this.pulseIntervalMsec * this.ppqn} msec/qn`)

        this.startTime = WebMidi.time
        this.nextPulseNum = 0

        this.handleInterval()
        this.intervalId = setInterval(this.handleInterval, this.pulseIntervalMsec)
        // this.link.startUpdate(60, (beat: any, phase: any, bpm: any) => {
        //     console.log("updated: ", beat, phase, bpm);
        // });
    }

    handleInterval = () => {
        // console.log(`TempoService.handleInterval: ${WebMidi.time} - ${this.lastTickTime} > ${this.pulseIntervalMsec}?`)
        const elapsedMsec = WebMidi.time - this.startTime
        // const pulseCount = elapsedMsec / this.pulseIntervalMsec;

        this.currentSpp = Math.floor(this.getElapsedMsec() / this.pulseIntervalMsec * 16 / this.ppqn)
        if (this.loopSpp !== 0 && this.currentSpp > this.loopSpp) {
            this.currentSpp = this.loopSpp
            this.sendSpp(this.currentSpp)            
        }
        
        if (WebMidi.time > this.startTime + this.nextPulseNum * this.pulseIntervalMsec) {

            // console.log(`send clock pulse ${this.nextPulseNum} at ${Math.floor(WebMidi.time - this.startTime)}`)
            this.sendClock(this.nextPulseNum)
            this.eventsEmitter.emit('MIDI pulse', { time: elapsedMsec, ticks: this.nextPulseNum })

            this.lastTickTime = WebMidi.time

            ++this.nextPulseNum
        }
    }

    sendStart = () => {
        const midiDevicePreferences: MidiDevicePreferences = usePreferencesStore.getState().midiDevicePreferences
        WebMidi.outputs.forEach((output) => {
            // console.log(`Preferences.getMidiOutputs: ${JSON.stringify(output)}`)
            if (midiDevicePreferences.isSyncEnabledForMidiOutputId(output.id)) {
                // console.log(`TempoService.sendStart: to ${output.name}`)
                output.sendStart()
            }
        })
    }

    sendStop = () => {
        const midiDevicePreferences: MidiDevicePreferences = usePreferencesStore.getState().midiDevicePreferences
        WebMidi.outputs.forEach((output) => {
            if (midiDevicePreferences.isSyncEnabledForMidiOutputId(output.id)) {
                output.sendStop()
            }
        })
    }

    sendContinue = () => {
        const midiDevicePreferences: MidiDevicePreferences = usePreferencesStore.getState().midiDevicePreferences
        WebMidi.outputs.forEach((output) => {
            if (midiDevicePreferences.isSyncEnabledForMidiOutputId(output.id)) {
                output.sendContinue()
            }
        })
    }

    // Panic button?
    sendReset = () => {
        const midiDevicePreferences: MidiDevicePreferences = usePreferencesStore.getState().midiDevicePreferences
        WebMidi.outputs.forEach((output) => {
            if (midiDevicePreferences.isSyncEnabledForMidiOutputId(output.id) 
            || midiDevicePreferences.isTrackingEnabledForMidiOutputId(output.id)) {
                output.sendReset()
            }
        })
    }

    sendClock = (timePulses: number) => {
        const midiDevicePreferences: MidiDevicePreferences = usePreferencesStore.getState().midiDevicePreferences
        WebMidi.outputs.forEach((output) => {
            // console.log(`Preferences.getMidiOutputs: ${JSON.stringify(output)}`)
            if (midiDevicePreferences.isSyncEnabledForMidiOutputId(output.id)) {
                // console.log(`TempoService.sendClock: to ${output.name} - ${timePulses} pulses`)
                output.sendClock({ time: timePulses })
            }
        })
    }

    sendSpp = (spp: number) => {
        this.eventsEmitter.emit('SPP', { spp: this.currentSpp })

        const midiDevicePreferences: MidiDevicePreferences = usePreferencesStore.getState().midiDevicePreferences
        WebMidi.outputs.forEach((output) => {
            // console.log(`Preferences.getMidiOutputs: ${JSON.stringify(output)}`)
            if (midiDevicePreferences.isSyncEnabledForMidiOutputId(output.id)) {
                output.sendSongPosition(spp)
            }
        })
    }

    setTempo(bpm: any) {
        this.bpm = bpm;
    }

    setPpqn(ppqn: any) {
        this.ppqn = ppqn;
    }

    reset() {
        console.log(`TempoService.reset bpm ${this.bpm}`)
        this.startTime = WebMidi.time
        this.lastTickTime = WebMidi.time
    }

    // TODO: Consider MIDI timecode
    getElapsedMsec() : number {
        const elapsed = WebMidi.time - this.startTime
        // console.log(`getElapsedMsec: WebMidi.time ${WebMidi.time} this.startTime ${this.startTime} = elapsed ${elapsed} ==> ${Math.floor(elapsed/1000)} seconds}`)
        return elapsed
    }

    // TODO: Consider MIDI timecode
    getElapsed64ths() : number {
        const elapsed64ths = Math.floor(this.getElapsedMsec() / 60000 * this.bpm * 64 / 4)
        // const elapsed64ths = this.getElapsedMsec() / this.pulseIntervalMsec / this.ppqn * 16
        // console.log(`getElapsed64ths: msec ${Math.floor(this.getElapsedMsec())} -> getElapsed64ths ${elapsed64ths} at bpm ${this.bpm}`)
        return elapsed64ths
    }

    start() {
        this.startTime = WebMidi.time
        this.currentSpp = this.startSpp
        this.eventsEmitter.emit('SPP', { spp: this.currentSpp })
        this.sendStart()
        this.startIntervalTimer()
    }

    continue() {
        this.sendContinue()
        this.startIntervalTimer()
    }

    stop() {
        this.stopIntervalTimer()
        this.sendStop()
    }
}

export default new TempoService()
