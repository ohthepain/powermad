import React, { useState, createContext } from "react"
import {Route, Routes, useNavigate} from "react-router-dom"
import * as Realm from "realm-web";

import Login from "./components/login";
import SequenceView from "./components/ui/sequence-view";
import SequencesList from "./components/ui/sequences-list";
import ManufacturerPage from "./components/manufacturer/manufacturer";
import {isLoggedIn} from "./components/login";
import Loading from "./components/loading/loading"
import {MidiPreferences} from "./preferences/MidiPreferences";
import "./css/AppMenu.css"
import KeyboardMonitor from "./components/keyboard-monitor/keyboard-monitor";
import KeyboardOverlay from "./components/ui/keyboard-overlay";

export const UserContext = createContext(null)

function App() {
    let navigate = useNavigate()
    const app = new Realm.App({ id: "powermad-hsulz" })

    const [preferencesOpen, setPreferencesOpen] = useState(false)
    const [monitorKeyboardVisible, setMonitorKeyboardVisible] = useState(true)

    const currentUserName = app.currentUser ? app.currentUser.profile.email : "(no username)"

    async function loginEmailPassword(email: any, password: any) {
        console.log(`App.loginEmailPassword ${email} ${password}`)
        // Create an anonymous credential
        const credentials = Realm.Credentials.emailPassword(email, password);
        try {
            // Authenticate the user
            const user = await app.logIn(credentials);
            return user;
        } catch (err) {
            console.error("Failed to log in", err);
        }
    }

    async function logout() {
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        console.log(`App.logout: ${(app.currentUser as any).email}. user is now ${app.currentUser.state}`);
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        await app.currentUser.logOut();
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        console.log(`App.logout: done. user is now ${app.currentUser.state}`)
    }

    // navigator.requestMIDIAccess().then(() => {}, () => {alert('no midi access')});

    if (typeof navigator.requestMIDIAccess === 'function') {
        console.log('This browser supports WebMIDI!');
        navigator.requestMIDIAccess().then((access) => {
            access.onstatechange = (event) => {
              console.log(event.port.name, event.port.manufacturer, event.port.state);
            };
         });
    } else {
        alert('This browser does not support MIDI. Chrome and Opera. Try one of those.');
    }

    return (
      <div className="layer-ui__wrapper">
        <div className="FixedSideContainer_side_top">
            <div className="App-menu App-menu-top">
                <div className="Stack Stack-horizontal">
                    <img src="/logoround.png" height={30} width={36} />
                    <button className="menu-button zen-mode-transition" type="button" onClick={() => {console.log("awesome")}}>
                        <svg className="Button-icon" aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <g strokeWidth="1.5">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <line x1="4" y1="6" x2="20" y2="6"></line>
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <line x1="4" y1="18" x2="20" y2="18"></line>
                            </g>
                        </svg>
                    </button>
                    <button className="menu-button zen-mode-transition" type="button" onClick={(e) => {e.stopPropagation(); setPreferencesOpen(true)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"/>
                        </svg>
                    </button>
                    { preferencesOpen && <MidiPreferences clickOutside={() => setPreferencesOpen(false)}/> }
                </div>
                <div className="Stack Stack-horizontal">
                    <button className="menu-button zen-mode-transition" type="button" title="Sequences" onClick={(e) => {e.stopPropagation(); navigate("/sequences")}}>
                        {/* <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="9" cy="7" r="4"></circle><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></g>
                        </svg> */}
                        <svg fill="#000000" width="800px" height="800px" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><path d="M 28.0234 51.2734 C 40.7500 51.2734 51.2735 40.7266 51.2735 28 C 51.2735 15.2968 40.7265 4.7266 28.0000 4.7266 C 15.2734 4.7266 4.7265 15.2968 4.7265 28 C 4.7265 40.7266 15.2968 51.2734 28.0234 51.2734 Z M 21.2734 15.8594 C 22.6562 12.3672 24.5546 9.8594 26.6406 9.0859 L 26.6406 16.3984 C 24.7187 16.3516 22.9141 16.1641 21.2734 15.8594 Z M 29.3359 9.0859 C 31.4219 9.8594 33.3437 12.3672 34.7031 15.8594 C 33.0625 16.1641 31.2812 16.3516 29.3359 16.3984 Z M 34.2812 9.7422 C 36.7890 10.6094 39.0625 11.9453 40.9609 13.7031 C 39.9297 14.2890 38.7343 14.7812 37.3984 15.2031 C 36.5546 13.0234 35.4765 11.1719 34.2812 9.7422 Z M 15.0156 13.7031 C 16.9375 11.9688 19.2109 10.6094 21.7187 9.7422 C 20.5000 11.1719 19.4453 13.0234 18.5781 15.2031 C 17.2656 14.7812 16.0703 14.2890 15.0156 13.7031 Z M 39.6250 26.6406 C 39.5078 23.3828 39.0156 20.3594 38.2422 17.6875 C 40.0000 17.1484 41.5468 16.4688 42.8594 15.6719 C 45.3437 18.6719 46.9609 22.4688 47.2422 26.6406 Z M 8.7578 26.6406 C 9.0390 22.4688 10.6328 18.6719 13.1406 15.6719 C 14.4297 16.4688 16.0000 17.1484 17.7343 17.6875 C 16.9609 20.3594 16.4922 23.3828 16.3750 26.6406 Z M 29.3359 26.6406 L 29.3359 19.0937 C 31.5390 19.0234 33.6250 18.7656 35.5703 18.3672 C 36.2734 20.8750 36.7422 23.6875 36.8594 26.6406 Z M 19.1406 26.6406 C 19.2343 23.6875 19.7031 20.8750 20.4297 18.3672 C 22.3515 18.7656 24.4609 19.0234 26.6406 19.0937 L 26.6406 26.6406 Z M 8.7578 29.3359 L 16.3750 29.3359 C 16.4687 32.6406 16.9609 35.7344 17.7343 38.4297 C 16.0234 38.9688 14.4765 39.6250 13.1875 40.4219 C 10.6562 37.3750 9.0390 33.5547 8.7578 29.3359 Z M 19.1172 29.3359 L 26.6406 29.3359 L 26.6406 37.0234 C 24.4609 37.0937 22.3515 37.3281 20.4297 37.75 C 19.7031 35.2188 19.2343 32.3359 19.1172 29.3359 Z M 29.3359 37.0234 L 29.3359 29.3359 L 36.8594 29.3359 C 36.7656 32.3359 36.2968 35.2188 35.5703 37.75 C 33.6250 37.3281 31.5390 37.0937 29.3359 37.0234 Z M 38.2422 38.4297 C 39.0390 35.7344 39.5078 32.6406 39.6250 29.3359 L 47.2422 29.3359 C 46.9843 33.5547 45.3672 37.3984 42.8125 40.4219 C 41.5234 39.6484 39.9765 38.9688 38.2422 38.4297 Z M 21.2734 40.2578 C 22.9141 39.9531 24.7187 39.7656 26.6406 39.7188 L 26.6406 47.0312 C 24.5546 46.2578 22.6562 43.7500 21.2734 40.2578 Z M 29.3359 39.7188 C 31.2812 39.7656 33.0625 39.9531 34.7031 40.2578 C 33.3437 43.7500 31.4219 46.2578 29.3359 47.0312 Z M 15.0859 42.3672 C 16.1172 41.8047 17.2890 41.3125 18.5781 40.9141 C 19.4219 43.0234 20.4297 44.8047 21.6015 46.2344 C 19.1641 45.3906 16.9609 44.0547 15.0859 42.3672 Z M 37.3984 40.9141 C 38.7109 41.3125 39.8828 41.8047 40.9141 42.3906 C 39.0390 44.0781 36.8125 45.4141 34.3750 46.2578 C 35.5468 44.8281 36.5781 43.0234 37.3984 40.9141 Z"/></svg>
                    </button>
                    <button className="menu-button zen-mode-transition" type="button" title="Manufacturers" onClick={(e) => {e.stopPropagation(); navigate("/manufacturers")}}>
                        <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.25"><path d="M12.5 6.667h.01"></path><path d="M4.91 2.625h10.18a2.284 2.284 0 0 1 2.285 2.284v10.182a2.284 2.284 0 0 1-2.284 2.284H4.909a2.284 2.284 0 0 1-2.284-2.284V4.909a2.284 2.284 0 0 1 2.284-2.284Z"></path><path d="m3.333 12.5 3.334-3.333c.773-.745 1.726-.745 2.5 0l4.166 4.166"></path><path d="m11.667 11.667.833-.834c.774-.744 1.726-.744 2.5 0l1.667 1.667"></path></g></svg>
                    </button>
                    <button className="menu-button zen-mode-transition" type="button" title="Test loading" onClick={(e) => {e.stopPropagation(); navigate("/loading")}}>
                        <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="17" x2="12" y2="17.01"></line><path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4"></path></g></svg>
                    </button>
                </div>

                <div className="Stack Stack-horizontal">
                    <button className="menu-button zen-mode-transition" type="button" onClick={(e) => {e.stopPropagation(); navigate("/sequences"); }}>
                        <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <g strokeWidth="1.5">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
                            </g>
                        </svg>
                    </button>
                    <button className="menu-button zen-mode-transition" type="button" title={`Logout ${currentUserName}`} onClick={(e) => {e.stopPropagation(); navigate("/logout")}}>
                        <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="5" y1="12" x2="19" y2="12"></line><line x1="15" y1="16" x2="19" y2="12"></line><line x1="15" y1="8" x2="19" y2="12"></line></g></svg>
                    </button>
                    <button className="menu-button zen-mode-transition" type="button" title="switch user" onClick={(e) => {e.stopPropagation(); navigate("/login")}}>
                        <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="9" cy="7" r="4"></circle><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></g>
                        </svg>
                    </button>
                </div>
            </div>

            <KeyboardOverlay></KeyboardOverlay>
            
            <div className="container-fluid">
                <Routes>
                    <Route path="/" element={<SequencesList />}></Route>
                    <Route path="/manufacturers" element={<ManufacturerPage/>} />
                    <Route path="/loading" element={<Loading/>} />
                    <Route path="/sequences" element={<SequencesList />} />
                    <Route path="/sequence" element={<SequenceView />} />
                    <Route path="/sequence/:id" element={<SequenceView />} />
                    {/*<Route exact path="/sequences/:id/genre" element={<AddGenre/>} />*/}
                    <Route path="/login" element={<Login/>} />
                </Routes>
            </div>

            {/*<ReactQueryDevtools initialIsOpen={false} />*/}
        </div>
    </div>
    );
}

export default App;
