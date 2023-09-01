import { Input, WebMidi } from "webmidi";
import { Sequence } from "../player/sequence";

class MidiService {

    receivedResponse : boolean = false

    constructor() {
        WebMidi
            .enable({ sysex: true, software: true })
            .then(() => console.log("WebMidi enabled"))
            .catch(err => alert(err));

        console.log(`Inputs:`)
        WebMidi.inputs.forEach(input => {
            console.log(input.manufacturer, input.name, input.id)
        });
        console.table(WebMidi.inputs)

        console.log(`Outputs:`)
        WebMidi.outputs.forEach(output => {
            console.log(output.manufacturer, output.name, output.id)
        });
    }

    getMidiInputs() : Array<any> {
        var options: Array<any> = []
        // WebMidi.inputs.map(input => {
        //     options.push({ id: input.id, label: input.name })
        // })
        WebMidi.inputs.forEach((input: Input) => {
            options.push({ id: input.id, label: input.name })
        })
        return options
    }

    playNote(midiSettings: any, note: number, velocity: number, duration?: number, delayMsec: number = 0) {
        // console.log(`midi-service.playNote note ${note} velocity ${velocity} duration ${duration}`)
        if (midiSettings.midiOutputDeviceId == null) {
            console.log(`MidiService.playNote: Please select output device`);
        }
        else if (midiSettings.midiOutputChannelNum == null) {
            console.log(`MidiService.playNote: Please select output channel`);
        }
        else {
            // console.log(`MidiService.playNote: midiSettings ${JSON.stringify(midiSettings)}`)
            // Search by id in case of multiple devices. Fall back to name if not found. id is not reliable.
            var midiOutputDevice = WebMidi.getOutputById(midiSettings.midiOutputDeviceId);
            if (!midiOutputDevice) {
                midiOutputDevice = WebMidi.getOutputByName(midiSettings.midiOutputDeviceName);
                if (!midiOutputDevice) {
                    console.warn(`no midi output device ${midiSettings.midiOutputDeviceName}/${midiSettings.midiOutputDeviceId}`)
                    return
                }
            }

            const midiOutputChannelNum = midiSettings.midiOutputChannelNum;
            console.log(`MidiService.playNote: midiOutputDevice <${midiOutputDevice.name}> channelNum ${midiOutputChannelNum}`)
            const outputChannel = midiOutputDevice.channels[midiOutputChannelNum]
            if (outputChannel === undefined) {
                throw new Error('midi output channel is undefined')
            }
            // console.log(`MidiService.playNote: midiOutputDevice id <${midiOutputDevice.id}> channel ${outputChannel.number}`)
            outputChannel.playNote(note, {attack: velocity, duration: duration, time: WebMidi.time + delayMsec})
        }
    }

    sendControlChange(midiSettings: any, ccNumber: any, value: any) {
        if (midiSettings.midiOutputDeviceId == null) {
            console.log(`MidiService.sendControlChange: Please select output device`);
        }
        else if (midiSettings.midiOutputChannelNum == null) {
            console.log(`MidiService.sendControlChange: Please select output channel`);
        }
        else {
            // console.log(`MidiService.sendControlChange: midiSettings ${JSON.stringify(midiSettings)}`)
            const midiOutputDevice = WebMidi.getOutputById(midiSettings.midiOutputDeviceId);
            if (midiOutputDevice) {
                const midiOutputChannelNum = midiSettings.midiOutputChannelNum;
                // console.log(`MidiService.playNote: midiOutputChannelNum ${midiOutputDevice.name} channel ${midiOutputChannelNum}`)
                const outputChannel = midiOutputDevice.channels[midiOutputChannelNum]
                // console.log(`MidiService.sendControlChange: midiOutputDevice ${midiOutputDevice} ccNumber ${ccNumber} value ${value}`)
                outputChannel.sendControlChange(ccNumber, value)
            } else {
                console.log(`MidiService.sendControlChange: Output device ${midiSettings.midiOutputDeviceId} not found`);
            }
        }
    }

/*
(1) CURRENT PROGRAM DATA DUMP REQUEST      
+----------------+--------------------------------------------------+
|     Byte       |             Description                          |
+----------------+--------------------------------------------------+
| F0,42,3g,      | EXCLUSIVE HEADER                                 |
|    00,01,2c    |                                                  |
| 0001 0000 (10) | CURRENT PROGRAM DATA DUMP REQUEST      10H       |
| 1111 0111 (F7) | EOX    
+----------------+--------------------------------------------------+
*/

/*

(4) CURRENT PROGRAM DATA DUMP                                     R/T
+----------------+--------------------------------------------------+
|     Byte       |             Description                          |
+----------------+--------------------------------------------------+
| F0,42,3g,      | EXCLUSIVE HEADER                                 |
|    00,01,51    |                                                  |
| 0100 0000 (40) | CURRENT PROGRAM DATA DUMP              40H       |
| 0ddd dddd (dd) | Data                                             |
| 0ddd dddd (dd) |  :         Data Size         Conv. Size          |
| 0ddd dddd (dd) |  :      384Bytes (7bit) -> 336Bytes (8bit)       |
| 0ddd dddd (dd) |  :                                               |
| 1111 0111 (F7) | EOX                        (See NOTE 1, TABLE 2) |
+----------------+--------------------------------------------------+
*/

