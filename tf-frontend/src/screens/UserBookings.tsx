import { View, Text, Dimensions, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Platform } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { ScrollView } from 'react-native';
import { COLORS, FONTS } from '../style/theme';
import { ms, mvs } from 'react-native-size-matters';
import { GlobalStyles } from '../style/GlobalStyles';
import CommonSvg from '../components/CommonSvg';
import TopBar from '../components/TopBar';
import screenNames from '../constants/screenNames';
import BottomBar from '../components/BottomBar';
import { AddGratuityModal, AddRatingModal, AllBookingUserComponent, CancelledUserComponent, CompletedUserComponent, Loader, PendingUserComponent, UpcomingUserComponent } from './components';
import { API_URL, STRIPE_KEY } from '../store/url';
import axios from 'axios';
import axiosInstance from '../services/axiosInterceptor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingStatusEnums, bookingType } from '../constants/enums';
import { showToast } from '../components/Toast';
import { PaymentSheet, StripeProvider, usePaymentSheet } from '@stripe/stripe-react-native';
import { useSelector } from 'react-redux';
// Notification sending moved to backend; client will POST to '/send-notification'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ArtistProfileData from './components/ArtistProfileData';
import CustomImageView from '../components/CustomImageView';
import moment from 'moment';

// removed client-side firebase service account

type Props = {}

