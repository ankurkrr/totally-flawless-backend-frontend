import { View, Text, Dimensions } from 'react-native'
import React from 'react'
import { COLORS } from '../style/theme';
import Entypo from 'react-native-vector-icons/Entypo'
import { mvs } from 'react-native-size-matters';
import { GlobalStyles } from '../style/GlobalStyles';

type Props = {}


const { height, width } = Dimensions.get('window');

const CommonPhotoClick = (props: Props) => {
    return (
        <View style={{
            height: height * 0.14,
            width: height * 0.14,
            borderRadius: height * 0.7, backgroundColor:'#E8E8E8', alignItems: 'center', paddingTop: mvs(20)
        }} >
            <Entypo name='camera' size={30} color={COLORS.greyTxt} />
            <Text style={[GlobalStyles.txtM12Dark, { paddingTop: mvs(10) }]} >Take a picture</Text>
        </View>
    )
}

export default CommonPhotoClick