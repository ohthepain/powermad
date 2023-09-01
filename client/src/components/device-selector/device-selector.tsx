import React from "react"
import {Sequence} from "../../player/sequence";
import MidiDeviceDataService, {MidiChart, MidiChartDataService} from "../../services/device-service"
import Select from "react-select"
import { useSequenceStore } from "../../app/state/sequence-store";
// import sequenceService from "../../services/sequence-service";

type DeviceSelectorProps = {
    sequence: Sequence;
}

const DeviceSelector = (props: DeviceSelectorProps) => {

    const setDeviceFamilyId = useSequenceStore(state => state.setDeviceFamilyId)

    const getDeviceOptions : any = () => {
        const midiCharts: MidiChart[] = MidiChartDataService.midiCharts
        var options: Array<any> = new Array<any>
        midiCharts.forEach(midiChart => {
            options.push({ value: midiChart._id, label: midiChart.familyName })
        })
        return options
    }

    const onChangeDevice = (item: any) => {
        setDeviceFamilyId(item.value)
        // const midiChart = MidiDeviceDataService.getMidiChart(props.sequence.deviceFamilyId)
        // const midiCharts: MidiChart[] = MidiChartDataService.midiCharts
        // for (var chart of midiCharts) {
        //     if (midiChart.familyName)
        // }
    }

    const getDeviceOption = (deviceFamilyId: string) => {
        var midiChart
        if (deviceFamilyId !== "") {
            midiChart = MidiDeviceDataService.getMidiChart(deviceFamilyId)
        } else {
            midiChart = MidiChartDataService.midiCharts[0]
        }
        if (!midiChart) {
            throw(`no midi chart found for deviceFamilyId ${deviceFamilyId}`)
        }
        return {value: midiChart._id, label: midiChart.familyName}
    }

    // console.log(`midicharts ${JSON.stringify(MidiChartDataService.midiCharts)}`)

    if (MidiChartDataService.midiCharts.length == 0) {
        return (<h1>Waiting for MIDI Charts ...</h1>)
    }

    return (
        <div>
            <Select options={getDeviceOptions} 
                value={getDeviceOption(props.sequence.deviceFamilyId)}
                onChange={e => onChangeDevice(e!)}/>
        </div>
    )
}

export default DeviceSelector
