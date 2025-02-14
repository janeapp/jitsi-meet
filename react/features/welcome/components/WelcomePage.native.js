import { jitsiLocalStorage } from '@jitsi/js-utils';
import React from 'react';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { HelpView } from '../../help';
import { DialInSummary } from '../../invite';
import { SettingsView } from '../../settings/components';
import { setScreen } from '../actions';


import {
    AbstractWelcomePage,
    _mapStateToProps as _abstractMapStateToProps
} from './AbstractWelcomePage';
import WelcomePageScreen from './Screen';

const LAUNCHED_BEFORE_STORAGE_KEY = 'LAUNCHED_BEFORE';

const WelcomePageLayout = () => <WelcomePageScreen />;

/**
 * The native container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {

    /**
     * Check if the user is opening the app for the first time.
     *
     * @returns {void}
     */
    checkIsFirstTimeLoading() {
        try {
            const launchedBefore = jitsiLocalStorage.getItem(LAUNCHED_BEFORE_STORAGE_KEY);

            if (launchedBefore === 'true') {
                this.props.dispatch(setScreen('done'));
            } else {
                jitsiLocalStorage.setItem(LAUNCHED_BEFORE_STORAGE_KEY, 'true');
                this.props.dispatch(setScreen('stepOne'));
            }
        } catch (e) {
            console.error(e);
            this.props.dispatch(setScreen('stepOne'));
        }
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs. Creates a local video track if none
     * is available and the camera permission was already granted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();
        this.checkIsFirstTimeLoading();
    }

    /**
     * Implements React's {@link Component#render()}. Renders a prompt for
     * entering a room name.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (<WelcomePageLayout
            _headerStyles = { this.props._headerStyles } />);
    }

    /**
     * Renders JitsiModals that are supposed to be on the welcome page.
     *
     * @returns {Array<ReactElement>}
     */
    _renderWelcomePageModals() {
        return [
            <HelpView key = 'helpView' />,
            <DialInSummary key = 'dialInSummary' />,
            <SettingsView key = 'settings' />
        ];
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        _headerStyles: ColorSchemeRegistry.get(state, 'Header')
    };
}

export default translate(connect(_mapStateToProps)(WelcomePage));
