import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom";
import { useSequenceStore } from "../../app/state/sequence-store";
import { usePositionStore } from "../../app/state/position-store"
import { Sequence } from "../../player/sequence"
import SongPlayer from "../../player/song-player"
import MidiService from "../../services/midi-service"
import "../../css/index.css"
import { useBoundStore } from "../../app/state/bound-store"

const SequenceCard = (props: any) => {

    const [sequence] = useState<Sequence>(props.sequence)

    const navigate = useNavigate()

    const loadSequence = useSequenceStore(state => state.loadSequence)
    const isPlaying = usePositionStore(state => state.isPlaying)
    const setCurrentSequenceId = useBoundStore(state => state.setCurrentSequenceId)
    const [currentSequenceId] = useState(useBoundStore(state => state.currentSequenceId))

    const startSequence = () => {
        console.log(`startSequence - ${sequence.name} ${sequence._id}`)
        // console.log(`SequenceCard: sequence ${JSON.stringify(sequence)}`)
        loadSequence(sequence)
        MidiService.sendCurrentProgramDataDump(sequence);
        SongPlayer.startSequence(sequence._id, [{note: 60, velocity: 100}])
        // setIsPlaying(true)
        // console.log(`SequenceCard: isPlaying ${isPlaying}`)
    }

    const sendSysex = () => {
        loadSequence(sequence)
        MidiService.sendCurrentProgramDataDump(sequence);
    }

    const startSequenceListen = () => {
        console.log(`startSequenceListen - ${sequence.name} ${sequence._id}`)
        // console.log(`SequenceCard: sequence ${JSON.stringify(sequence)}`)
        loadSequence(sequence)
        MidiService.sendCurrentProgramDataDump(sequence);
        SongPlayer.startSequence(sequence._id, [])
        // setIsPlaying(true)
        // console.log(`SequenceCard: isPlaying ${isPlaying}`)
    }

    const stopSequence = () => {
        SongPlayer.stop()
    }

    // console.log(`SequenceCard: isPlaying ${isPlaying}`)

    return (
        <div className="max-w-sm rounded overflow-hidden shadow-lg">
            <img className="w-full" src="/img/sequence.png" alt="Sequence image"></img>
            <div className="px-6 py-1">
                <h5 className="card-title">{sequence.name || "no name"}</h5>
                <p className="card-text">
                    <strong>About: </strong>{sequence.text}<br />
                    <strong>Bpm: </strong>{sequence.tempo}<br />
                    <strong>Notes/Division: </strong>{sequence.numSteps}/{sequence.division}<br />
                    <strong>Length: </strong>{sequence.length}{currentSequenceId}<br />
                </p>
            </div>
            <div className="py-1">
                <div className="flexbox-row Island">
                    <button className="menu-button zen-mode-transition" type="button" title="send sysex patch" onClick={() => { sendSysex() }}>
                        {/* <svg fill="#000000" viewBox="0 0 450.682 450.682">
                        <g>
                            <path d="M40.106,448.463c61.079-24.229,72.21-68.932,70.916-130.538c-0.99-47.131-10.309-94.11-14.862-140.969
                                c-1.867-19.228-2.561-38.553-2.212-57.849c0.587-32.659,21.486-32.963,45.374-31.238c12.021,19.799,36.652,33.414,65.175,33.414
                                h107.427V99.795h36.19V21.486h-36.19V0H204.505c-26.239,0-49.175,11.532-62.043,28.79C70.913,24,35.604,61.612,34.315,133.017
                                c-0.794,43.979,7.512,88.499,12.844,131.995c4.528,36.944,21.516,108.589-22.831,126.182
                                C-10.833,405.139,4.478,462.597,40.106,448.463z"/>
                            <path d="M390.686,90.161c5.178-8.187,3.695-1.238,14.775,3.477c11.085,4.719,40.792-29.178,40.792-29.178v-0.391v-6.667v-0.395
                                c0,0-29.715-33.897-40.792-29.178c-11.089,4.719-9.605,11.668-14.775,3.477c-5.174-8.188-16.995-9.648-16.995-9.648v-0.172h-9.866
                                v78.317h9.866C373.69,99.803,385.512,98.35,390.686,90.161z"/>
                        </g>
                        </svg> */}
                        {/* <svg fill="#000000" viewBox="0 0 548.291 548.291">
                            <g>
                                <path d="M486.201,196.116h-13.166V132.59c0-0.399-0.062-0.795-0.115-1.2c-0.021-2.522-0.825-5-2.552-6.96L364.657,3.677
                                    c-0.033-0.034-0.064-0.044-0.085-0.075c-0.63-0.704-1.364-1.292-2.143-1.796c-0.229-0.157-0.461-0.286-0.702-0.419
                                    c-0.672-0.365-1.387-0.672-2.121-0.893c-0.2-0.052-0.379-0.134-0.577-0.188C358.23,0.118,357.401,0,356.562,0H96.757
                                    C84.894,0,75.256,9.649,75.256,21.502v174.613H62.092c-16.971,0-30.732,13.756-30.732,30.73v159.81
                                    c0,16.966,13.761,30.736,30.732,30.736h13.164V526.79c0,11.854,9.638,21.501,21.501,21.501h354.776
                                    c11.853,0,21.501-9.647,21.501-21.501V417.392h13.166c16.966,0,30.729-13.764,30.729-30.731V226.854
                                    C516.93,209.872,503.167,196.116,486.201,196.116z M96.757,21.502h249.054v110.006c0,5.94,4.817,10.751,10.751,10.751h94.972
                                    v53.861H96.757V21.502z M310.14,237.605v141.036h-32.016V237.605H310.14z M253.667,378.652h-31.184l-2.097-53.985
                                    c-0.622-16.946-1.252-37.466-1.252-57.967h-0.622c-4.394,17.998-10.257,38.082-15.704,54.617l-17.147,55.029h-24.903
                                    l-15.074-54.608c-4.602-16.526-9.413-36.632-12.756-55.038H132.5c-0.829,19.037-1.456,40.812-2.506,58.386l-2.509,53.566H97.978
                                    l9-141.042h42.481l13.798,47.087c4.391,16.314,8.795,33.9,11.934,50.425h0.628c3.979-16.314,8.795-34.939,13.391-50.636
                                    l15.066-46.876h41.643L253.667,378.652z M451.534,520.962H96.757v-103.57h354.776V520.962z M439.041,361.894
                                    c-14.873,12.363-37.461,18.222-65.082,18.222c-16.531,0-28.254-1.046-36.206-2.095V239.484c11.733-1.879,26.998-2.919,43.114-2.919
                                    c26.776,0,44.152,4.811,57.753,15.069c14.657,10.874,23.858,28.245,23.858,53.148C462.467,331.78,452.63,350.398,439.041,361.894z"
                                    />
                                <path d="M384.214,261.051c-7.118,0-11.732,0.627-14.446,1.247v92.286c2.714,0.629,7.112,0.629,11.088,0.629
                                    c28.87,0.199,47.706-15.696,47.706-49.392C428.783,276.528,411.623,261.051,384.214,261.051z"/>
                            </g>
                        </svg> */}
                        <svg fill="#000000" viewBox="0 0 24 24">
                            <path d="M21.775 7.517H24v8.966h-2.225zm-8.562 0h6.506c.66 0 1.045.57 1.045 1.247v6.607c0 .84-.35 1.112-1.112 1.112h-6.439v-5.696h2.225v3.505h3.135V9.54h-5.36zm-3.235 0h2.19v8.966h-2.19zM0 7.517h7.854c.66 0 1.045.57 1.045 1.247v7.72H6.708V9.774H5.427v6.708H3.438V9.775H2.191v6.708H0Z"/>
                        </svg>
                    </button>
                    <button className="menu-button zen-mode-transition" type="button" title="edit" onClick={() => {navigate("/sequence/" + sequence._id)}}>
                        <svg viewBox="0 0 16 16" fill="none">
                            <g fill="#000000">
                                <path fillRule="evenodd" d="M11.436 1.005A1.75 1.75 0 0113.902.79l.702.589a1.75 1.75 0 01.216 2.465l-5.704 6.798a4.75 4.75 0 01-1.497 1.187l-2.572 1.299a.75.75 0 01-1.056-.886l.833-2.759a4.75 4.75 0 01.908-1.68l5.704-6.798zm1.502.934a.25.25 0 00-.353.03l-.53.633 1.082.914.534-.636a.25.25 0 00-.031-.352l-.703-.59zm-.765 2.726l-1.082-.914-4.21 5.016a3.25 3.25 0 00-.621 1.15L5.933 11l1.01-.51a3.249 3.249 0 001.024-.812l4.206-5.013z" clipRule="evenodd"/>
                                <path d="M3.25 3.5a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h9.5a.75.75 0 00.75-.75V9A.75.75 0 0115 9v4.75A2.25 2.25 0 0112.75 16h-9.5A2.25 2.25 0 011 13.75v-9.5A2.25 2.25 0 013.25 2H6a.75.75 0 010 1.5H3.25z"/>
                            </g>
                        </svg>
                    </button>
                    { isPlaying ? (
                        <button className="menu-button zen-mode-transition" type="button" title="stop" onClick={() => { stopSequence() }} >
                            <svg fill="red" viewBox="0 0 56 56">
                                <path d="M 8.8984 41.9219 C 8.8984 45.1797 10.8672 47.1016 14.1719 47.1016 L 41.8281 47.1016 C 45.1328 47.1016 47.1016 45.1797 47.1016 41.9219 L 47.1016 14.0781 C 47.1016 10.8203 45.1328 8.8984 41.8281 8.8984 L 14.1719 8.8984 C 10.8672 8.8984 8.8984 10.8203 8.8984 14.0781 Z M 12.6719 41.0312 L 12.6719 14.9688 C 12.6719 13.5390 13.5156 12.6719 14.9219 12.6719 L 41.0781 12.6719 C 42.4844 12.6719 43.3281 13.5390 43.3281 14.9688 L 43.3281 41.0312 C 43.3281 42.4609 42.4844 43.3281 41.0781 43.3281 L 14.9219 43.3281 C 13.5156 43.3281 12.6719 42.4609 12.6719 41.0312 Z"/>
                            </svg>
                        </button>
                    ) : (
                        <>
                            <button className="menu-button zen-mode-transition" type="button" title="play" onClick={() => { startSequence() }} >
                                <svg viewBox="0 0 32 32" fill="black">
                                    <path stroke="#535358" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 24.414V7.586c0-1.746 2.081-2.653 3.36-1.465l9.062 8.413a2 2 0 010 2.932l-9.061 8.413C13.08 27.067 11 26.16 11 24.414z"/>
                                </svg>
                            </button>
                            <button className="menu-button zen-mode-transition" type="button" title="monitor" onClick={() => { startSequenceListen() }} >
                                <svg viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" fill="#000000"
                                        d="M22 21C23.1046 21 24 20.1046 24 19V5C24 3.89543 23.1046 3 22 3H3C1.89543 3 1 3.89543 1 5V19C1 20.1046 1.89543 21 3 21H22ZM11 5H8.98486V13H7.98511V19H12V13H11V5ZM18.0151 19H22V5H19.0151V13H18.0151V19ZM17.0151 13H16.0151V5H14V13H13V19H17.0151V13ZM6.98511 19V13H5.98486V5H3L3 19H6.98511Z"
                                    />
                                </svg>
                            </button>
                        </>
                )}
                </div>
            </div>
        </div>
    )
}

export default SequenceCard
