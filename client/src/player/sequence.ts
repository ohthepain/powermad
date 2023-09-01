import {immerable, nothing} from "immer";
import {MidiDevicePreferences} from "../preferences/preferences-store"
import { ScaleSettings, getScaleType } from "./scales";

export class SequenceStep {
    [immerable] = true;
    // time: number = 0;
    note: number = 64;
    velocity: number = 100;
    gateLength: number = 0.8;

    constructor(note: number, velocity: number, gateLength: number) {
        this.note = note;
        this.velocity = velocity;
        this.gateLength = gateLength;
    }
}

export class MidiSettings {
    [immerable] = true;
    midiInputDeviceId: string = "";
    midiInputDeviceName: string = "";
    midiInputChannelNum: number = -1;
    midiRemoteDeviceId: string = "";
    midiRemoteDeviceName: string = "";
    midiRemoteChannelNum: number = -1;
    midiOutputDeviceId: string = "";
    midiOutputDeviceName: string = "";
    midiOutputChannelNum: number = 0;

    constructor(fake: any) {
        this.midiInputDeviceId = fake.midiInputDeviceId || ""
        this.midiInputDeviceName= fake.midiInputDeviceName || ""
        this.midiInputChannelNum = fake.midiInputChannelNum || -1
        this.midiRemoteDeviceId = fake.midiRemoteDeviceId || ""
        this.midiRemoteDeviceName = fake.midiRemoteDeviceName || ""
        this.midiRemoteChannelNum = fake.midiRemoteChannelNum || -1
        this.midiOutputDeviceId = fake.midiOutputDeviceId || ""
        this.midiOutputDeviceName = fake.midiOutputDeviceName || ""
        this.midiOutputChannelNum = fake.midiOutputChannelNum || -1
    }
}

export class ViewSettings {
    [immerable] = true;
    monitorKeyboardVisible: boolean = true;
    monitorKeyboardInputMidiDeviceName: string = "";
    monitorKeyboardInputMidiDeviceId: string = "";
    monitorKeyboardInputMidiChannelNum: number = -1;
    monitorKeyboardOutputMidiDeviceName: string = "";
    monitorKeyboardOutputMidiDeviceId: string = "";
    monitorKeyboardOutputMidiChannelNum: number = -1;
    randomizerVisible: boolean = false;
    randomizerPanel: string = "note";
}

export class EnvelopePoint {
    [immerable] = true;
    // time in steps
    time64ths: number = 0;
    value: number = 0;

    constructor(time: number, value: number) {
        this.time64ths = time;
        this.value = value;
    }
}

export class Skin {
    [immerable] = true;
    backgroundColor: number;
    velocityColor: number;

    constructor (backgroundColor: number | null = null, velocityColor: number | null = null) {
        this.backgroundColor = 0xff0000
        this.velocityColor = velocityColor || Math.floor(Math.random() * 0xffffff);
    }
}

export class Envelope {
    [immerable] = true;
    id: string = "";
    controller: string = "";
    points: Array<EnvelopePoint> = [];
    locked: boolean = true;
    length64ths: number = 8;
    division: number = 8;
    mode: string = "loop";
    trigger: string = "first";
    type: string = "envelope";
    // cacheMinValue: number = 0;
    // cacheMaxValue: number = 127;

    // constructor(id: string, controller: string) {
    //     this.id = id
    //     this.controller = controller
    //     this.points = [{ time: 0, value: 0}, ]
    // }

    constructor(fake: any | null = null) {
        if (fake) {
            this.id = fake.id;
            this.controller = fake.controller;
            this.points = fake.points ? [...fake.points] : [];
            this.locked = fake.locked;
            this.length64ths = fake.length64ths || fake.length
            this.mode = fake.mode;
            this.trigger = fake.trigger;
            this.type = fake.type;
        }
    }
}

export interface IStepFilterEditor {
    getOptionName() : string;
    onEditSequence(sequence: Sequence, program: any) : void;
    getMinStepValue() : number;
    getMaxStepValue() : number;
    getStepValueIncrement(): number
}

