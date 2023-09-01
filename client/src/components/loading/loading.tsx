import React from "react"
import "./loading.css"
import '@animxyz/core'
import {XyzTransition, XyzTransitionGroup} from '@animxyz/react'

const Loading = (props: any) => {
    return (
        <div>
            <div className="animcontainer">
                <XyzTransition xyz="fade up">
                    <div className="bluesquare" />
                </XyzTransition>
                <XyzTransition xyz="fade up in-left in-rotate-left out-right out-rotate-right">
                    <div className="bluesquare">
                        <button>awesome</button>
                    </div>
                </XyzTransition>
                <XyzTransitionGroup
                    appear
                    className="example-grid"
                    xyz="fade small out-down out-rotate-right appear-stagger"
                >
                    {[...Array(6)].map((_, index) => (
                        <div className="square" key={index} />
                    ))}
                </XyzTransitionGroup>
            </div>
        </div>
    )
}

export default Loading