const UserBookings = ({ navigation }) => {

    const [routes] = useState([
        { key: 'all', title: 'All Booking' },
        { key: 'pending', title: 'Pending' },
        { key: 'upcoming', title: 'Upcoming' },
        { key: 'completed', title: 'Completed' },
        { key: 'cancelled', title: 'Cancelled' },
    ]);
    const [selectedParentIndex, setSelectedParentIndex] = useState(0);
    const [addGratuityModalVisible, setAddGratuityModalVisible] = useState(false)
    const [addRatingModal, setAddRatingModal] = useState(false)
    const [rate, setRate] = useState(0)
    const [childLists, setChildLists] = useState<any[]>([])
    const parentFlatListRef = useRef<FlatList>();
    const scrollViewRef = useRef<ScrollView>();
    const windowWidth = Dimensions.get('window').width;
    const [selectedBookingType, setSelectedBookingType] = useState("")
    const [loading, setLoading] = useState(false)
    const [isPayNowDisabled, setIsPayNowDisabled] = useState(false)

    const [gratuityAmount, setGratuityAmount] = useState(0)
    const [selectedBooking, setSelectedBooking] = useState<any>({})
    const [selectedBookingItem, setSelectedBookingItem] = useState<any>({})
    const [selectedBookingIndex, setSelectedBookingIndex] = useState(0)

    const [pendingBookingData, setPendingBookingData] = useState<any[]>([])

    const { initPaymentSheet, presentPaymentSheet, } = usePaymentSheet();
    const [paymentInitiated, setPaymentInitiated] = useState(false);

    const [artistProfileData, setArtistProfileData] = useState<any>({})
    const [artistImageData, setArtistImageData] = useState<any[]>([])
    const [imageVisible, setImageVisible] = useState(false);
    const [viewImgSrc, setViewImgSrc] = useState("")
    const [artistProfileVisible, setArtistProfileVisible] = useState(false);
    const [userDetail, setUserDetail] = useState(null);

    const { isGuest } = useSelector(state => state.AppReducer);

    useEffect(() => {

        // const unsubscribe = navigation.addListener('focus', () => {
        getData();

        if (Platform.OS == "ios") {
            setTimeout(() => {
                setLoading(false)
            }, 1500);
        } else {
            setTimeout(() => {
                setLoading(false)
            }, 2000);
        }

        // })

        //  return () => {
        //  unsubscribe();
        // }
    }, [])


    const getData = async () => {
        const flag = await AsyncStorage.getItem('guestUser');
        if (flag === 'true') {
            navigation?.navigate("Auth")
            return
        }
        const id = await AsyncStorage.getItem('id');
        if (id) {
            console.log(id);
            // getBookingsItems(id);
            if (Platform.OS == "android") {

                setLoading(true)
            }
            // setSelectedParentIndex(0)
            getBookingsByType("");
            getUserData();
        }
    }

    const getVirtualData = async () => {

        try {
            const id = await AsyncStorage.getItem("id")
            const request = {
                "user_id": id
            }
            const allTrainigResponse = await axiosInstance.post(`/get-training-service`, request);

            console.log('allTrainigResponse?.data >>>>', JSON.stringify(allTrainigResponse?.data))
            return allTrainigResponse?.data;
        } catch (error) {
            return []
        }


    }

    const getUserData = async () => {
        const id = await AsyncStorage.getItem('id');
        if (id) {
            await axiosInstance.get(`/get-userdetails?userId=${id}`).then((res) => {
                console.log('get user >>>>', res.data.data[0]);
                setUserDetail(res?.data?.data[0])
            }).catch((err) => {
                console.log('get user error >>>>', err);
            });
        }
    };

    const callDevice = async (payload: any) => {
        await axiosInstance.post(`/device/create/call`, payload).then((res) => {
            console.log('Device call >>>>', res.data);
            showToast("Call request sent. We’ll be calling shortly. ");
        }).catch((err) => {
            showToast("Insufficient funds. Please try after some time.")
            console.log('Device call error >>>>', err);
        });
    };

    const getAllBookingsData = async () => {

        try {
            const id = await AsyncStorage.getItem("id")
            const allBookingResponse = await axiosInstance.get(`/get-bookingtype?userId=${id}`);
            const allBookingData = allBookingResponse?.data?.data;

            console.log('allBookingData >>>>>', JSON.stringify(allBookingData));

            const temp = await getVirtualData();
            const data = temp ? temp?.data : []

            if (!data) {
                return allBookingData || []
            }

            const subcategory_names = data?.map((item: any) => {
                if (item.categoryId == 1 && item?.status == "pending") {
                    return item.service_name + " Hair";
                } else if (item.categoryId == 2 && item?.status == "pending") {
                    return item.service_name
                }
            })?.filter(Boolean)

            const sortedData = data.sort((a: any, b: any) => {
                return new Date(a.updated_at) - new Date(b.updated_at);
            });

            // Format date (ISO format preserved)
            const formattedDate = moment(sortedData[0]?.training_date, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

            // Format time
            const formattedTime = moment(sortedData[0]?.training_time, 'HH:mm:ss').format('hh:mm a');

            const obj = {
                "user_id": id,
                "latest_booking_date_time": subcategory_names?.length > 0 ? `${formattedDate}, ${formattedTime}` : "",
                "latest_booking_time": sortedData[0]?.training_time,
                "subcategory_names": subcategory_names ? [...new Set(subcategory_names)] : []
            }

            const finalData: any[] = allBookingData;
            finalData.push(obj)

            console.log('finalData All Booking final>>>', finalData)

            return finalData || []
        } catch (error) {
            console.log('error', error)
            return []
        }

    }

    const getBookingsByType = async (type: string) => {

        try {

            if (type == bookingType.VIRTUAL) {

                const allBookingData = await getAllBookingsData();

                // const id = await AsyncStorage.getItem("id")
                // const request = {
                //     "user_id": id
                // }
                // const allTrainigResponse = await axiosInstance.post(`/get-training-service`, request);

                // console.log('allTrainigResponse?.data >>>>', allTrainigResponse?.data)

                // const data = allTrainigResponse?.data?.data;

                const temp = await getVirtualData();
                const data = temp ? temp?.data : [];

                const pendingData = data?.filter((item: any) => item.status === "pending") || [];
                // const upcomingData = data?.filter((item: any) => item.status === "upcoming") || [];
                const completedData = data?.filter((item: any) => item.status === "completed") || [];
                const cancelledData = data?.filter((item: any) => item.status === "cancelled") || [];

                setLoading(false)

                setChildLists([[allBookingData], [pendingData ? pendingData : []],
                [[]], [completedData ? completedData : []], [cancelledData ? cancelledData : []]])


            } else {

                setIsPayNowDisabled(false)
                const [allBookingData, pendingData, completedData, cancelledData] = await Promise.all([
                    getAllBookingsData(),
                    getBookingsData(bookingStatusEnums.CONFIRMED, type),
                    // getBookingsData(bookingStatusEnums.CONFIRMED, type),
                    getBookingsData(bookingStatusEnums.COMPLETED, type),
                    getBookingsData(bookingStatusEnums.CANCELLED, type),
                ])
                setLoading(false)

                // console.log('pendingData >>>', JSON.stringify(pendingData))
                console.log('upcomingData >>>', JSON.stringify(pendingData))
                // console.log('completedData >>>', JSON.stringify(completedData))
                // console.log('cancelledData >>>', JSON.stringify(cancelledData))
                setPendingBookingData(pendingData)
                if (allBookingData) {
                    setChildLists([[allBookingData], [pendingData ? pendingData : []],
                    [pendingData ? pendingData : []], [completedData ? completedData : []], [cancelledData ? cancelledData : []]])
                }
            }

            // console.log('[[allBookingData[0],[pendingData],[upcomingData],[completedData]]] >>>>', [[allBookingData], [pendingData], [upcomingData], [completedData]])

        } catch (error) {
            setLoading(false)
            setChildLists([[], [], [], [], []])
            console.log('error', error)
        }
    }

    const getBookingsData = async (status: string, type: string) => {
        try {
            const id = await AsyncStorage.getItem("id")
            console.log(`/get-bookingsdata?userId=${id}&bookingitemstatus=${status}&bookingType=${type}`)
            const response = await axiosInstance.get(`/get-bookingsdata?userId=${id}&bookingitemstatus=${status}`)
            return response?.data?.data || []
        } catch (error) {
            setLoading(false);
            return []
        }
    }


    const getArtistDetails = async (id: any) => {
        try {
            if (!id) {
                return
            }
            setLoading(true)
            const response = await axiosInstance.get(`/get-artistdetails?artistId=${id}`);
            const data = response?.data?.data || "";

            console.log('getArtistDetails data >>>', data)
            const imgTemp = data?.artistData?.map((item: any) => {
                return item?.type == "image" ? item?.url : ""
            }).filter((item: any) => item != null && item !== "");
            // const repeatedImgTemp = [...imgTemp, ...imgTemp];
            setLoading(false)
            setArtistProfileData(data)
            setArtistImageData(imgTemp)
            setArtistProfileVisible(true)


        } catch (error) {

        }
    }

    const handleUpcomingDeleteData = async (data: any, item: any, index: any) => {

        try {
            console.log('item,index', data, JSON.stringify(item), index)
            const id = await AsyncStorage.getItem("id")
            const bookingId = item?.booking_id;
            const cartItemId = item?.cartitemId;
            const request = {
                "bookingId":bookingId,
                "userId":id,
                "status":bookingStatusEnums.CANCELLED,
                "bookingItemId":item?.id
            }
            // const request = {
            //     "artistId": item?.artistId,
            //     "bookingItemId": item?.id,
            //     "status": bookingStatusEnums.CANCELLED
            //   }

            console.log('request handleUpcomingDeleteData >>>', request)
            // const response = await axiosInstance.post(`/artist-bookingitem-status-change`, request);
            const response = await axiosInstance.post(`/user-cancel-booking`, request);
            console.log('handleUpcomingDeleteData response?.data >>>>', response?.data)
            if (response?.data?.status == "success") {
                getBookingsByType(selectedBookingType)
            }
            const sendData = {
                name: data?.user_firstName,
                time: item?.bookingTime
            }
            handleNotificationBookingDelete(item, sendData)
            showToast(response?.data?.message);
        } catch (error) {
            console.log('handleUpcomingDeleteData error>>', error)
        }
    }

    const handleUpcomingAddWishlistArtist = async (item: any, isAdded: boolean) => {
        try {
            const id = await AsyncStorage.getItem("id")
            console.log('item >>>>', item)
            const artistId = item?.artistId
            if (isAdded) {
                const request = {
                    "user_id": id,
                    "artist_id": artistId
                }
                console.log('handleUpcomingAddWishlistArtist request >>>', request)
                const response = await axiosInstance.post(`/add-wishlist`, request);
                console.log('handleUpcomingAddWishlistArtist >>>', response?.data);
                if (response?.data?.status == "success") {
                    getBookingsByType("")
                    showToast("Artist added to Favorites successfully!")
                }
            } else {
                const url = `/remove-wishlist?user_id=${id}&artist_id=${artistId}`
                console.log('url', url)
                const response = await axiosInstance.delete(url);
                console.log('handleDeleteWishlist response?.data >>>', response?.data)
                if (response?.data?.status == "success") {
                    getBookingsByType("")
                }
                showToast("Artist removed from Favorites successfully")
            }
        } catch (error) {
            console.log('error', error)
        }
    }


    const onChildScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / windowWidth);
        if (index !== selectedParentIndex) {
            setSelectedParentIndex(index);
            parentFlatListRef.current?.scrollToIndex({
                animated: true,
                index: index,
                viewPosition: 0.5
            })

            // setTimeout(() => {
            //     parentFlatListRef.current?.scrollToIndex({
            //         animated: true,
            //         index: index,
            //         viewPosition: 0.5
            //     })
            // }, 200);
        }
    };


    const handleAddRating = async (rate: any, review: any) => {
        try {

            setLoading(true)
           

            const request = {
                "cartId": selectedBooking?.cartId,
                "bookingitemId": selectedBookingItem?.id,
                "rating": `${rate}`,
                "how_service": review?.howService,
                "how_artist": review?.howArtist
            }

            console.log('handleAddRating request >>>', request)
            const response = await axiosInstance.post(`/update-rating`, request)
            console.log('handleAddRating response >>', response?.data)
            if (response?.data?.status == "success") {

                const data = {
                    name: selectedBooking?.user_firstName,
                    rate: rate
                }
 
                // getData()
                getBookingsByType("");
                setLoading(false)
                showToast("Rating added successfully!")
               await handleNotificationRating(selectedBookingItem, data)
            }
        } catch (error) {
            setLoading(false)
            showToast("Another artist service not completed yet!")
            console.error('handleAddRating error >>>', error)
        }
    }

    const handleNotificationRating = async (data: any, client: any) => {
        // const handleNotification = debounce(async (sendData, data) => {
        const receiver = data?.devices[0]?.deviceToken;
        if (!receiver) {
            return
        }

        try {
            const payload = {
                receiver,
                title: 'Rating added!',
                body: `${client?.name} has given you ${client?.rate} star review`,
                data: {}
            }
            await axiosInstance.post('/send-notification', payload);
        } catch (err) {
            console.error('Notification proxy error', err?.response || err.message || err);
        }
    }

    const handleNotificationGratuity = async (data: any, client: any) => {
        // const handleNotification = debounce(async (sendData, data) => {
        const receiver = data?.devices[0]?.deviceToken;

        if (!receiver) {
            return
        }

        try {
            const payload = {
                receiver,
                title: 'Gratuity added!',
                body: `${client?.name} has given $${client?.amount} for your services`,
                data: {}
            }
            await axiosInstance.post('/send-notification', payload);
        } catch (err) {
            console.error('Notification proxy error', err?.response || err.message || err);
        }
    }

    const handleNotificationBookingDelete = async (data: any, client: any) => {
        // const handleNotification = debounce(async (sendData, data) => {
        const receiver = data?.devices[0]?.deviceToken;

        if (!receiver) {
            return
        }

        try {
            const payload = {
                receiver,
                title: 'Booking Cancelled!',
                body: `${client?.name} has cancelled the booking that was scheduled on ${client?.time}`,
                data: {}
            }
            await axiosInstance.post('/send-notification', payload);
        } catch (err) {
            console.error('Notification proxy error', err?.response || err.message || err);
        }
    }

    const handleAddGratuity = async (selectedGratuity: any, gratuity: any) => {
        try {

            var calcGratuity = 0;

            if (selectedGratuity != 0) {
                const calc: number = parseFloat(parseInt(selectedGratuity) / 100).toFixed(2) * parseInt(selectedBookingItem.quantity)
                calcGratuity = calc * parseInt(selectedBookingItem?.price)

            } else {
                calcGratuity = parseInt(gratuity)
            }
            console.log('selectedBooking >>>', selectedBooking)
            setGratuityAmount(calcGratuity)

            const request = {
                "bookingId": selectedBookingItem?.booking_id,
                "userId": selectedBooking?.userId,
                "BookingItemId": selectedBookingItem?.id,
                "gratuityAmount": calcGratuity
            }

            console.log('handleAddGratuity request >>>', request)
            // return
            const response = await axiosInstance.post(`/makePayment`, request)
            console.log('handleAddGratuity response >>>', response?.data)
            // if (response?.data?.status == "success") {
            initiatePayment(response?.data, calcGratuity)
            // }

        } catch (error) {
            console.error('handleAddGratuity error >>>', error)
        }
    }

    const confirmGratuity = async (orderObj: any, amount: any) => {

        try {

            //First get amount

            const request = {
                "cartId": selectedBooking?.cartId,
                "bookingitemId": selectedBookingItem?.id,
                "gratuity": amount,
                // add Transaction id
            }

            console.log('handleAddGratuity request >>>', request)
            const response = await axiosInstance.post(`/update-gratuity`, request)
            console.log('confirmGratuity response >>', response?.data?.data)
            showToast("Gratuity added successfully")
            const data = {
                name: selectedBooking?.user_firstName,
                amount: amount
            }
            getData();
            handleNotificationGratuity(selectedBookingItem, data)
        } catch (error) {
            console.error('confirmGratuity error >>>', error)
        }

    }

    const initiatePayment = async (orderObj: any, calcGratuity: any, booking?: any) => {
        setPaymentInitiated(true);
        const { error } = await initPaymentSheet({
            // customerEphemeralKeySecret: orderObj.user.ephemeralKey,
            customerId: orderObj.customer,
            merchantDisplayName: 'Totally Flawless',
            paymentIntentClientSecret: orderObj.clientSecret,
            googlePay: {
                merchantCountryCode: 'US',
                currencyCode: 'usa',
                testEnv: true,
            },
            applePay: {
                merchantCountryCode: 'US',
                currencyCode: 'usa',
                testEnv: true,
            },
            billingDetailsCollectionConfiguration: {
                address: PaymentSheet.AddressCollectionMode.NEVER,
            },
            returnURL: 'http://localhost:3001',
        });
        setLoading(false);
        if (error) {
            setPaymentInitiated(false);
            setIsPayNowDisabled(false)
            console.error(error);
        } else {
            console.log('pamentSheetInititated');
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                const { error } = await presentPaymentSheet();
                if (error) {
                    console.error(error);
                    setIsPayNowDisabled(false)
                    setPaymentInitiated(false);
                    showToast(`${error?.localizedMessage}`)
                } else {
                    console.log('PaymentSheetClosed');
                    if (booking) {
                        setLoading(true)
                        confirmFutureBooking(orderObj, booking)
                    } else {
                        confirmGratuity(orderObj, calcGratuity);
                    }
                }
            } catch (err) {
                setIsPayNowDisabled(false)
                console.error("pamentSheetInititated 11 >>>", err);
            }
        }
    };

    const handleFutureBookingPayNow = async (booking: any) => {

        try {
            console.log('booking >>>>', booking)
            const id = await AsyncStorage.getItem("id")
            let temp = booking?.unpaid_booking_ids?.map((item) => {
                return {
                    "bookingId": item?.bookingId,
                    "amount": item?.unpaidAmount
                }
            })
            const request = {
                "userId": id,
                "bookings": temp
            }

            console.log('request >>>>', JSON.stringify(request))

            const response = await axiosInstance.post(`/booking-payment`, request)
            console.log('response?.data /booking-payment >>>>', response?.data)
            if (response?.data?.status == "success") {
                initiatePayment(response?.data, 0, request)
            }
        } catch (error) {
            console.log('handleFutureBookingPayNow error >>>', error)
        }

    }

    const confirmFutureBooking = async (orderObj, bookingReq) => {

        try {
            let temp = bookingReq?.bookings?.map((item) => {
                return {
                    "bookingId": item?.bookingId,
                    "amountPaid": item?.amount,
                    "transactionId": orderObj?.transactionId
                }
            })
            const request = {
                "bookings": temp
            }
            console.log('request confirmFutureBooking >>>>', request)
            const response = await axiosInstance.post(`/booking-amountpaid`, request)
            console.log('response?.data /booking-amountpaid >>>', response?.data)
            if (response?.data?.status == "success") {
                showToast("Payment successful!")
                getData()
                setLoading(false)
                console.log('response?.data >>>>', response?.data)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.error('error', error)
        }
    }

    const onRefresh = () => {
        getBookingsByType(selectedBookingType)
        //TODO: CALL APIS BY TYPE
        if (selectedParentIndex == 1) {
        }
    }


    const returnTabColor = (item: any) => {

        switch (item?.key) {
            case "all":
                return COLORS.black
            case "pending":
                return COLORS.red
            case "upcoming":
                return COLORS.yellow
            case "completed":
                return COLORS.green
            case "cancelled":
                return COLORS.red
            default:
                break;
        }

    }

    const renderChildItem = ({ item }) => {
        const componentMap = {
            0: <AllBookingUserComponent data={item}
                isPayNowDisabled={isPayNowDisabled}
                handleSelectedBooking={(type) => {
                    setLoading(true)
                    setSelectedBookingType(type);
                    getBookingsByType(type)

                    console.log('pendingBookingData >>>>', pendingBookingData?.length)
                    if (type == bookingType.NOW) {
                        scrollViewRef.current.scrollTo({ x: 2 * windowWidth, animated: true });
                        setTimeout(() => {
                            setSelectedParentIndex(2);
                            parentFlatListRef.current?.scrollToIndex({
                                animated: true,
                                index: 2,
                                viewPosition: 0.5
                            })
                        }, 500);
                    } else if (pendingBookingData?.length > 0 && type != bookingType.VIRTUAL) {

                        scrollViewRef.current.scrollTo({ x: 2 * windowWidth, animated: true });
                        setTimeout(() => {
                            setSelectedParentIndex(2);
                            parentFlatListRef.current?.scrollToIndex({
                                animated: true,
                                index: 2,
                                viewPosition: 0.5
                            })
                        }, 500);
                    } else {
                        scrollViewRef.current.scrollTo({ x: 1 * windowWidth, animated: true });
                        setTimeout(() => {
                            setSelectedParentIndex(1);
                            parentFlatListRef.current?.scrollToIndex({
                                animated: true,
                                index: 1,
                                viewPosition: 0.5
                            })
                        }, 500);
                    }

                }}
                handlePayNow={(booking: any) => {
                    setIsPayNowDisabled(true)
                    handleFutureBookingPayNow(booking)
                }}
            />,
            1: <PendingUserComponent data={item} type="Pending" bookType={selectedBookingType}
                handleDeleteBooking={(booking, data, index) => handleUpcomingDeleteData(booking, data, index)}
            />,
            2: <UpcomingUserComponent
                bookType={selectedBookingType}
                handleDeleteBooking={(booking, data, index) => handleUpcomingDeleteData(booking, data, index)}
                handleUpcomingAddWishlistArtist={(data, isAdded) => handleUpcomingAddWishlistArtist(data, isAdded)}
                handleProfileClick={(artist) => {
                    // setArtistProfileData(artist)
                    //FIXME:

                    // getArtistDetails(artist?.id)
                }}
                handleCall={(data: any) => {
                    const payload = {
                        "from": "+" + data?.countryCode + data?.mobile,
                        "to": "+" + userDetail?.countryCode + userDetail?.phone,
                    }
                    console.log('Calldata >>>', payload);
                    callDevice(payload);
                }}
                data={item}
                type="Upcoming"
            />,
            3: <CompletedUserComponent
                bookType={selectedBookingType}
                data={item}
                type="Completed"
                handleProfileClick={(artist) => {
                    // setArtistProfileData(artist)
                    //FIXME:
                    // getArtistDetails(artist?.id)
                }}
                handleUpcomingAddWishlistArtist={(data, isAdded) => handleUpcomingAddWishlistArtist(data, isAdded)}
                handleAddGratuity={(data, item, index) => {
                    setSelectedBooking(data)
                    setSelectedBookingItem(item)
                    setSelectedBookingIndex(index)
                    setAddGratuityModalVisible(true)
                }}
                handleAddRating={(data, item, index) => {
                    setSelectedBooking(data)
                    setSelectedBookingItem(item)
                    setSelectedBookingIndex(index)
                    setAddRatingModal(true)
                }}
            />,
            4: <CancelledUserComponent data={item} type="Cancelled" bookType={selectedBookingType} />,
        };
        return componentMap[selectedParentIndex] || null;
    };

    const renderParentItem = ({ item, index }) => (

        <TouchableOpacity
            disabled={selectedParentIndex == index}
            onPress={() => {
                setTimeout(() => {
                    setSelectedParentIndex(index)
                }, 200);
                scrollViewRef.current.scrollTo({ x: index * windowWidth, animated: true });
                parentFlatListRef.current?.scrollToIndex({
                    animated: true,
                    index: index,
                    viewPosition: 0.5
                })
            }}
            style={[styles.typesBtn, { backgroundColor: COLORS.white, }]} >
            <Text style={[styles.label, {
                color: selectedParentIndex == index ? returnTabColor(item) : COLORS.greyTxt,
                fontFamily: selectedParentIndex == index ? FONTS.medium : FONTS.light
            }]} >{item.title}</Text>
            <View style={[styles.indicator, { backgroundColor: selectedParentIndex == index ? returnTabColor(item) : COLORS.transparent }]} />
        </TouchableOpacity>
    );

    const changeNavigation = page => {

        //For reset to all booking
        // scrollViewRef.current.scrollTo({ x: 1 * windowWidth, animated: true });
        // setTimeout(() => {
        //     // setChildLists([[childLists[0]], [], [], [], []])
        //     setSelectedParentIndex(0);
        //     parentFlatListRef.current?.scrollToIndex({
        //         animated: true,
        //         index: 0,
        //         viewPosition: 0.5
        //     })
        //     // setSelectedBookingType("");
        //     // getBookingsByType("")
        // }, 1000);

        navigation.navigate(page);

    };

    return (
        <StripeProvider
            publishableKey={STRIPE_KEY}
            merchantIdentifier="merchant.com.flawless">
            <View style={{ backgroundColor: '#FFF', flex: 1 }}>
                <Loader loading={loading} />
                <TopBar navigation={navigation} />

                <View style={styles.headerTitleView} >
                    <TouchableOpacity style={styles.backBtn} onPress={() => changeNavigation(screenNames.HOME)} >
                        <CommonSvg.back />
                    </TouchableOpacity>
                    <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >My Booking</Text>
                </View>

                <View style={{ flexGrow: 1, backgroundColor: '#FFF' }}>

                    <FlatList
                        ref={parentFlatListRef}
                        data={routes}
                        renderItem={renderParentItem}
                        // initialScrollIndex={selectedParentIndex}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0, borderBottomWidth: 0.57, borderColor: COLORS.greyTxt, marginBottom: 5 }}
                        contentContainerStyle={{ paddingTop: mvs(10), paddingLeft: ms(15) }}
                    />

                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        pagingEnabled
                        onScroll={onChildScroll}
                        scrollEventThrottle={16}
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                        style={{ flexGrow: 1, }}
                        contentContainerStyle={{ paddingBottom: mvs(200) }}
                    >
                        {childLists.map((childList, index) => (
                            <View key={index} style={{ width: windowWidth }}>
                                <FlatList
                                    data={childList}
                                    renderItem={renderChildItem}
                                    contentContainerStyle={{ paddingBottom: mvs(70) }}
                                    keyExtractor={(item, index) => `${item?.id}-${index}`}
                                    showsVerticalScrollIndicator={false}
                                    refreshControl={
                                        <RefreshControl
                                            onRefresh={onRefresh}
                                            refreshing={false}
                                        />
                                    }
                                    keyboardShouldPersistTaps="always"
                                    ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
                                        <Text style={{}} >No Bookings.</Text>
                                    </View>}
                                    ItemSeparatorComponent={() => <View style={{ marginTop: mvs(10) }} />}
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
                <BottomBar navigation={changeNavigation} page={screenNames.USER_BOOKING} />

                {
                    addGratuityModalVisible &&
                    <AddGratuityModal
                        visible={addGratuityModalVisible}
                        visibleFunction={() => {
                            setAddGratuityModalVisible(false)
                        }}
                        onSelect={(selectedGratuity, gratuity) => {
                            handleAddGratuity(selectedGratuity, gratuity)
                            console.log('gratuity', gratuity)
                        }}
                    />
                }
                {/* <KeyboardAwareScrollView style={{flex:1}} keyboardShouldPersistTaps="always" > */}
                {
                    addRatingModal &&
                    <AddRatingModal
                        visible={addRatingModal}
                        visibleFunction={() => {
                            setAddRatingModal(false)
                        }}
                        data={{
                            title: selectedBookingItem?.serviceName,
                            name: selectedBookingItem?.artists?.firstName + " " + selectedBookingItem?.artists?.lastName,
                            rate: 0
                        }}
                        onSelect={(rate, data) => {
                            setRate(rate)
                            console.log('data >>>', data)
                            handleAddRating(rate, data)
                        }}
                    />
                }

                {
                    artistProfileVisible &&
                    <ArtistProfileData
                        visible={artistProfileVisible}
                        visibleFunction={() => {

                            setArtistProfileVisible(false)
                            setArtistProfileData([])
                            setArtistImageData([])
                        }}
                        data={artistProfileData}
                        imageData={artistImageData}
                        onSelect={(img) => {
                            setImageVisible(true)
                            setViewImgSrc(img)
                        }}
                    />
                }

                {
                    imageVisible &&

                    <CustomImageView
                        imageVisible={imageVisible}
                        index={0}
                        imgData={[{ uri: viewImgSrc }]}
                        imageVisibleFunction={() => {
                            setImageVisible(false)
                        }}
                    />
                }

                {/* </KeyboardAwareScrollView> */}

            </View>
        </StripeProvider>

    )
}

const styles = StyleSheet.create({
    indicator: {
        backgroundColor: '#232323',
        height: 5,
        borderTopStartRadius: 5,
        borderTopEndRadius: 5,

    },
    label: {
        color: COLORS.lightGreyTxt,
        fontFamily: FONTS.light,
        fontSize: 18,
        textAlign: 'center'
    },


    typesBtn: {
        // width: ms(100),
        paddingRight: ms(15)
    },
    headerTitleView: {
        ...GlobalStyles.rowCenter,
        // height:mvs(30),
        paddingVertical: mvs(15),
        paddingLeft: ms(15)
    },
    backBtn: {
        ...GlobalStyles.alignJustifyCenter,
        height: 30,
        width: 25,
    },
})

export default UserBookings