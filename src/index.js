import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from './App';
import './index.css';
import EventPage from './EventPage'
import TimeTest from "./TimeTest";
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <App /> }>
        </Route>
        <Route path="/test" element={ <EventPage /> }>
        </Route>
        <Route path="/test/uuid" element={ <EventPage /> }>
        </Route>
        <Route path="/time" element={ <TimeTest /> }>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);