// import http from "../http-common"
import {findMidiChart} from "../util/midi-utils"
import {WebMidi} from "webmidi";
import axios from "axios";

export class ControllerInfo {
    public name: string = "unassigned";
    public ccMsb: number = 0;
    public ccLsb: number = 0;
    public max: number = 127;
    public min: number = 0;

    constructor(jsonObject: any) {
        this.name = jsonObject.name;
        this.ccMsb = jsonObject.ccMsb;
        this.ccLsb = jsonObject.ccLsb;
        this.max = jsonObject.max;
        this.min = jsonObject.min;
    }

    public toString = () => {
        return `ControllerInfo ${this.name} ${this.min} to ${this.max} ccMsb ${this.ccMsb} ccLsb ${this.ccLsb}`
    }
}

export class DeviceInfo {
    name: string = "";
    url: string = "";
}

export class MidiChart {
    public _id: string = "";
    public manufacturer: string = "";
    public familyName: string = "";
    public inputNames: string[] = [];
    public outputNames: string[] = [];
    public midiCcs: ControllerInfo[] = [];
    public devices: DeviceInfo[] = []
    globalLsbCcNumber: number = 63;

    constructor(jsonObject: any) {
        console.time('MidiChart constructor took')
        console.log(`MidiChart constructor: jsonObject.id ${jsonObject._id}`)
        this._id = jsonObject._id || "no id";
        this.manufacturer = jsonObject.manufacturer;
        this.familyName = jsonObject.familyName;
        this.inputNames = jsonObject.inputNames;
        this.outputNames = jsonObject.outputNames;
        for (const key in jsonObject.midiCcs) {
            const fakeControllerInfo: ControllerInfo = jsonObject.midiCcs[key]
            this.midiCcs.push(new ControllerInfo(fakeControllerInfo));
            this.midiCcs = this.midiCcs.sort((a, b) => a.ccMsb - b.ccMsb)

            if (fakeControllerInfo.name === "GLOBAL LSB") {
                this.globalLsbCcNumber = fakeControllerInfo.ccLsb;
                console.log(`cc ${this.globalLsbCcNumber} is global lsb`)
            }
        }
        for (const key in jsonObject.devices) {
            console.log(`device x- ${JSON.stringify(jsonObject.devices[key])}`)
            this.devices.push(jsonObject.devices[key])
        }
        // console.table(this.inputNames)
        // console.table(this.outputNames)
        // console.table(this.devices)
        // console.table(this.midiCcs)
        console.timeEnd('MidiChart constructor took')
    }

    getMidiController(ccNumber: number) : ControllerInfo | undefined {
        if (ccNumber === this.globalLsbCcNumber) {
            return undefined
        }

        for (const controllerInfo of this.midiCcs) {
            if (controllerInfo.ccMsb === ccNumber || (controllerInfo.ccLsb !== 0 && controllerInfo.ccLsb === ccNumber)) {
                console.log(`found controller ${JSON.stringify(controllerInfo)}`)
                if (controllerInfo.name === 'IGNORE') {
                    return undefined
                }
                return controllerInfo;
            }
        }
        return undefined
    }

    public dump(s:string) {
        //console.log(`hi from MidiChart.dump`)
        return `MidiChart.${s}: ${this.inputNames[0]} ${this.outputNames[0]} id ${this._id} \n: ${this.midiCcs.join('\n')}`
    }
}

export class MidiChartDataService {
    static midiCharts: MidiChart[] = [];

    constructor() {
        console.log(`MidiChartDataService: constructor - fetching midicharts`)
        // http.get(`midicharts`).then(response => {
        axios.get(`http://localhost:8080/midicharts`).then(response => {
            const fakeMidiCharts = response.data as Array<MidiChart>

            MidiChartDataService.midiCharts = []
            for (const fakeMidiChart of fakeMidiCharts) {
                MidiChartDataService.midiCharts.push(new MidiChart(fakeMidiChart))
            }
        })
    }

    getControllerInfo(midiChart: MidiChart, controllerName: string) : ControllerInfo {
        for (const value of midiChart.midiCcs) {
            if (value.name === controllerName) {
                return value
            }
        }
        throw new Error(`getControllerInfo: Could not find controller info for <${controllerName}>`)
    }

    getMidiCcInfo(midiChart: MidiChart, ccnumber: number) : ControllerInfo {
        for (const value of midiChart.midiCcs) {
            if (value.ccMsb === ccnumber || value.ccLsb === ccnumber ) {
                return value
            }
        }
        throw new Error(`getControllerInfo: Could not find controller info for cc ${ccnumber}`)
    }

    getMidiChartForDeviceId(deviceId: string) : MidiChart | undefined {
        if (MidiChartDataService.midiCharts == null) {
            throw new Error('MidiChartDataService.getMidiChart: midi charts have not been loaded')
        }

        for (const output of WebMidi.outputs) {
            if (output.id === deviceId) {
                console.log(`Found output device ${output.name} (${output.id})`)
                return findMidiChart(output.name)
            }
        }

        for (const input of WebMidi.inputs) {
            if (input.id === deviceId) {
                console.log(`Found output device ${input.name} (${input.id})`)
                return findMidiChart(input.name)
            }
        }

        return undefined
    }

    getMidiChart(deviceNameArg: string) : MidiChart | undefined {
        if (MidiChartDataService.midiCharts == null) {
            throw new Error('MidiChartDataService.getMidiChart: midi charts have not been loaded')
        }

        return findMidiChart(deviceNameArg)
    }

    // createMidiChart(midiChart: MidiChart) {
    //     console.log(`MidiChartDataService.createMidiChart ${JSON.stringify(midiChart)}`);
    //     return http.post(`midichart`, midiChart);
    // }

    saveMidiChart(midiChart: MidiChart) {
        console.log(`MidiChartDataService.saveMidiChart: ${JSON.stringify(midiChart)}`)
        // return http.put(`midichart`, midiChart);
        return axios.put(`http://localhost:8080/midichart`, midiChart)
    }

    // deleteMidiChart(midiChart: MidiChart) {
    //     console.log(`MidiChartDataService.deleteMidiChart: ${midiChart._id}`);
    //     return http.delete(`/midichart?id=${midiChart._id}`)
    // }
}

export default new MidiChartDataService();
