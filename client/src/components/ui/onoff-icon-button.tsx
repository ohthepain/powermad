// import React, {useState} from 'react'

// type OnOffIconButtonProps = {
//     value: boolean;
//     onToggle: (value: boolean) => void;
//     disabled?: boolean;
//     svg: React.SVGProps<SVGSVGElement>;
//     className: string;
// }

// export const OnOffIconButton = (props: OnOffIconButtonProps) => {

//     // console.log(`OnOffButton: props: ${JSON.stringify(props)}`)
//     const [value, setValue] = useState(props.value)
//     const onToggle = props.onToggle

//     const toggle = (e: any) => {
//         // must send this before setting value, as setValue waits for next update
//         onToggle(!value)
//         setValue(!value)
//     }

//     <button className="menu-button zen-mode-transition flex-end" type="button" title="save" onClick={toggle}>
//         <svg viewBox="2 2 20 20" fill="none">
//             <path d="M4 6C4 4.89543 4.89543 4 6 4H12H14.1716C14.702 4 15.2107 4.21071 15.5858 4.58579L19.4142 8.41421C19.7893 8.78929 20 9.29799 20 9.82843V12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             <path d="M8 4H13V7C13 7.55228 12.5523 8 12 8H9C8.44772 8 8 7.55228 8 7V4Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             <path d="M7 15C7 13.8954 7.89543 13 9 13H15C16.1046 13 17 13.8954 17 15V20H7V15Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         </svg>
//     </button>

//     return value ? (
//         <button className="onoff-button on" onClick={toggle} disabled={props.disabled}>
//             {props.svg}
//         </button>
//     ) : (
//         <button className="onoff-button off" onClick={toggle} disabled={props.disabled}>
//             {props.svg}
//         </button>
//     )
// }
