// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';

import { DialogContainer } from '../../base/dialog';
import JitsiThemeProvider from '../../base/ui/components/JitsiThemeProvider';
import { ChromeExtensionBanner } from '../../chrome-extension-banner';

import { AbstractApp } from './AbstractApp';

// Register middlewares and reducers.
import '../middlewares';
import '../reducers';

/**
 * Root app {@code Component} on Web/React.
 *
 * @extends AbstractApp
 */
export class App extends AbstractApp {
    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    _checkLastVisitedURL(): void {
        if (window.location.href.indexOf('?jwt=') > -1) {
            localStorage.setItem('lastVisitedUrl', window.location.href.toString());
        }
        if (window.location.href.indexOf('?jwt=') < 0 && localStorage.getItem('lastVisitedUrl')) {
            window.location.href = localStorage.getItem('lastVisitedUrl');
        }
    }

    _createMainElement(component, props) {
        this._checkLastVisitedURL();

        return (
            <JitsiThemeProvider>
                <AtlasKitThemeProvider mode = 'dark'>
                    <ChromeExtensionBanner />
                    { super._createMainElement(component, props) }
                </AtlasKitThemeProvider>
            </JitsiThemeProvider>
        );
    }

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    _renderDialogContainer() {
        return (
            <JitsiThemeProvider>
                <AtlasKitThemeProvider mode = 'dark'>
                    <DialogContainer />
                </AtlasKitThemeProvider>
            </JitsiThemeProvider>
        );
    }
}
