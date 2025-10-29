import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import "../node_modules/bootstrap/dist/css/bootstrap.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.js";
// src/fontAwesome.js
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons"; // Solid icons
import { far } from "@fortawesome/free-regular-svg-icons"; // Regular icons (optional)
import { fab } from "@fortawesome/free-brands-svg-icons"; // Brand icons (optional)
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import 'sweetalert2/src/sweetalert2.scss'

// Add desired icon styles to the library
library.add(fas, far, fab);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
