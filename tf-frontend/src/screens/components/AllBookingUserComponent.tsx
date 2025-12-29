import { View, Text, Image, TouchableOpacity, ScrollView, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { styles } from './style'
import images from '../../constants/images'
import { GlobalStyles } from '../../style/GlobalStyles'
import { ms, mvs } from 'react-native-size-matters'
import { COLORS } from '../../style/theme'
import { dateTimeFormat } from '../../services/utils'
import { bookingType } from '../../constants/enums'

type Props = {
    data?: any,
    isPayNowDisabled?: boolean,
    handleSelectedBooking?: (type: string) => void
    handlePayNow?: (booking: any) => void
}

const AllBookingUserComponent = ({ data, handleSelectedBooking, handlePayNow, isPayNowDisabled = false }: Props) => {


    const [bookingData, setBookingData] = useState<any[]>([])

    // console.log('data >>>>', data)

    useEffect(() => {

        if (data[0]?.hasOwnProperty("later_cart_count")) {
            if(data[2]){
                const temp: any[] = [];
                temp.push(data[1])
                temp.push(data[0])
                temp.push(data[2])
                // console.log('temp data[2] >>>>', temp)
                setBookingData(temp)
            }else{
                const temp: any[] = [data[1], data[0]];
                console.log('temp >>>>', temp)
                setBookingData(temp)
            }
           
        } else {
            setBookingData(data)
        }

    }, [data])

    const isPaid = () => {
        return bookingData[1]?.later_total_unpaid_amount != 0 && bookingData[1]?.later_total_unpaid_amount != null
    }



    // console.log('AllBookingUserComponent >>>', data)

    // [{"later_cart_count": 4, "later_total_amount": 947, "latest_later_booking_time": "2025-01-07T09:41:35.000Z", 
    //     "subcategory_names": ["Short hair", "Medium hair", "Long hair", "Textured Hair", "Soft Glam", "Natural Glam"], "total_later_booking_count": 3, 
    //     "user_id": "5f4de70b-7860-46e9-aacb-22427f7773b8"}, {"latest_now_booking_time": "2025-01-09T10:13:59.000Z", "now_cart_count": 6, "now_total_amount": 2965, "subcategory_names": ["Short hair", "Medium hair", "Long hair", "Textured Hair", "Soft Glam", "Natural Glam"], "total_now_booking_count": 5, "user_id": "5f4de70b-7860-46e9-aacb-22427f7773b8"}]

    return (
        <View style={{ marginTop: mvs(10) }} >
            
            {
                bookingData ?
                    <>
                    {/* Immediate */}
                        <TouchableOpacity
                            onPress={() => handleSelectedBooking(bookingType.NOW)}
                            style={[styles.cardContainer, {}]} >
                            <View style={[GlobalStyles.rowCenter, { alignSelf: 'flex-start' }]} >
                                <View style={styles.imgContainer} >
                                    {/* <Image source={images.flaw_booking} style={styles.allBookImg} /> */}
                                    <Image
                                        source={images.logoFinal}
                                        // source={require('../../assets/logo1.jpg')} 
                                        style={[styles.allBookImg]} />
                                </View>

                                <View style={{ flex: 1, alignSelf: 'flex-start', padding: mvs(10) }} >
                                    <View style={{ ...GlobalStyles.rowCenterSpaceBetween, }} >
                                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >Immediate Booking</Text>
                                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >${bookingData[0]?.now_total_paid_amount || 0}</Text>
                                    </View>

                                    {
                                        bookingData[0]?.latest_now_booking_time ?
                                            <View style={[GlobalStyles.rowCenter, { marginVertical: mvs(5) }]} >
                                                <Image
                                                    source={images.calendar}
                                                    style={{ width: 14, height: 14, alignSelf: 'center' }}
                                                />
                                                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{dateTimeFormat(bookingData[0]?.latest_now_booking_time)}</Text>
                                            </View>
                                            :
                                            <View style={[GlobalStyles.rowCenter, { marginVertical: mvs(5) }]} >
                                                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >No Immediate bookings.</Text>
                                            </View>
                                    }

                                    <FlatList
                                        data={bookingData[0]?.subcategory_names}
                                        keyExtractor={(item) => `${item}`}
                                        showsVerticalScrollIndicator={false}
                                        numColumns={2}
                                        contentContainerStyle={{}}
                                        renderItem={({ item, index }) => {
                                            return <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >{item}{bookingData[0]?.subcategory_names[index+1]?",":""}</Text>
                                        }}
                                    />
                                    {/* <ScrollView style={{flexWrap:'nowrap'}} horizontal >
                                {
                                    bookingData[1]?.subcategory_names?.map(item => {
                                        return (
                                            <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >{item}</Text>
                                        )
                                    })
                                }
                        </ScrollView> */}

                                    {/* </View> */}
                                </View>

                            </View>


                        </TouchableOpacity>

                        {/* Future */}
                        <View style={[styles.cardContainer, {}]} >
                            <TouchableOpacity
                                onPress={() => handleSelectedBooking(bookingType.LATER)} style={[GlobalStyles.rowCenter, { alignSelf: 'flex-start' }]} >
                                <View style={styles.imgContainer} >
                                    {/* <Image source={images.flaw_booking} style={styles.allBookImg} /> */}
                                    <Image
                                        source={images.logoFinal}  style={[styles.allBookImg]} />
                                </View>

                                <View style={{ flex: 1, alignSelf: 'flex-start', paddingTop: mvs(10), paddingHorizontal: mvs(10) }} >
                                    <View style={{ ...GlobalStyles.rowCenterSpaceBetween, }} >
                                        <View style={{ alignSelf: 'flex-start' }} >
                                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >Future Booking</Text>
                                        </View>
                                        <View>
                                            <Text style={[GlobalStyles.txtSB14Dark, { lineHeight: ms(16) }]} >${bookingData[1]?.later_total_unpaid_amount || 0}</Text>
                                            {
                                                isPaid() &&
                                                <Text style={[GlobalStyles.txtL10Dark, { color: COLORS.yellow }]} >Unpaid</Text>
                                            }
                                        </View>
                                    </View>

                                    {
                                        bookingData[1]?.latest_later_booking_time ?
                                            <View style={[GlobalStyles.rowCenter, { marginBottom: mvs(5) }]} >
                                                <Image
                                                    source={images.calendar}
                                                    style={{ width: 14, height: 14, alignSelf: 'center' }}
                                                />
                                                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{dateTimeFormat(bookingData[1]?.latest_later_booking_time)}</Text>
                                            </View>
                                            :
                                            <View style={[GlobalStyles.rowCenter, { marginVertical: mvs(5) }]} >
                                                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >No Future bookings.</Text>
                                            </View>
                                    }

                                    {/* <View style={[GlobalStyles.rowCenter, {}]} >
                    <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >Long Hair Cut, Nail Design, Makeup...</Text>
                </View> */}
                                    <FlatList
                                        data={bookingData[1]?.subcategory_names}
                                        keyExtractor={(item) => `${item}`}
                                        showsVerticalScrollIndicator={false}
                                        numColumns={2}
                                        contentContainerStyle={{}}
                                        renderItem={({ item, index }) => {
                                            return <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >{item}{bookingData[1]?.subcategory_names[index+1]?",":""}</Text>
                                        }}
                                    />


                                </View>

                            </TouchableOpacity>
                            <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(5), width: '100%', padding: 10 }]} >
                                <View />
                                {
                                    isPaid() &&
                                    <TouchableOpacity
                                        disabled={isPayNowDisabled}
                                        style={[GlobalStyles.buttonWithoutBorder, styles.doneBtn, { marginBottom: mvs(0), height: ms(30), width: ms(80), }]}
                                        onPress={() => handlePayNow(bookingData[1])}>
                                        <Text style={[GlobalStyles.txtM14Dark, {}]} >Pay Now</Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        </View>

                        {/* virual trainig */}
                        {/* <View style={[styles.cardContainer, {}]} >
                            <TouchableOpacity
                                onPress={() => handleSelectedBooking(bookingType.VIRTUAL)} style={[GlobalStyles.rowCenter, { alignSelf: 'flex-start' }]} >
                                <View style={styles.imgContainer} >
                                    <Image
                                        source={images.logoFinal}  style={[styles.allBookImg]} />
                                </View>

                                <View style={{ flex: 1, alignSelf: 'flex-start', paddingTop: mvs(10), paddingHorizontal: mvs(10) }} >
                                    <View style={{ ...GlobalStyles.rowCenterSpaceBetween, }} >
                                        <View style={{ alignSelf: 'flex-start' }} >
                                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >Virtual Training</Text>
                                        </View>
                                        <View>
                                            <Text style={[GlobalStyles.txtSB14Dark, { lineHeight: ms(16) }]} ></Text>
                                           
                                        </View>
                                    </View>

                                    {
                                        bookingData[2]?.latest_booking_date_time ?
                                            <View style={[GlobalStyles.rowCenter, { marginBottom: mvs(5) }]} >
                                                <Image
                                                    source={images.calendar}
                                                    style={{ width: 14, height: 14, alignSelf: 'center' }}
                                                />
                                                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{dateTimeFormat(bookingData[2]?.latest_booking_date_time)}</Text>
                                            </View>
                                            :
                                            <View style={[GlobalStyles.rowCenter, { marginVertical: mvs(5) }]} >
                                                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >No Virtual training bookings.</Text>
                                            </View>
                                    }

                                   
                                    <FlatList
                                        data={bookingData[2]?.subcategory_names}
                                        keyExtractor={(item) => `${item}`}
                                        showsVerticalScrollIndicator={false}
                                        numColumns={2}
                                        contentContainerStyle={{}}
                                        renderItem={({ item, index }) => {
                                            return <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >{item}{bookingData[2]?.subcategory_names[index+1]?",":""}</Text>
                                        }}
                                    />


                                </View>

                            </TouchableOpacity>
                            <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(5), width: '100%', padding: 10 }]} >
                                <View />
                                
                            </View>
                        </View> */}


                    </>
                    :
                    <>
                        <TouchableOpacity
                            onPress={() => handleSelectedBooking(bookingType.NOW)}
                            style={[styles.cardContainer, {}]} >
                            <View style={[GlobalStyles.rowCenter, { alignSelf: 'flex-start' }]} >
                            <View style={styles.imgContainer} >
                                    {/* <Image source={images.flaw_booking} style={styles.allBookImg} /> */}
                                    <Image
                                        source={images.logoFinal} style={[styles.allBookImg]} />
                                </View>

                                <View style={{ flex: 1, alignSelf: 'flex-start', padding: mvs(10) }} >
                                    <View style={{ ...GlobalStyles.rowCenterSpaceBetween, }} >
                                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >Immediate Booking</Text>
                                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >$0</Text>
                                    </View>

                                    <View style={[GlobalStyles.rowCenter, { marginVertical: mvs(5) }]} >
                                        {/* <Image
                               source={images.calendar}
                               style={{ width: 14, height: 14, alignSelf: 'center' }}
                           />
                           <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{dateTimeFormat(bookingData[1]?.latest_booking_time)}</Text> */}
                                    </View>

                                    {/* <FlatList
                           bookingData={bookingData[1]?.subcategory_names}
                           keyExtractor={(item) => `${item}`}
                           showsVerticalScrollIndicator={false}
                           numColumns={3}
                           contentContainerStyle={{}}
                           renderItem={({ item, index }) => {
                               return <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >{item},</Text>
                           }}
                       /> */}
                                    {/* <ScrollView style={{flexWrap:'nowrap'}} horizontal >
                               {
                                   bookingData[1]?.subcategory_names?.map(item => {
                                       return (
                                           <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >{item}</Text>
                                       )
                                   })
                               }
                       </ScrollView> */}

                                    {/* </View> */}
                                </View>

                            </View>


                        </TouchableOpacity>

                        {/* Future */}
                        <TouchableOpacity
                            onPress={() => handleSelectedBooking(bookingType.LATER)}
                            style={[styles.cardContainer, {}]} >
                            <View style={[GlobalStyles.rowCenter, { alignSelf: 'flex-start' }]} >
                            <View style={styles.imgContainer} >
                                    {/* <Image source={images.flaw_booking} style={styles.allBookImg} /> */}
                                    <Image
                                        source={images.logoFinal} style={[styles.allBookImg]} />
                                </View>

                                <View style={{ flex: 1, alignSelf: 'flex-start', padding: mvs(10) }} >
                                    <View style={{ ...GlobalStyles.rowCenterSpaceBetween, }} >
                                        <View style={{ alignSelf: 'flex-start' }} >
                                            <Text style={[GlobalStyles.txtSB14Dark, {}]} >Future Booking</Text>
                                        </View>
                                        <View>
                                            <Text style={[GlobalStyles.txtSB14Dark, { lineHeight: ms(16) }]} >$0</Text>
                                            {/* <Text style={[GlobalStyles.txtL10Dark, { color: COLORS.yellow }]} >Unpaid</Text> */}
                                        </View>
                                    </View>

                                    <View style={[GlobalStyles.rowCenter, { marginBottom: mvs(5) }]} >
                                        {/* <Image
                               source={images.calendar}
                               style={{ width: 14, height: 14, alignSelf: 'center' }}
                           />
                           <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{dateTimeFormat(bookingData[0]?.latest_booking_time)}</Text> */}
                                    </View>
                                    {/* <View style={[GlobalStyles.rowCenter, {}]} >
                   <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >Long Hair Cut, Nail Design, Makeup...</Text>
               </View> */}
                                    {/* <FlatList
                           bookingData={bookingData[0]?.subcategory_names}
                           keyExtractor={(item) => `${item}`}
                           showsVerticalScrollIndicator={false}
                           numColumns={3}
                           contentContainerStyle={{}}
                           renderItem={({ item, index }) => {
                               return <Text style={[GlobalStyles.txtR12Dark, { marginLeft: ms(5) }]} >{item},</Text>
                           }}
                       /> */}

                                    <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(5) }]} >
                                        <View />
                                        {/* <TouchableOpacity style={[GlobalStyles.buttonWithoutBorder,
                           styles.doneBtn, { marginBottom: mvs(0), height: ms(30), width: ms(80), }]} onPress={() => null}>
                               <Text style={[GlobalStyles.txtM14Dark, {}]} >Pay Now</Text>
                           </TouchableOpacity> */}
                                    </View>

                                </View>

                            </View>


                        </TouchableOpacity>
                    </>
            }

        </View >

    )
}

export default AllBookingUserComponent
