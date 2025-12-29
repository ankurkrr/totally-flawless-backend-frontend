import { View, Text, Image, FlatList } from 'react-native'
import React from 'react'
import { styles } from './style'
import images from '../../constants/images'
import { GlobalStyles } from '../../style/GlobalStyles'
import { ms, mvs } from 'react-native-size-matters'
import { COLORS } from '../../style/theme'
import moment from 'moment'
import { dateTimeFormat } from '../../services/utils'
import { bookingStatusEnums, bookingType } from '../../constants/enums'

type Props = {
    data?: any,
    bookType: string
}

const CancelledUserComponent = ({ data, bookType }: Props) => {
    // console.log('data PendingUserComponent >>>', JSON.stringify(data))


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


    const BookingCard = ({ booking, item, index }) => {
        return (
            <View key={`${index}`} style={styles.cardContainer} >
                {/* shortHair.jpeg */}

                <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '100%' }]} >
                    <Image source={{ uri: item?.imageUrl }} style={styles.bookingImg} resizeMode='contain' />
                    <View style={{ flex: 1, alignSelf: 'flex-start', paddingVertical: mvs(5), paddingHorizontal: ms(10) }} >
                        <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >{item?.serviceName}</Text>
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
        )
    }


    const VirtualCard = ({ item, index }) => {
        return (
            <View key={`${index}`} style={styles.cardContainer} >

                <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '100%' }]} >
                    <Image source={{ uri: item?.imgUrl }} style={styles.bookingImg} resizeMode='contain' />
                    <View style={{ flex: 1, alignSelf: 'flex-start', paddingVertical: mvs(5), paddingHorizontal: ms(10) }} >
                        <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >{item?.service_name}<Text style={[GlobalStyles.txtM12Dark, {}]} >{parseInt(item?.addOnAmount)>0?" (Styling Blowout)":""}</Text></Text>
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
                    keyExtractor={(item,index) => `virtual-${index}`}
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
                    )?.filter((b: any) => (b.status == bookingStatusEnums.CANCELLED))
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

                                {booking.bookingItems.map(item => (
                                    <BookingCard
                                        booking={booking}
                                        item={item}
                                        index={index}></BookingCard>
                                ))}
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

export default CancelledUserComponent