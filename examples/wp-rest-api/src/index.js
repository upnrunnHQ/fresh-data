import React from 'react';
import { render } from 'react-dom';
import './index.css';
import App from './App';
import createStore from './create-store';
import reducer from './reducer';

const store = createStore( reducer );

render( <App store={ store } />, document.getElementById( 'root' ) );
