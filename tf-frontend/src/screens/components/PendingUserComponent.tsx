import { View, Text, Image, FlatList, TouchableOpacity, Alert, Platform } from 'react-native'
import React from 'react'
import { styles } from './style'
import images from '../../constants/images'
import { GlobalStyles } from '../../style/GlobalStyles'
import { ms, mvs } from 'react-native-size-matters'
import { COLORS, SIZES } from '../../style/theme'
import moment from 'moment'
import { dateTimeFormat } from '../../services/utils'
import { bookingStatusEnums, bookingType } from '../../constants/enums'
import Icons from 'react-native-vector-icons/MaterialCommunityIcons'

type Props = {
    data?: any,
    bookType: string,
    handleDeleteBooking?: (booking, item, index) => void
}

const PendingUserComponent = ({ data, bookType, handleDeleteBooking }: Props) => {
    // console.log('data PendingUserComponent >>>', JSON.stringify(data))


    const canCancelBooking = (bookingTime: any) => {
        const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
        const currentDateTime = moment(); // Get current time
        const hoursDifference = bookingDateTime.diff(currentDateTime, 'hours'); // Get difference in hours
        // console.log('hoursDifference', hoursDifference)
        return hoursDifference < 24;
    };

    const handleCancelBooking = (item: any, index: any, booking: any) => {

        // Alert.alert("Booking Alert", "Booking cannot be cancelled as the ETA of artist is less than 24 hours.")

        if (canCancelBooking(item?.bookingTime)) {
            Alert.alert("Booking Alert", "Booking cannot be cancelled as the ETA of artist is less than 24 hours.")
        } else {
            //   setSelectedItem(item)
            //   setSelectedIndex(index)
            Alert.alert(
                "Booking Alert",
                // "You will be charged as the cancellation deadline has passed. Do you still wish to cancel?",
                "If you cancel the appointment only 50% of your booking amount will be refunded. Are you sure you want to cancel the booking ?",
                [
                    {
                        text: "No",
                        onPress: () => console.log("No Pressed"),
                        style: "cancel",
                    },
                    {
                        text: "Yes",
                        onPress: () => handleDeleteBooking(booking, item, index),

                    },
                ],
                { cancelable: false }
            );
        }
    }


    const returnAmt = (item, booking) => {
        const bookingFee = item?.bookingType == "now" ? 35  : 0
        // const travelFee = Math.ceil(parseInt(item?.travelFee)/booking?.bookingItems?.length)||0
        const travelFee = parseInt(item?.travelFee) || 0
        // const travelFee = parseInt(item?.travelFee)/booking?.bookingItems?.length||0

        return (parseInt(item?.price) * parseInt(item?.quantity)) +
            (parseInt(item?.addOnAmount || 0) * parseInt(item?.quantity)) +
            (parseInt(item?.longHairAmount || 0) * parseInt(item?.quantity)) +
            travelFee + bookingFee
    }

    const virtualDateFormat = (item: any) => {

        // Format date (ISO format preserved)
        const formattedDate = moment(item.training_date, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

        // Format time
        const formattedTime = moment(item.training_time, 'HH:mm:ss').format('hh:mm a');

        return dateTimeFormat(`${formattedDate}, ${formattedTime}`)

    }

    const CheckBookingTime = (bookingTime) => {
        const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
        const currentDateTime = moment(); // Get current time
        const minsDifference = bookingDateTime.diff(currentDateTime, 'minutes'); // Get difference in hours
        return minsDifference < 11
    };


    const BookingCard = ({ booking, item, index }) => {
        return (
            <View key={`${index}`} style={styles.cardOuterContainer} >
                {/* shortHair.jpeg */}
                <View style={[styles.cardContainer, {
                    backgroundColor: COLORS.white,
                    width: SIZES.cardWidth - ms(10), height: ms(115)
                }]} >
                    <View style={[GlobalStyles.rowCenterSpaceBetween, {
                        width: '100%',
                        height: '100%', borderBottomLeftRadius: 10,
                    }]} >
                        <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '100%' }]} >
                            <Image source={{ uri: item?.imageUrl }} style={styles.bookingImg} resizeMode='contain' />
                            <View style={{ flex: 1, alignSelf: 'flex-start', paddingVertical: mvs(5), paddingHorizontal: ms(10) }} >
                                <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                                    <Text style={[GlobalStyles.txtSB14Dark, {}]} >{item?.serviceName}<Text style={[GlobalStyles.txtM12Dark, {}]} >{parseInt(item?.addOnAmount)>0?" (Styling Blowout)":""}</Text></Text>
                                    <Text style={[GlobalStyles.txtSB14Dark, {}]} >${returnAmt(item, booking)}</Text>
                                </View>

                                <Text style={[GlobalStyles.txtSB14Dark, {
                                    color: item.artist == 'Silver'
                                        ? '#939393'
                                        : item.artist == 'Gold'
                                            ? '#ee9313'
                                            : item.artist == 'Elite'
                                                ? 'black'
                                                : '#304cc0', marginTop: 5
                                }]} >{item.artist?.toUpperCase()}</Text>

                                <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: 5 }]} >
                                    <View style={[GlobalStyles.rowCenter, {}]} >
                                        <Image
                                            source={images.calendar}
                                            style={{ width: 14, height: 14, alignSelf: 'center' }}
                                        />
                                        <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{dateTimeFormat(item?.bookingTime)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                    </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleCancelBooking(item, index, booking)}>
                    {/* <CommonSvg.deleteBooking /> */}
                    <Icons name='close' size={25} color={COLORS.red} />
                </TouchableOpacity>
            </View>
        )
    }


    const VirtualCard = ({ item, index }) => {
        return (
            <View key={`${index}`} style={styles.cardContainer} >

                <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '100%' }]} >
                    <Image source={{ uri: item?.imgUrl }} style={styles.bookingImg} resizeMode='contain' />
                    <View style={{ flex: 1, alignSelf: 'flex-start', paddingVertical: mvs(5), paddingHorizontal: ms(10) }} >
                        <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >{item?.service_name}</Text>
                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >${item.price}</Text>
                        </View>

                        <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: 5 }]} >
                            <View style={[GlobalStyles.rowCenter, {}]} >
                                <Image
                                    source={images.calendar}
                                    style={{ width: 14, height: 14, alignSelf: 'center' }}
                                />
                                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{virtualDateFormat(item)}</Text>
                            </View>
                        </View>
                    </View>

                </View>

            </View>
        )
    }



    // console.log("Pending >>>",data?.sort((a, b) =>
    //                     moment(b.createdAt, 'YYYY-MM-DD, hh:mm A').diff(
    //                         moment(a.createdAt, 'YYYY-MM-DD, hh:mm A'),
    //                     ),
    //                 ))

    if (bookType == bookingType.VIRTUAL) {

        return (

            <>

                <FlatList
                    data={data}
                    keyExtractor={(item, index) => `virtual-${index}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{}}
                    ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
                        <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
                    </View>}
                    renderItem={({ item: booking, index }) => {
                        return (
                            <>
                                <VirtualCard item={booking} index={index} />
                            </>
                        )
                    }}
                />

            </>
        )

    } else {
        return (

            <>

                <FlatList
                    data={data?.sort((a, b) =>
                        moment(b.updatedAt, 'YYYY-MM-DD, hh:mm A').diff(
                            moment(a.updatedAt, 'YYYY-MM-DD, hh:mm A'),
                        ),
                    )?.filter((b: any) => (b.status == bookingStatusEnums.CONFIRMED)&& b.totalAmount > b.amountPaid)
                        // )
                    }
                    keyExtractor={(item) => `upcoming-${item.id}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{}}
                    ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
                        <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
                    </View>}
                    renderItem={({ item: booking, index }) => {
                        return (
                            <>

                                {booking.bookingItems.map(item => {
                                    if (item?.serviceId) {
                                        return (
                                            <BookingCard
                                                booking={booking}
                                                item={item}
                                                index={index}></BookingCard>
                                        )
                                    } else {
                                        return null
                                    }
                                })}
                                {/* {booking.cartData?.later.map(item => (
                              <BookingCard
                                booking={booking}
                                item={item}
                                index={index}></BookingCard>
                            ))} */}
                            </>
                        )
                    }}
                />
                {/* {
                  data&&  data.sort((a, b) =>
                            moment(b.createdAt, 'YYYY-MM-DD, hh:mm A').diff(
                                moment(a.createdAt, 'YYYY-MM-DD, hh:mm A'),
                            ),
                        ).map((booking, index) => (
                            <>
    
                                {booking.cartData?.now.map(item => (
                                    <BookingCard
                                        booking={booking}
                                        item={item}
                                        index={index}></BookingCard>
                                ))}
                                {booking.cartData?.later.map(item => (
                                    <BookingCard
                                        booking={booking}
                                        item={item}
                                        index={index}></BookingCard>
                                ))}
                            </>
                        ))
                } */}

            </>


        )
    }

}

export default PendingUserComponent