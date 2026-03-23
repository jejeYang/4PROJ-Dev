import React, { useEffect, useState } from "react";

const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
    const [themeSombre, setThemeSombre] = useState(() => {
        const themeSauvegarde = localStorage.getItem('themeSombre');
        return themeSauvegarde === 'true';
    });

    const basculerTheme = () => {
        setThemeSombre(themePrecedent => {
            const nouveauTheme = !themePrecedent;
            localStorage.setItem('themeSombre', nouveauTheme);
            return nouveauTheme;
        });
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeSombre ? 'dark' : 'light');
    }, [themeSombre]);

    return (
        <ThemeContext.Provider value={{ toggle: themeSombre, toggleFunction: basculerTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export { ThemeContext, ThemeProvider };
