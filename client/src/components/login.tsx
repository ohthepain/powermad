import React, { useState } from "react";
import {useParams} from "react-router-dom";
import * as Realm from "realm-web";

export function isLoggedIn() {
    const app = new Realm.App({ id: "powermad-hsulz" });
    return app.currentUser && Object.keys(app.currentUser.profile).length > 0;
}

// function RegisteredSuccess() {
//     return (
//         <div>
//             <div>
//                 <h1>Success</h1>
//             </div>
//         </div>
//     );
// }

function Login() {

    const routeParams = useParams();
    console.log(JSON.stringify(routeParams))
    // const user = React.useContext(UserContext);
    // console.log(user && user.id)
    // console.log(JSON.stringify(user))
    const app = new Realm.App({ id: "powermad-hsulz" });
    console.log(JSON.stringify(app.currentUser))

    const initialCredentials = {
        username: "",
        password: "",
    };

    const [credentials, setCredentials] = useState(initialCredentials);

    const handleUsernameInputChange = (event: any) => {
        // console.log(JSON.stringify(event))
        const username = event.target.value;
        // console.log(`Login.handleUsernameInputChange: <${username}>`)
        setCredentials({ ...credentials, username: username });
        // console.log(`credentials: <${JSON.stringify(credentials)}>`)
    };

    const handlePasswordInputChange = (event: any) => {
        // console.log(JSON.stringify(event))
        const password = event.target.value;
        console.log(`<!--Login.handlePasswordInputChange: <${password}>-->`)
        setCredentials({ ...credentials, password: password });
        // console.log(`credentials: <${JSON.stringify(credentials)}>`)
    };

    // Create a component that displays the given user's details
    function UserDetail({
        user
    }: any) {
        console.log(`UserDetail: app.currentUser is ${app.currentUser && app.currentUser}`)
        console.log(`UserDetail: app.currentUser.isLoggedIn is ${app.currentUser && app.currentUser.isLoggedIn}`)
        console.log(`UserDetail: app.currentUser is ${app.currentUser && JSON.stringify(app.currentUser)}`)
        console.log(`UserDetail: app.currentUser.id is ${app.currentUser && JSON.stringify(app.currentUser.id)}`)
        console.log(`UserDetail: app.currentUser.profile is ${app.currentUser && JSON.stringify(app.currentUser.profile)}`)
        console.log(`UserDetail: app.currentUser.profile.data is ${app.currentUser && JSON.stringify(app.currentUser.profile.data)}`)
        return (
            <div>
                {/* @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message */}
                <h1>{isLoggedIn() ? ("Logged in as: " + app.currentUser.profile.email) : ("Login:")}</h1>
            </div>
        );
    }

    // // Anonymous login
    // function Login({ setUser }) {
    //     const loginAnonymous = async () => {
    //         const user = await app.logIn(Realm.Credentials.anonymous());
    //         setUser(user);
    //     };
    //     return <button onClick={loginAnonymous}>Log In</button>;
    // }

    async function loginEmailPassword(email: any, password: any) {
        console.log(`Login.loginEmailPassword ${email} ${password}`)
        // Create an anonymous credential
        const credentials = Realm.Credentials.emailPassword(email, password);
        try {
            // Authenticate the user
            const user = await app.logIn(credentials);
            // `App.currentUser` updates to match the logged in user
            // @ts-expect-error TS(2531): Object is possibly 'null'.
            console.assert(user.id === app.currentUser.id);
            return user;
        } catch (err) {
            console.error("Failed to log in", err);
        }
    }

    async function logout() {
        console.log(`App.Logout: ${(app.currentUser as any).email}. user is now ${JSON.stringify(app.currentUser)}`);
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        await app.currentUser.logOut();
        console.log(`App.Logout: done. user is now ${JSON.stringify(app.currentUser)}`)
    }

    async function registerEmailPassword(email: any, password: any) {
        console.log(`Login.registerEmailPassword ${email} ${password}`)
        try {
            await app.emailPasswordAuth.registerUser({ email, password });
        } catch (err) {
            console.error("Failed to register", err);
        }
    }

    async function register() {
        console.log(`Login.register ${credentials.username} ${credentials.password}`)
        await registerEmailPassword(credentials.username, credentials.password)
    }

    async function login() {
        console.log(`Login.login ${credentials.username} ${credentials.password}`)
        await loginEmailPassword(credentials.username, credentials.password)
        console.log(`current user: ${JSON.stringify(app.currentUser)}`)
    }

    async function deregister() {
        // @ts-expect-error TS(2345): Argument of type 'User<DefaultFunctionsFactory & B... Remove this comment to see the full error message
        await app.deleteUser(app.currentUser);
    }

    return (
        <div>
            <div><UserDetail/></div>
            <div className="submit-form">
                <div>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            required
                            value={credentials.username}
                            onChange={handleUsernameInputChange}
                            name="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">ID</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            required
                            value={credentials.password}
                            onChange={handlePasswordInputChange}
                            name="password"
                        />
                    </div>

                    <button onClick={login} className="btn btn-success">
                        Login
                    </button>
                    <button onClick={register} className="btn btn-success">
                        Register
                    </button>
                    <button onClick={deregister} className="btn btn-success">
                        Delete User
                    </button>
                    <button onClick={logout} className="btn btn-success">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