export class ControllerEntry {
    [immerable] = true;
    instanceId: string = "";
    typeId: string = "pulse-count";
    presetAddress: PresetAddress

    constructor(fake: any) {
        // console.log(`ControllerEntry.constructor: fake ${JSON.stringify(fake)}`)
        this.instanceId = fake.instanceId
        this.typeId = fake.typeId
        this.presetAddress = fake.presetAddress
    }
}

export class Preset {
    [immerable] = true;
    id: string = "";
    name: string = "";
    program: any = null;

    constructor(id: string, name: string, program: any) {
        this.id = id
        this.name = name
        this.program = program
    }
}

export class PresetAddress {
    [immerable] = true
    packId: string
    typeId: string
    presetId: string

    constructor(packId: string, typeId: string, presetId: string) {
        this.packId = packId
        this.typeId = typeId
        this.presetId = presetId    
    }
}

export class PackTypeCollection {
    [immerable] = true;
    typeId: string = "";
    presets: Array<any> = []

    getPreset(presetId: string) : Preset | undefined {
        for (const preset of this.presets) {
            if (preset.id === presetId) {
                return preset
            }
        }
        return undefined
    }
}

export class Pack {
    [immerable] = true;
    id: string = "localpack"; // We should use the sequenceId for the local pack?
    name: string = "built-ins";
    packTypeCollections: Array<PackTypeCollection> = [];

    getPackTypeCollection(typeId: string) : PackTypeCollection | undefined {
        for (const packTypeCollection of this.packTypeCollections) {
            if (packTypeCollection.typeId === typeId) {
                return packTypeCollection
            }
        }
        return undefined
    }
}

// export class Clip {
//     [immerable] = true;
//     _id: string = "";
//     sequenceId: string = "";
//     startBarNum = 0;
//     endBarNum = nothing;
//     startDivisionNum = 0;
//     endDivisionNum = nothing;
// }

// export class Song {
//     [immerable] = true;
//     _id: string = "";
//     sequences: Array<Sequence> = [];
//     user_id: string = "";
//     tempo: number = 120.0;
//     clips: Array<Clip> = []
// }

export class Sequence {
    [immerable] = true
    _id: string = ""
    name: string = ""
    // songs: Array<Song> = []
    deviceFamilyId: string = ""
    text: string = ""
    user_name: string = ""
    user_id: string = ""
    steps: Array<SequenceStep> = []
    rawSteps: Array<SequenceStep> = []
    stepFilters: Array<ControllerEntry> = []
    tempo: number = 120.0
    length: number = 8
    numSteps: number = 8
    division: number = 8
    midiSettings: MidiSettings = new MidiSettings({})
    viewSettings: ViewSettings = new ViewSettings()
    currentEnvelopeId: string = ""
    currentPanelId: string = "ARP"
    envelopes: Array<Envelope> = []
    skin: Skin = new Skin()
    packs: Array<Pack> = []
    midiDevicePreferences: MidiDevicePreferences = new MidiDevicePreferences({})
    searchHints: any = {}
    // sysexProgram: Uint8Array = new Uint8Array(0)
    sysexPresetAddress: PresetAddress
    randomizerPresetAddress: PresetAddress
    scaleSettings: ScaleSettings
    playOrder: string

    // Time signature 3/8 is 3 beats, beat division 8
    getTimeSignatureBeatsForBar(barnum: number) : number { return 4; }
    getTimeSignatureDivisionForBar(barnum: number) : number { return 4; }

