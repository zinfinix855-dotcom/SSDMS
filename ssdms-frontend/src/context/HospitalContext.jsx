import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API from '../api/axios';

const HospitalContext = createContext(null);

export const HospitalProvider = ({ children }) => {
    const { user } = useAuth();
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState(() => {
        const stored = localStorage.getItem('ssdms_hospital_id');
        return stored ? parseInt(stored, 10) : null;
    });

    // Fetch accessible hospitals whenever the user changes/logs in
    useEffect(() => {
        if (!user) {
            setHospitals([]);
            setSelectedHospitalId(null);
            localStorage.removeItem('ssdms_hospital_id');
            return;
        }

        const fetchHospitals = async () => {
            try {
                const response = await API.get('/hospitals');
                const list = response.data || [];
                setHospitals(list);

                // Set initial hospital ID
                const storedId = localStorage.getItem('ssdms_hospital_id');
                const parsedStoredId = storedId ? parseInt(storedId, 10) : null;

                // Validate if stored ID exists in the fetched list (or if Admin, any is fine)
                const isValid = list.some(h => h.id === parsedStoredId);
                
                if (parsedStoredId && (isValid || user.role_name === 'Admin')) {
                    setSelectedHospitalId(parsedStoredId);
                } else if (list.length > 0) {
                    const defaultId = user.hospital_id || list[0].id;
                    setSelectedHospitalId(defaultId);
                    localStorage.setItem('ssdms_hospital_id', defaultId);
                }
            } catch (error) {
                console.error('Error loading hospitals:', error);
                // Fallback to user's assigned hospital
                const defaultId = user.hospital_id || 1;
                setSelectedHospitalId(defaultId);
                localStorage.setItem('ssdms_hospital_id', defaultId);
            }
        };

        fetchHospitals();
    }, [user]);

    const setHospital = (id) => {
        const parsedId = parseInt(id, 10);
        setSelectedHospitalId(parsedId);
        localStorage.setItem('ssdms_hospital_id', parsedId);
        // Dispatch custom storage event so other components or tabs can react
        window.dispatchEvent(new Event('storage'));
        // Trigger a reload of the current page / state so all queries fetch for the new hospital
        window.location.reload();
    };

    const activeHospitalName = hospitals.find(h => h.id === selectedHospitalId)?.name || 'Loading Hospital...';

    return (
        <HospitalContext.Provider value={{
            selectedHospitalId,
            setHospital,
            hospitals,
            activeHospitalName
        }}>
            {children}
        </HospitalContext.Provider>
    );
};

export const useHospital = () => useContext(HospitalContext);
export default HospitalContext;
