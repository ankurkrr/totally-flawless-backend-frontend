import { View, Text, ScrollView, Dimensions, TouchableOpacity, Platform, Modal, StyleSheet, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Icon } from '@rneui/base';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { mvs } from 'react-native-size-matters';
import TimePicker from '../components/TimePicker';
import Toast from 'react-native-toast-message';
import { GlobalStyles } from '../style/GlobalStyles';
import { FONTS } from '../style/theme';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../services/axiosInterceptor';
import { PaymentSheet, StripeProvider, usePaymentSheet } from '@stripe/stripe-react-native';
import { Loader } from './components';
import { showToast } from '../components/Toast';
import screenNames from '../constants/screenNames';
import { STRIPE_KEY } from '../store/url';

type Props = {}

const BookVirtualAppointment = (props: Props) => {


    const routeData = useRoute()?.params?.routeData;

    // console.log('routeData', routeData)
    // {"addOnAmt": 0, "artistPrice": 250, "bookingFee": 70, "longHairAmt": 50, 
    //     "selectedArtist": {"description": "Experience (3-7 yrs)", "levelName": "Platinum", "price": "250", "priceId": 372}, 
    //     "serviceData": {"id": 172, "imgUrl": "https://mmobileapp.s3.ap-south-1.amazonaws.com/1742426322045_Averie-6 (3).jpg", "name": "Short Hair", "serviceid": 3, "title": null}, 
    //     "totalPrice": 370}

    const height = Dimensions.get('window').height;

    const todaysDate = dayjs().subtract(1, 'day');
    const [date, setDate] = useState(dayjs());
    const [maxDate, setMaxDate] = useState(dayjs());
    const [ampm, setAmpm] = useState('AM');
    const [hh, setHh] = useState('HH');
    const [mm, setMm] = useState('MM');
    const [showClock, setShowClock] = useState(false);

    const { initPaymentSheet, presentPaymentSheet, } = usePaymentSheet();
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [loading, setLoading] = useState(false)
    const [isPayNowDisabled, setIsPayNowDisabled] = useState(false)

    const [proceedCheckoutModal, setProceedCheckoutModal] = useState(false)
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

    const navigation = useNavigation<any>();

    useEffect(() => {

        const unsubscribe = navigation.addListener('focus', () => {
            getData();
        })

        return () => {
            unsubscribe();
        }
    }, [])


    const getData = () => {

        //set Date and Time

        setMaxDate(dayjs().add(1, 'year'));

        let dateTimeString = moment().format('YYYY-MM-DD, hh:mm A');

        if (dateTimeString) {
            console.log(dateTimeString);
            var parts = dateTimeString.split(', ');
            var dateString = parts[0];
            setDate(dayjs(dateString));
            var timeString = parts[1];
            var dateParts = dateString.split('-');
            var year = parseInt(dateParts[0]);
            var month = parseInt(dateParts[1]) - 1;
            var day = parseInt(dateParts[2]);
            var timeParts = timeString.split(' ');
            var time = timeParts[0];
            var period = timeParts[1];
            var [hh, mm] = time.split(':');
            hh = parseInt(hh);
            hh = hh % 12 || 12;
            hh = String(hh).padStart(2, '0');
            mm = String(mm).padStart(2, '0');
            setHh(hh);
            setMm(mm);
            setAmpm(period);
        }

    }

    const changeTime = (hour, min, am_pm) => {
        console.log(hour, min, am_pm);
        setHh(hour);
        setMm(min.toString());
        setAmpm(am_pm);
        if (Platform.OS == 'android') {
            setShowClock(false);
        }
    };

    const validateFutureTime = (hh:string, mm:string, ampm:string) => {
        var currentDateTime = new Date();
        var currentHour = currentDateTime.getHours();
        var currentMinute = currentDateTime.getMinutes();
        var currentAmPm = currentHour >= 12 ? 'PM' : 'AM';
        var currentHour12 = currentHour % 12 || 12;
        var inputHour = parseInt(hh, 10);
        var inputMinute = parseInt(mm, 10);

        if (ampm === 'PM' && inputHour !== 12) {
            inputHour += 12;
        } else if (ampm === 'AM' && inputHour === 12) {
            inputHour = 0;
        }

        // Create Date objects for comparison
        var currentDate = new Date();
        var inputDate = new Date(currentDate);
        inputDate.setHours(inputHour, inputMinute, 0, 0);

        if (date.isAfter(dayjs(), 'day')) {
            console.log(date.isAfter(dayjs(), 'day'));
            return true;
        }

        // Check if the input time is in the future
        if (inputDate > currentDateTime) {
            return true; // The input time is in the future
        } else {
            return false; // The input time is not in the future
        }
    };

    const submitHandler = async () => {
        if (!validateFutureTime(hh, mm, ampm)) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Past time cannot be selected',
            });
        } else if (hh === '' || mm === '') {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select Time.',
            });
            // return;
        } else {

            setProceedCheckoutModal(true)


        }
    };


    const handleCheckoutSummary = async () => {

        try {
            setLoading(true)
            const userId = await AsyncStorage.getItem('id');
            const time24hr = moment(`${hh}:${mm} ${ampm}`, 'hh:mm A').format('HH:mm')
            const request = {
                "user_id": userId,
                "service_id": routeData?.serviceData?.serviceid,
                "price": routeData?.totalPrice,
                "training_date": moment(date).format("YYYY-MM-DD"),
                "training_time": time24hr
            }

            console.log('request', request)

            setProceedCheckoutModal(false)
            const response = await axiosInstance.post(`/add-training-service`, request);
            if (response?.status == 200) {
                const intentReq = {
                    "user_id": userId,
                    "payment_price": routeData?.totalPrice,
                    "booking_id": response?.data?.data?.id
                }
                const payResponse = await axiosInstance.post(`/get-training-service-payment-intent`, intentReq);

                console.log('payResponse >>>>', JSON.stringify(payResponse?.data))

                initiatePayment(payResponse?.data?.data[0]?.payment_intent, response?.data?.data?.id)
                // confirmTrainigService(response?.data?.data)
            }
            console.log('response?.data', response?.data)

        } catch (error) {
            setLoading(false)
            console.log('error', error)
        }
    }

    const initiatePayment = async (orderObj: any, training_id: any) => {
        setPaymentInitiated(true);
        const { error } = await initPaymentSheet({
            // customerEphemeralKeySecret: orderObj.user.ephemeralKey,
            customerId: orderObj.customer,
            merchantDisplayName: 'Totally Flawless',
            paymentIntentClientSecret: orderObj.client_secret,
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

                    setLoading(true)
                    confirmTrainigService(training_id)
                    //  confirmFutureBooking(orderObj, booking)

                    //   confirmGratuity(orderObj, calcGratuity);

                }
            } catch (err) {
                setIsPayNowDisabled(false)
                console.error("pamentSheetInititated 11 >>>", err);
            }
        }
    };

    const confirmTrainigService = async (training_id: any) => {

        try {
            setLoading(true)
            const userId = await AsyncStorage.getItem('id');

            const request = {
                "training_id": training_id,
                "user_id": userId,
                "payment_price": routeData?.totalPrice,
                "status": "paid"
            }

            console.log('request', request)

            const response = await axiosInstance.post(`/add-training-service-payment`, request);
            if (response.status == 200) {
                setLoading(false)
                setBookingConfirmed(true)
            }
            // showToast("Payment successful");
            // console.log('response?.data', response?.data)

        } catch (error) {
            setLoading(false)
            console.log('error', error)
        }

    }

    return (
        <StripeProvider
            publishableKey={STRIPE_KEY}
            merchantIdentifier="merchant.com.flawless">
            <ScrollView style={{ height: height, backgroundColor: '#FFF' }}>

                <Loader loading={loading} />

                <View style={{ padding: 15 }}>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <View>
                            <Icon
                                color="#000"
                                name="arrow-back-ios"
                                onPress={() => navigation.goBack()}
                                size={25}
                                type="material"
                            />
                        </View>
                        <View style={{ justifyContent: 'center', paddingLeft: 10 }}>
                            <Text
                                style={{
                                    color: 'black',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    fontFamily: 'Poppins-Regular',
                                }}>
                                Book Virtual Training Appointment
                            </Text>
                        </View>
                    </View>

                    <View style={{ marginTop: mvs(70) }}>
                        <DateTimePicker
                            headerContainerStyle={{ backgroundColor: '#F3C46E' }}
                            calendarTextStyle={{ color: '#000' }}
                            headerTextStyle={{ color: '#FFF' }}
                            todayTextStyle={{ color: '#000' }}
                            weekDaysTextStyle={{ color: '#000' }}
                            weekDaysContainerStyle={{ color: '#000' }}
                            selectedItemColor="#000"
                            dayContainerStyle={{ color: '#000' }}
                            mode="single"
                            minDate={todaysDate}
                            maxDate={maxDate}
                            date={date}
                            onChange={params => setDate(params.date)}
                        />
                    </View>

                    <View style={{ flexDirection: 'column' }}>
                        <View style={{ marginBottom: 10 }}>
                            <Text
                                style={{
                                    color: 'black',
                                    fontFamily: 'Poppins-Regular',
                                    fontSize: 17,
                                    fontWeight: 500,
                                }}>
                                Enter your time
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => setShowClock(true)}>
                                <Text
                                    style={{
                                        borderWidth: 1,
                                        borderColor: 'black',
                                        padding: 10,
                                        color: 'black',
                                        borderRadius: 10,
                                        textAlign: 'center',
                                        fontSize: 18,
                                    }}>
                                    {hh}
                                </Text>
                            </TouchableOpacity>
                            <View style={{ paddingHorizontal: 5 }}>
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontFamily: 'Poppins-Regular',
                                        color: 'black',
                                    }}>
                                    :
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowClock(true)}>
                                <Text
                                    style={{
                                        borderWidth: 1,
                                        borderColor: 'black',
                                        padding: 10,
                                        color: 'black',
                                        borderRadius: 10,
                                        textAlign: 'center',
                                        fontSize: 18,
                                    }}>
                                    {mm}
                                </Text>
                            </TouchableOpacity>
                            <View
                                style={{
                                    flexDirection: 'column',
                                    borderRadius: 10,
                                    marginHorizontal: 15,
                                }}>
                                <TouchableOpacity
                                    onPress={() => setAmpm('AM')}
                                    style={{
                                        backgroundColor: ampm === 'AM' ? '#000' : '#FFF',
                                        paddingHorizontal: 15,
                                        // paddingTop: 2,
                                        borderTopLeftRadius: 10,
                                        borderTopRightRadius: 10,
                                        borderColor: 'black',
                                        borderWidth: 0.5,
                                    }}>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontFamily: 'Poppins-Regular',
                                            color: ampm === 'AM' ? '#FFF' : '#000',
                                        }}>
                                        AM
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setAmpm('PM')}
                                    style={{
                                        backgroundColor: ampm === 'PM' ? '#000' : '#FFF',
                                        paddingHorizontal: 15,
                                        borderBottomLeftRadius: 10,
                                        borderBottomRightRadius: 10,
                                        borderColor: 'black',
                                        borderWidth: 0.5,
                                    }}>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontFamily: 'Poppins-Regular',
                                            color: ampm === 'PM' ? '#FFF' : '#000',
                                        }}>
                                        PM
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {showClock && (
                        <View
                            style={{
                                marginTop: 10,
                            }}>
                            <TimePicker changeTime={(x, y, z) => changeTime(x, y, z)} />
                        </View>
                    )}
                    <View
                        style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 40,
                        }}>
                        <TouchableOpacity
                            onPress={() => submitHandler()}
                            style={{
                                backgroundColor: '#000',
                                width: '100%',
                                alignItems: 'center',
                                paddingVertical: 15,
                                borderRadius: 35,
                            }}>
                            <Text
                                style={{
                                    fontSize: 20,
                                    color: '#FFF',
                                    fontWeight: 'bold',
                                    fontFamily: 'Poppins-Regular',
                                }}>
                                Confirm
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {/* <Toast /> */}


                    {proceedCheckoutModal && (
                        <Modal animationType="fade" visible={proceedCheckoutModal} transparent={true}>

                            <View style={styles.modalContainer}>
                                <View style={[styles.modalContent, { minHeight: Platform.OS == "ios" ? mvs(250) : mvs(305) }]}>
                                    {/* Close button */}
                                    <TouchableOpacity
                                        style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
                                        onPress={() => setProceedCheckoutModal(false)}>
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>


                                    <View>
                                        <Text style={[GlobalStyles.txtM16Dark, { textDecorationLine: 'underline', }]}>
                                            Checkout Summary
                                        </Text>
                                    </View>


                                    <View style={{ marginTop: 10, width: '100%' }}>
                                        <View>
                                            <Text
                                                style={{
                                                    ...GlobalStyles.txtM14Dark,
                                                    textDecorationLine: 'underline',
                                                }}>
                                                Price Details
                                            </Text>
                                        </View>

                                        <View

                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                marginTop: 10,
                                                marginBottom: Platform.OS == "ios" ? 10 : 5,
                                            }}>
                                            <View>
                                                <Text
                                                    style={{
                                                        color: '#101010',
                                                        fontFamily: FONTS.regular,
                                                        fontSize: 14,
                                                    }}>
                                                    {routeData?.serviceData?.name}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text
                                                    style={{
                                                        color: '#000',
                                                        fontFamily: FONTS.medium,
                                                        fontSize: 14,
                                                    }}>
                                                    ${routeData?.artistPrice}
                                                </Text>
                                            </View>
                                        </View>


                                        {
                                            routeData?.addOnAmt != 0 &&
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    marginBottom: Platform.OS == "ios" ? 10 : 5,
                                                }}>
                                                <View>
                                                    <Text
                                                        style={{
                                                            color: '#101010',
                                                            fontFamily: FONTS.regular,
                                                            fontSize: 14,
                                                        }}>
                                                        Add on blowout
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text
                                                        style={{
                                                            color: '#000',
                                                            fontFamily: FONTS.medium,
                                                            fontSize: 14,
                                                        }}>
                                                        ${routeData?.addOnAmt}
                                                    </Text>
                                                </View>
                                            </View>
                                        }


                                        {
                                            routeData?.longHairAmt != 0 &&
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    marginBottom: Platform.OS == "ios" ? 10 : 5,
                                                }}>
                                                <View>
                                                    <Text
                                                        style={{
                                                            color: '#101010',
                                                            fontFamily: FONTS.regular,
                                                            fontSize: 14,
                                                        }}>
                                                        Textured Hair
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text
                                                        style={{
                                                            color: '#000',
                                                            fontFamily: FONTS.medium,
                                                            fontSize: 14,
                                                        }}>
                                                        ${routeData?.longHairAmt}
                                                    </Text>
                                                </View>
                                            </View>
                                        }

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                marginBottom: Platform.OS == "ios" ? 10 : 5,
                                            }}>
                                            <View>
                                                <Text
                                                    style={{
                                                        color: '#101010',
                                                        fontFamily: FONTS.regular,
                                                        fontSize: 14,
                                                    }}>
                                                    Booking Fee
                                                </Text>
                                            </View>
                                            <View>
                                                <Text
                                                    style={{
                                                        color: '#000',
                                                        fontFamily: FONTS.medium,
                                                        fontSize: 14,
                                                    }}>
                                                    ${routeData?.bookingFee}
                                                </Text>
                                            </View>
                                        </View>


                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                marginBottom: Platform.OS == "ios" ? 10 : 5,
                                            }}>
                                            <View>
                                                <Text
                                                    style={{
                                                        ...GlobalStyles.txtM14Dark
                                                    }}>
                                                    Total Amount Payable
                                                </Text>
                                            </View>
                                            <View>
                                                <Text
                                                    style={{
                                                        color: '#000',
                                                        fontFamily: FONTS.semiBold,
                                                        fontSize: 14,
                                                    }}>
                                                    ${routeData?.totalPrice}
                                                </Text>
                                            </View>
                                        </View>

                                    </View>


                                    <TouchableOpacity

                                        onPress={() => handleCheckoutSummary()}
                                        style={{
                                            backgroundColor: '#000',
                                            width: '100%',
                                            alignItems: 'center',
                                            paddingVertical: 17,
                                            borderRadius: 35,
                                            borderWidth: 2,
                                            borderColor: '#000',
                                            marginTop: mvs(30)
                                        }}>

                                        <Text
                                            style={{
                                                fontSize: 20,
                                                color: '#FFF',
                                                fontWeight: 'bold',
                                                fontFamily: 'Poppins-Regular',
                                            }}>
                                            Proceed to checkout
                                        </Text>

                                    </TouchableOpacity>
                                </View>
                            </View>

                        </Modal>
                    )}


                    {bookingConfirmed && (
                        <Modal animationType="fade" visible={bookingConfirmed} transparent={true}>
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                }}>
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginHorizontal: 30,
                                        // marginVertical: Platform.OS=="ios"?180: 200,
                                        maxHeight: mvs(320),
                                        // paddingVertical:mvs(10),
                                        backgroundColor: 'white',
                                        borderRadius: 20,
                                        // width:SIZES.cardWidth,
                                        padding: 15,
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 0,
                                            height: 2,
                                        },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 4,
                                        elevation: 5,
                                    }}>
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontFamily: FONTS.regular,
                                            color: 'black',
                                            textAlign: 'center',
                                        }}>
                                        You have successfully booked virtual training appointment
                                    </Text>
                                    <Image
                                        source={require('../../src/assets/confirm-circle.png')}
                                        style={{
                                            width: 120,
                                            height: 120,
                                            marginRight: 5,
                                            marginVertical: 20,
                                        }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => {
                                            setLoading(false)
                                            setBookingConfirmed(false);
                                            navigation.replace(screenNames.USER_BOOKING);
                                        }}
                                        style={{
                                            backgroundColor: '#000',
                                            width: 150,
                                            alignItems: 'center',
                                            paddingVertical: 17,
                                            borderRadius: 8,
                                            borderWidth: 2,
                                            borderColor: '#000',
                                        }}>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                color: '#FFF',
                                                fontWeight: 'bold',
                                                fontFamily: 'Poppins-Regular',
                                            }}>
                                            Continue
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    )}

                </View>
            </ScrollView>
        </StripeProvider>
    )
}


const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalContent: {
        width: 375,
        // height: 435,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    closeButtonText: {
        fontSize: 20,
        color: 'black',
    },
})

export default BookVirtualAppointment