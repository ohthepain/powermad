import {ControllerEntry, Sequence, Preset, IStepFilterEditor} from "../../../player/sequence";
import {IStepProcessor, Pulse} from "../../../player/sequence-player";
import {ISequencePlayer} from "../../../player/sequence-player"

export class ProbabilityFilter implements IStepProcessor, IStepFilterEditor {

    //IStepFilterEditor
    getOptionName(): string {
        return "Probability"
    }

    getMinStepValue() : number {
        return 0
    }

    getMaxStepValue() : number {
        return 100
    }

    getStepValueIncrement(): number {
        return 10
    }

    onEditSequence(sequence: Sequence, preset: Preset) : void {
    }

    //IStepProcessor
    getPulses(sequencePlayer: ISequencePlayer, program: any, pulses: Pulse[], controllerEntry: ControllerEntry, stepNum: number) : Pulse[] {
        const prob: number = program.steps[sequencePlayer.nextStepNum]
        console.log(`ProbabilityFilter. program ${JSON.stringify(program)} step ${sequencePlayer.nextStepNum} -> prob ${prob}`)
        if (Math.random() * 100 < prob) {
            for (var n=0; n < pulses.length; n++) {
                pulses[n].velocity = 0
            }
        }
        return pulses
    }
}
