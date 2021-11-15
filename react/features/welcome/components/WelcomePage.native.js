import { faUserMd, faUser, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import {
    Animated,
    Image,
    Keyboard,
    SafeAreaView,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    View
} from 'react-native';

import { getName } from '../../app/functions';
import { ColorSchemeRegistry } from '../../base/color-scheme';
import { translate } from '../../base/i18n';
import { Icon, IconMenu, IconWarning } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import { Header, LoadingIndicator, Text } from '../../base/react';
import { connect } from '../../base/redux';
import { ColorPalette } from '../../base/styles';
import {
    createDesiredLocalTracks,
    destroyLocalDesktopTrackIfExists,
    destroyLocalTracks
} from '../../base/tracks';
import { HelpView } from '../../help';
import { DialInSummary } from '../../invite';
import { SettingsView } from '../../settings/components';
import { setSideBarVisible } from '../actions';

import {
    AbstractWelcomePage,
    _mapStateToProps as _abstractMapStateToProps
} from './AbstractWelcomePage';
import LocalVideoTrackUnderlay from './LocalVideoTrackUnderlay';
import VideoSwitch from './VideoSwitch';
import WelcomePageLists from './WelcomePageLists';
import WelcomePageSideBar from './WelcomePageSideBar';
import styles, { PLACEHOLDER_TEXT_COLOR } from './styles';

// eslint-disable-next-line react/prop-types
const WelcomePageLayout = ({ _headerStyles }) => (
    <LocalVideoTrackUnderlay>
        <View style = { _headerStyles.page }>
            <SafeAreaView style = { [ styles.blankPageWrapper, styles.welcomePage ] }>
                <View style = { styles.welcomePageContainer }>

                    <Image
                        source = { require('../../../../images/jane-video-logo.png') }
                        style = { styles.logo } />
                    <Text style = { styles.bigText }>
                            Welcome to
                        {'\n'}
                            Jane Online Appointments
                    </Text>

                    <View style = { styles.row }>
                        <View style = { styles.column }>
                            <FontAwesomeIcon
                                color = 'white'
                                icon = { faUserMd }
                                size = { 45 } />
                        </View>
                        <View style = { [ styles.column, styles.columnText ] }>
                            {/* eslint-disable-next-line max-len */}
                            <Text style = { styles.whiteText }>Please find the scheduled appointment in a web browser and click Begin.</Text>
                        </View>
                    </View>


                    <View style = { styles.row }>
                        <View style = { styles.column }>
                            <FontAwesomeIcon
                                icon = { faIdBadge }
                                size = { 45 }
                                color = 'white' />
                        </View>
                        <View style = { [ styles.column, styles.columnText ] }>
                            <Text style = { [ styles.whiteText, styles.bold ] }>Staff Member</Text>
                            <Text style = { styles.whiteText }>Please find the scheduled appointment in a web browser and click <Text style = { styles.bold }>Begin</Text>.</Text>
                        </View>
                    </View>

                    <View style = { styles.row }>
                        <View style = { styles.column }>
                            <FontAwesomeIcon
                                color = 'white'
                                icon = { faUser }
                                size = { 45 } />
                        </View>
                        <View style = { [ styles.column, styles.columnText ] }>
                            <Text style = { [ styles.whiteText, styles.bold ] }>Client</Text>
                            <Text style = { styles.whiteText }>You will receive an email 30 minutes prior to your appointment with a link to begin. You can also sign in to your Jane account with a web browser and tap <Text style = { styles.bold }>Begin</Text>.</Text>
                        </View>
                    </View>
                </View>

                <View style = { styles.row }>
                    <View style = { styles.column }>
                        <FontAwesomeIcon
                            color = 'white'
                            icon = { faUser }
                            size = { 45 } />
                    </View>
                    <View style = { [ styles.column, styles.columnText ] }>
                        <Text style = { styles.whiteText }>Please go into your 'My Account' and click Begin.</Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    </LocalVideoTrackUnderlay>
);

/**
 * The native container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * Constructor of the Component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state._fieldFocused = false;
        this.state.hintBoxAnimation = new Animated.Value(0);

        // Bind event handlers so they are only bound once per instance.
        this._onFieldFocusChange = this._onFieldFocusChange.bind(this);
        this._onShowSideBar = this._onShowSideBar.bind(this);
        this._renderHintBox = this._renderHintBox.bind(this);

        // Specially bind functions to avoid function definition on render.
        this._onFieldBlur = this._onFieldFocusChange.bind(this, false);
        this._onFieldFocus = this._onFieldFocusChange.bind(this, true);
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

        this._updateRoomname();

        const { dispatch } = this.props;

        if (this.props._settings.startAudioOnly) {
            dispatch(destroyLocalTracks());
        } else {
            dispatch(destroyLocalDesktopTrackIfExists());

            // Make sure we don't request the permission for the camera from
            // the start. We will, however, create a video track iff the user
            // already granted the permission.
            navigator.permissions.query({ name: 'camera' }).then(response => {
                response === 'granted'
                    && dispatch(createDesiredLocalTracks(MEDIA_TYPE.VIDEO));
            });
        }
    }

    /**
     * Implements React's {@link Component#render()}. Renders a prompt for
     * entering a room name.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // We want to have the welcome page support the reduced UI layout,
        // but we ran into serious issues enabling it so we disable it
        // until we have a proper fix in place. We leave the code here though, because
        // this part should be fine when the bug is fixed.
        //
        // NOTE: when re-enabling, don't forget to uncomment the respective _mapStateToProps line too

        /*
        const { _reducedUI } = this.props;

        if (_reducedUI) {
            return this._renderReducedUI();
        }
        */
        return <WelcomePageLayout _headerStyles = { this.props._headerStyles } />;

        // return this._renderFullUI(); // use to get access to call in simluator
    }

    /**
     * Constructs a style array to handle the hint box animation.
     *
     * @private
     * @returns {Array<Object>}
     */
    _getHintBoxStyle() {
        return [
            styles.messageContainer,
            styles.hintContainer,
            {
                opacity: this.state.hintBoxAnimation
            }
        ];
    }

    /**
     * Callback for when the room field's focus changes so the hint box
     * must be rendered or removed.
     *
     * @private
     * @param {boolean} focused - The focused state of the field.
     * @returns {void}
     */
    _onFieldFocusChange(focused) {
        if (focused) {
            // Stop placeholder animation.
            this._clearTimeouts();
            this.setState({
                _fieldFocused: true,
                roomPlaceholder: ''
            });
        } else {
            // Restart room placeholder animation.
            this._updateRoomname();
        }

        Animated.timing(
            this.state.hintBoxAnimation,
            {
                duration: 300,
                toValue: focused ? 1 : 0
            })
            .start(animationState =>
                animationState.finished
                    && !focused
                    && this.setState({
                        _fieldFocused: false
                    }));
    }

    /**
     * Toggles the side bar.
     *
     * @private
     * @returns {void}
     */
    _onShowSideBar() {
        Keyboard.dismiss();
        this.props.dispatch(setSideBarVisible(true));
    }

    /**
     * Renders the hint box if necessary.
     *
     * @private
     * @returns {React$Node}
     */
    _renderHintBox() {
        if (this.state._fieldFocused) {
            const { t } = this.props;

            return (
                <Animated.View style = { this._getHintBoxStyle() }>
                    <View style = { styles.hintTextContainer } >
                        <Text style = { styles.hintText }>
                            { t('welcomepage.roomnameHint') }
                        </Text>
                    </View>
                    <View style = { styles.hintButtonContainer } >
                        { this._renderJoinButton() }
                    </View>
                </Animated.View>
            );
        }

        return null;
    }

    /**
     * Renders the join button.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderJoinButton() {
        const { t } = this.props;
        let children;


        if (this.state.joining) {
            // TouchableHighlight is picky about what its children can be, so
            // wrap it in a native component, i.e. View to avoid having to
            // modify non-native children.
            children = (
                <View>
                    <LoadingIndicator
                        color = { styles.buttonText.color }
                        size = 'small' />
                </View>
            );
        } else {
            children = (
                <Text style = { styles.buttonText }>
                    { this.props.t('welcomepage.join') }
                </Text>
            );
        }

        return (
            <TouchableHighlight
                accessibilityLabel =
                    { t('welcomepage.accessibilityLabel.join') }
                onPress = { this._onJoin }
                style = { styles.button }
                underlayColor = { ColorPalette.white }>
                { children }
            </TouchableHighlight>
        );
    }

    /**
     * Renders the full welcome page.
     *
     * @returns {ReactElement}
     */
    _renderFullUI() {
        const roomnameAccLabel = 'welcomepage.accessibilityLabel.roomname';
        const { _headerStyles, t } = this.props;

        return (
            <LocalVideoTrackUnderlay style = { styles.welcomePage }>
                <View style = { _headerStyles.page }>
                    <Header style = { styles.header }>
                        <TouchableOpacity onPress = { this._onShowSideBar } >
                            <Icon
                                src = { IconMenu }
                                style = { _headerStyles.headerButtonIcon } />
                        </TouchableOpacity>
                        <VideoSwitch />
                    </Header>
                    <SafeAreaView style = { styles.roomContainer } >
                        <View style = { styles.joinControls } >
                            <Text style = { styles.enterRoomText }>
                                { t('welcomepage.roomname') }
                            </Text>
                            <TextInput
                                accessibilityLabel = { t(roomnameAccLabel) }
                                autoCapitalize = 'none'
                                autoComplete = 'off'
                                autoCorrect = { false }
                                autoFocus = { false }
                                onBlur = { this._onFieldBlur }
                                onChangeText = { this._onRoomChange }
                                onFocus = { this._onFieldFocus }
                                onSubmitEditing = { this._onJoin }
                                placeholder = { this.state.roomPlaceholder }
                                placeholderTextColor = { PLACEHOLDER_TEXT_COLOR }
                                returnKeyType = { 'go' }
                                style = { styles.textInput }
                                underlineColorAndroid = 'transparent'
                                value = { this.state.room } />
                            {
                                this._renderInsecureRoomNameWarning()
                            }
                            {
                                this._renderHintBox()
                            }
                        </View>
                    </SafeAreaView>
                    <WelcomePageLists disabled = { this.state._fieldFocused } />
                </View>
                <WelcomePageSideBar />
                { this._renderWelcomePageModals() }
            </LocalVideoTrackUnderlay>
        );
    }

    /**
     * Renders a "reduced" version of the welcome page.
     *
     * @returns {ReactElement}
     */
    _renderReducedUI() {
        const { t } = this.props;

        return (
            <View style = { styles.reducedUIContainer }>
                <Text style = { styles.reducedUIText }>
                    { t('welcomepage.reducedUIText', { app: getName() }) }
                </Text>
            </View>
        );
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

        // _reducedUI: state['features/base/responsive-ui'].reducedUI
    };
}

export default translate(connect(_mapStateToProps)(WelcomePage));
