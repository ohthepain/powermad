import TempoService from "../services/tempo-service";
import {WebMidi} from "webmidi";
import SequencePlayer, {MidiNote} from "./sequence-player";
import {Sequence} from "./sequence";
// import sequencePlayer from "./sequence-player";
import {useSequenceStore} from "../app/state/sequence-store";
import { usePositionStore } from "../app/state/position-store";

class SongPlayer {
    isPlaying: any;
    lastTickTime: any;
    startTickTime: any;
    sequencePlayers: any;

    constructor() {
        console.log(`SongPlayer:ctor`)
        this.sequencePlayers = []
        this.isPlaying = false
    }

    searchSequencePlayer(sequenceId: string) {
        // console.log(`getSequencePlayer - there are ${this.sequencePlayers.length} players in ${JSON.stringify(this.sequencePlayers)}`)
        for (const sequencePlayer of this.sequencePlayers) {
            // console.log(`SongPlayer.getSequencePlayer - try ${sequencePlayer.sequenceId} === ${sequenceId}`)
            if (sequencePlayer.sequenceId === sequenceId) {
                // console.log(`SongPlayer.getSequencePlayer - found ${sequencePlayer.sequenceId} === ${sequenceId}`)
                return sequencePlayer
            }
        }
    }

    addNote(sequenceId: string, midiNote: MidiNote) {
        if (this.sequencePlayers.length === 0 && midiNote.velocity > 0) {
            this.startSequence(sequenceId, [midiNote])
        } else {
            this.sequencePlayers[0].addNotes([midiNote])
        }
    }

    getActiveNotes() : Array<number> {
        return this.sequencePlayers.length > 0 ? this.sequencePlayers[0].activeNotes : []
    }

    addNoteGlobal(midiNote: MidiNote) {
        this.sequencePlayers[0].addNotes([midiNote])
    }

    removeNoteGlobal(midiNote: MidiNote) {
        // console.trace(`SongPlayer.removeNote: sequencePlayers: ${JSON.stringify(this.sequencePlayers)}`)
        this.sequencePlayers[0].removeNotes([midiNote])
    }

    removeNote(sequenceId: string, midiNote: MidiNote) {
        console.trace(`SongPlayer.removeNote: sequencePlayers: ${JSON.stringify(this.sequencePlayers)}`)
        this.sequencePlayers[0].removeNotes([midiNote])
        console.trace(`SongPlayer.removeNote: notes remaining: ${this.sequencePlayers[0].activeNotes.length} notes -> ${JSON.stringify(this.sequencePlayers[0].activeNotes)}`)
        if (this.sequencePlayers[0].activeNotes.length === 0) {
            console.trace(`SongPlayer.removeNote: will stop`)
            this.stop()
        }
    }

    startSequence(sequenceId: string, notes: Array<any>) {
        console.log(`SongPlayer.startSequence - ${sequenceId} isPlaying? ${this.isPlaying}`)
        var sequencePlayer = new SequencePlayer(sequenceId)
        this.sequencePlayers.push(sequencePlayer)
        if (notes.length > 0) {
            console.log(`SongPlayer.startSequence - we have notes`)
            sequencePlayer.start(notes)
        }
        this.isPlaying = true;
        usePositionStore.getState().setIsPlaying(true)

        // TempoService.eventsEmitter.addListener('MIDI pulse', (e: any) => { this.handleMidiPulse(e); })
        // TempoService.eventsEmitter.addListener('SPP', (e: any) => { this.handleSpp(e); })
        this.startTickTime = WebMidi.time
        this.lastTickTime = WebMidi.time
        console.log(`SongPlayer.startSequence: - ${this.sequencePlayers.length} sequencePlayers. ${WebMidi.time}`)
        if (this.sequencePlayers.length === 1) {
            const sequence: Sequence = useSequenceStore.getState().sequence
            console.log(`set tempo ${sequence.tempo}`)
            TempoService.setTempo(sequence.tempo)
            TempoService.start()
        }

        console.log(`SongPlayer.startSequence: sequencePlayers: ${JSON.stringify(this.sequencePlayers)}`)
    }

    stop() {
        console.log(`SongPlayer.stop - isPlaying? ${this.isPlaying}`)
        this.isPlaying = false;
        usePositionStore.getState().setIsPlaying(false)

        // Find sequence player
        // Remove
        // this.sequencePlayers.remove(sequence)
        for (var sequencePlayer of this.sequencePlayers) {
            sequencePlayer.stop();
        }
        this.sequencePlayers = []
        TempoService.stop()
        // TempoService.eventsEmitter.removeListener('MIDI pulse')
        // TempoService.eventsEmitter.removeListener('SPP')
    }

    handleMidiPulse(e: any) {
        // console.log(`SongPlayer: MIDI pulse - ${this.sequencePlayers.length} sequences. ${WebMidi.time} ${this.lastTickTime} ${WebMidi.time - this.lastTickTime} ${TempoService.pulseIntervalMsec * TempoService.ppqn}`)
        // if (WebMidi.time - this.lastTickTime >= TempoService.pulseIntervalMsec * TempoService.ppqn) {
        //     // console.log(`SongPlayer: quarter note`)
        //     this.lastTickTime = WebMidi.time
        // }
        //
        // this.sequencePlayers.forEach((sequencePlayer: any) => {
        //     sequencePlayer.handleMidiPulse()
        // })
    }

    handleSpp(e: any) {

    }
}

export default new SongPlayer();
