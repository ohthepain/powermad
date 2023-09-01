import React, {createContext, useEffect, useState} from "react";
// import {useQuery} from "@tanstack/react-query";
// import http from "../../http-common";
import "./manufacturer.css"
import {MidiChartView} from "./midi-chart-component"
import {MidiChartDataService, MidiChart} from "../../services/device-service";
import Select from 'react-select'
// import {findMidiChart} from "../../util/midi-utils";

export const DeviceDatabaseContext = createContext(null)

const ManufacturerPage = (props: any) => {
    console.log(`ManufacturerPage: hi`)
    const midiCharts: MidiChart[] = MidiChartDataService.midiCharts
    if (midiCharts.length == 0) {
        return (<h1>Waiting for MIDI Charts ...</h1>)
    } else {
        return <Manufacturer />
    }
}

const Manufacturer = (props: any) => {
    const midiCharts: MidiChart[] = MidiChartDataService.midiCharts
    console.log(`Manufacturer: midiCharts ${JSON.stringify(midiCharts)}`)

    const [manufacturer, setManufacturer] = useState(midiCharts[0].manufacturer)
    const [deviceFamily, setDeviceFamily] = useState(midiCharts[0].familyName)
    // const [device, setDevice] = useState(null)

    useEffect(() => {
        console.log(`manafacturer changed - set device family to ${midiCharts[0].familyName}`)
        const deviceFamily: string = getDeviceFamilies(manufacturer)[0]
        setDeviceFamily(deviceFamily)
    }, [manufacturer])

    // const getManufacturers = () => {
    //     let manufacturers = new Set()
    //     // manufacturers.add('All Manufacturers')
    //     for (const family of midiCharts) {
    //         manufacturers.add(family.manufacturer)
    //     }
    //     console.log(`getManufacturers: ${JSON.stringify(Array.from(manufacturers))}`)
    //     return Array.from(manufacturers)
    // }

    const getManufacturerOptions = (): Array<any>  => {
        var options : Array<any> = []
        midiCharts.map(manufacturer => {
                options.push({ value: manufacturer.manufacturer, label: manufacturer.manufacturer })
        })
        console.log(`MidiInputSelector: getMidiInputOptions: options are ${JSON.stringify(options)}`)
        return options
    }

    const getDeviceFamilies = (manufacturer: string) : string[] => {
        let families = new Set<string>()
        // families.add('All Device Families')
        for (const midiChart of midiCharts) {
            if (midiChart.manufacturer === manufacturer || !manufacturer || manufacturer === "All Manufacturers") {
                families.add(midiChart.familyName)
            }
        }
        console.log(`getDeviceFamilies: <${manufacturer}> -> ${JSON.stringify(Array.from(families))}`)
        return Array.from(families)
    }

    const getDeviceFamilyOptions = (manafacturer: string): Array<any>  => {
        var options : Array<any> = []
        for (const midiChart of midiCharts) {
            if (midiChart.manufacturer === manufacturer || !manufacturer || manufacturer === "All Manufacturers") {
                options.push({ value: midiChart.familyName, label: midiChart.familyName })
            }
        }
        return options
    }

    const getDevices = (manufacturer: string, deviceFamily: string) => {
        let devices = new Set()
        for (const midiChart of midiCharts) {
            if (midiChart.manufacturer === manufacturer || !manufacturer || manufacturer === "All Manufacturers") {
                if (midiChart.familyName === deviceFamily || !deviceFamily || deviceFamily === "All Device Families") {
                    for (const device of midiChart.devices) {
                        devices.add(device)
                    }
                }
            }
        }
        console.log(`getDevices: <${manufacturer}>/<${deviceFamily}> -> ${JSON.stringify(Array.from(devices))}`)
        return Array.from(devices)
    }

    const handleSelectDevice = (name: string) => {
        console.log(`onSelectDevice ${name}`)
        // setDevice(name)
    }

    const onChangeManufacturer = (e: any) => {
        console.log(`onChangeManufacturer ${JSON.stringify(e.target.value)}`)
        setManufacturer(e.target.value)
    }

    const onSelectDeviceFamily = (e: any) => {
        console.log(`onSelectDeviceFamily ${e.target.value}`)
        let deviceObject = e.target.value
        setDeviceFamily(deviceObject)
    }

    console.log(`Manufacturer ${manufacturer} deviceFamily ${deviceFamily} device ${JSON.stringify(deviceFamily)}`)

    return (
        <div>
            <div id="container-fluid">
            <div className="flexbox-row pb-1 Island">
                Manufacturer
                <Select options={getManufacturerOptions()}
                    value={{value: manufacturer, label: manufacturer} }
                    onChange={e => props.onChange(e!.value || "", e!.label || "")}
                />
                <button className="menu-button zen-mode-transition flex-end" type="button" title="edit" onClick={() => {}}>
                        <svg viewBox="0 0 16 16" fill="none">
                            <g fill="#000000">
                                <path fillRule="evenodd" d="M11.436 1.005A1.75 1.75 0 0113.902.79l.702.589a1.75 1.75 0 01.216 2.465l-5.704 6.798a4.75 4.75 0 01-1.497 1.187l-2.572 1.299a.75.75 0 01-1.056-.886l.833-2.759a4.75 4.75 0 01.908-1.68l5.704-6.798zm1.502.934a.25.25 0 00-.353.03l-.53.633 1.082.914.534-.636a.25.25 0 00-.031-.352l-.703-.59zm-.765 2.726l-1.082-.914-4.21 5.016a3.25 3.25 0 00-.621 1.15L5.933 11l1.01-.51a3.249 3.249 0 001.024-.812l4.206-5.013z" clipRule="evenodd"/>
                                <path d="M3.25 3.5a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h9.5a.75.75 0 00.75-.75V9A.75.75 0 0115 9v4.75A2.25 2.25 0 0112.75 16h-9.5A2.25 2.25 0 011 13.75v-9.5A2.25 2.25 0 013.25 2H6a.75.75 0 010 1.5H3.25z"/>
                            </g>
                        </svg>
                </button>
            </div>
            <div className="flexbox-row pb-1 Island">
                Devices
                <Select options={getDeviceFamilyOptions(manufacturer)}
                    value={{value: deviceFamily, label: deviceFamily} }
                    // onChange={e => props.onChange(e!.value || "", e!.label || "")}
                />
                <button className="menu-button zen-mode-transition flex-end" type="button" title="edit" onClick={() => {}}>
                    <svg viewBox="0 0 16 16" fill="none">
                        <g fill="#000000">
                            <path fillRule="evenodd" d="M11.436 1.005A1.75 1.75 0 0113.902.79l.702.589a1.75 1.75 0 01.216 2.465l-5.704 6.798a4.75 4.75 0 01-1.497 1.187l-2.572 1.299a.75.75 0 01-1.056-.886l.833-2.759a4.75 4.75 0 01.908-1.68l5.704-6.798zm1.502.934a.25.25 0 00-.353.03l-.53.633 1.082.914.534-.636a.25.25 0 00-.031-.352l-.703-.59zm-.765 2.726l-1.082-.914-4.21 5.016a3.25 3.25 0 00-.621 1.15L5.933 11l1.01-.51a3.249 3.249 0 001.024-.812l4.206-5.013z" clipRule="evenodd"/>
                            <path d="M3.25 3.5a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h9.5a.75.75 0 00.75-.75V9A.75.75 0 0115 9v4.75A2.25 2.25 0 0112.75 16h-9.5A2.25 2.25 0 011 13.75v-9.5A2.25 2.25 0 013.25 2H6a.75.75 0 010 1.5H3.25z"/>
                        </g>
                    </svg>
                </button>                
            </div>
            <div className="manufacturerBar">{manufacturer}</div>
                {deviceFamily ? (
                    <div className="deviceArea">
                        <div className="selectDevice">{deviceFamily ? deviceFamily : "none"}</div>
                        <div className="deviceListColumn">
                            {getDevices(manufacturer, deviceFamily).map((device: any) => {
                                console.log(`add key ${device.name}`)
                                return (
                                    <div className="device" id={device.name} key={device.name}>
                                        <button className="device-button" onClick={() => {
                                                handleSelectDevice(device.name);
                                                // setDeviceFamily(device.familyName)
                                            }}>
                                            <img className="device-image" src={device.imageUrl}/>
                                            <h3>{device.name}</h3>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="deviceInfoColumn">
                            {/*<div className="deviceImage">*/}
                            {/*    <img src={device.imageUrl}/>*/}
                            {/*</div>*/}
                            {/*<div className="deviceInfo">Device Info*/}
                            {/*    insert midi cc info here for*/}
                            {/*</div>*/}
                            {deviceFamily && deviceFamily != "All Device Families" ? (
                                <MidiChartView deviceFamily={deviceFamily}/>
                            ) : (
                                <h3>select device family</h3>
                            )}
                        </div>
                    </div>
                ) : (
                    <h2>
                    please select device
                    </h2>
                )}
        </div>
        </div>
    )
}

export default ManufacturerPage
