// Safeguard against Safari / WebKit bug where internal Web Speech API calls Object.getPrototypeOf(voice) when voice is undefined
if (typeof window !== 'undefined' && typeof Object.getPrototypeOf === 'function') {
  const nativeGetPrototypeOf = Object.getPrototypeOf;
  Object.getPrototypeOf = function (obj: unknown) {
    if (obj === undefined || obj === null) {
      return null;
    }
    return nativeGetPrototypeOf.call(Object, obj as object);
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

