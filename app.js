/* application specific logic */

import bugsnag from '@bugsnag/js'
window.bugsnagClient = bugsnag('a0c8e2c65bed338af650acd9c2192855')
import 'jquery';
import 'jquery-contextmenu';
import 'jQuery-Impromptu';

import 'olm';

import conference from './conference';
import API from './modules/API';
import UI from './modules/UI/UI';
import keyboardshortcut from './modules/keyboardshortcut/keyboardshortcut';
import remoteControl from './modules/remotecontrol/RemoteControl';
import translation from './modules/translation/translation';

// Initialize Olm as early as possible.
if (window.Olm) {
    window.Olm.init();
}

window.APP = {
    API,
    conference,

    // Used by do_external_connect.js if we receive the attach data after
    // connect was already executed. status property can be 'initialized',
    // 'ready', or 'connecting'. We are interested in 'ready' status only which
    // means that connect was executed but we have to wait for the attach data.
    // In status 'ready' handler property will be set to a function that will
    // finish the connect process when the attach data or error is received.
    connect: {
        handler: null,
        status: 'initialized'
    },

    // Used for automated performance tests.
    connectionTimes: {
        'index.loaded': window.indexLoadedTime
    },

    keyboardshortcut,
    remoteControl,
    translation,
    UI
};

// TODO The execution of the mobile app starts from react/index.native.js.
// Similarly, the execution of the Web app should start from react/index.web.js
// for the sake of consistency and ease of understanding. Temporarily though
// because we are at the beginning of introducing React into the Web app, allow
// the execution of the Web app to start from app.js in order to reduce the
// complexity of the beginning step.
import './react';
