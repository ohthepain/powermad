import MidiChartDataService, {MidiChart} from "../../services/device-service";
import create from 'zustand'

// Store for MidiCharts, isPlaying state, etc. It should  not a slice as we do not want undo

interface MidiChartsStoreState {
    midiCharts: Array<MidiChart>
    setMidiCharts: (midiCharts: Array<MidiChart>) => void,
    setMidiChart: (midiChart: MidiChart) => void,
}  
  
const useMidiChartsStore = create<MidiChartsStoreState>()((set) => ({
    midiCharts: [],

    setMidiCharts: (midiCharts: Array<MidiChart>) => set((state) => ({ midiCharts: midiCharts })),
    setMidiChart: (midiChart: MidiChart) => set((state) => ({ midiCharts: [...state.midiCharts.filter(mc => {mc._id != midiChart._id}), midiChart] })),
}))

export default useMidiChartsStore
