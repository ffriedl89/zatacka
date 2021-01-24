import { FunctionalComponent, h } from "preact";
import { Route, Router, RouterOnChangeArgs } from "preact-router";

import Home from "../routes/home";
import Profile from "../routes/profile";
import NotFoundPage from "../routes/notfound";
import Lobby from '../routes/lobby';
import Header from "./header";
import { CommunicationProvider } from "../comms/";

const App: FunctionalComponent = () => {
    let currentUrl: string;
    const handleRoute = (e: RouterOnChangeArgs) => {
        currentUrl = e.url;
    };

    return (
        <div id="app">
            <Header />
            <CommunicationProvider>
                <Router onChange={handleRoute}>
                    <Route path="/" component={Home} />
                    <Route path="/lobby" component={Lobby} />
                    <Route path="/profile/" component={Profile} user="me" />
                    <Route path="/profile/:user" component={Profile} />
                    <NotFoundPage default />
                </Router>
            </CommunicationProvider>
        </div>
    );
};

export default App;
