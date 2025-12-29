import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { COLORS, SIZES } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import { GlobalStyles } from '../../style/GlobalStyles'
import { styles } from './style'
import images from '../../constants/images'
import moment from 'moment'
import { bookingStatusEnums } from '../../constants/enums'

type Props = {
    data: any,
    handleChangeBookingStatus?: (item: any, status: string) => void
}


const PendingComponent = ({ data, handleChangeBookingStatus }: Props) => {

    // console.log('data', JSON.stringify(data))


    const returnAddress = (booking: any) => {
        // console.log('booking', booking)
        return `${booking?.address?.street} ${booking?.address?.city} ${booking?.address?.state}`
    }


    const BookingCard = ({ booking, item }) => {
        return (
            <View style={styles.cardContainer} >
                <View style={{ paddingHorizontal: ms(15), ...GlobalStyles.rowCenterSpaceBetween, }} >
                    <Image source={{ uri: booking?.user_profileImage || item?.imageUrl }} style={styles.profileImg} />
                    <View>
                        <Text style={[GlobalStyles.txtL14Dark, {}]} >Client:<Text style={[GlobalStyles.txtSB14Dark, {}]} >{booking?.user_firstName + " " + booking?.user_lastName}</Text></Text>
                    </View>
                    <View />
                </View>

                <View style={styles.whiteStrip} />

                <View style={{ paddingHorizontal: ms(15) }} >
                    <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                        <Text style={[GlobalStyles.txtM14Dark, {}]} >{item?.name}<Text style={[GlobalStyles.txtSB14Dark, {
                            color: item.artist == 'Silver'
                                ? '#939393'
                                : item.artist == 'Gold'
                                    ? '#ee9313'
                                    : item.artist == 'Elite'
                                        ? 'black'
                                        : '#304cc0'
                        }]} > {item?.artist}</Text></Text>
                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >${item?.price}</Text>
                    </View>
                    <View style={{ marginTop: mvs(10), ...GlobalStyles.rowCenterSpaceBetween, }} >
                        <View style={[GlobalStyles.rowCenter, { width: '50%' }]} >
                            <Image source={images.location} style={[styles.locationImg, { alignSelf: 'flex-start' }]} />
                            <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5) }]} >{returnAddress(booking?.cartData)}</Text>
                        </View>
                        <View style={[GlobalStyles.rowCenter, { alignSelf: 'flex-start' }]} >
                            <Image
                                source={images.calendar}
                                style={{ width: 14, height: 14, marginRight: 5 }}
                            />
                            <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5) }]} >{moment(item?.bookingTime, "YYYY-MM-DD, hh:mm a").format("DD MMM YY, hh:mm A")}</Text>
                        </View>
                    </View>

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '70%', alignSelf: 'center', marginTop: mvs(15) }]} >

                        <TouchableOpacity style={[GlobalStyles.button, {}]} onPress={() => handleChangeBookingStatus(booking, bookingStatusEnums.ACCEPTED)}>
                            <Text style={[GlobalStyles.btnWhiteTxt, {}]} >Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleChangeBookingStatus(booking, bookingStatusEnums.CANCELLED)} style={[GlobalStyles.button, { backgroundColor: COLORS.transparent }]} >
                            <Text style={[GlobalStyles.btnDarkTxt, {}]} >Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        )
    }

    return (

        <>

            <FlatList
                data={data?.sort((a, b) =>
                    moment(b.createdAt, 'YYYY-MM-DD, hh:mm A').diff(
                        moment(a.createdAt, 'YYYY-MM-DD, hh:mm A'),
                    ),
                ).filter((b: any) => b.status == bookingStatusEnums.CONFIRMED) || []}
                keyExtractor={(item) => `upcoming-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{}}
                ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
                    <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
                </View>}
                renderItem={({ item: booking, index }) => {
                    return (
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
                    )
                }}
            />
            {/* {
              data &&  data.sort((a, b) =>
                        moment(b.createdAt, 'YYYY-MM-DD, hh:mm A').diff(
                            moment(a.createdAt, 'YYYY-MM-DD, hh:mm A'),
                        ),
                    ).filter((b: any) => b.status == bookingStatusEnums.CONFIRMED).map((booking, index) => (
                        <>

                            {booking.cartData?.now.map((item:any) => (
                                <BookingCard
                                    booking={booking}
                                    item={item}
                                    index={index}></BookingCard>
                            ))}
                            {booking.cartData?.later.map((item:any) => (
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



export default PendingComponent