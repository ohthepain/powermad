import React, {useState} from 'react'
import "./onoff-text-button.css"

type OnOffTextButtonProps = {
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
    label: string;
    className: string;
}

export const OnOffTextButton = (props: OnOffTextButtonProps) => {

    // console.log(`OnOffButton: props: ${JSON.stringify(props)}`)
    const [value, setValue] = useState(props.value)
    const onToggle = props.onToggle

    const toggle = (e: any) => {
        // must send this before setting value, as setValue waits for next update
        onToggle(!value)
        setValue(!value)
    }

    return value ? (
        <button className="onoff-button on" onClick={toggle} disabled={props.disabled}>
            {props.label}
        </button>
    ) : (
        <button className="onoff-button off" onClick={toggle} disabled={props.disabled}>
            {props.label}
        </button>
    )
}
