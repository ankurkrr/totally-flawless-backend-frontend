import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native'
import React, { useState } from 'react'
import { styles } from './style'
import { COLORS, SIZES } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import { GlobalStyles } from '../../style/GlobalStyles'
import ReactNativeModal from 'react-native-modal'
import Icons from 'react-native-vector-icons/AntDesign'
import moment from 'moment'

type Props = {
    visible: boolean,
    data?: any,
    imageData?: any,
    visibleFunction: (visible: boolean) => void,
    onSelect?: (selected: string) => void
}

const ArtistProfileData = ({ visible, visibleFunction, data, imageData, onSelect }: Props) => {

    const [modalVisible, setModalVisible] = useState<any>(visible);

    const handleClose = () => {
        visibleFunction(false)
        setModalVisible(false)
    }

    return (
        <ReactNativeModal
            isVisible={modalVisible}
            //  swipeDirection={"down"}
            backdropOpacity={1}
            backdropColor={'rgba(0,0,0,0.5)'}
            onBackdropPress={handleClose}

        //  onSwipeComplete={handleClose}
        // avoidKeyboard={true}
        >
            <View style={[styles.modalContainer]}>

                <View style={{ ...styles.modalInnerContainer, width: SIZES.cardWidth, paddingVertical: mvs(0), }} >

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { paddingHorizontal: ms(20), paddingVertical: mvs(15) }]} >
                        <View />
                        <View>
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Artist Information</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <Icons name='close' size={22} color={COLORS.darkTxt} />
                        </TouchableOpacity>
                    </View>

                    <View style={[GlobalStyles.rowCenter, { marginLeft: ms(20) }]} >
                        <Image source={{ uri: data?.profileImage }} style={{ height: 60, width: 60, borderRadius: 40 }} />
                        <View style={{ marginLeft: ms(20), alignSelf: 'flex-start' }} >
                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >{data?.firstName} {data?.lastName}</Text>
                            <Text style={[GlobalStyles.txtL12Dark, {}]} >{moment(data?.createdDate).format("MMM YYYY")}</Text>
                        </View>
                    </View>

                    <View style={[ { marginLeft: ms(20), marginTop: mvs(20) }]} >
                        <Text style={[GlobalStyles.txtM14Dark, {}]} >Portfolio</Text>

                        <View style={{  }} >
                            <FlatList
                                data={imageData }
                                keyExtractor={(item,index) => `${index}`}
                                numColumns={3}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{marginBottom:mvs(20)}}
                                renderItem={({ item, index }) => {
                                    return(
                                        <TouchableOpacity
                                        key={index}
                                        onPress={()=>onSelect(item)}
                                        style={{
                                            padding: 10,
                                        }}>
                                        <Image
                                            source={{ uri: item }}
                                            style={{
                                                height: 90,
                                                width: 90,
                                                borderRadius: 4,
                                                backgroundColor:COLORS.greyTxt
                                            }}
                                        />
                                    </TouchableOpacity>
                                    )
                                   
                                }}
                            />
                        </View>

                    </View>

                </View>

            </View>
        </ReactNativeModal>
    )
}

export default ArtistProfileData