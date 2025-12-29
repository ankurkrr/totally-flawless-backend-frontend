import { View, Text, ScrollView, TouchableOpacity, Platform, PermissionsAndroid, RefreshControl } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import TopBar from '../../components/TopBar'
import ArtistBottomBar from '../../components/ArtistBottomBar'
import { useRoute } from '@react-navigation/native'
import screenNames from '../../constants/screenNames'
import NewBookingRequestModal from './NewBookingRequestModal'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axiosInstance from '../../services/axiosInterceptor'
import { GlobalStyles } from '../../style/GlobalStyles'
import { COLORS, SIZES } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import DeviceInfo from 'react-native-device-info'
import { styles } from './style'
import { asynchEnums, bookingStatusEnums } from '../../constants/enums'
import { showToast } from '../../components/Toast'
import { useDispatch, useSelector } from 'react-redux'
import { IS_ORDER } from '../../store/allactionsTypes'
import { Loader } from '../components'
import moment from 'moment'
import UserContext from '../UserContext'
import CustomStarRating from '../../components/CustomStarRating'
import Geolocation from '@react-native-community/geolocation';

type Props = {}

Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'auto',
});

// Notifications are proxied to backend; client must not generate service-account JWTs.

const ArtistHome = ({ navigation }) => {

    const routes = useRoute();

    const [requestBookingModal, setRequestBookingModal] = useState(false)
    const [bookingDataObj, setBookingDataObj] = useState<any>({})
    const [requestTimer, setRequestTimer] = useState(0)
    const [loading, setLoading] = useState(false)
    const [count, setCount] = useState({
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0
    })
    const { isOrderReceived } = useSelector(state => state.AppReducer);
    const { user, updateUser } = useContext(UserContext);
    const dispatch = useDispatch();
    // const {guestUser = true} = routes.params;
    const [requestOrderData, setRequestOrderData] = useState<any>({})

    const [cartItems, setCartItems] = useState<any[]>([])
    const [rating, setRating] = useState(0)
    const [artistData, setArtistData] = useState<any>({})
    const intervalRef = useRef(null);



    useEffect(() => {
        checkApplicationPermission()
    }, []);


    useEffect(() => {

        const subscribe = navigation.addListener('focus', () => {

            getRequestModal()
            updateFcmToken()
            getData();
            // setTimeout(() => {
            //     updateArtistLocation()
            // }, 2000);
        })

        return () => {
            subscribe;
        }
    }, [])

    useEffect(() => {

        const subscribe = setTimeout(async () => {
            if (requestTimer == 0) {
                setRequestTimer(0);
                setRequestBookingModal(false)
                dispatch({ type: IS_ORDER, payload: false });
                await AsyncStorage.removeItem(asynchEnums.ORDER_DATA);
                // PushNotification.cancelAllLocalNotifications();
            } else {
                setRequestTimer(prev => { return prev - 1 });
            }
        }, 1000);

        return () => {
            clearTimeout(subscribe)
        }

    }, [requestTimer])

    useEffect(() => {
        // Start interval when component mounts
        intervalRef.current = setInterval(() => {
            updateArtistLocation();
        }, 7000);

        // Clear interval when component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);


    const updateArtistLocation = async () => {

        try {

            const geo = await Geolocation.getCurrentPosition(async (location) => {
                const id = await AsyncStorage.getItem("id");

                const request = {
                    "artist_id": id,
                    "latitude": location?.coords?.latitude,
                    "longitude": location?.coords?.longitude,
                    //FIXME:
                    // "latitude": 18.7632075,
                    // "longitude": 73.8613203,
                }

                console.log(' updateArtistLocation request>>>>', request)

                const response = await axiosInstance.post(`/update/artist/location`, request)
                console.log('updateArtistLocation response?.data >>>>', response?.data)

            },
                err => {

                    console.warn("getPermissionLocation==>", err);
                },
                { enableHighAccuracy: true, timeout: 20000 },
            )

        } catch (error) {
            console.log('error', error)
        }
    }

    useEffect(() => {
        // console.log('isOrderReceived >>>', isOrderReceived)
        if (isOrderReceived) {
            setTimeout(() => {
                getRequestModal()
            }, 1000);
        }
    }, [isOrderReceived])


    const getRequestModal = async () => {

        const temp = await AsyncStorage.getItem(asynchEnums.ORDER_DATA);
        const data = temp && JSON.parse(temp);
        console.log('data >>>', data);

        if (data) {
            const response = await axiosInstance.get(`/get-userdetails?userId=${data?.cartDetails?.userId}`);
            const userData = response.data.data[0];

            const addrResponse = await axiosInstance.get(`/get-addresses?userId=${data?.cartDetails?.userId}`);
            console.log('addrResponse >>>', addrResponse?.data?.data)
            const userAddressData = addrResponse.data.data?.filter(a => a.id == data?.cartDetails?.addressId)[0];

            console.log('userAddressData >>>', userAddressData)

            // const tempItems: any[] = [];

            // data?.cartDetails?.now && data?.cartDetails?.now?.map((item: any) => {
            //     tempItems?.push(item)
            // })
            // data?.cartDetails?.later && data?.cartDetails?.later?.map((item: any) => {
            //     tempItems?.push(item)
            // })

            const addData = { userDetails: userData, useraddressDetails: userAddressData, ...data }

            if (addData?.userDetails == undefined) {
                return
            }
            setRequestOrderData(addData)
            console.log('Final req order data >>>>', addData)
            setCartItems(data?.cartItems)
            setRequestBookingModal(true)
            setRequestTimer(20)
        }


        // const bookingId="143a6095-2c2d-4c71-bfed-2334e68405da"
        // const bookingId = data?.bookingDetails?.id
        // if (data) {
        //     const response = await axiosInstance.get(`/booking?bookingId=${bookingId}`)
        //     console.log('response?.data', response?.data)
        //     setBookingDataObj(response?.data)
        //     if (response?.data?.bookingDetails?.status == "pending") {
        //         setRequestBookingModal(true)
        //         setRequestTimer(2000)
        //     }

        // }

    }

    const checkApplicationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                // await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            } catch (error) {
            }
        }
    }

    const updateFcmToken = async () => {
        try {

            const id = await AsyncStorage.getItem("id");
            const fcmToken = await AsyncStorage.getItem("fcmToken");
            console.log('fcmToken Artist >>>', fcmToken);

            if (!fcmToken) {


                // await requestUserPermission();
                const fcmToken = await AsyncStorage.getItem("fcmToken");
                const request = {
                    "userId": id,
                    "deviceId": Platform.OS == "ios" ? DeviceInfo.getDeviceId() : await DeviceInfo.getAndroidId(),
                    "deviceType": Platform.OS,
                    "deviceToken": fcmToken
                }

                console.log('request updateFcmToken >>>', request)
                const response = await axiosInstance.post(`/manageDevice`, request);
                console.log('response?.data', response?.data)

                // setTimeout(() => {
                //     updateFcmToken();

                // }, 1000);
                // return

            } else {

                const request = {
                    "userId": id,
                    "deviceId": Platform.OS == "ios" ? DeviceInfo.getDeviceId() : await DeviceInfo.getAndroidId(),
                    "deviceType": Platform.OS,
                    "deviceToken": fcmToken
                }

                console.log('request updateFcmToken >>>', request)
                const response = await axiosInstance.post(`/manageDevice`, request);
                console.log('response?.data', response?.data)
            }

        } catch (error) {

        }

    }


    const getData = async () => {

        try {

            const id = await AsyncStorage.getItem('id');

            const response = await axiosInstance.get(`/get-artistdetails?artistId=${id}`);
            const data = response?.data?.data || "";
            updateUser({
                firstName: data.firstName,
                lastName: data.lastName,
                profileImage: data?.profileImage,
                email: data.email,
                isAvailable: data.isAvailable == 1 ? true : false,
                userType: 'Artist',
            });
            setRating(Math.ceil(data?.average_rating) || 0)
            setArtistData(data)
            console.log('/get-artistdetails >>>>', data)

            // calculate Count

            const [upcomingData, completedData, cancelledData] = await Promise.all([
                getBookingsByStatusAndType(bookingStatusEnums.CONFIRMED, ""),
                getBookingsByStatusAndType(bookingStatusEnums.COMPLETED, ""),
                getBookingsByStatusAndType(bookingStatusEnums.CANCELLED, "")
            ])

            // const uCount = upcomingData && upcomingData.filter((b: any) =>
            //     b.status == bookingStatusEnums.CONFIRMED && !isBookingTimePassedForOngoing(b?.bookingitemData?.bookingTime)
            // ).length

            // const oCount = upcomingData && upcomingData.filter((b: any) =>
            //     b.status == bookingStatusEnums.CONFIRMED && b.totalAmount == b.amountPaid && isBookingTimePassedForOngoing(b?.bookingitemData?.bookingTime)
            // ).length

            // const cCount = completedData && completedData.filter((b: any) =>
            //     b.status == bookingStatusEnums.COMPLETED
            // ).length

            // const canCount = cancelledData && cancelledData.filter((b: any) =>
            //     b.status == bookingStatusEnums.CANCELLED
            // ).length

            const uCount = upcomingData?.filter((b: any) =>
                b.status == bookingStatusEnums.CONFIRMED &&
                !isBookingTimePassedForOngoing(b?.bookingitemData?.bookingTime)
            ).reduce((total: number, booking: any) =>
                total + (booking?.bookingitemData?.later?.length || 0) + (booking?.bookingitemData?.now?.length || 0)
                , 0);

            const oCount = upcomingData?.filter((b: any) =>
                b.status == bookingStatusEnums.CONFIRMED &&
                b.totalAmount <= b.amountPaid &&
                isBookingTimePassedForOngoing(b?.bookingitemData?.bookingTime)
            ).reduce((total: number, booking: any) =>
                total + (booking?.bookingitemData?.later?.length || 0) + (booking?.bookingitemData?.now?.length || 0)
                , 0);

            const cCount = completedData?.reduce((total: number, booking: any) =>
                total + (booking?.bookingitemData?.later?.length || 0) + (booking?.bookingitemData?.now?.length || 0)
                , 0);

            const canCount = cancelledData?.filter((b: any) =>
                b.status == bookingStatusEnums.CANCELLED
            ).reduce((total: number, booking: any) =>
                total + (booking?.bookingitemData?.later?.length || 0) + (booking?.bookingitemData?.now?.length || 0)
                , 0);

            const temp = { ...count };
            temp.upcoming = uCount || 0;
            temp.ongoing = oCount || 0;
            temp.completed = cCount || 0;
            temp.cancelled = canCount || 0;
            setCount(temp)

        } catch (error) {
            console.log('error', error)
        }

    }

    const isBookingTimePassedForOngoing = (bookingTime: any) => {
        const bookingMoment = moment(bookingTime, "YYYY-MM-DD, hh:mm A");
        const now = moment();

        // Compare bookingTime with the current time
        if (bookingMoment.isBefore(now)) {
            // console.log("The booking time has passed.");
            return true;
        } else {
            // console.log("The booking time is in the future.");
            return false;
        }
    }

    const getBookingsByStatusAndType = async (status: any, type?: any) => {
        try {
            const id = await AsyncStorage.getItem("id");
            console.log('getBookingsByStatusAndType >>>', `/get-artistbooking?artistId=${id}&bookingitemstatus=${status}`)
            const response = await axiosInstance.get(`/get-artistbooking?artistId=${id}&bookingitemstatus=${status}`)
            //  console.log('response', response)
            if (response?.status == 200) {
                return response?.data?.data || []
            } else {
                return []
            }
        } catch (error) {

        }
    }

    const changeNavigation = page => {
        console.log('Hello>>>', page);
        navigation.navigate(page);
    };

    const handleBookingRequestAcceptAndCancelled = async (type: string) => {
        try {


            const acceptedArtistCount = await handleSendNotificationToUser();

            if (acceptedArtistCount == requestOrderData?.artistBookingCount) {
                showToast("Taken by another artist. Better luck next time!")
                await AsyncStorage.removeItem(asynchEnums.ORDER_DATA)
                setRequestBookingModal(false)
                // setBookingDataObj({})
                setRequestTimer(0)
                setLoading(false)
                dispatch({ type: IS_ORDER, payload: false });
                return
            }


            setLoading(true)

            const id = await AsyncStorage.getItem("id");

            const cartitemids = cartItems?.map((item) => {
                const travelFee = parseFloat(parseInt(requestOrderData?.artistDetails?.travelFee) / cartItems.length).toFixed(2) || 0;
                return {
                    "id": item?.Id,
                    "qty": item?.quantity,
                    "travelFee": `${travelFee}`,
                    "status": type
                }
            })
            const request = {
                "artistId": id,
                cartitemid: cartitemids
                // "bookingId": bookingDataObj?.bookingDetails?.id,
                // "cartitemid": cartitemids,
                // "status": type
            }

            console.log('handleChangeBookingStatus request >>>', request)
            const response = await axiosInstance.post(`/booking-accept-declined-by-arttist`, request);
            console.log('handleChangeBookingStatus response?.data >>>>', response.status)
            if (response?.status == 200) {

                if (type == bookingStatusEnums.ACCEPTED) {
                    //for sending user notification
                    const acceptedArtistCount = await handleSendNotificationToUser();

                    if (acceptedArtistCount == requestOrderData?.artistBookingCount) {
                        sendUserNotification()
                    }
                }

            }
            //

            await AsyncStorage.removeItem(asynchEnums.ORDER_DATA)
            setRequestBookingModal(false)
            // setBookingDataObj({})
            setRequestTimer(0)
            dispatch({ type: IS_ORDER, payload: false });
            if (type == bookingStatusEnums.ACCEPTED) {
                showToast("Booking request accepted successfully")
            } else if (type == bookingStatusEnums.DECLINED) {
                showToast("Booking request declined successfully")
            }

            // setTimeout(() => {
            //     setRequestOrderData({})
            // }, 20000);

            // setTimeout(() => {
            //     getData()
            // }, 10000);
            setLoading(false)
        } catch (error) {
            setLoading(false)
            showToast(`${error}`)
            console.error('error', error)
        }
    }


    const handleSendNotificationToUser = async () => {
        let acceptedArtist = 0;
        const userId = requestOrderData?.cartDetails?.userId;
        const userCartId = cartItems[0]?.cartId;
        const businessTypes = [3, 2, 1];

        for (const businessType of businessTypes) {
            try {
                const url = `/usertoartistlocation?userId=${userId}&userCartId=${userCartId}&businessType=${businessType}`;
                const userOrderResponse = await axiosInstance.get(url);

                if (userOrderResponse?.status !== 404) {
                    acceptedArtist += userOrderResponse?.data?.acceptedArtists?.length || 0;
                    // break;
                }
            } catch (error) {
                if (error?.response?.status !== 404) {
                    console.error("Error fetching user order:", error);
                }
            }
        }

        console.log('acceptedArtist user artist>>>', acceptedArtist)

        return acceptedArtist;  // Return the final count
    };


    const sendUserNotification = async () => {
        const receiver = requestOrderData?.userToken;
        if (!receiver) return;

        const sendData = {
            cartId: cartItems[0]?.cartId || "jkasdfkj",
            userType: "Client"
        }
        console.log('sendData sendUserNotification >>>>>', sendData)
        const requestData = { customData: JSON.stringify(sendData) }

        try {
            const resp = await axiosInstance.post('/send-notification', {
                receiver,
                title: "Your booking has been accepted by TF App Artist!",
                body: "Tap to open app and place order",
                data: requestData
            });
            console.log('sendUserNotification response >>>', resp?.data)
        } catch (err) {
            console.error('sendUserNotification error >>>', err)
        }
    }



    return (
        <View style={{ backgroundColor: '#FFF', flex: 1 }}>
            <TopBar navigation={navigation} />
            <Loader loading={loading} />
            <View style={{ flexGrow: 1, backgroundColor: '#FFF' }}>
                <ScrollView style={{ backgroundColor: 'white' }}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={getData}
                        />
                    }
                    contentContainerStyle={{ paddingTop: mvs(20) }}
                    showsVerticalScrollIndicator={false}>

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth, alignSelf: 'center' }]} >

                        <TouchableOpacity style={styles.homeCountContainer}
                            onPress={() => navigation.navigate(screenNames.ARTIST_BOOKING, { index: 0 })}
                            testID="artistUpcoming"
                            nativeID="artistUpcoming"
                            accessibilityLabel="artistUpcoming">
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Upcoming</Text>
                            <Text style={[GlobalStyles.txtSB16Dark, { fontSize: ms(30) }]} >{count.upcoming}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.homeCountContainer}
                            onPress={() => navigation.navigate(screenNames.ARTIST_BOOKING, { index: 1 })}
                            testID="artistOngoing"
                            nativeID="artistOngoing"
                            accessibilityLabel="artistOngoing">
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Ongoing</Text>
                            <Text style={[GlobalStyles.txtSB16Dark, { fontSize: ms(30) }]} >{count.ongoing}</Text>
                        </TouchableOpacity>

                    </View>
                    <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth, alignSelf: 'center', marginTop: mvs(20) }]} >

                        <TouchableOpacity style={styles.homeCountContainer}
                            onPress={() => navigation.navigate(screenNames.ARTIST_BOOKING, { index: 2 })}
                            testID="artistCompleted"
                            nativeID="artistCompleted"
                            accessibilityLabel="artistCompleted"
                        >
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Completed</Text>
                            <Text style={[GlobalStyles.txtSB16Dark, { fontSize: ms(30) }]} >{count.completed}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.homeCountContainer}
                            onPress={() => navigation.navigate(screenNames.ARTIST_BOOKING, { index: 3 })}
                            testID="artistCancelled"
                            nativeID="artistCancelled"
                            accessibilityLabel="artistCancelled"
                        >
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Cancelled</Text>
                            <Text style={[GlobalStyles.txtSB16Dark, { fontSize: ms(30) }]} >{count.cancelled}</Text>
                        </TouchableOpacity>

                    </View>

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth, alignSelf: 'center', marginTop: mvs(20) }]} >

                        <View style={styles.homeCountContainer} >
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Total Earnings</Text>
                            <Text style={[GlobalStyles.txtSB16Dark, { fontSize: ms(30) }]}
                                adjustsFontSizeToFit numberOfLines={1}>${artistData?.totalEarning || 0}</Text>
                        </View>

                        <View style={styles.homeCountContainer} >
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Total Gratuity</Text>
                            <Text style={[GlobalStyles.txtSB16Dark, { fontSize: ms(30) }]}
                                adjustsFontSizeToFit numberOfLines={1}>${parseInt(artistData?.total_gratuity) || 0}</Text>
                        </View>

                    </View>

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth, alignSelf: 'center', marginTop: mvs(20) }]} >

                        <View style={{ ...styles.homeCountContainer, width: '100%', alignItems: 'center', }} >
                            <Text style={[GlobalStyles.txtM16Dark, {}]} >Average Rating</Text>

                            <View style={{ ...GlobalStyles.rowCenter, marginTop: mvs(10) }} >
                                <CustomStarRating
                                    rate={rating}
                                    disabled
                                    starSize={30}
                                    containerStyle={{ padding: 0, width: ms(160) }}
                                    starColor={COLORS.yellow}
                                    handleRate={(star) => {
                                        // setRating(star)
                                    }}
                                />
                                <View style={{ marginLeft: ms(10), justifyContent: 'center', marginTop: 5 }} >
                                    <Text style={[GlobalStyles.txtR12Dark, { fontSize: ms(14) }]} >{rating} out of 5</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    {/* <TouchableOpacity style={[GlobalStyles.button, { marginTop: mvs(50) }]} onPress={handleNotification} >
                        <Text style={[GlobalStyles.txtM14Dark, { color: COLORS.white }]} >SEND</Text>
                    </TouchableOpacity> */}

                </ScrollView>
            </View>

            <ArtistBottomBar navigation={changeNavigation} page={screenNames.ARTIST_HOME} />

            {
                requestBookingModal &&
                <NewBookingRequestModal
                    visible={requestBookingModal}
                    cartItems={cartItems}
                    orderReqData={requestOrderData}
                    onSelect={(type) => {
                        console.log('type >>>>', type)
                        handleBookingRequestAcceptAndCancelled(type)
                    }}
                    visibleFunction={() => {
                        setRequestBookingModal(false)
                    }}
                />
            }

        </View>
    )
}


export default ArtistHome