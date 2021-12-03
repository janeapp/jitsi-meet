// @flow
/* eslint-disable require-jsdoc, react/no-multi-comp, react/jsx-handler-names*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import moment from 'moment';
import React, { Component, useCallback, useEffect, useState } from 'react';
import { Image, Linking, Text, View, Clipboard } from 'react-native';
import { WebView } from 'react-native-webview';

import { createWaitingAreaModalEvent, createWaitingAreaPageEvent, sendAnalytics } from '../../../analytics';
import { connect as startConference } from '../../../base/connection';
import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { getLocalParticipantFromJwt, getLocalParticipantType } from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    enableJaneWaitingArea,
    setJaneWaitingAreaAuthState,
    updateRemoteParticipantsStatuses
} from '../../actions';
import { POLL_INTERVAL, MAXIMUN_LOADING_TIME } from '../../constants';
import {
    checkLocalParticipantCanJoin, checkRoomStatus, getRemoteParticipantsStatuses,
    updateParticipantReadyStatus
} from '../../functions';

import { ActionButton } from './ActionButton';
import SocketConnection from './SocketConnection';
import styles from './styles';
type DialogTitleProps = {
    participantType: string,
    localParticipantCanJoin: boolean,
    authState: string,
    t: Function
}

type DialogBoxProps = {
    joinConferenceAction: Function,
    startConferenceAction: Function,
    enableJaneWaitingAreaAction: Function,
    jwtPayload: Object,
    jwt: string,
    participantType: string,
    updateRemoteParticipantsStatusesAction: Function,
    setJaneWaitingAreaAuthStateAction: Function,
    locationURL: string,
    remoteParticipantsStatuses: Array<Object>,
    authState: string,
    localParticipantCanJoin: boolean,
    t: Function
};

type SocketWebViewProps = {
    onError: Function,
    onMessageUpdate: Function,
    locationURL: string,
    fetchRoomStatus: Function
}

const getWebViewUrl = (locationURL: any) => {
    let uri = locationURL.href;

    uri = `${uri}&RNsocket=true`;

    return uri;
};

let poller, timer;

const SocketWebView = (props: SocketWebViewProps) => {
    const [ loading, setLoading ] = useState(false);
    const [ time, setTime ] = useState(0);

    const clearTimer = () => {
        setTime(0);
        timer && clearInterval(timer);
        poller && clearInterval(poller);
    };

    useEffect(() => {
        if (loading) {
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearTimer();
        }
    }, [ loading ]);

    useEffect(() => {
        if (time === MAXIMUN_LOADING_TIME) {
            clearTimer();
            poller = setInterval(() => {
                sendAnalytics(createWaitingAreaModalEvent('polling.started'));
                props.fetchRoomStatus();
            }, POLL_INTERVAL);
        }
    }, [ time ]);

    useEffect(() => () => {
        clearTimer();
    }, []);

    const injectedJavascript = `(function() {
          window.postMessage = function(data) {
            window.ReactNativeWebView.postMessage(data);
          };
        })()`;

    const onLoadStart = useCallback(() => {
        setLoading(true);
    });

    const onLoadEnd = useCallback(() => {
        setLoading(false);
        clearTimer();
    });

    return (<View
        style = { styles.socketView }>
        <WebView
            allowFileAccessFromFileURLs = { true }
            allowUniversalAccessFromFileURLs = { true }
            injectedJavaScript = { injectedJavascript }
            mixedContentMode = { 'always' }
            onError = { props.onError }
            onLoadEnd = { onLoadEnd }
            onLoadStart = { onLoadStart }
            onMessage = { props.onMessageUpdate }
            originWhitelist = { [ '*' ] }
            source = {{ uri: getWebViewUrl(props.locationURL) }}
            startInLoadingState = { false } />
    </View>);
};

class DialogBox extends Component<DialogBoxProps> {

    _joinConference: Function;
    _webviewOnError: Function;
    _return: Function;
    _onMessageUpdate: Function;

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
        this._webviewOnError = this._webviewOnError.bind(this);
        this._return = this._return.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt } = this.props;

        Clipboard.setString('');
        sendAnalytics(
            createWaitingAreaPageEvent('loaded', undefined));
        updateParticipantReadyStatus('waiting', jwt);
        this.fetchRoomStatus();
    }

    async fetchRoomStatus() {
        const { jwt, participantType, updateRemoteParticipantsStatusesAction } = this.props;

        try {
            const response = await checkRoomStatus(jwt);
            const remoteParticipantsStatuses
                = getRemoteParticipantsStatuses(response.participant_statuses, participantType);

            updateRemoteParticipantsStatusesAction(remoteParticipantsStatuses);
        } catch (error) {
            sendAnalytics(
                createWaitingAreaPageEvent('fetch.state.error', {
                    error
                }));
        }
    }

    _webviewOnError(error) {
        try {
            throw new Error(error);
        } catch (e) {
            sendAnalytics(
                createWaitingAreaPageEvent('webview.error', {
                    error
                }));
            this._joinConference();
        }
    }

    componentDidUpdate(prevProps: DialogBoxProps): * {
        const { localParticipantCanJoin, participantType } = this.props;

        if (prevProps.localParticipantCanJoin !== localParticipantCanJoin
            && participantType === 'Patient'
            && localParticipantCanJoin) {
            setTimeout(() => {
                this._joinConference();
            }, 1000);
        }
    }

    componentWillUnmount(): * {
        const { updateRemoteParticipantsStatusesAction } = this.props;

        updateRemoteParticipantsStatusesAction([]);
    }

    _joinConference() {
        const { startConferenceAction, enableJaneWaitingAreaAction, jwt } = this.props;

        updateParticipantReadyStatus('joined', jwt);
        enableJaneWaitingAreaAction(false);
        startConferenceAction();
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';

        if (startAt) {
            return (<Text style = { styles.msgText }>
                {
                    getLocalizedDateFormatter(startAt)
                        .format('MMMM D, YYYY')
                }
            </Text>);
        }

        return null;
    }

    _getStartTimeAndEndTime() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';
        const endAt = _.get(jwtPayload, 'context.end_at') ?? '';

        if (!startAt || !endAt) {
            return null;
        }

        return (<Text style = { styles.msgText }>
            {
                `${getLocalizedDateFormatter(startAt)
                    .format('h:mm')} - ${getLocalizedDateFormatter(endAt)
                    .format('h:mm A')}`
            }
        </Text>);
    }

    _getDuration() {
        const { jwtPayload, t } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at');
        const endAt = _.get(jwtPayload, 'context.end_at');
        const treatmentDuration = _.get(jwtPayload, 'context.treatment_duration');
        let duration;

        if (treatmentDuration) {
            duration = Number(treatmentDuration) / 60;
        }

        if (startAt && endAt && !treatmentDuration) {
            const ms = getLocalizedDateFormatter(endAt)
                .valueOf() - getLocalizedDateFormatter(startAt)
                .valueOf();

            duration = moment.duration(ms).asMinutes();
        }

        if (!duration) {
            return null;
        }

        return (<Text style = { styles.msgText }>
            {
                t('janeWaitingArea.minutes', { duration })
            }
        </Text>);
    }

    _getBtnText() {
        const { participantType, t } = this.props;

        return participantType === 'StaffMember' ? t('janeWaitingArea.admitClient') : t('janeWaitingArea.begin');
    }

    _return() {
        const { jwtPayload, jwt } = this.props;
        const leaveWaitingAreaUrl = _.get(jwtPayload, 'context.leave_waiting_area_url') ?? '';

        sendAnalytics(
            createWaitingAreaPageEvent('return.button', {
                event: 'clicked'
            }));
        updateParticipantReadyStatus('left', jwt);
        Linking.openURL(leaveWaitingAreaUrl);
    }

    _parseJsonMessage(string) {
        try {
            return string && JSON.parse(string) && JSON.parse(string).message;
        } catch (e) {
            return null;
        }
    }

    _onMessageUpdate(event) {
        const { updateRemoteParticipantsStatusesAction, setJaneWaitingAreaAuthStateAction } = this.props;
        const webViewEvent = this._parseJsonMessage(event.nativeEvent.data);
        const remoteParticipantsStatuses = (webViewEvent && webViewEvent.remoteParticipantsStatuses) || null;

        webViewEvent && console.log(webViewEvent, 'incoming web view event');

        if (remoteParticipantsStatuses) {
            updateRemoteParticipantsStatusesAction(remoteParticipantsStatuses);
        }

        if (webViewEvent && webViewEvent.error) {
            sendAnalytics(
                createWaitingAreaPageEvent('webview.error', {
                    error: webViewEvent.error
                }));
            if (webViewEvent.error.error === 'Signature has expired') {
                setJaneWaitingAreaAuthStateAction('failed');
            } else {
                this._joinConference();
            }
        }
    }

    render() {
        const {
            participantType,
            jwtPayload,
            locationURL,
            localParticipantCanJoin,
            authState,
            t
        } = this.props;

        return (<View style = { styles.janeWaitingAreaContainer }>
            <View style = { styles.janeWaitingAreaDialogBoxWrapper }>
                <View style = { styles.janeWaitingAreaDialogBoxInnerWrapper }>
                    <View style = { styles.logoWrapper }>
                        <Image
                            source = { require('../../../../../images/jane_logo_72.png') }
                            style = { styles.logo } />
                    </View>
                    <View style = { styles.messageWrapper }>
                        {
                            <DialogTitleHeader
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType }
                                t = { t } />
                        }
                        {
                            <DialogTitleMsg
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType }
                                t = { t } />
                        }
                        <View style = { styles.infoDetailContainer }>
                            <Text style = { [ styles.msgText, styles.boldText ] }>
                                {
                                    jwtPayload && jwtPayload.context && jwtPayload.context.treatment
                                }
                            </Text>
                            <Text style = { [ styles.msgText, styles.boldText ] }>
                                {
                                    jwtPayload && jwtPayload.context && jwtPayload.context.practitioner_name
                                }
                            </Text>
                            {
                                this._getStartDate()
                            }
                            {
                                this._getStartTimeAndEndTime()
                            }
                            {
                                this._getDuration()
                            }
                        </View>
                    </View>
                </View>
                {
                    participantType === 'StaffMember' && <View style = { styles.actionButtonWrapper }>
                        {
                            authState !== 'failed'
                        && <ActionButton
                            containerStyle = { styles.joinButtonContainer }
                            disabled = { !localParticipantCanJoin }
                            onPress = { this._joinConference }
                            title = { this._getBtnText() }
                            titleStyle = { styles.joinButtonText } />
                        }
                        {
                            authState === 'failed'
                        && <ActionButton
                            onPress = { this._return }
                            title = { t('janeWaitingArea.returnToSchedule') } />
                        }
                    </View>
                }
                {
                    participantType === 'Patient' && authState === 'failed'
                    && <View style = { styles.actionButtonWrapper }>
                        <ActionButton
                            onPress = { this._return }
                            title = { t('janeWaitingArea.returnToAccount') } />
                    </View>
                }
            </View>
            {/* <SocketWebView*/}
            {/*    fetchRoomStatus = { this.fetchRoomStatus.bind(this) }*/}
            {/*    locationURL = { locationURL }*/}
            {/*    onError = { this._webviewOnError }*/}
            {/*    onMessageUpdate = { this._onMessageUpdate } />*/}
            <SocketConnection />
        </View>);

    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = (jwt && jwtDecode(jwt)) || null;
    const participant = getLocalParticipantFromJwt(state);
    const participantType = getLocalParticipantType(state);
    const { locationURL } = state['features/base/connection'];
    const { remoteParticipantsStatuses, authState } = state['features/jane-waiting-area'];
    const localParticipantCanJoin = checkLocalParticipantCanJoin(state);

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        locationURL,
        remoteParticipantsStatuses,
        authState,
        localParticipantCanJoin
    };
}

