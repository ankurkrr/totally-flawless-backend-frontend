import { View, Text, TouchableOpacity, Image, Linking } from 'react-native'
import React, { useState } from 'react'
import ReactNativeModal from 'react-native-modal'
import Icons from 'react-native-vector-icons/AntDesign'
import { COLORS, SIZES } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import { styles } from './style'
import { GlobalStyles } from '../../style/GlobalStyles'
import images from '../../constants/images'
import moment from 'moment'
import { asynchEnums, bookingStatusEnums } from '../../constants/enums'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Props = {
    visible: boolean,
    visibleFunction: (visible: boolean) => void,
    onSelect?: (selected: string) => void
    cartItems: any
    orderReqData: any
}

const NewBookingRequestModal = ({ visible, visibleFunction, cartItems, onSelect, orderReqData }: Props) => {

    const [modalVisible, setModalVisible] = useState<any>(visible);

    const handleClose = () => {
        visibleFunction(false)
        setModalVisible(false)
        onSelect(bookingStatusEnums.DECLINED)
    }

    const handleBackDropClose = async () => {
        visibleFunction(false)
        setModalVisible(false)
        await AsyncStorage.removeItem(asynchEnums.ORDER_DATA)
    }

    // const userDetails=bookingDataObj && bookingDataObj?.userDetails;
    // const useraddressDetails=bookingDataObj &&bookingDataObj?.useraddressDetails;
    // const bookingDetails=bookingDataObj &&bookingDataObj?.bookingDetails;
    // const cartDetails=bookingDataObj &&bookingDataObj?.cartDetails[0];


    const returnItemAmount = (item: any) => {

        return (parseInt(item?.price) * item?.quantity) + (parseInt(item?.longHairAmount || 0) * item?.quantity) + (parseInt(item?.addOnAmount || 0) * item?.quantity)

    }



    const returnTotalAmount = () => {
        let amount = 0;
        cartItems?.map(item => {
            amount += returnItemAmount(item)
        })
        return amount + parseInt(orderReqData?.bookingFee) + parseInt(orderReqData?.artistDetails?.travelFee)
    }

    const handleMapRedirect = () => {

        if (orderReqData?.useraddressDetails?.geocode) {
            Linking.openURL(`https://www.google.com/maps?q=${orderReqData?.useraddressDetails?.geocode}`)
        } else {
            const query = `${orderReqData?.useraddressDetails?.street}+${orderReqData?.useraddressDetails?.city}+${orderReqData?.useraddressDetails?.state}+${orderReqData?.useraddressDetails?.pincode}`;
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)
        }

    }

    return (
        <ReactNativeModal
            isVisible={modalVisible}
            //  swipeDirection={"down"}
            backdropOpacity={1}
            backdropColor={'rgba(0,0,0,0.5)'}
            // onBackdropPress={handleBackDropClose}
            //  onSwipeComplete={handleClose}
            avoidKeyboard={true}
        >
            <View style={[styles.modalContainer]}>

                <View style={{ ...styles.modalInnerContainer, width: SIZES.cardWidth, paddingVertical: mvs(0), }} >

                    <View style={styles.closeView} >
                        <TouchableOpacity onPress={handleClose}>
                            <Icons name='closecircleo' size={22} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.selectTenantView} >
                        <Text style={GlobalStyles.txtM14White} >New Booking Request</Text>
                    </View>

                    {/* Profile view */}
                    <View style={{ marginTop: mvs(50), ...GlobalStyles.rowCenterSpaceBetween, }} >
                        <View style={[GlobalStyles.rowCenter, {}]} >
                            {/* <Image source={{ uri: orderReqData?.userDetails?.profileImage }} style={styles.profileImg} /> */}
                            <View style={{ marginLeft: ms(15) }} >
                                <Text style={[GlobalStyles.txtL14Dark, {}]} >Client: <Text style={[GlobalStyles.txtSB14Dark, {}]} >{orderReqData?.userDetails?.firstName} {orderReqData?.userDetails?.lastName || ""}</Text></Text>
                            </View>
                        </View>

                        {/* <View /> */}
                    </View>

                    {/* Booking info */}
                    {
                        cartItems?.map((item) => {
                            return (
                                <View style={{ paddingHorizontal: ms(15), marginTop: mvs(10) }} >
                                    <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                                        <View style={GlobalStyles.rowCenter} >
                                            <Image source={{ uri: item?.imageUrl }} style={styles.serviceImg} resizeMode='contain' />
                                            <Text style={[GlobalStyles.txtM14Dark, { marginLeft: ms(10) }]} >{item?.name}<Text style={[GlobalStyles.txtSB14Dark, {
                                                color: item?.artist == 'Silver'
                                                    ? '#939393'
                                                    : item?.artist == 'Gold'
                                                        ? '#ee9313'
                                                        : item?.artist == 'Elite'
                                                            ? 'black'
                                                            : '#304cc0'
                                            }]} > {item?.artist?.toUpperCase()}</Text></Text>
                                        </View>
                                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >${returnItemAmount(item)}</Text>
                                    </View>
                                    {
                                        parseInt(item?.addOnAmount) > 0 &&
                                        <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(10),  }]}  >
                                            <Text style={[GlobalStyles.txtM14Dark, {}]} >Add on styling blowout</Text>
                                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >${parseInt(item.addOnAmount)*item.quantity}</Text>
                                        </View>
                                    }
                                </View>
                            )
                        })
                    }
                    {
                        orderReqData?.bookingFee != 0 &&
                        <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(10), paddingHorizontal: ms(15) }]}  >
                            <Text style={[GlobalStyles.txtM14Dark, {}]} >Booking Fee</Text>
                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >${parseInt(orderReqData?.bookingFee)}</Text>
                        </View>
                    }
                    


                    <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(10), paddingHorizontal: ms(15) }]}  >
                        <Text style={[GlobalStyles.txtM14Dark, {}]} >Travel Fee</Text>
                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >${parseInt(orderReqData?.artistDetails?.travelFee) || 0}</Text>
                    </View>

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(10), paddingHorizontal: ms(15) }]}  >
                        <Text style={[GlobalStyles.txtM14Dark, {}]} >Booking Total</Text>
                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >${returnTotalAmount()}</Text>
                    </View>

                    <View style={{ marginTop: mvs(10), ...GlobalStyles.rowCenterSpaceBetween, paddingHorizontal: ms(15) }} >
                        <TouchableOpacity style={[GlobalStyles.rowCenter, { width: '55%' }]} onPress={handleMapRedirect}>
                            <Image source={images.location} style={styles.locationImg} tintColor={"blue"} />
                            <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5), color: "blue" }]} numberOfLines={3}>{orderReqData?.useraddressDetails?.street},{orderReqData?.useraddressDetails?.city},{orderReqData?.useraddressDetails?.state},{orderReqData?.useraddressDetails?.pincode}
                            </Text>
                        </TouchableOpacity>
                        <View style={[GlobalStyles.rowCenter, { width: '35%', alignSelf: 'center' }]} >
                            <Image
                                source={images.calendar}
                                style={{ width: 14, height: 14, marginRight: 5 }}
                            />
                            <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5) }]} >{moment(orderReqData?.cartDetails?.bookingTime, "YYYY-MM-DD, hh:mm a").format("DD MMM, hh:mm a")}</Text>
                        </View>
                    </View>

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { marginVertical: mvs(10), width: '70%', alignSelf: 'center', marginTop: mvs(15) }]} >

                        <TouchableOpacity style={[GlobalStyles.button, {}]} onPress={() => onSelect(bookingStatusEnums.ACCEPTED)}>
                            <Text style={[GlobalStyles.btnWhiteTxt, {}]} >Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[GlobalStyles.button, { backgroundColor: COLORS.transparent }]} onPress={() => onSelect(bookingStatusEnums.DECLINED)}>
                            <Text style={[GlobalStyles.btnDarkTxt, {}]} >Decline</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </ReactNativeModal>
    )
}

export default NewBookingRequestModal