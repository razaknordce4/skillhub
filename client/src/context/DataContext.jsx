import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  const fetchData = useCallback(async (key, url, options = {}) => {
    const { forceRefresh = false, silent = false } = options;
    
    if (!forceRefresh && cache[key]) {
      return cache[key];
    }

    if (!silent) {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
    }
    
    try {
      const res = await axios.get(url);
      setCache(prev => ({ ...prev, [key]: res.data }));
      return res.data;
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
      throw err;
    } finally {
      if (!silent) {
        setLoadingStates(prev => ({ ...prev, [key]: false }));
      }
    }
  }, [cache]);

  const updateCache = useCallback((key, data) => {
    setCache(prev => ({ ...prev, [key]: data }));
  }, []);

  const clearCache = useCallback((key = null) => {
    if (key) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  return (
    <DataContext.Provider value={{ cache, loadingStates, fetchData, updateCache, clearCache }}>
      {children}
    </DataContext.Provider>
  );
};
