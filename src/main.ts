import { mount } from 'svelte';
// Lato, bundled so the app works offline (Latin + Latin Extended covers German).
import '@fontsource/lato/latin-400.css';
import '@fontsource/lato/latin-400-italic.css';
import '@fontsource/lato/latin-700.css';
import '@fontsource/lato/latin-900.css';
import '@fontsource/lato/latin-ext-400.css';
import '@fontsource/lato/latin-ext-700.css';
import './app.css';
import './styles/theme.css';
import './blocks/index.ts';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
