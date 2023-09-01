import { immerable } from "immer";

export class ScaleType {
    name: string;
    notes: Array<boolean>;
    constructor(name: string, notes: Array<boolean>) {
        this.name = name;
        this.notes = notes;
    }
}

const customScaleType = new ScaleType("Custom", [])

const scaleTypes : Array<ScaleType> = [
    new ScaleType("Chromatic", [true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true]),
    new ScaleType("Major",     [true,  false, true, false,  true,  true, false,  true, false,  true, false,  true]),
    new ScaleType("Minor",     [true,  false, true,  true, false,  true, false,  true,  true,  false,  true, false]),
]

export const getScaleTypes: any = () => {
    var options = []
    for (var n=0; n < scaleTypes.length; n++) {
        options.push({ value: scaleTypes[n].name, label: scaleTypes[n].name})
    }
    options.push({value: "Custom", label: "Custom"})
    return options
}

export const getScaleTypeOption: any = (scaleTypeName: string) => {
    for (var n=0; n < scaleTypes.length; n++) {
        if (scaleTypes[n].name === scaleTypeName) {
            // return scaleTypes[n]
            return { value: scaleTypes[n].name, label: scaleTypes[n].name}
        }
    }
    console.log(`getScaleTypeOption return ${JSON.stringify(customScaleType)}`)
    return { value: -1, label: "Custom" }
}

export const getScaleType: any = (scaleTypeName: string) => {
    for (var n=0; n < scaleTypes.length; n++) {
        if (scaleTypes[n].name === scaleTypeName) {
            // return scaleTypes[n]
            return scaleTypes[n]
        }
    }

    return scaleTypes[0]
}

export class ScaleSettings {
    [immerable] = true;
    scaleType: string;
    root: number;
    isCustom: boolean;
    customNotes: Array<boolean>;
    constructor(fake: any) {
        this.scaleType = fake.scaleType || "Chromatic";
        this.root = fake.root || 0;
        this.isCustom = fake.isCustom;
        this.customNotes = fake.customNotes || []
    }

    isNoteInScale(notenum: number) : boolean {
        notenum = (notenum + 12 - this.root) % 12
        // console.log(`isNoteInScale: notenum ${notenum} <== ${JSON.stringify(this)}`)
        if (this.isCustom) {
            // console.log(`isNoteInScale ${notenum} ${this.customNotes[notenum]}`)
            return this.customNotes[notenum]
        } else {
            const scaleType : ScaleType = getScaleType(this.scaleType)
            // console.log(`isNoteInScale: scaleType <== ${JSON.stringify(scaleType)}`)
            // console.log(`isNoteInScale ${notenum} ${scaleType.notes[notenum]}`)
            return scaleType.notes[notenum]
        }
    }

    getNoteList() : Array<boolean> {
        var notes = new Array<boolean>()
        for (var n=0; n < 12; n++) {
            notes.push(this.isNoteInScale(n))
        }
        return notes
    }

    quantize(notenum: number) : number {
        // console.log(`quantize ${notenum}`)
        while (!this.isNoteInScale(notenum)) {
            notenum++
        }
        // console.log(`quantize ==> ${notenum}`)
        return notenum
    }

    enableNote(notenum: number, enabled: boolean) : void {
        if (!this.isCustom) {
            this.isCustom = true
            const scaleType : ScaleType = getScaleType(this.scaleType)
            this.customNotes = [...scaleType.notes]
        }
        this.customNotes[notenum] = enabled
    }
}

const noteOptions = [
    { value: 0, label: "C"}, 
    { value: 1, label: "C#"}, 
    { value: 2, label: "D"}, 
    { value: 3, label: "Eb" }, 
    { value: 4, label: "E" }, 
    { value: 5, label: "F"}, 
    { value: 6, label: "F#"}, 
    { value: 7, label: "G"}, 
    { value: 8, label: "G#"}, 
    { value: 9, label: "A" }, 
    { value: 10, label: "Bb" }, 
    { value: 11, label: "B" },
]

export const getNoteOptions : any = () => {
    return noteOptions
}

export const getNoteOption : any = (notenum: number) => {
    var theoption
    noteOptions.forEach(option => {
        if (option.value === notenum) {
            theoption = option
        }
    })
    return theoption
}