const mapDispatchToProps = {
    startConferenceAction: startConference,
    enableJaneWaitingAreaAction: enableJaneWaitingArea,
    updateRemoteParticipantsStatusesAction: updateRemoteParticipantsStatuses,
    setJaneWaitingAreaAuthStateAction: setJaneWaitingAreaAuthState
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(DialogBox));

const DialogTitleHeader = (props: DialogTitleProps) => {
    const { participantType, authState, localParticipantCanJoin, t } = props;
    const tokenExpiredHeader = t('janeWaitingArea.authenticationExpired');
    let header;

    if (participantType === 'StaffMember') {
        if (localParticipantCanJoin) {
            header = t('janeWaitingArea.patientIsReady');
        } else {
            header = t('janeWaitingArea.waitClient');
        }
    } else {
        header = t('janeWaitingArea.waitPractitioner');
    }

    return (<Text
        style = { styles.title }>{ authState === 'failed' ? tokenExpiredHeader : header }</Text>);
};

const DialogTitleMsg = (props: DialogTitleProps) => {
    const { authState, localParticipantCanJoin, participantType, t } = props;
    const isStaffMember = participantType === 'StaffMember';

    if (authState === 'failed') {
        return null;
    }

    if (localParticipantCanJoin && isStaffMember) {
        return (<Text style = { styles.titleMsg }>
            {
                t('janeWaitingArea.whenYouAreReady')}
            }
        </Text>);
    }

    return <>
        <Text
            style = { styles.titleMsg }>
            {
                t('janeWaitingArea.keepAppOpen')
            }
        </Text>
        <Text
            style = { styles.titleMsg }>
            {
                t('janeWaitingArea.testYourDevice')
            }
        </Text>
        {
            !isStaffMember && <Text
                style = { styles.titleMsg }>
                {
                    t('janeWaitingArea.callWillBegin')
                }
            </Text>
        }
    </>;
};
