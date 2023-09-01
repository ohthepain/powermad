import {MidiChart, MidiChartDataService} from "../services/device-service";

function findMidiChart(searchString: string) : MidiChart | undefined {
    // console.log(`findMidiChart: for device name ${nameArg} ... in ${JSON.stringify(MidiChartDataService.midiCharts)}`)

    if (searchString === 'omni' || searchString === 'none') {
        return undefined
    }

    const midiCharts: MidiChart[] = MidiChartDataService.midiCharts

    for (const midiChart of midiCharts) {
        if (midiChart.familyName === searchString) {
            return midiChart
        }

        for (const devicename of midiChart.inputNames) {
            if (devicename === searchString) {
                return midiChart;
            }
        }
        for (const devicename of midiChart.outputNames) {
            if (devicename === searchString) {
                return midiChart;
            }
        }
        for (const device of midiChart.devices) {
            if (device.name === searchString) {
                return midiChart;
            }
        }
    }

    // console.warn(`getMidiChart: for device name ${searchString} not found`)
    return undefined
}

export { findMidiChart }
