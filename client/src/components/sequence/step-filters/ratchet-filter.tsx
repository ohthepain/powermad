import {ControllerEntry, Sequence, Preset, IStepFilterEditor} from "../../../player/sequence";
import {IStepProcessor, Pulse} from "../../../player/sequence-player";
import {ISequencePlayer} from "../../../player/sequence-player"

export class RatchetFilter implements IStepProcessor, IStepFilterEditor {

    //IStepFilterEditor
    getOptionName(): string {
        return "Ratchet"
    }

    getMinStepValue() : number {
        return 0
    }

    getMaxStepValue() : number {
        return 8
    }

    getStepValueIncrement(): number {
        return 1
    }

    onEditSequence(sequence: Sequence, preset: Preset) : void {
    }

    //IStepProcessor
    getPulses(sequencePlayer: ISequencePlayer, program: any, pulses: Pulse[], controllerEntry: ControllerEntry, stepNum: number) : Pulse[] {
        // const sequence: Sequence = sequencePlayer.getSequence()
        const numRatchets: number = program.steps[sequencePlayer.nextStepNum]
        console.log(`RatchetFilter. program ${JSON.stringify(program)} step ${sequencePlayer.nextStepNum} -> ${numRatchets} ratchets`)
        for (var n=0; n < numRatchets; n++) {
            pulses[numRatchets].velocity = 0
        }
        return pulses
    }
}