    constructor(fakeSequence: any) {
        // console.trace(`sequence constructor fakeSequence: ${JSON.stringify(fakeSequence)}`)

        this.sysexPresetAddress = new PresetAddress('localpack', 'sysex', '0')

        this._id = fakeSequence._id
        this.name = fakeSequence.name
        this.text = fakeSequence.text
        this.user_id = fakeSequence.user_id
        this.tempo = fakeSequence.tempo
        this.length = fakeSequence.length
        this.numSteps = fakeSequence.numSteps
        this.division = fakeSequence.division
        this.midiSettings = {...fakeSequence.midiSettings}
        this.viewSettings = {...fakeSequence.viewSettings}
        this.currentEnvelopeId = fakeSequence.currentEnvelopeId
        if (this.currentEnvelopeId === "notes") {
            this.currentEnvelopeId = ""
        }
        this.currentPanelId = fakeSequence.currentPanelId || "ARP"
        this.skin = fakeSequence.skin || this.skin
        this.scaleSettings = new ScaleSettings(fakeSequence.scaleSettings || {})
        this.deviceFamilyId = fakeSequence.deviceFamilyId || "Mini/Monologue"
        this.playOrder = fakeSequence.playOrder || "forward"
        console.log("create randomizerPresetAddress")
        this.randomizerPresetAddress = fakeSequence.randomizerPresetAddress

        if (fakeSequence.steps) {
            this.steps = [...fakeSequence.steps]
            // no idea why we have to do this here
            this.rawSteps = [...fakeSequence.steps]
        }

        if (fakeSequence.rawSteps) {
            this.rawSteps = [...fakeSequence.rawSteps]
        }

        this.envelopes = new Array<Envelope>();
        if (fakeSequence.envelopes) {
            for (const fakeEnvelope of fakeSequence.envelopes) {
                this.envelopes.push(new Envelope(fakeEnvelope))
            }
        }

        if (fakeSequence.stepFilters) {
            // console.trace(`sequence constructor fakeSequence.stepFilters: ${JSON.stringify(fakeSequence.stepFilters)}`)
            for (const entry of fakeSequence.stepFilters) {
                // console.trace(`sequence constructor fakeSequence.stepFilters entry: ${JSON.stringify(entry)}`)
                this.stepFilters.push(new ControllerEntry(entry))
            }
            // console.trace(`sequence constructor fakeSequence.stepFilters dobne: ${JSON.stringify(this.stepFilters)}`)
        }

        if (fakeSequence.packs) {
            // console.log(`we have packs`)
            for (const fakePack of fakeSequence.packs) {
                // console.log(`we have pack ${JSON.stringify(fakePack)}`)
                var pack = new Pack()
                pack.id = fakePack.id
                pack.name = fakePack.name
                this.packs.push(pack)
                for (const fakePackTypeCollection of fakePack.packTypeCollections) {
                    // console.log(`we have fakePackTypeCollection ${JSON.stringify(fakePackTypeCollection)}`)
                    var packTypeCollection = new PackTypeCollection()
                    packTypeCollection.typeId = fakePackTypeCollection.typeId
                    packTypeCollection.presets = [...fakePackTypeCollection.presets]
                    pack.packTypeCollections.push(packTypeCollection)
                    // console.log(`packTypeCollection: -> ${JSON.stringify(packTypeCollection)}`)
                }
            }
        } else {
            fakeSequence.packs = [new Pack()]
            // var pack = new Pack()
            // pack.id = 'localpack'
            // pack.name = 'built-ins'
            // this.packs.push(pack)
            // var packTypeCollection = new PackTypeCollection()
            // packTypeCollection.typeId = 'sysex'
            // packTypeCollection.presets = []
        }

        if (fakeSequence.midiDevicePreferences) {
            this.midiDevicePreferences = new MidiDevicePreferences(fakeSequence.midiDevicePreferences)
        }

        // console.trace(`sequence constructor: ${JSON.stringify(this)}`)
    }

    // setSysexProgram(arrayBuffer: ArrayBuffer) {
    //     this.sysexPreset.patch = new Uint8Array(arrayBuffer)
    //     console.log(`setSysexProgram: ${this.sysexProgram.length} bytes`)
    // }

    getSysexProgram() {
        const preset: Preset = this.getPreset(this.sysexPresetAddress, true)
        // console.log(`getSysexProgram 1 ${JSON.stringify(preset.program.sysex)}`)
        let byteArray: Uint8Array = new Uint8Array(preset.program.sysex);
        // console.log(`getSysexProgram 2 ${JSON.stringify(byteArray)}`)
        return preset.program.sysex
    }

