import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { COLORS, SIZES } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import { GlobalStyles } from '../../style/GlobalStyles'
import { styles } from './style'
import images from '../../constants/images'
import { bookingStatusEnums } from '../../constants/enums'
import moment from 'moment'

type Props = {
    data: any,
    type?: string,
    handleChangeBookingStatus?: (item: any, status: string, booking: any) => void
    handleServiceImageOpen?: (image: any) => void
}



const OngoingAndUpcomingComponent = ({ data, type, handleChangeBookingStatus, handleServiceImageOpen }: Props) => {

    // console.log('OngoingAndUpcomingComponent data>>>', JSON.stringify(data))

    const [ongoingData, setOngoingData] = useState<any[]>([])

    // console.log('ongoingData >>>>', JSON.stringify(data))


    useEffect(() => {

        const temp = data?.sort((a, b) =>
            moment(b.updatedAt, 'YYYY-MM-DD, hh:mm A').diff(
                moment(a.updatedAt, 'YYYY-MM-DD, hh:mm A'),
            ),
        )?.filter((b: any) => b.status == bookingStatusEnums.CONFIRMED
            && b.totalAmount <= b.amountPaid
        ) || []

        console.log('temp >>>>>', JSON.stringify(temp))

        setOngoingData(temp)

    }, [data])



    const returnAddress = (booking: any): string => {
        const { street = "", city = "", state = "" } = booking?.address || {};

        return street || city || state ? `${street} ${city} ${state}`.trim() : "";
    };

    const returnAmount = (item: any, booking: any) => {
        // console.log('item', JSON.stringify(item))
        // console.log('booking', JSON.stringify(booking))
        const bookingFee = item?.bookingType == "now" ? 35 / booking?.bookingitemData?.now?.length : 0
        // const travelFee = parseInt(item?.travelFee)/
        // (booking?.bookingitemData?.now?.length==0?
        //     booking?.bookingitemData?.later?.length:booking?.bookingitemData?.now?.length)||0
        const travelFee = parseInt(item?.travelFee) || 0

        // console.log('bookingFee', bookingFee)
        return item?.price * item?.quantity +
            (parseInt(item?.longHairAmount || 0) * item?.quantity) +
            (parseInt(item?.addOnAmount || 0) * item?.quantity) +
            travelFee + bookingFee
    }

    const BookingCard = ({ booking, item }) => {
        return (
            <View style={styles.cardContainer} >
                <View style={{ paddingHorizontal: ms(15), ...GlobalStyles.rowCenter }} >
                    <Image source={{ uri: booking?.user_profileImage || item?.imageUrl }} style={styles.profileImg} />
                    <View style={{ marginLeft: ms(15) }} >
                        <Text style={[GlobalStyles.txtL14Dark, {}]} ><Text style={[GlobalStyles.txtSB14Dark, {}]} >{booking?.user_firstName + " " + booking?.user_lastName}</Text></Text>
                    </View>
                    <View />
                </View>

                <View style={styles.whiteStrip} />

                <View style={{ paddingHorizontal: ms(15) }} >
                    <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                        <View style={[GlobalStyles.rowCenter, {}]} >
                            <TouchableOpacity onPress={() => handleServiceImageOpen(item?.imageUrl)}>
                                <Image source={{ uri: item?.imageUrl }} style={styles.serviceImg} resizeMode='contain' />
                            </TouchableOpacity>

                            <View style={{ marginLeft: ms(10) }} >

                                <Text style={[GlobalStyles.txtM14Dark, {marginLeft:ms(3)}]} >{item?.serviceName}<Text style={[GlobalStyles.txtSB14Dark, {
                                    color: item.artist == 'Silver'
                                        ? '#939393'
                                        : item.artist == 'Gold'
                                            ? '#ee9313'
                                            : item.artist == 'Elite'
                                                ? 'black'
                                                : '#304cc0'
                                }]} > {item?.artist}</Text></Text>
                                <Text style={[GlobalStyles.txtM12Dark, {}]} >{parseInt(item?.addOnAmount) > 0 ? " (Styling Blowout)" : ""}</Text>
                            </View>
                        </View>

                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >${returnAmount(item, booking)}</Text>
                    </View>
                    <View style={{ marginTop: mvs(8) }}>
                        <Text style={[GlobalStyles.txtL14Dark, {}]} >Booking Id: <Text style={[GlobalStyles.txtM14Dark, {}]} >#{item?.booking_id?.slice(-4)}</Text></Text>
                    </View>

                    <View style={{ marginTop: mvs(10), ...GlobalStyles.rowCenterSpaceBetween, }} >
                        {
                            returnAddress(booking?.bookingitemData) ?
                                <View style={[GlobalStyles.rowCenter, { width: '50%' }]} >
                                    <Image source={images.location} style={[styles.locationImg, { alignSelf: 'flex-start' }]} />
                                    <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5) }]} >{returnAddress(booking?.bookingitemData)}</Text>
                                </View>
                                :
                                <View style={[GlobalStyles.rowCenter, { width: '50%' }]} />

                        }
                        <View style={[GlobalStyles.rowCenter, { alignSelf: 'flex-start' }]} >
                            <Image
                                source={images.calendar}
                                style={{ width: 14, height: 14, marginRight: 5 }}
                            />
                            <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5) }]} >{moment(booking.bookingitemData?.bookingTime, "YYYY-MM-DD, hh:mm a").format("DD MMM YY, hh:mm A")}</Text>
                        </View>
                    </View>

                    <View style={[{ width: '70%', alignSelf: 'center', marginTop: mvs(15) }]} >
                        <TouchableOpacity style={[GlobalStyles.button, { width: ms(150), alignSelf: 'center' }]}
                            onPress={() => handleChangeBookingStatus(item, bookingStatusEnums.COMPLETED, booking)}
                        >
                            <Text style={[GlobalStyles.btnWhiteTxt, {}]} >Mark As Complete</Text>
                        </TouchableOpacity>

                        {/* <TouchableOpacity style={[GlobalStyles.button, { backgroundColor: COLORS.transparent }]} >
                        <Text style={[GlobalStyles.btnDarkTxt, {}]} >Decline</Text>
                        </TouchableOpacity> */}
                    </View>
                </View>

            </View >
        )
    }

    const isBookingTimePassedForOngoing = (bookingTime: any) => {
        const bookingMoment = moment(bookingTime, "YYYY-MM-DD, hh:mm A");
        const now = moment();
        // console.log('bookingTime >>>>', bookingTime)
        // Compare bookingTime with the current time
        if (bookingMoment.isBefore(now)) {
            // console.log("The booking time has passed.");
            return true;
        } else {
            // console.log("The booking time is in the future.");
            return false;
        }
    }

    return (
        <>

            <FlatList
                data={ongoingData}
                keyExtractor={(item) => `upcoming-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{}}
                ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
                    <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
                </View>}
                renderItem={({ item: booking, index }) => {

                    if (isBookingTimePassedForOngoing(booking.bookingitemData?.bookingTime)) {
                        return (
                            <>
                                {booking.bookingitemData?.now?.map(item => (
                                    <BookingCard
                                        booking={booking}
                                        item={item}
                                        index={index}></BookingCard>
                                ))}
                                {booking.bookingitemData.later?.map(item => (
                                    <BookingCard
                                        booking={booking}
                                        item={item}
                                        index={index}></BookingCard>
                                ))}

                            </>
                        )
                    } else {
                        return null
                    }

                }}
            />
            {/* {
                data && data.sort((a, b) =>
                    moment(b.createdAt, 'YYYY-MM-DD, hh:mm A').diff(
                        moment(a.createdAt, 'YYYY-MM-DD, hh:mm A'),
                    ),
                ).filter((b: any) => b.status == bookingStatusEnums.ACCEPTED).map((booking, index) => (
                        <>

                            {booking.bookingitemData?.now.map((item: any) => (
                                <BookingCard
                                    booking={booking}
                                    item={item}
                                    index={index}></BookingCard>
                            ))}
                            {booking.bookingitemData?.later.map((item: any) => (
                                <BookingCard
                                    booking={booking}
                                    item={item}
                                    index={index}></BookingCard>
                            ))}
                        </>
                    ))
            } */}

        </>
        // <View style={styles.cardContainer} >
        //     <View style={{ paddingHorizontal: ms(15), ...GlobalStyles.rowCenterSpaceBetween, }} >
        //         <Image source={images.profile} style={styles.profileImg} />
        //         <View>
        //             <Text style={[GlobalStyles.txtL14Dark, {}]} >Client:<Text style={[GlobalStyles.txtSB14Dark, {}]} >{data?.client}</Text></Text>
        //         </View>
        //         <View />
        //     </View>

        //     <View style={styles.whiteStrip} />

        //     <View style={{ paddingHorizontal: ms(15) }} >
        //         <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
        //             <Text style={[GlobalStyles.txtM14Dark, {}]} >Hairstyle<Text style={[GlobalStyles.txtSB14Dark, { color: COLORS.lightGreyTxt }]} > SILVER</Text></Text>
        //             <Text style={[GlobalStyles.txtSB14Dark, {}]} >{data?.price}</Text>
        //         </View>
        //         <View style={{ marginTop: mvs(10), ...GlobalStyles.rowCenterSpaceBetween, }} >
        //             <View style={[GlobalStyles.rowCenter, {}]} >
        //                 <Image source={images.location} style={styles.locationImg} />
        //                 <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5) }]} >{data?.location}</Text>
        //             </View>
        //             <View style={[GlobalStyles.rowCenter, {}]} >
        //                 <Image
        //                     source={images.calendar}
        //                     style={{ width: 14, height: 14, marginRight: 5 }}
        //                 />
        //                 <Text style={[GlobalStyles.txtL10Dark, { marginLeft: ms(5) }]} >{data?.date}</Text>
        //             </View>
        //         </View>



        // </View>
    )
}

export default OngoingAndUpcomingComponent