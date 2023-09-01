import {ControllerEntry, Sequence, Preset, IStepFilterEditor} from "../../../player/sequence";
import {IStepProcessor, Pulse} from "../../../player/sequence-player";
import {ISequencePlayer} from "../../../player/sequence-player"

export class SkipFilter implements IStepProcessor, IStepFilterEditor {

    //IStepFilterEditor
    getOptionName(): string {
        return "skip"
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
        // const sequence: Sequence = sequencePlayer.getSequence()
        const prob: number = program.steps[sequencePlayer.nextStepNum]
        console.log(`SkipFilter. program ${JSON.stringify(program)} step ${sequencePlayer.nextStepNum} -> prob ${prob}`)
        if (Math.random() * 100 > prob) {
            return pulses
        }

        console.log(`SkipFilter. skip!!!`)
        return []
    }
}