    getStepController(controllerId: string) : ControllerEntry {
        for (const stepController of this.stepFilters) {
            if (stepController.typeId === controllerId) {
                return stepController;
            }
        }

        throw Error(`getStepController: controllerId ${controllerId} is not defined`)
    }

    searchStepController(controllerId: string) : ControllerEntry | undefined {
        for (const stepController of this.stepFilters) {
            if (stepController.typeId === controllerId) {
                return stepController;
            }
        }

        return undefined
    }

    getPack(packId: string) : Pack | undefined {
        for (const pack of this.packs) {
            if (pack.id === packId) {
                return pack
            }
        }
        return undefined
    }

    searchPreset(presetAddress: PresetAddress) : Preset | undefined {
        // console.log(`searchPreset ${JSON.stringify(presetAddress)}`)
        const pack: Pack | undefined = this.getPack(presetAddress.packId)
        if (pack) {
            // console.log(`searchPreset - found pack ${JSON.stringify(presetAddress)}`)
            const packTypeCollection: PackTypeCollection | undefined = pack.getPackTypeCollection(presetAddress.typeId)
            if (packTypeCollection) {
                // console.log(`searchPreset found pack collection ${JSON.stringify(presetAddress)}`)
                const preset: Preset | undefined = packTypeCollection.getPreset(presetAddress.presetId)
                if (preset) {
                    // console.log(`searchPreset found preset ${JSON.stringify(presetAddress)}`)
                    // console.log(`searchPreset found preset: program ${JSON.stringify(preset.program)}`)
                    return preset
                }
            }
        }
        console.log(`searchPreset undefined at ${JSON.stringify(presetAddress)}`)
        return undefined
    }

    createDefaultSysexPreset(presetAddress: PresetAddress) : Preset {

        const preset: Preset = new Preset(presetAddress.presetId, 'sysex', { sysex: "" })
        const packId: string = presetAddress.packId
        const typeId: string = presetAddress.typeId
        const presetId: string = presetAddress.presetId
    
        console.log(`createDefaultSysexPreset: packId ${packId} from presetAddress ${JSON.stringify(presetAddress)}`)
    
        var pack : Pack;
        const packIndex: number = this.packs.findIndex(pack => pack.id === packId)
        console.log(`packIndex: packId ${packIndex}`)
        if (packIndex !== -1) {
            pack = this.packs[packIndex]
        } else {
            pack = new Pack()
            this.packs.push(pack)
        }
    
        console.log(`packIndex: there are now ${this.packs.length} packs`)
    
        var packTypeCollection: PackTypeCollection;
        const typeIndex: number = pack.packTypeCollections.findIndex(packTypeCollection => packTypeCollection.typeId === typeId)
        if (typeIndex !== -1) {
            packTypeCollection = pack.packTypeCollections[typeIndex]
        } else {
            packTypeCollection = new PackTypeCollection()
            packTypeCollection.typeId = typeId
            pack.packTypeCollections.push(packTypeCollection)
        }
    
        const presetIndex: number = packTypeCollection.presets.findIndex(preset => preset.presetId === presetId)
        if (presetIndex !== -1) {
            packTypeCollection.presets[presetIndex] = preset;
        } else {
            packTypeCollection.presets.push(preset)
        }

        return preset

    }

    getPreset(presetAddress: PresetAddress, createIfNotFound: boolean = false) : Preset {
        const preset: Preset | undefined = this.searchPreset(presetAddress)
        if (preset) {
            return preset
        } else if (createIfNotFound) {
            return this.createDefaultSysexPreset(presetAddress)
        }
        throw Error(`Sequence.getPreset: preset undefined at ${JSON.stringify(presetAddress)}`)
    }

    getProgram(presetAddress: PresetAddress) : any {
        const preset: Preset | undefined = this.searchPreset(presetAddress)
        if (preset) {
            return preset.program
        }
        throw Error(`Sequence.getProgram: preset undefined at ${JSON.stringify(presetAddress)}`)
    }
}
