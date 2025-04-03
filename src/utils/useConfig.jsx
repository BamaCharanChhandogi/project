// utils/useConfig.js
import { useContext, createContext } from 'react';
import { client, storage, databases } from './appwrite';

const AppwriteContext = createContext();

export const AppwriteProvider = ({ children }) => {
  const config = {
    appwrite: {
      endpoint: 'https://cloud.appwrite.io/v1',
      projectId: '67e54122002b48ebf3d1',
      bucketId: '67e541df000fda7737de',
      databaseId: '67ee315b00173845a432',
      collectionId: '67ee3167003dc92155ec',
      models: [], // Populate this if you have predefined models
    },
  };

  return <AppwriteContext.Provider value={config}>{children}</AppwriteContext.Provider>;
};

export const useConfig = () => useContext(AppwriteContext);