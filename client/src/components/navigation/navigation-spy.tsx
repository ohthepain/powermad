import React, {useEffect, useState} from 'react'
import {useBoundStore} from "../../app/state/bound-store"
import './navigation-spy.css'

const NavigationSpy = () => {
    const navigationInfo = useBoundStore(state => state.navigationInfo)
    const midiLearnMode = useBoundStore(state => state.midiLearnMode)

    useEffect(() => {
        console.log(`NavigationSpy.useEffect(midiLearnMode): midi learn mode changed to ${midiLearnMode}`)
    }, [midiLearnMode])

    return (
        <div className='navigation-spy Island big-island'>
            Navigation Spy {navigationInfo.startBar}:0:{navigationInfo.startSixtyfourth} to {navigationInfo.endBar}:0:{navigationInfo.endSixtyfourth}
            {<div>{midiLearnMode ? "on" : "off"}</div>}
        </div>
    )
}

export default NavigationSpy
