import React, { useEffect } from "react";

const ThemeContext = React.createContext(false);

const ThemeProvider = ({ children }) => {
    const [toggle, setToggle] = React.useState(false);

    const toggleFunction = () => {
        setToggle(prev => !prev);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', toggle ? 'dark' : 'light');
    }, [toggle]);


    return (
        <ThemeContext.Provider value={{ toggle, toggleFunction }}>
        {children}
        </ThemeContext.Provider>
    );
};

export { ThemeContext, ThemeProvider };
