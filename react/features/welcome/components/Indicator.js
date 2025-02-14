// @flow
/* eslint-disable react-native/no-inline-styles */
import _ from 'lodash';
import React from 'react';
import { View } from 'react-native';

import { sizeHelper } from '../../base/styles';
import { ColorPalette } from '../../base/styles/components/styles';


type Props = {
    count: number,
    currentIndex: number,
};

const styles = {
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%'
    },
    indicator: {
        width: sizeHelper.getDpByHeight(11),
        height: sizeHelper.getDpByHeight(11),
        backgroundColor: ColorPalette.jane,
        marginRight: sizeHelper.getDpByWidth(7),
        borderRadius: 40
    }
};

export const Indicator = (props: Props) => {
    if (!props.count) {
        return null;
    }

    return (<View
        style = { styles.indicatorContainer }>
        {
            _.times(props.count, index => (<View
                key = { index }
                style = {{
                    ...styles.indicator,
                    opacity: index === props.currentIndex ? 1 : 0.28
                }} />))
        }
    </View>);
};
