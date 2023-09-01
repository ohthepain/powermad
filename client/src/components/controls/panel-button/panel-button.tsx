
import React from "react"
import PropTypes from "prop-types"
import "./panel-button.css"

export const PanelButton = (props: any) => {

    const style : string = props.enabled ? (props.selected ? "panel-button-selected" : "panel-button-unselected") : "panel-button-disabled"

    return (
        <div className={"panel-button " + style} onClick={props.onClick}>
            <div className="panel-button-item">{props.label}</div>
        </div>
    )
}

PanelButton.propTypes = {
    enabled: PropTypes.bool,
    selected: PropTypes.bool,
    label: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.any,
}