    sendCurrentProgramDataDump(sequence: Sequence) {
        console.log(`sendCurrentProgramDataDump`)
        const midiSettings: any = sequence.midiSettings
        const midiOutputDevice = WebMidi.getOutputById(midiSettings.midiOutputDeviceId);
        const midiOutputChannelNum = midiSettings.midiOutputChannelNum - 1

        let sourceArrayBuffer = sequence.getSysexProgram()
        console.log(`sendCurrentProgramDataDump: sourceArrayBuffer type ${typeof(sourceArrayBuffer)}`)
        console.log(`sendCurrentProgramDataDump: sourceArrayBuffer length ${typeof(sourceArrayBuffer.byteLength)}`)
        let sourceUint8Array = new Uint8Array(sourceArrayBuffer)
        // console.log(`sendCurrentProgramDataDump: sourceUint8Array ${JSON.stringify(sourceUint8Array)}`)

        const messageStartBytes = [0x30 + midiOutputChannelNum, 0x00, 0x01, 0x51, 0x40];
        let arrayBuffer = new ArrayBuffer(sourceUint8Array.length + messageStartBytes.length)
        let uint8Array = new Uint8Array(arrayBuffer)
        var n
        for (n=0; n<messageStartBytes.length; n++) {
            uint8Array[n] = messageStartBytes[n]
        }

        n = 0
        var key = "0"
        while (sourceArrayBuffer[key] !== undefined) {
            key = `${n}`
            var value = sourceArrayBuffer[key]
            uint8Array[messageStartBytes.length + n] = value
            // console.log(`json ${key} ${value} -> ${messageStartBytes.length + n} : ${JSON.stringify(uint8Array)}`)
            ++n
        }

        // console.log(`sending ${uint8Array.length} bytes:`)
        // console.log(`sending ${uint8Array.length} bytes:\n${JSON.stringify(uint8Array)}`)

        midiOutputDevice?.sendSysex(0x42, uint8Array);
        // console.log(`sendCurrentProgramDataDump: dunn`)
    }

    requestCurrentProgramDataDump(sequence: Sequence) {
        return new Promise<number[]>(resolve => {
            const midiSettings: any = sequence.midiSettings
            const midiInputDevice = WebMidi.getInputById(midiSettings.midiRemoteDeviceId);
            midiInputDevice.addListener("sysex", e => {
                let uint8Array: number[] = e.message.dataBytes
                uint8Array = uint8Array.slice(5)

                midiInputDevice.removeListener("sysex")
                console.log(`requestCurrentProgramDataDump: resolve promise with ${JSON.stringify(uint8Array)}`)
                resolve(uint8Array)
            }, {});

            const midiOutputDevice = WebMidi.getOutputById(midiSettings.midiOutputDeviceId);
            const midiOutputChannelNum = midiSettings.midiOutputChannelNum - 1
            midiOutputDevice?.sendSysex(0x42, [0x30 + midiOutputChannelNum, 0x00, 0x01, 0x51, 0x10]);
        })
    }
}

export default new MidiService()
