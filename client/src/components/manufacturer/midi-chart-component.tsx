import React, {useEffect, useRef, useState} from "react"
import "./midi-chart-component.css"
import MidiDeviceDataService, {ControllerInfo, MidiChart} from "../../services/device-service";
import {faPencil, faTrashCan, faCheck} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {WebMidi, Input} from "webmidi";

function MidiCcList(props: any) {
    console.log(`MidiCcList: props ${JSON.stringify(props)}`)
    
    const [newControllerName, setNewControllerName] = useState("")
    const [midiLearnMsbCc, setMidiLearnMsbCc] = useState(0)
    const [midiLearnLsbCc, setMidiLearnLsbCc] = useState(0)
    const [midiLearnMsbMaxValue, setMidiLearnMsbMaxValue] = useState(0)
    const [midiLearnLsbMaxValue, setMidiLearnLsbMaxValue] = useState(0)
    const midiLearnMsbCcRef = useRef(midiLearnMsbCc)
    const midiLearnLsbCcRef = useRef(midiLearnLsbCc)
    const midiLearnMsbMaxValueRef = useRef(midiLearnMsbMaxValue)
    const midiLearnLsbMaxValueRef = useRef(midiLearnLsbMaxValue)

    var midiChart: MidiChart = MidiDeviceDataService.getMidiChart(props.deviceFamily) || new MidiChart({})
    const midiChartRef = useRef(midiChart)

    useEffect(() => {
        console.log(`midiChart changed - ${JSON.stringify(midiChart.midiCcs)} - ${JSON.stringify(midiChart.midiCcs.values())}`)
        midiChartRef.current = midiChart
    }, [midiChart])

    useEffect(() => {
        console.log(`hi from useEffect - init`)
        startMidiListeners()
        return () => { stopMidiListeners() }
    }, [])

    useEffect(() => {
        midiLearnMsbCcRef.current = midiLearnMsbCc
        midiLearnLsbCcRef.current = midiLearnLsbCc
        midiLearnMsbMaxValueRef.current = midiLearnMsbMaxValue
        midiLearnLsbMaxValueRef.current = midiLearnLsbMaxValue
    }, [midiLearnMsbCc, midiLearnLsbCc, midiLearnMsbMaxValue, midiLearnLsbMaxValue])

    const handleDeleteController = (controllerName: any) => {
        console.log(`handleDeleteController ${JSON.stringify(controllerName)}`)
        midiChart.midiCcs = midiChart.midiCcs.filter((controllerInfo) => controllerInfo.name !== controllerName)
        console.log(`handleDeleteController ${JSON.stringify(midiChart.midiCcs)}`)
        saveMidiChart(midiChart)
        // Refresh
        setNewControllerName("")
    }

    const handleEditController = (e: any) => {
        console.log(`handleEditController ${JSON.stringify(e)}`)
    }

    const handleNewController = () => {
        console.log(`handleNewController - ${JSON.stringify(midiChartRef.current)}`)
        if (midiChart.getMidiController(midiLearnMsbCc) || (midiLearnMsbCc !== 0 && midiChart.getMidiController(midiLearnLsbCc))) {
            alert("Already defined")
            return
        }

        if (midiLearnMsbCc != 0 || midiLearnLsbCc != 0) {
            const controller: ControllerInfo = new ControllerInfo({
                name: newControllerName.trim(),
                ccMsb: midiLearnMsbCc,
                ccLsb: midiLearnLsbCc,
                min: 0,
                max: midiLearnMsbMaxValue,
            })
            midiChart.midiCcs.push(controller)
        }

        saveMidiChart(midiChart)

        setNewControllerName("")
        setMidiLearnMsbCc(0)
        setMidiLearnLsbCc(0)
        setMidiLearnMsbMaxValue(0)
        setMidiLearnLsbMaxValue(0)
    }

    function saveMidiChart(midiChart: MidiChart) {
        console.log(`saveMidiChart: ${JSON.stringify(midiChartRef.current)}`);
        MidiDeviceDataService.saveMidiChart(midiChartRef.current)
            .then(response => {
                console.log(response.data)
            })
            .catch(e => {
                console.error(e);
            });
    }

    const handleMidiControlChange = (midiChart: MidiChart, e: any) => {
        const ccid = e.controller.number;
        const value = e.rawValue;

        if (ccid === midiChart.globalLsbCcNumber) {
            return;
        }

        const controllerInfo: ControllerInfo | undefined = midiChart.getMidiController(ccid);
        if (controllerInfo && controllerInfo.name === "IGNORE") {
            return
        }

        console.log(`cc ${e.controller.name}/${e.controller.number}/${e.rawValue} port ${e.port.name}`)

        const isMsb: boolean = midiLearnMsbCcRef.current === 0 || midiLearnMsbCcRef.current === ccid;
        if (isMsb) {
            setMidiLearnMsbCc(ccid)
            console.log(`${value} > ${midiLearnMsbMaxValueRef.current}`)
            if (value > midiLearnMsbMaxValueRef.current) {
                console.log(`set ${midiLearnMsbMaxValueRef.current} to ${value}`)
                setMidiLearnMsbMaxValue(value)
            }
        } else {
            setMidiLearnLsbCc(ccid)
            if (value > midiLearnLsbMaxValueRef.current) {
                setMidiLearnLsbMaxValue(value)
            }
        }
    }

    function getMidiLearnMaxValue() : number {
        return midiLearnLsbMaxValue
    }

    const startMidiListeners = () => {
        stopMidiListeners()
        // console.log(`🎹startMidiListeners`);

        var inputNum = 0;
        for (const input of WebMidi.inputs) {
            // console.log(`🎹startMidiListeners - add listener ${input.name}`);
            input.addListener("controlchange", e => {
                handleMidiControlChange(midiChart, e);
            }, {});
        }
    }

    const stopMidiListeners = () => {
        // console.log(`🎹stopMidiListeners`);
        for (var inputNum = 0; inputNum < WebMidi.inputs.length; inputNum++) {
            WebMidi.inputs[inputNum].removeListener()
        }
    }

    return (
        <div className="midiCcList">
            <table>
                <thead>
                    <tr>
                        <th>Controller</th>
                        <th>ccMsb</th>
                        <th>ccLsb</th>
                        <th>Min</th>
                        <th>Max</th>
                    </tr>
                </thead>
                <tbody>
                    {midiChart.midiCcs.map((controller) => {
                        return (<tr key={controller.name}>
                            <th>{controller.name}</th>
                            <td>{controller.ccMsb}</td>
                            <td>{controller.ccLsb}</td>
                            <td>{controller.min}</td>
                            <td>{controller.max}</td>
                            <td>
                                <button onClick={e => handleEditController(controller.name)}><FontAwesomeIcon icon={faPencil}/></button>
                                <button onClick={e => handleDeleteController(controller.name)}><FontAwesomeIcon icon={faTrashCan}/></button>
                            </td>
                        </tr>)
                    })}
                    <tr>
                        <th><input type="text" key="new controller" id="fname" name="ccname" value={newControllerName} onChange={e => setNewControllerName(e.target.value)}/></th>
                        <td><input type="number" min={0} max={127} id="fname" name="ccmsb" value={midiLearnMsbCc} onChange={e => setMidiLearnMsbCc(e.target.valueAsNumber)}/></td>
                        <td><input type="number" min={0} max={127} id="fname" name="cclsb" value={midiLearnLsbCc} onChange={e => setMidiLearnLsbCc(e.target.valueAsNumber)}/></td>
                        <td><input type="number" id="fname" name="ccmin" value={0} onChange={e => console.log(`cant change`)}/></td>
                        <td><input type="number" id="fname" name="ccmax" value={midiLearnMsbMaxValue} onChange={e => {
                            console.log(e.target.valueAsNumber)
                            setMidiLearnMsbMaxValue(e.target.valueAsNumber)
                        }}/></td>
                        <td>
                            <button type="submit" onClick={handleNewController}><FontAwesomeIcon icon={faCheck}/></button>
                            <button onClick={e => {
                                setNewControllerName("")
                                setMidiLearnMsbCc(0)
                                setMidiLearnLsbCc(0)
                                setMidiLearnMsbMaxValue(0)
                                setMidiLearnLsbMaxValue(0)
                            }}><FontAwesomeIcon icon={faTrashCan}/></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export function MidiChartView(props: any) {
    console.log(`hi from MidiChart props: ${JSON.stringify(props)}`)
    return (
        <div className="midiChart">
            <h1>MIDI Chart</h1>
            <MidiCcList deviceFamily={props.deviceFamily}></MidiCcList>
        </div>
    )
}
