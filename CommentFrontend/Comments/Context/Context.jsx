import React, { useContext, useState } from "react";

const MainContext = React.createContext();

export function useMainContext() {
    return useContext(MainContext);
}

export function ContextProvider(props) {
    const [messageUpdate, setMessageUpdate] = useState([]);
    const [messageReset, setMessageReset] = useState(false);
    const [commentIncrement, setCommentIncrement] = useState(0);
    const [forceRefresh, setForceRefresh] = useState(false);

    const value = {
        messageReset,
        setMessageReset,
        messageUpdate,
        setMessageUpdate,
        commentIncrement,
        setCommentIncrement,
        forceRefresh,
        setForceRefresh
    };

    return (
        <MainContext.Provider value={value}>
            {props.children}
        </MainContext.Provider>
    );
}
