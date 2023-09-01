import React from 'react'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const IconSwitch = (props: any) => {

    const value = props.value
    const onToggle = props.onToggle

    const toggle = () => {
        onToggle(!value)
    }

    return props.value ? (
        <button onClick={toggle} disabled={props.disabled}>
            <FontAwesomeIcon icon={props.onIcon}/>
        </button>
    ) : (
        <button onClick={toggle} disabled={props.disabled}>
            <FontAwesomeIcon icon={props.offIcon}/>
        </button>
    )
}

export default IconSwitch
