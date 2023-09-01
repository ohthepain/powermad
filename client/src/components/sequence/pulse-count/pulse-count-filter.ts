import {ControllerEntry, Sequence, Preset, IStepFilterEditor} from "../../../player/sequence";
import {IStepProcessor, Pulse} from "../../../player/sequence-player";
import {ISequencePlayer} from "../../../player/sequence-player"

export class PulseCountFilter implements IStepProcessor, IStepFilterEditor {

    //IStepFilterEditor
    getOptionName(): string {
        return "pulse-count"
    }

    onEditSequence(sequence: Sequence, preset: Preset) : void {
    }

    getMinStepValue() : number {
        return 1
    }

    getMaxStepValue() : number {
        return 8
    }

    getStepValueIncrement(): number {
        return 1
    }

    //IStepProcessor
    getPulses(sequencePlayer: ISequencePlayer, program: any, pulses: Pulse[], controllerEntry: ControllerEntry, stepNum: number) : Pulse[] {

        // console.log(`PulseCountFilter.step: program ${JSON.stringify(program)}`)
        const sequence = sequencePlayer.getSequence()
        const step = sequence.steps[sequencePlayer.nextStepNum];
        const stepDurationMsec = sequence.tempo / 60 / sequence.division * 1000;
        const count: number = program.steps[stepNum]
        // console.log(`PulseCountFilter.step ${stepNum} has ${count} steps`)
        let newPulses: Pulse[] = new Array<Pulse>();
        var stepNum = 0
        for (const pulse of pulses) {
            const firstPulseTime = pulse.pulseTime;
            for (var n=0; n < count; n++) {
                // Copy pulse, only pulseTime changes
                var newPulse = new Pulse(step, pulse.note, pulse.velocity, pulse.durationMsec, pulse.stepNum, firstPulseTime + stepDurationMsec * n);
                newPulses.push(newPulse)
                // console.log(`PulseCountFilter.step: building pulse ${n} of ${count} with ${stepDurationMsec} msec between ${JSON.stringify(newPulses)}`)
            }
            ++stepNum
        }

        return newPulses
    }
}
