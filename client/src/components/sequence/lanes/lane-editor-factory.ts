import { PulseCountFilter } from "../../../components/sequence/pulse-count/pulse-count-filter"
import { ProbabilityFilter } from "../../../components/sequence/step-filters/probability-filter"
import { SkipFilter } from "../../../components/sequence/step-filters/skip-filter"
import { IStepFilterEditor } from "../../../player/sequence";

export function getStepFilterEditor(typeId: string) : IStepFilterEditor {
    if (typeId === "pulse-count") {
        return new PulseCountFilter()
    } else if (typeId === "probability") {
        return new ProbabilityFilter()
    } else {
        return new SkipFilter()
    }
}
