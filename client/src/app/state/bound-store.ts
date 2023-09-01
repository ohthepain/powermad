import create from "zustand";

import { createNavSlice, NavSlice } from "./nav-store";
import { createEditStateSlice, EditStateSlice } from "./edit-state-slice";
import { createKeyboardMonitorSlice, KeyboardMonitorSlice } from "./keyboard-monitor-slice";

export const useBoundStore = create<NavSlice & EditStateSlice & KeyboardMonitorSlice>()((...a) => ({
    ... createNavSlice(...a),
    ... createEditStateSlice(...a),
    ... createKeyboardMonitorSlice(...a),
}))
