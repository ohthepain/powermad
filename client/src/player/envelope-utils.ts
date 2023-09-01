import {Envelope, EnvelopePoint, Sequence} from "./sequence";

export function getEnvelopeValue(envelope: Envelope, timeInSteps: number) : number {
    const numpoints = envelope.points.length
    // const loop: boolean = true;
    var index = 0
    while (index < numpoints && envelope.points[index].time64ths < timeInSteps) {
        ++index
    }

    if (index === 0) {
        return envelope.points[0].value
    } else if (index >= numpoints) {
        return envelope.points[numpoints - 1].value
    } else {
        const p0: EnvelopePoint = envelope.points[index - 1];
        const p1: EnvelopePoint = envelope.points[index];
        if (p0.time64ths === p1.time64ths) {
            return p0.value
        } else {
            return p0.value + (timeInSteps - p0.time64ths) / (p1.time64ths - p0.time64ths) * (p1.value - p0.value)
        }
    }
}

export function getEnvelopeValueForPos64ths(envelope: Envelope, timeIn64ths: number) : number {
    const pos64ths = timeIn64ths % envelope.length64ths
    const numpoints = envelope.points.length
    // const loop: boolean = true;
    var index = 0
    while (index < numpoints && envelope.points[index].time64ths < pos64ths) {
        ++index
    }

    if (index === 0) {
        return envelope.points[0].value
    } else if (index >= numpoints) {
        return envelope.points[numpoints - 1].value
    } else {
        const p0: EnvelopePoint = envelope.points[index - 1];
        const p1: EnvelopePoint = envelope.points[index];
        if (p0.time64ths === p1.time64ths) {
            return p0.value
        } else {
            return p0.value + (pos64ths - p0.time64ths) / (p1.time64ths - p0.time64ths) * (p1.value - p0.value)
        }
    }
}

export function getEnvelopeOptions(sequence: Sequence) {
    var options = []
    if (!sequence.currentEnvelopeId || sequence.currentEnvelopeId === 'notes') {
        options.push({value: 'notes', label: 'notes'})
    } else {
        // options.push({ value: 'sequence.currentEnvelopeId', label: sequence.currentEnvelopeId })
        options.push({value: 'notes', label: 'notes'})
    }
    if (sequence.envelopes != null) {
        for (const envelope of sequence.envelopes) {
            options.push({value: envelope.id, label: envelope.controller})
        }
    }

    // const moreOptions = [
    //     {value: 'learn', label: 'learn'},
    // ]
    // options.push(...moreOptions)
    return options
}

export function getEnvelopeOption(sequence: Sequence, value: any) {
    for (const option of getEnvelopeOptions(sequence)) {
        if (option.value === value) {
            return option
        }
    }
}
