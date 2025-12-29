import { Image, ImageSourcePropType, ImageStyle, ImageURISource, Modal, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import React, { useState } from 'react'
import { ms, mvs } from 'react-native-size-matters';
// import { COLORS, SIZES } from 'styles/theme';
import Video from 'react-native-video';
import Icons from 'react-native-vector-icons/AntDesign'
import { COLORS, SIZES } from '../style/theme';

type Props = {
    containerStyle?: StyleProp<ViewStyle>;
    videoStyle?: StyleProp<ImageStyle>;
    vedioUrl?: string,
    visibleFunction?: () => void
    visible?: Boolean
}

const CustomVideoView: React.FC<Props> = ({
    containerStyle,
    videoStyle,
    vedioUrl,
    visibleFunction,
    visible
}) => {

    const [modalVisible, setModalVisible] = useState(visible)

    const handleClose = () => {
        setModalVisible(false)
        visibleFunction()
    }

    return (

        <Modal
            visible={modalVisible}
            transparent={true}
            onRequestClose={() => {
                handleClose()
            }}
        >

            <View style={[StyleSheet.absoluteFillObject, styles.container,]}>

                {
                    vedioUrl != null ?
                        <Video
                            source={{ uri: vedioUrl }}
                            paused={false}
                            style={{ width: '100%', height: "100%" }}
                            controls={true} // Show playback controls
                            resizeMode="contain"
                        />
                        :
                      <>
                      </>
                }

                <View style={{ position: 'absolute', top: mvs(30), right: ms(20) }} >
                    <TouchableOpacity onPress={handleClose}>
                        <Icons name='close' size={25} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

            </View>

        </Modal>
    )
}

export default CustomVideoView

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,1)',
        //backgroundColor: BG,
    },
    imageStyle: {
        height: ms(30),
        width: ms(35),
        borderRadius: SIZES.radius,
        resizeMode: 'cover',
        // tintColor: COLORS.lightWhite
    }
})