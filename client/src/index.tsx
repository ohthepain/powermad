import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import reportWebVitals from './reportWebVitals';
import {BrowserRouter} from "react-router-dom";
import {enableMapSet} from "immer";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
const queryClient = new QueryClient();
enableMapSet()

// @ts-expect-error TS(2345): Argument of type 'HTMLElement | null' is not assig... Remove this comment to see the full error message
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <div>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                { typeof navigator.requestMIDIAccess === 'function' ? 
                    (<App />) 
                    : 
                    (<h1 className='no-midi'>Please use a browser with MIDI support, such as Chrome, Opera or Firefox</h1>)
                }
                {/* <ReactQueryDevtools initialIsOpen /> */}
            </QueryClientProvider>
        </BrowserRouter>
    </div>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
