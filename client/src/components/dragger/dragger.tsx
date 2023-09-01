import React, {useEffect, useRef, useState} from "react"
import "./dragger.css"

type DraggerProps = {
    yIncrement?: number;
    onDragY: (dragval: number) => void;
}

const Dragger = (props: DraggerProps) => {

    const yIncrement = props.yIncrement || 10

    const [mouseDown, setMouseDown] = useState<boolean>(false)
    const [mouseDownY, setMouseDownY] = useState<number>(0)
    const mouseDownRef = useRef(mouseDown)
    const [lastSentYValue, setLastSentYValue] = useState<number>(0)
    const lastSentYValueRef = useRef(lastSentYValue)
    const mouseDownYRef = useRef(mouseDownY)

    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mouseDownRef.current = mouseDown
    }, [mouseDown])

    useEffect(() => {
        mouseDownYRef.current = mouseDownY
    }, [mouseDownY])

    useEffect(() => {
        lastSentYValueRef.current = lastSentYValue
    }, [lastSentYValue])

    const handleMouseDown = (e: any) => {
        console.log(`dragger.handleMouseDown`)
        if (!divRef.current) {
            return
        }

        // console.log(`dragger.handleMouseDown(e.clientY ${e.clientY}`)
        setMouseDown(true)
        setMouseDownY(e.clientY)
        setLastSentYValue(0)

        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('mousemove', handleMouseMove)
    }

    const handleMouseUp = (e: any) => {
        setMouseDown(false)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('mousemove', handleMouseMove)
    }

    const handleMouseMove = (e: any) => {
        // console.log(`location.handleMouseMove: drag distanceY ${e.clientY} mouseDownRef.current ${mouseDownRef.current}`)
        if (divRef && divRef.current && mouseDownRef.current) {
            const distanceY = mouseDownYRef.current - e.clientY;
            // console.log(`dragger distanceY ${distanceY} vs ${(divRef.current.clientHeight / 2)}`)
            const dragYVal = Math.floor(distanceY / yIncrement)
            if (dragYVal != lastSentYValueRef.current) {
                // console.log(`dragger dragYVal ${dragYVal}`)
                // console.log(`bink!! distanceY ${distanceY} dragItemIndex offset ${dragYVal} vs ${lastSentYValueRef.current}`)
                setLastSentYValue(dragYVal)
                props.onDragY(dragYVal)
            }
        }
    }

    return (
        <div className="dragger" ref={divRef}
            onMouseDown={e => handleMouseDown(e) } 
            // onMouseMove={e => handleMouseMove(e)}
            // onMouseUp={e => handleMouseUp(e)}
        >
        </div>
    )
}

export default Dragger
