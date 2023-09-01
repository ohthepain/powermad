
import React, {useEffect, useState, useRef, useContext} from "react"
import Dragger from "../../components/dragger/dragger"
import PropTypes from "prop-types"
import "./location.css"

type LocationProps = {
    id: string;
    enabled: boolean;
    values: number[];
    onEditLocation: (s: Array<number>) => void;
    onEditString: (s: string) => void;
}

export const Location = (props: LocationProps) => {

    // const [mouseDown, setMouseDown] = useState<boolean>(false)
    // const [lastMouseY, setLastMouseY] = useState<number>(0)
    // const mouseDownRef = useRef(mouseDown)
    // const lastMouseYRef = useRef(lastMouseY)
    // const [dragItemIndex, setDragItemIndex] = useState<number>(0)
    // const [dragItemStartValue, setDragItemStartValue] = useState<number>(0)
    // const [dragItemLastValueSent, setDragItemLastValueSent] = useState<number>(0)
    // const dragItemIndexRef = useRef(dragItemIndex)
    const [useStringInput, setUseStringInput] = useState<boolean>(false)
    const [textValue, setTextValue] = useState("x.x.x")

    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log(`init`)
    }, [])

    useEffect(() => {
        setTextValue(`${props.values[0]}.${props.values[1]}.${props.values[2]}`)
    }, [useStringInput])

    // useEffect(() => {
    //     console.log(`mouseDown changed to ${mouseDown}`)
    //     mouseDownRef.current = mouseDown
    // }, [mouseDown])

    // useEffect(() => {
    //     lastMouseYRef.current = lastMouseY
    // }, [lastMouseY])

    // useEffect(() => {
    //     dragItemIndexRef.current = dragItemIndex
    // }, [dragItemIndex])

    // const handleMouseDown = (e: any) => {
    //     if (!divRef.current) {
    //         return
    //     }

    //     console.log(`location.handleMouseDown(${props.id}): e.clientY ${e.clientY}`)

    //     // if (e.clientY >= 0 && e.clientY <= divRef.current.clientHeight) {
    //         console.log(`start ${props.id} e.clientY ${e.clientY}`)
    //         e.stopPropagation()
    //         setMouseDown(true)
    //         setLastMouseY(e.clientY)

    //         var dragItemIndex = 1
    //         if (divRef.current) {
    //             const clientLeft = divRef.current.getBoundingClientRect().left
    //             const offsetX = e.clientX - clientLeft
    //             if (offsetX < divRef.current.clientWidth / 3) {
    //                 dragItemIndex = 0
    //             } else if (offsetX > (divRef.current.clientWidth * 2 / 3)) {
    //                 dragItemIndex = 2
    //             }
    //         }

    //         console.log(`mouse down - dragItemIndex ${dragItemIndex} e.clientY ${e.clientY}`)
    //         setDragItemIndex(dragItemIndex)
    //         // setDragItemStartValue([props.values[dragItemIndex]])
    //     // }
    // }

    // const handleMouseUp = (e: any) => {
    //     setMouseDown(false)
    //     // e.stopPropagation()
    // }

    // const handleMouseMove = (e: any) => {
    //     // console.log(`location.handleMouseMove(${props.id}): drag distanceY ${e.clientY} mouseDownRef.current ${mouseDownRef.current}`)
    //     if (divRef && divRef.current && mouseDownRef.current) {
    //         const distanceY = lastMouseYRef.current - e.clientY;
    //         console.log(`location.handleMouseMove(${props.id}): drag distanceY ${distanceY}`)
    //         if (Math.abs(distanceY) > divRef.current.clientHeight) {
    //             console.log(`lastMouseYRef.current ${lastMouseYRef.current} - e.clientY ${e.clientY} > divRef.current.clientHeight ${divRef.current.clientHeight} `)
    //             setLastMouseY(e.clientY)
    //             lastMouseYRef.current = e.clientY
    //             e.stopPropagation();
    //             const offset: number = distanceY > 0 ? 1 : -1
    //             console.log(`bink!! distanceY ${distanceY} dragItemIndex ${dragItemIndexRef.current} offset ${offset}`)
    //             // props.onEdit(dragItemIndexRef.current, offset)
    //         }
    //     }
    // }

    const handleTextInput = (e: any) => {
        console.log(`handleTextInput ${e.target.value}`)
        // const regex = /^\d+\.\d+\.\d+$/
        // if (regex.test(e.target.value)) {
            setTextValue(e.target.value)
        // }
    }

    const checkAndSetLengthString = (s: string) => {
        const regex = /^(\d+)\.(\d+)\.(\d)+$/
        const result : RegExpExecArray | null = regex.exec(s)
        console.log(`regex result ${JSON.stringify(result)}`)
        if (result && result.length == 4) {
            setTextValue(s)
            // props.onEditLocation(result.slice(1))
        }
    }

    const handleKeyUp = (e: any) => {
        if (e.key === 'Enter') {
            checkAndSetLengthString(e.target.value)
            setUseStringInput(false)
        }
    }

    const handleBlur = (e: any) => {
        console.log(`end edit`)

        const regex = /^\d+\.\d+\.\d+$/
        if (regex.test(e.target.value)) {
            setTextValue(e.target.value)
            props.onEditString(e.target.value)
        }

        setUseStringInput(false)
    }

    const updateLocation = (values: Array<number>) => {
        props.onEditLocation(values)
    }

    const handleDragBars = (offset: number) => {
        console.log(`dragger bars ${offset} ${JSON.stringify(props.values)}`)
        updateLocation([Math.max(0, props.values[0] + offset), props.values[1], props.values[2]])
    }

    const handleDragBeats = (offset: number) => {
        console.log(`dragger beats ${offset} ${JSON.stringify(props.values)}`)
        updateLocation([props.values[0], Math.max(0, props.values[1] + offset), props.values[2]])
    }

    const handleDragDivisions = (offset: number) => {
        console.log(`dragger divisions ${offset} ${JSON.stringify(props.values)}`)
        const minval = props.values[0] === 0 && props.values[1] === 0 ? 1 : 0
        updateLocation([props.values[0], props.values[1], Math.max(minval, props.values[2] + offset)])
    }

    return (
        useStringInput ? (
            <div className="location" ref={divRef}>
                <div className="location-item">
                    <input type="text" value={textValue}
                    onInput={handleTextInput}
                    onBlur={handleBlur}
                    onKeyUp={handleKeyUp}
                    />
                </div>
            </div>
        ) : (
            <div className={props.enabled ? "location" : "location location-disabled"} ref={divRef} 
                // onMouseDown={e => handleMouseDown(e) } 
                // onMouseMove={e => handleMouseMove(e)}
                // onMouseUp={e => handleMouseUp(e)}
                >
                 {/* + props.enabled ? "" : "location-disabled" */}
                <div className="location-item">{props.values[0]}.
                    <Dragger onDragY={(dragYVal: number) => { handleDragBars(dragYVal) }}></Dragger>
                </div>
                <div className="location-item">{props.values[1]}.
                    <Dragger onDragY={(dragYVal: number) => { handleDragBeats(dragYVal) }}/>
                </div>
                <div className="location-item">{props.values[2]}
                    <Dragger onDragY={(dragYVal: number) => { handleDragDivisions(dragYVal) }}/>
                </div>
                {props.enabled ? (
                <div className="edit-button" onClick={() => { setUseStringInput(true) }}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M7 18.005C7 19.1078 7.9 20 9 20C10.1 20 11 19.1078 11 18.005C11 16.9023 10.1 16 9 16C7.9 16 7 16.9023 7 18.005Z" fill="#000000"/>
                        <path d="M7 12.005C7 13.1078 7.9 14 9 14C10.1 14 11 13.1078 11 12.005C11 10.9023 10.1 10 9 10C7.9 10 7 10.9023 7 12.005Z" fill="#000000"/>
                        <path d="M7 6.00501C7 7.10777 7.9 8 9 8C10.1 8 11 7.10777 11 6.00501C11 4.90226 10.1 4 9 4C7.9 4 7 4.90226 7 6.00501Z" fill="#000000"/>
                        <path d="M13 6.00501C13 7.10777 13.9 8 15 8C16.1 8 17 7.10777 17 6.00501C17 4.90226 16.1 4 15 4C13.9 4 13 4.90226 13 6.00501Z" fill="#000000"/>
                        <path d="M13 12.005C13 13.1078 13.9 14 15 14C16.1 14 17 13.1078 17 12.005C17 10.9023 16.1 10 15 10C13.9 10 13 10.9023 13 12.005Z" fill="#000000"/>
                        <path d="M13 18.005C13 19.1078 13.9 20 15 20C16.1 20 17 19.1078 17 18.005C17 16.9023 16.1 16 15 16C13.9 16 13 16.9023 13 18.005Z" fill="#000000"/>
                    </svg>
                </div>
                ) : (<></>)}
            </div>
        ))
}

// Location.propTypes = {
//     id: PropTypes.string,
//     values: PropTypes.array,
//     // bars: PropTypes.string, 
//     // beats: PropTypes.string,
//     // divisions: PropTypes.string,
//     enabled: PropTypes.bool,
//     onEditString: PropTypes.func,
//     onEditLocation: PropTypes.func,
// }
