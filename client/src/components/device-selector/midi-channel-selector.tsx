import React from "react"
import Select from 'react-select'

type MidiChannelSelectorProps = {
    channelNum: number;
    onChange: (channelNum: number) => void;
}

export default function  MidiChannelSelector(props: MidiChannelSelectorProps) {

    const getMidiChannelOptions = (allowOmni: boolean) => {
        var options: any = []
        allowOmni && options.push({ value: -1, label: "All"})
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(n => {
            return (
                options.push({ value: n, label: n })
            )
        })}
        return options
    }

    return (
        <div className="flexbox-item">
            <Select options={getMidiChannelOptions(true)}
                    value={ {value: props.channelNum, label: props.channelNum == -1 ? "All" : props.channelNum}}
                    onChange={e => props.onChange(e!.value)}/>
        </div>
    )
}
