import { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const data = await AuthService.getMe();
                setUser(data.user);
            } catch {
                console.warn('No active session found.');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    // Session Heartbeat - Keeps JWT fresh every 10 mins if user is active
    useEffect(() => {
        if (!user) return;

        const heartbeat = setInterval(async () => {
            // Optimization: Pause heartbeat if tab is hidden to reduce server load
            if (document.visibilityState !== 'visible') {
                console.debug('[Auth] Heartbeat: Tab hidden, skipping refresh');
                return;
            }

            try {
                const data = await AuthService.getMe();
                setUser(data.user);
                console.debug('[Auth] Heartbeat: Session refreshed');
            } catch {
                console.error('[Auth] Session expired during heartbeat');
                setUser(null);
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(heartbeat);
    }, [user]);

    const login = async (authId, password) => {
        const data = await AuthService.login(authId, password);
        
        if (data.require2FA) {
            return { require2FA: true, employee_id: data.employee_id, tempToken: data.tempToken };
        }

        return finalizeLogin(data);
    };

    const verify2FA = async (employeeId, otp) => {
        const data = await AuthService.verify2FA(employeeId, otp);
        return finalizeLogin(data);
    };

    const finalizeLogin = (data) => {
        const { user } = data;
        setUser(user);
        return { user };
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
    };

    if (loading) {
        return null; // Or a splash screen
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            verify2FA,
            isAdmin: user?.role_name === 'Admin', 
            isModerator: user?.role_name === 'Moderator' 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
