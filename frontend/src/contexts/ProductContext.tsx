import React, { createContext, useContext, useReducer, useEffect } from 'react';


// Initial state adapting to our domain (Plants, Rooms instead of just Products)
// State is now ephemeral (not persisted in localStorage for security)
const initialState = {
    plants: [],
    rooms: [], // Salas
    strains: [], // Cepas
    isLoading: true,
    error: null,
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_DATA':
            // Removed localStorage persistence for security
            return {
                ...state,
                plants: action.payload.plants || state.plants,
                rooms: action.payload.rooms || state.rooms,
                strains: action.payload.strains || state.strains,
                isLoading: false,
            };
        case 'STATE_UPDATE':
            // Removed localStorage persistence
            return state;
        case 'FETCH_START':
            return { ...state, isLoading: true, error: null };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false, error: action.payload };
        default:
            return state;
    }
};

const ProductContext = createContext(initialState);

export const ProductProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // State is now ephemeral (not persisted for security)
    // useEffect removed - no localStorage persistence

    return (
        <ProductContext.Provider value={{ state, dispatch }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
