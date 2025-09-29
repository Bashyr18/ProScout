import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './components/HomePage.tsx';
import { ModalProvider } from './contexts/ModalContext.tsx';
import { useAppStore } from './store/useAppStore.ts';

const App: React.FC = () => {
    // Initialize the store on app startup
    useEffect(() => {
        useAppStore.getState().init();
    }, []);

    return <HomePage />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </React.StrictMode>
);
