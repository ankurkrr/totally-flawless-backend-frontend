import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  DrawerLayoutAndroid,
  Modal,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  Linking,
} from 'react-native';
import { Icon, Image } from '@rneui/base';
import { useEffect, useState, useRef, useContext, useCallback } from 'react';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useIsFocused } from '@react-navigation/native';
import {
  PaymentSheet,
  StripeProvider,
  usePaymentSheet,
} from '@stripe/stripe-react-native';
import { CART_DATA, CART_ITEMS, IS_ADDED_CART } from '../store/allactionsTypes';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import { API_URL, STRIPE_KEY } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import screenNames from '../constants/screenNames';
import { GlobalStyles } from '../style/GlobalStyles';
import { COLORS, FONTS, SIZES } from '../style/theme';
import { ms, mvs } from 'react-native-size-matters';
import CommonSvg from '../components/CommonSvg';
import Gif from 'react-native-gif';
// Notification sending moved to backend; client will POST to '/send-notification'
import { asynchEnums, bookingStatusEnums } from '../constants/enums';
import { showToast } from '../components/Toast';
import { Loader } from './components';
import { debounce } from 'lodash';
import UserContext from './UserContext';
import Tooltip from 'react-native-walkthrough-tooltip';
import Icons from 'react-native-vector-icons/AntDesign';

// removed client service account from bundle

const Cart = ({ navigation }) => {
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  let intervalId; // Store the interval ID
  // const API_URL = 'http://164.52.197.9:3001';
  const drawer = useRef(null);
  const [guestUser, setGuestUser] = useState(false);
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const [addOnServiceAmount, setaddOnServiceAmount] = useState(0);
  const [longHairAmount, setlongHairAmount] = useState(0);
  const [address, setAddress] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [payNowAmount, setPayNowAmount] = useState(0);
  const [serviceList, setServiceList] = useState([]);
  const bookingFees = 35;
  // const bookingFees = 70;
  const [priceDetails, setPriceDetails] = useState([]);
  const [cartType, setCartType] = useState('now');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [artistData, setArtistData] = useState([])
  const [isNotificationSended, setIsNotificationSended] = useState(false)
  const [userId, setUserId] = useState(null);
  const [cartDetails, setCartDetails] = useState(null);
  const [addServiceFlag, setAddServiceFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inLoading, setInLoading] = useState(true);
  const [totalTravelFee, setTotalTravelFee] = useState(0)
  const [checkOutSummaryModal, setCheckOutSummaryModal] = useState(false)
  const { initPaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [timerModalVisible, setTimerModalVisible] = useState(false)
  const [unableToFindModal, setUnableToFindModal] = useState(false)
  const [requestTimer, setRequestTimer] = useState(0)
  const [requestTimerBoth, setRequestTimerBoth] = useState(0)
  const [acceptedArtist, setAcceptedArtist] = useState([])

  const [loaderLoading, setLoaderLoading] = useState(false)
  const [userData, setUserData] = useState({})
  const [toolTipVisible, setToolTipVisible] = useState(false)
  const [toolTipModalVisible, setToolTipModalVisible] = useState(false)
  const [bothServiceInfoModal, setBothServiceInfoModal] = useState(false)
  const [fcmToken, setFcmToken] = useState("")

  const [isMakeUpArtistCountFulfilled, setIsMakeUpArtistCountFulfilled] = useState(false)
  const [isHairArtistCountFulfilled, setIsHairArtistCountFulfilled] = useState(false)

  const [countFulfilled, setCountFulfilled] = useState(false)

  // const [selectedNumberHA, setSelectedNumberHA] = useState(0)
  // const [notificationSendArtistIndex, setNotificationSendArtistIndex] = useState(0);
  const [isRetry, setIsRetry] = useState(false)

  const [isCartData, setIsCartData] = useState(true)

  const [isSeperateSend, setIsSeperateSend] = useState(false)

  // const [makeServiceData, setMakeServiceData] = useState([]);
  // const [hairServiceData, setHairServiceData] = useState([])

  const [notificationSentArtists, setNotificationSentArtists] = useState([])
  const [rejOrErrorSentArtists, setRejOrErrorSentArtists] = useState([])
  const [artistFinalCount, setArtistFinalCount] = useState(0)

  const { isOrderAccepted } = useSelector(state => state.AppReducer);

  const { user, updateUser } = useContext(UserContext);

  const isConditionFulfilledRef = useRef(false);


  useEffect(() => {
    setCartDetails();
    // returnRequestedArtistCount([])
    setServiceList();
    getAllLocalStorage();

    setBookingConfirmed(false);

    console.log('price>>>>>>', priceDetails);
  }, [isFocused]);

  useEffect(() => {
    getLocalStorage();

  }, []);



  useEffect(() => {
    var totalSum = 0;
    var GA = 0;
    var addOn = 0;
    var longHairAmt = 0;
    if (cartType == 'now') {
      totalSum += bookingFees * returnRequestedArtistCount()[2];
    }
    if (serviceList && serviceList?.length > 0) {
      serviceList.map((item, index) => {
        totalSum += parseInt(item.price) * item.quantity;
        totalSum += parseInt(item.gratuity) * item.quantity;
        totalSum += parseInt(item.addOnAmount) * item.quantity;
        totalSum += parseInt(item.longHairAmount) * item.quantity;
        GA += parseInt(item.gratuity) * item.quantity;
        addOn += parseInt(item.addOnAmount) * item.quantity;
        longHairAmt += parseInt(item.longHairAmount) * item.quantity;
      });
      // added travel fee
      totalSum += parseInt(totalTravelFee);
      console.log('totalSum', totalSum);
      console.log('cartType', cartType);
      console.log(
        cartType == 'later' ? Number(totalSum / 2).toFixed(0) : totalSum,
      );
      setTotalAmount(totalSum);
      setPayNowAmount(
        cartType == 'later' ? Number(totalSum / 2).toFixed(0) : totalSum,
      );
      setaddOnServiceAmount(addOn)
      setlongHairAmount(longHairAmt)
      serviceList.length > 0 && priceDetails.length > 0 && changeCount();
    }
  }, [priceDetails, serviceList, cartType, totalTravelFee]);


  const changeNavigation = page => {

    navigation.navigate(page, { guestUser: guestUser });

  };

  const cancelPaymentInAlert = async (page) => {
    try {
      setLoaderLoading(true);

      for (const item of acceptedArtist || []) {
        for (const b of item?.bookingDetails || []) {
          const request = {

            "cartId": cartDetails.Id,
            "artistId": item.artistId
          }
          console.log('cancelPaymentInAlert request >>>', request)
          // console.log('item >>>', item)
          try {
            await axiosInstance.delete(`/delete-booking_request`, {
              data: request, // Body goes inside `data`
              headers: {
                'Content-Type': 'application/json',
              },
            });

            await handleCancelNotification(item);
          } catch (error) {
            console.error("Error updating booking status:", error);
          }
        }
      }

      setLoaderLoading(false);
      setAcceptedArtist([]);
      showToast("Booking cancelled");
      navigation.navigate(page, { guestUser });
    } catch (error) {
      setLoaderLoading(false);
      setAcceptedArtist([]);
      showToast("Booking cancelled");
      console.error("cancelPaymentInAlert >>>", error);
    }
  };

  const getLocalStorage = async () => {
    const flag = await AsyncStorage.getItem('guestUser');
    setGuestUser(flag)
    console.log('flag', flag);
    if (flag === 'true') {
      navigation?.navigate("Auth")

    } else {
      const fToken = await AsyncStorage.getItem("fcmToken");
      setFcmToken(fToken)
    }
  };


  const getCartItems = async id => {
    // setInLoading(true);
    console.log('in cart >>>>>>>>>>>>>>>>>>>>>>>>>');
    setAddServiceFlag(false);
    try {
      const response = await axiosInstance.get(`/get-cart?userId=${id}`);
      // getTravelFee()
      // console.log('getcart res>>>>>' + JSON.stringify(response.data));
      if (response?.data?.message !== 'Cart not found!') {
        const data = response.data.data;
        console.log('cartData >>>>', data)
        setCartDetails(data);
        await AsyncStorage.setItem(asynchEnums.CART_ID, data?.Id)
        // returnRequestedArtistCount(data)
        if (data?.later.length > 0) {
          console.log('ServiceList', data.later);
          setServiceList(data.later);
          setCartType('later');
          setIsCartData(false)
          dispatch({ type: CART_ITEMS, payload: data.later.length });
        } else if (data?.now.length > 0) {
          console.log('ServiceList', data.now);
          if (data.now.length > 1) {
            console.log('data.now.length', data.now.length);
            setIsCartData(false)
            setAddServiceFlag(true);
          }
          setCartType('now');
          setServiceList(data.now);
          dispatch({ type: CART_ITEMS, payload: data.now.length });

        } else {
          setIsCartData(true)
          dispatch({ type: CART_ITEMS, payload: 0 });
        }
        setLoaderLoading(false)
        // returnRequestedArtistCount()[0]
        getAddressFromId(data?.addressId);
        if (data.bookingTime !== '') {
          const date = data?.bookingTime ? data?.bookingTime.split(',') : '';
          const dt =
            date === ''
              ? ''
              : `${moment(date[0]).format('DD MMM, YYYY')}, ${date[1]}`;
          setDateTime(dt || '');
        } else {
          setDateTime('');
        }
      } else {
        setIsCartData(false)
        setCartDetails(null);
        // returnRequestedArtistCount([])
        setServiceList([]);
        dispatch({ type: CART_ITEMS, payload: 0 });
        dispatch({ type: CART_DATA, payload: [] });
        setLoaderLoading(false)
      }
    } catch (err) {
      setLoaderLoading(false)
      console.log(err);
    } finally {
      setLoaderLoading(false)
      setInLoading(false);
    }
  };

  const getAddressFromId = async id => {
    try {
      const response = await axiosInstance.get(`/getAddressById?id=${id}`);
      console.log("getAddressById >>>>", response.data);
      var data = response.data.data[0];
      if (data) {
        var address = `${data?.street ? data?.street + ', ' : ''}${data?.city ? data?.city + ', ' : ''
          }${data?.state}, ${data?.pincode}`;
        setAddress(address);
      } else {
        setAddress("")
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getAllLocalStorage = async () => {
    console.log('ingetlocalstorae>>>>>>>>>>>');
    const id = await AsyncStorage.getItem('id');
    console.log('id', id);
    if (id) {
      console.log(id);
      setLoaderLoading(true)
      await getCartItems(id);

      await getUserDetails(id);
      setUserId(id);
    }
    setPriceDetails([]);
  };

  const getUserDetails = async (id) => {

    try {
      //FIXME:
      // const response = await axiosInstance.get(
      //   `/get-userdetails?userId=${id}`,
      // );
      console.log('redux user >>>>', user);
      setUserData(user)
    } catch (error) {
      console.log('error', error)
    }

  }

  const changeHandler = (index, flag) => {
    let payload = { ...cartDetails };
    console.log('cartDetails', cartDetails);
    if (flag) {
      if (payload?.bookingFee > 0 && payload.now.length > 0) {
        payload.now[index].quantity = payload.now[index].quantity + 1;
      } else {
        payload.later[index].quantity = payload.later[index].quantity + 1;
      }
      // priceTemp[index].quantity = priceTemp[index].quantity + 1;
    } else if (!flag) {
      if (payload?.bookingFee > 0 && payload.now.length > 0) {
        payload.now[index].quantity = payload.now[index].quantity - 1;
      } else {
        payload.later[index].quantity = payload.later[index].quantity - 1;
      }
      // priceTemp[index].quantity = priceTemp[index].quantity - 1;
    }
    updateCart(payload);
  };

  const updateCart = async body => {
    try {
      let totalAmount = 0;
      let bookingFee = 0;
      let totalGratuity = 0;
      let totalAddOnAmt = 0;
      let totalLongHair = 0;
      let now = [];
      let later = [];
      var list = [];

      if (body.bookingFee > 0) {
        body.now.map(item => {
          const tempList = {
            Id: item?.Id,
            cartId: item?.cartId,
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: parseInt(item.price),
            gratuity: parseFloat(item.gratuity),
            addOnAmount: parseFloat(item.addOnAmount),
            longHairAmount: parseFloat(item.longHairAmount),
            imageUrl: item.imgUrl || item.imageUrl,
            artist: item.artist,
            bookingTime: item?.bookingTime || '',
          };
          now.push(tempList);
          totalAmount +=
            parseInt(item.price) * item.quantity +
            parseInt(item.gratuity * item.quantity) +
            parseInt(item.addOnAmount * item.quantity) +
            parseInt(item.longHairAmount * item.quantity)
          bookingFee = bookingFees;
          totalGratuity += parseInt(item.gratuity) * item.quantity;
          totalAddOnAmt += parseInt(item.addOnAmount) * item.quantity;
          totalLongHair += parseInt(item.longHairAmount) * item.quantity;
        });
      } else {
        body.later.map(item => {
          const tempList = {
            Id: item?.Id,
            cartId: item?.cartId,
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: parseInt(item.price),
            gratuity: parseFloat(item.gratuity),
            addOnAmount: parseFloat(item.addOnAmount),
            longHairAmount: parseFloat(item.longHairAmount),
            imageUrl: item.imgUrl || item.imageUrl,
            artist: item.artist,
            bookingTime: item?.bookingTime || '',
          };
          later.push(tempList);
          totalAmount +=
            parseInt(item.price) * item.quantity +
            parseInt(item.gratuity * item.quantity) +
            parseInt(item.addOnAmount * item.quantity) +
            parseInt(item.longHairAmount * item.quantity)
          bookingFee = 0;
          totalGratuity += parseInt(item.gratuity) * item.quantity;
          totalAddOnAmt += parseInt(item.addOnAmount) * item.quantity;
          totalLongHair += parseInt(item.longHairAmount) * item.quantity;
        });
      }
      let payload = {
        actionType: 'U',
        cartId: cartDetails.Id,
        totalAmount: (totalAmount + bookingFee).toString(),
        bookingFee: bookingFee.toString(),
        addressId: body.addressId,
        totalGratuity: totalGratuity.toString(),
        addOnAmount: totalAddOnAmt.toString(),
        longHairAmount: totalLongHair.toString(),
        now: now,
        later: later,
        bookingTime: body?.bookingTime || '',
      };

      // await AsyncStorage.removeItem(asynchEnums.CART_BOOKING)

      console.log('payload update >>>>', payload);
      const response = await axiosInstance.post(`/cart`, payload);
      console.log(response.data);
      getCartItems(userId);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteServiceListHandler = async (index) => {
    try {
      let nowCount = 0;
      let laterCount = 0;
      let payload = { ...cartDetails };
      if (payload?.bookingFee > 0) {
        nowCount = payload.now.length;
        payload.now = [payload.now[index]];
        // now.push(payload.now[index]);
      } else {
        laterCount = payload.later.length;
        payload.later = [payload.later[index]];
        // later.push(payload.later[index]);
      }
      // await AsyncStorage.removeItem(asynchEnums.CART_BOOKING)
      // console.log(payload, '>>>>>>>>>>>santosh', laterCount, nowCount);
      if (nowCount === 1 || laterCount === 1) {
        clearCartHandler();
      } else {
        deleteCartItemHandler(cartDetails, payload);
      }
      await AsyncStorage.removeItem(asynchEnums.CART_ID)
      await AsyncStorage.removeItem(asynchEnums.SEND_NOTI_ARTIST)
    } catch (err) {
      console.log(`Delete >>${err}`);
    }
  };

  const clearCartHandler = async () => {
    try {
      let payload = cartDetails;
      payload['actionType'] = 'C';
      const response = await axiosInstance.post(`/cart`, payload);
      console.log(response.data);
      setCartDetails(null);
      // returnRequestedArtistCount([])
      setServiceList([]);
      getCartItems(userId);
      await AsyncStorage.removeItem('summary');
    } catch (err) {
      console.log(err);
    }
  };

  const deleteCartItemHandler = async (body, deletePayload) => {
    try {
      let totalAmount = 0;
      let bookingFee = 0;
      let totalGratuity = 0;
      let addOn = 0;
      let longHair = 0;
      if (body.bookingFee > 0) {
        body.now.map(item => {
          totalAmount +=
            parseInt(item.price) * item.quantity +
            parseInt(item.gratuity * item.quantity);
          bookingFee = bookingFees;
          totalGratuity += parseInt(item.gratuity) * item.quantity;
          // addOn += parseInt(item.addOnAmount) * item.quantity;
          longHair += parseInt(item.longHairAmount) * item.quantity;
        });
        console.log(
          totalAmount,
          totalGratuity,
          addOn, longHair,
          deletePayload.now[0].price,
          deletePayload.now[0].gratuity,
        );
        totalAmount -=
          deletePayload.now[0].price * deletePayload.now[0].quantity +
          deletePayload.now[0].gratuity +
          parseInt(deletePayload.now[0].addOnAmount) +
          parseInt(deletePayload.now[0].longHairAmount);

        totalGratuity -= deletePayload.now[0].gratuity;
        addOn -= parseInt(deletePayload.now[0].addOnAmount)
        longHair -= parseInt(deletePayload.now[0].longHairAmount)
      } else {
        body.later.map(item => {
          totalAmount +=
            parseInt(item.price) * item.quantity +
            parseInt(item.gratuity * item.quantity);
          bookingFee = 0;
          totalGratuity += parseInt(item.gratuity) * item.quantity;
          addOn += parseInt(item.addOnAmount) * item.quantity;
          longHair += parseInt(item.longHairAmount) * item.quantity;
        });
        console.log(totalAmount, totalGratuity, deletePayload.later[0]?.price);
        totalAmount -=
          deletePayload.later[0].price * deletePayload.later[0].quantity +
          deletePayload.later[0].gratuity +
          parseInt(deletePayload.later[0].addOnAmount) +
          parseInt(deletePayload.later[0].longHairAmount)
          ;
        totalGratuity -= deletePayload.later[0].gratuity;
        // addOn -= parseInt(deletePayload.later[0].addOnAmount);
        longHair -= parseInt(deletePayload.later[0].longHairAmount);
      }

      let payload = {
        actionType: 'D',
        userId: body.userId,
        cartId: cartDetails.Id,
        totalAmount: (totalAmount + bookingFee).toString() == "NaN" ? 0 : totalAmount,
        bookingFee: bookingFee.toString(),
        addressId: body.addressId,
        totalGratuity: totalGratuity.toString(),
        addOnAmount: addOn.toString() == "NaN" ? 0 : addOn.toString(),
        longHairAmount: longHair.toString() == "NaN" ? 0 : longHair.toString(),
        // totalGratuity: totalGratuity.toString(),i
        // totalGratuity: totalGratuity.toString(),
        now: deletePayload.now,
        later: deletePayload.later,
        bookingTime: body?.bookingTime || '',
      };

      console.log(payload);
      const response = await axiosInstance.post(`/cart`, payload);
      console.log(response.data);
      dispatch({ type: IS_ADDED_CART, payload: true })

      getCartItems(userId);
    } catch (err) {
      console.log("Delete service >>>>", err);
    }
  };

  const changeCount = async () => {
    var list = [];
    serviceList.map((item, index) => {
      list.push(item);
      list[index].count = priceDetails[index].count;
    });
    await AsyncStorage.setItem('serviceJson', JSON.stringify(list));
  }


  useEffect(() => {

    const subscribe = setTimeout(async () => {
      if (requestTimer == 0) {
        setRequestTimer(0);
        setTimerModalVisible(false)
        setIsNotificationSended(false)
        // showToast("Artist not available!Please try after some time!")
        // setNotificationSendArtistIndex(0)
        clearInterval(intervalId)
        setRejOrErrorSentArtists([])
      } else if (requestTimer == 1 && artistFinalCount != acceptedArtist.length) {
        // setIsRetry(true)
        // setNotificationSendArtistIndex(notificationSendArtistIndex + 1)
        setRequestTimer(prev => { return prev - 1 });
        // showToast("Unable to find the artist please try again after sometime");
        setTimeout(() => {

          setUnableToFindModal(true)
        }, 1500);
      }
      else {
        if (requestTimer % 10 == 0 && !checkOutSummaryModal) {
          // console.log('individual >>>')

          if (!isSeperateSend) {
            getArtistByBookingId()
          } else {
            handleSeperateArtistRequest()
          }
          // else if (requestTimer % 10 == 0 && isNotificationSended){
          //   getHairArtistByBookingId();
          //   getMakeupArtistByBookingId()
          // }
          // console.log('artist setInterval >>>>>>', artistFinalCount)
          // if (!checkOutSummaryModal) {

          setTimeout(async () => {
            const acceptedArtist = await handleSendNotificationToUser();
            console.log('artist setInterval request Timer>>>>>>', acceptedArtist, artistFinalCount)

            handleAcceptedArtists(acceptedArtist, artistFinalCount)
          }, 1500);

          // }

        }
        setRequestTimer(prev => { return prev - 1 });
      }
    }, 1000);

    return () => {
      clearTimeout(subscribe)
      clearInterval(intervalId)
    }

  }, [requestTimer, checkOutSummaryModal])

  useEffect(() => {

    const subscribe = setTimeout(() => {
      if (requestTimerBoth == 0) {
        setRequestTimerBoth(0);
        setTimerModalVisible(false)
        setIsNotificationSended(false)
        // showToast("Artist not available!Please try after some time!")
        // setNotificationSendArtistIndex(0)
        clearInterval(intervalId)
        setRejOrErrorSentArtists([])
      }
      else if (requestTimerBoth == 1) {
        // setIsRetry(true)
        // setNotificationSendArtistIndex(notificationSendArtistIndex + 1)
        setRequestTimerBoth(prev => { return prev - 1 });
        // showToast("Unable to find the artist please try again after sometime")
        setTimeout(() => {

          setUnableToFindModal(true)
        }, 1500);
      }
      else {
        if (requestTimerBoth % 2 == 0 && isNotificationSended) {

          console.log('seperate >>>')

          if (!isMakeUpArtistCountFulfilled && requestTimerBoth % 4 == 0) {
            getMakeupArtistByBookingId()
          }

          if (!isHairArtistCountFulfilled && requestTimerBoth % 6 == 0) {
            getHairArtistByBookingId();
          }
        }
        setRequestTimerBoth(prev => { return prev - 2 });
      }
    }, 2000);

    return () => {

      clearTimeout(subscribe)
      clearInterval(intervalId)
    }

  }, [requestTimerBoth])

  const returnRequestedArtistCount = useCallback(() => {

    let ma = 0;
    let ha = 0;

    const calculateCount = (items) => {
      items?.length > 0 &&
        items?.forEach((item) => {
          // const makeTemp = makeServiceData?.filter((i) => item.serviceId === i.serviceId) || [];
          // const hairTemp = hairServiceData?.filter((i) => item.serviceId === i.serviceId) || [];
          if (item.categoryId == 1) {
            ha += item.quantity;
          }

          if (item.categoryId == 2) {
            ma += item.quantity;
          }


        });
    };

    calculateCount(cartDetails?.now);
    calculateCount(cartDetails?.later);

    const haCount = Math.ceil(ha / 4);
    const maCount = Math.ceil(ma / 4);

    const totalCount = haCount + maCount;

    return [haCount, maCount, totalCount]


  }, [cartDetails]);


  const initiatePayment = async orderObj => {
    setPaymentInitiated(true);
    const billingDetails = {
      name: userData?.firstName + " " + userData?.lastName,
      email: userData?.email,
      phone: "+" + userData?.countryCode + " " + userData?.phone,
    }
    console.log('billingDetails >>>', billingDetails)
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
      defaultBillingDetails: billingDetails,
      billingDetailsCollectionConfiguration: {
        address: PaymentSheet.AddressCollectionMode.NEVER,
      },
      returnURL: 'http://localhost:3001',
    });
    setIsLoading(false);
    if (error) {
      setPaymentInitiated(false);
      console.error(error);
    } else {
      console.log('pamentSheetInititated');
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const { error } = await presentPaymentSheet();
        if (error) {
          console.error("presentPaymentSheet error >>>", error);
          showToast(`${error.localizedMessage}`);
          setIsHairArtistCountFulfilled(false)
          setIsMakeUpArtistCountFulfilled(false)
          setPaymentInitiated(false);

        } else {
          console.log('PaymentSheetClosed');
          confirmBooking(orderObj);
        }
      } catch (err) {
        console.error("initiatePayment err >>>", err);
      }
    }
  };

  const isBookingTimePassed = (bookingTime) => {
    const bookingMoment = moment(bookingTime, "'DD MMM, YYYY, hh:mm A");
    const now = moment();
    // console.log('bookingTime >>>>', bookingTime)
    // Compare bookingTime with the current time
    if (bookingMoment.isBefore(now)) {
      console.log("The booking time has passed.");
      return true;
    } else {
      console.log("The booking time is in the future.");
      return false;
    }
  }

  const handleFindArtist = async () => {

    try {
      console.log('artist >>>>',)
      const [hairCount, makeCount] = returnRequestedArtistCount();
      if (address == "") {
        showToast('Please select address!')
        setTimeout(() => {
          navigation.navigate('BookAppointment', {
            guestUser: false,
            cartId: cartDetails.Id,
            cartDetails: JSON.stringify(cartDetails),
          });
        }, 1000);
        return;
      } else if (!dateTime) {
        console.log('dateTime not found>>>>>>' + dateTime);
        // Toast.show({
        //   type: 'error',
        //   text1: 'Please select date and time of booking!',
        // });
        showToast('Please select date and time of booking!')
        setTimeout(() => {
          navigation.navigate('BookAppointment', {
            guestUser: false,
            cartId: cartDetails.Id,
            cartDetails: JSON.stringify(cartDetails),
          });
        }, 1000);
        return;
      } else if (isBookingTimePassed(dateTime)) {
        showToast('Date and time passed! Please select date and time of booking!')
        setTimeout(() => {
          navigation.navigate('BookAppointment', {
            guestUser: false,
            cartId: cartDetails.Id,
            cartDetails: JSON.stringify(cartDetails),
          });
        }, 1000);
      }
      // else if (acceptedArtist.length ) {
      //   setCheckOutSummaryModal(true)
      // } 
      else if (hairCount > 0 && makeCount > 0) {
        setBothServiceInfoModal(true)
      }
      else {
        // setIsSeperateSend(true)

        setRequestTimer(90);
        setTimerModalVisible(true);

        const availableArtist = await handleCheckAvailableArtists()

        if (availableArtist.length > 0) {
          getArtistByBookingId()
        } else {
          //When no artist available
          setRequestTimer(0);
          setTimerModalVisible(false);
          setUnableToFindModal(true)
          showToast("We're sorry, but no artists are available right now. Please try again shortly.")
        }
        // getArtistByBookingId()

      }
    } catch (error) {
      if (error.response.status === 404) {
        showToast(error.response.data.message)
        console.error('error handleFindArtist >>>', error.response.data.message)
      }
      console.log('error >>>', error)
    }

  }

  useEffect(() => {

    if (isOrderAccepted && Platform.OS == "android") {
      const getData = async () => {
        // const data=await AsyncStorage.getItem(asynchEnums.ACCEPTED_USER_ORDER);
        console.log('artist Accept notification >>>>>>', isOrderAccepted)

        const acceptedArtist = await handleSendNotificationToUser();
        console.log('artist Accept data >>>>>>', acceptedArtist)

        handleAcceptedArtists(acceptedArtist, artistFinalCount)

      }
      getData()
    }
  }, [isOrderAccepted])

  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     console.log('artist setInterval >>>>>>', !checkOutSummaryModal && requestTimer != 0)
  //     if (!checkOutSummaryModal) {
  //       console.log('artist setInterval 1111 >>>>>>')
  //       const acceptedArtist = await handleSendNotificationToUser();
  //       console.log('artist setInterval >>>>>>', acceptedArtist)

  //       handleAcceptedArtists(acceptedArtist, artistFinalCount)
  //     }

  //   }, 10000);

  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, []);



  const handleCheckAvailableArtists = async () => {

    console.log('userCartId', userCartId)
    const userId = await AsyncStorage.getItem("id");
    const userCartId = await AsyncStorage.getItem(asynchEnums.CART_ID);

    if (!userCartId) {
      return []
    }
    let availableArtist = [];
    // const userId = ;
    // const userCartId = cartDetails?.Id;

    // console.log('userCartId', userCartId)
    const businessTypes = [3, 1, 2];

    for (const businessType of businessTypes) {
      try {
        const url = `/usertoartistlocation?userId=${userId}&userCartId=${userCartId}&businessType=${businessType}`;
        console.log('handleSendNotificationToUser url >>>>', url)
        const userOrderResponse = await axiosInstance.get(url);

        if (userOrderResponse?.status !== 404) {
          // acceptedArtist += userOrderResponse?.data?.acceptedArtists?.length || 0;
          availableArtist.push(userOrderResponse?.data?.acceptedArtists);
          availableArtist.push(userOrderResponse?.data?.availableArtists);
          // break;
        }
        // if (userOrderResponse?.status !== 404) {
        //   const artists = userOrderResponse?.data?.acceptedArtists;
        //   if (artists?.length) {
        //     acceptedArtist.push(artists);
        //     break;
        //   }
        // }
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("Error fetching user order:", error);
        }
      }
    }

    console.log('availableArtist user>>>', availableArtist)

    return availableArtist.flat();  // Return the final data
  };

  const handleSendNotificationToUser = async () => {

    console.log('userCartId', userCartId)
    const userId = await AsyncStorage.getItem("id");
    const userCartId = await AsyncStorage.getItem(asynchEnums.CART_ID);

    if (!userCartId) {
      return []
    }
    let acceptedArtist = [];
    // const userId = ;
    // const userCartId = cartDetails?.Id;

    // console.log('userCartId', userCartId)
    const businessTypes = [3, 1, 2];

    for (const businessType of businessTypes) {
      try {
        const url = `/usertoartistlocation?userId=${userId}&userCartId=${userCartId}&businessType=${businessType}`;
        console.log('handleSendNotificationToUser url >>>>', url)
        const userOrderResponse = await axiosInstance.get(url);

        if (userOrderResponse?.status !== 404) {
          // acceptedArtist += userOrderResponse?.data?.acceptedArtists?.length || 0;
          acceptedArtist.push(userOrderResponse?.data?.acceptedArtists);
          // break;
        }
        // if (userOrderResponse?.status !== 404) {
        //   const artists = userOrderResponse?.data?.acceptedArtists;
        //   if (artists?.length) {
        //     acceptedArtist.push(artists);
        //     break;
        //   }
        // }
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("Error fetching user order:", error);
        }
      }
    }

    console.log('acceptedArtist user>>>', acceptedArtist)

    return acceptedArtist.flat();  // Return the final data
  };

  const handleRetry = () => {
    setIsRetry(false)
    getArtistByBookingId()
  }



  const getArtistByBookingId = async () => {
    try {


      // flow => First send the request to both skill artist 
      // If both skill artist not found(404) then look for seperate skill artists 

      const id = await AsyncStorage.getItem("id");
      const cartId = cartDetails?.Id;
      const [hairCount, makeCount] = returnRequestedArtistCount();

      let businessType = 3;
      let finalCount = hairCount + makeCount;

      // if (hairCount === 0 && makeCount > 0) businessType = 2;
      // if (hairCount > 0 && makeCount === 0) businessType = 1;

      if (makeCount > 0 && hairCount > 0) {
        businessType = 3;
        finalCount = Math.ceil(finalCount / 2);
        // console.log('finalCount >>>', finalCount)
      }
      let groupedItems = []
      if (cartDetails.now.length > 0) {
        groupedItems = groupItemsWithoutRemoving(cartDetails.now, finalCount);
      }

      if (cartDetails.later.length > 0) {
        groupedItems = groupItemsWithoutRemoving(cartDetails.later, finalCount);
      }

      console.log('groupedItems >>>', groupedItems)

      // return;
      setArtistFinalCount(finalCount)
      const url = `/usertoartistlocation?userId=${id}&userCartId=${cartId}&businessType=${businessType}`;
      console.log("url", url);
      console.log("finalCount >>>", finalCount);

      const { data } = await axiosInstance.get(url);
      console.log("artistResponse >>>>", JSON.stringify(data));

      if (data?.status !== "success") {
        showToast(data?.message);
        return;
      }

      setArtistData(data);

      const availableArtists = data?.availableArtists?.length == 0 ? [] : data?.availableArtists;
      const acceptedArtists = data?.acceptedArtists.length == 0 ? [] : data?.acceptedArtists;
      console.log(data?.availableArtists?.length === 0 && acceptedArtist?.length == 0)
      // if ((!availableArtists && availableArtists.length === 0) && acceptedArtist.length == 0) {
      if (data?.availableArtists?.length === 0 && acceptedArtists?.length == 0) {

        // // if (makeCount > 0 && hairCount > 0) {
        // setIsSeperateSend(true);
        // setRequestTimer(0)
        // setTimerModalVisible(true);
        // setIsNotificationSended(true)
        // setRequestTimerBoth(100);

        handleSeperateArtistRequest(finalCount);
        return
        // }
        // resetSearchState();
        // return showToast("Artist not available! Please try after some time!");
      }


      if (acceptedArtists.length > 0 && acceptedArtists[0]?.status === bookingStatusEnums.ACCEPTED) {
        handleAcceptedArtists(acceptedArtists, finalCount);
        if (finalCount == acceptedArtists.length) {
          return
        }

        finalCount = finalCount - (acceptedArtists?.length || 0);

        const bookingData = acceptedArtists?.flatMap(item => item?.bookingDetails || []);
        groupedItems = removeBookingDetails(groupedItems, bookingData)

        console.log('new groupedItems >>>>', groupedItems)
        // return;
      }

      const noResponseArtistData = await AsyncStorage.getItem(asynchEnums.SEND_NOTI_ARTIST);
      const parsedNoResponseArtist = noResponseArtistData && JSON.parse(noResponseArtistData);
      console.log('parsedNoResponseArtist', parsedNoResponseArtist)
      let filterArtist = []
      if (parsedNoResponseArtist != null) {
        filterArtist = availableArtists.filter(
          (item) => !parsedNoResponseArtist.includes(item?.artistId)
        ) || [];
      } else {
        filterArtist = availableArtists;
      }

      console.log("filterArtist Both >>>>", filterArtist);
      // console.log("rejOrErrorSentArtists >>>>", rejOrErrorSentArtists);

      if (filterArtist.length === 0) {
        // // resetSearchState();
        // setIsSeperateSend(true);
        // setRequestTimer(0)
        // setTimerModalVisible(true);
        // setIsNotificationSended(true)
        // setRequestTimerBoth(100);

        handleSeperateArtistRequest(finalCount);
        return
        // showToast("Artist not available! Please try after some time!");
        // return;
      }

      if (!isNotificationSended || !notificationSentArtists.includes(filterArtist[0]?.artistId)) {
        sendNotifications(filterArtist, finalCount, data, groupedItems);
      }
    } catch (error) {
      handleError(error);
    }
  };


  const handleSeperateArtistRequest = async () => {

    // const acceptedArtist = await handleSendNotificationToUser();
    // console.log('artist Accept data >>>>>>', acceptedArtist,artistFinalCount)
    // if (acceptedArtist &&artistFinalCount!=0&& acceptedArtist.length == artistFinalCount) {

    //   handleAcceptedArtists(acceptedArtist, artistFinalCount)
    //   return
    // }

    console.log('isConditionFulfilledRef.current', isConditionFulfilledRef.current)
    if (isConditionFulfilledRef.current) {
      return
    }
    setIsSeperateSend(true);


    const [hairCount, makeCount] = returnRequestedArtistCount();

    if (hairCount > 0) {
      getHairArtistByBookingId();
    }

    if (makeCount > 0) {
      setTimeout(() => {
        getMakeupArtistByBookingId()
        // setIsNotificationSended(true)
      }, 7000);//delay to 10 sec
    }
  }

  const getHairArtistByBookingId = async () => {
    try {
      const id = await AsyncStorage.getItem("id");
      const cartId = cartDetails?.Id;
      const [hairCount, makeCount] = returnRequestedArtistCount();

      let businessType = 1;
      let finalCount = hairCount + makeCount;
      // if (hairCount === 0 && makeCount > 0) businessType = 2;
      // if (hairCount > 0 && makeCount === 0) businessType = 1;
      // if (makeCount > 0 && hairCount > 0) {
      //   businessType = 3;
      //   finalCount = Math.ceil(finalCount / 2);
      //   // console.log('finalCount >>>', finalCount)

      // }
      let groupedItems = []
      if (cartDetails.now.length > 0) {
        groupedItems = groupItemsWithoutRemovingWithCategoyId(cartDetails.now, hairCount, 1);
      }

      if (cartDetails.later.length > 0) {
        groupedItems = groupItemsWithoutRemovingWithCategoyId(cartDetails.later, hairCount, 1);
      }

      console.log('groupedItems >>>', groupedItems)

      // return;

      // if(isHairArtistCountFulfilled){
      //   return
      // }

      if (groupedItems.length < 1) {
        return
      }
      setArtistFinalCount(finalCount)
      const url = `/usertoartistlocation?userId=${id}&userCartId=${cartId}&businessType=${businessType}`;
      console.log("url", url);
      console.log("finalCount >>>", finalCount);

      const { data } = await axiosInstance.get(url);
      console.log("artistResponse getHairArtistByBookingId>>>>", JSON.stringify(data));

      if (data?.status !== "success") {
        showToast(data?.message);
        return;
      }

      setArtistData(data);


      const availableArtists = data?.availableArtists.length == 0 ? [] : data?.availableArtists;
      const acceptedArtists = data?.acceptedArtists.length == 0 ? [] : data?.acceptedArtists;
      if ((!availableArtists && availableArtists.length === 0) && acceptedArtists.length == 0) {
        // resetSearchState();
        // return showToast("Artist not available! Please try after some time!");
      }

      if (acceptedArtist && finalCount == acceptedArtist.length) {
        return
      }

      if (requestTimer === 0 || isRetry) {
        setRequestTimer(90);
        setTimerModalVisible(true);
      }


      if (acceptedArtists.length > 0 && acceptedArtists[0]?.status === bookingStatusEnums.ACCEPTED) {
        handleAcceptedArtists(acceptedArtist, finalCount);
        if (hairCount == acceptedArtists.length) {
          // setIsHairArtistCountFulfilled(true)
          const temp = [...acceptedArtist, ...acceptedArtists]
          setAcceptedArtist(temp)
          return
        }
        finalCount = finalCount - (acceptedArtists?.length || 0);

        const bookingData = acceptedArtists?.flatMap(item => item?.bookingDetails || []);
        groupedItems = removeBookingDetails(groupedItems, bookingData)

        console.log('new groupedItems >>>>', groupedItems)
        // return;
      }

      const noResponseArtistData = await AsyncStorage.getItem(asynchEnums.SEND_NOTI_ARTIST);
      const parsedNoResponseArtist = noResponseArtistData && JSON.parse(noResponseArtistData);
      console.log('parsedNoResponseArtist', parsedNoResponseArtist)
      let filterArtist = []
      if (parsedNoResponseArtist != null) {
        filterArtist = availableArtists.filter(
          (item) => !parsedNoResponseArtist.includes(item?.artistId)
        ) || [];
      } else {
        filterArtist = availableArtists;
      }

      console.log("filterArtist hair >>>>", filterArtist);

      if (filterArtist.length === 0) {
        // resetSearchState();
        // showToast("Artist not available! Please try after some time!");
        // return;
      }

      if (!isNotificationSended || !notificationSentArtists.includes(filterArtist[0]?.artistId)) {
        if (filterArtist.length != 0) {
          sendNotificationsHair(filterArtist, finalCount, data, groupedItems);
        }
      }
    } catch (error) {
      handleErrorHair(error);
    }
  };

  const getMakeupArtistByBookingId = async () => {
    try {
      const id = await AsyncStorage.getItem("id");
      const cartId = cartDetails?.Id;
      const [hairCount, makeCount] = returnRequestedArtistCount();

      let businessType = 2;
      let finalCount = hairCount + makeCount;
      // if (hairCount === 0 && makeCount > 0) businessType = 2;
      // if (hairCount > 0 && makeCount === 0) businessType = 1;
      // if (makeCount > 0 && hairCount > 0) {
      //   businessType = 3;
      //   finalCount = Math.ceil(finalCount / 2);
      //   // console.log('finalCount >>>', finalCount)

      // }
      let groupedItems = []
      if (cartDetails.now.length > 0) {
        groupedItems = groupItemsWithoutRemovingWithCategoyId(cartDetails.now, makeCount, 2);
      }

      if (cartDetails.later.length > 0) {
        groupedItems = groupItemsWithoutRemovingWithCategoyId(cartDetails.later, makeCount, 2);
      }

      console.log('groupedItems >>>', groupedItems)
      if (groupedItems.length < 1) {
        return
      }

      // return;
      setArtistFinalCount(finalCount)
      const url = `/usertoartistlocation?userId=${id}&userCartId=${cartId}&businessType=${businessType}`;
      console.log("url", url);
      console.log("finalCount >>>", finalCount);

      // if(isMakeUpArtistCountFulfilled){
      //   return
      // }

      const { data } = await axiosInstance.get(url);
      console.log("artistResponse getMakeupArtistByBookingId>>>>", JSON.stringify(data));

      if (data?.status !== "success") {
        showToast(data?.message);
        return;
      }

      setArtistData(data);



      const availableArtists = data?.availableArtists.length == 0 ? [] : data?.availableArtists;
      const acceptedArtists = data?.acceptedArtists.length == 0 ? [] : data?.acceptedArtists;
      if ((!availableArtists && availableArtists.length === 0) && acceptedArtists.length == 0) {
        // resetSearchState();
        // return showToast("Artist not available! Please try after some time!");
      }

      console.log('isConditionFulfilledRef.current makeup>>>', isConditionFulfilledRef.current)
      if (isConditionFulfilledRef.current) {
        return
      }

      if (requestTimer === 0) {
        setRequestTimer(90);
        setTimerModalVisible(true);
      }


      if (acceptedArtists.length > 0 && acceptedArtists[0]?.status === bookingStatusEnums.ACCEPTED) {

        handleAcceptedArtists(acceptedArtist, finalCount);
        if (makeCount == acceptedArtists.length) {

          const temp = [...acceptedArtist, ...acceptedArtists]

          console.log('makeup accepted tems >>>>', temp)
          setAcceptedArtist(temp)
          return
        }
        finalCount = finalCount - (acceptedArtists?.length || 0);

        const bookingData = acceptedArtists?.flatMap(item => item?.bookingDetails || []);
        groupedItems = removeBookingDetails(groupedItems, bookingData)

        console.log('new groupedItems >>>>', groupedItems)
        // return;
      }


      const noResponseArtistData = await AsyncStorage.getItem(asynchEnums.SEND_NOTI_ARTIST);
      const parsedNoResponseArtist = noResponseArtistData && JSON.parse(noResponseArtistData);
      console.log('parsedNoResponseArtist', parsedNoResponseArtist)
      let filterArtist = []
      if (parsedNoResponseArtist != null) {
        filterArtist = availableArtists.filter(
          (item) => !parsedNoResponseArtist.includes(item?.artistId)
        ) || [];
      } else {
        filterArtist = availableArtists;
      }

      console.log("filterArtist Makeup >>>>", filterArtist);

      if (filterArtist.length === 0) {
        // resetSearchState();
        // showToast("Artist not available! Please try after some time!");
        // return;
      }

      if (!isNotificationSended || !notificationSentArtists.includes(filterArtist[0]?.artistId)) {
        if (filterArtist.length != 0) {
          sendNotificationsHairAndMakeup(filterArtist, finalCount, data, groupedItems);
        }

      }
    } catch (error) {
      handleErrorMakeup(error);
    }
  };

  function removeBookingDetails(groupedItems, bookingDetails) {
    const cartItemIdsToRemove = new Set(bookingDetails.map(item => item.cartitemId));

    return groupedItems.map(group =>
      group.filter(item => !cartItemIdsToRemove.has(item.Id))
    ).filter(group => group.length > 0); // Remove empty groups
  }

  const resetSearchState = () => {
    setRequestTimer(0);
    setTimerModalVisible(false);
    setIsNotificationSended(false);
    setRejOrErrorSentArtists([]);
    setNotificationSentArtists([]);
  };

  const handleAcceptedArtists = (acceptedArtists, finalCount) => {
    let totalTravelFee = acceptedArtists.reduce((sum, item) => sum + item?.travelFee, 0);
    // console.log('acceptedArtists >>>>', acceptedArtists)
    const uniqueArtists = Object.values(
      acceptedArtists.reduce((acc, artist) => {
        acc[artist.artistId] = artist;
        return acc;
      }, {})
    );
    console.log('uniqueArtists >>>>', uniqueArtists)

    if (uniqueArtists.length != 0 && finalCount === uniqueArtists.length) {
      isConditionFulfilledRef.current = true
      setCountFulfilled(true)
      setRequestTimer(0);
      setRequestTimerBoth(0)
      setTotalTravelFee(parseInt(totalTravelFee));
      setTimerModalVisible(false);
      setBothServiceInfoModal(false)
      setIsMakeUpArtistCountFulfilled(true)
      setIsHairArtistCountFulfilled(true)
      // showToast("Request accepted by artist");
      setAcceptedArtist(uniqueArtists);
      setCheckOutSummaryModal(true);
    }
  };

  const sendNotifications = (filterArtist, finalCount, artistResponse, sendCartItems) => {
    setNotificationSentArtists((prev) => [...prev, filterArtist[0]?.artistId]);


    if (finalCount > filterArtist.length) {
      resetSearchState();
      return showToast("Artist not available! Please try after some time!");
    }

    const sendCart = {
      addressId: cartDetails?.addressId,
      userId: cartDetails?.userId,
      bookingTime: cartDetails?.bookingTime
    }
    setIsNotificationSended(true);

    if (finalCount == 1) {
      const data = {
        totalAmount,
        bookingFee: cartType == "later" ? 0 : bookingFees,
        artistBookingCount: finalCount,
        userToken: fcmToken || "", // accept send notification
        cartDetails: sendCart,
        // addOnAmount:
        artistDetails: filterArtist[0],
        cartItems: sendCartItems[0],
        ...artistResponse,
      };

      handleNotification(data, filterArtist[0]);

    } else {
      //Send to multiple artist request

      //If both artist not available then send to seperate
      if (sendCartItems.length > filterArtist.length) {
        handleSeperateArtistRequest()
      } else {
        for (let i = 0; i < sendCartItems.length; i++) {
          const data = {
            totalAmount,
            bookingFee: cartType == "later" ? 0 : bookingFees,
            artistBookingCount: finalCount,
            userToken: fcmToken || "", // accept send notification
            cartDetails: sendCart,
            artistDetails: filterArtist[i],
            cartItems: sendCartItems[i],
            ...artistResponse,
          };

          setTimeout(() => {
            handleNotificationForMultipleArtist(data, filterArtist[i]);
          }, i * 3000);
        }
      }

    }
  };

  const sendNotificationsHairAndMakeup = (filterArtist, finalCount, artistResponse, sendCartItems) => {
    setNotificationSentArtists((prev) => [...prev, filterArtist[0]?.artistId]);
    setIsNotificationSended(true);

    // if (finalCount > filterArtist.length) {
    //   resetSearchState();
    //   return showToast("Artist not available! Please try after some time!");
    // }

    const sendCart = {
      addressId: cartDetails?.addressId,
      userId: cartDetails?.userId,
      bookingTime: cartDetails?.bookingTime
    }

    if (finalCount == 1) {
      const data = {
        totalAmount,
        bookingFee: cartType == "later" ? 0 : bookingFees,
        artistBookingCount: finalCount,
        userToken: fcmToken || "", // accept send notification
        cartDetails: sendCart,
        artistDetails: filterArtist[0],
        cartItems: sendCartItems[0],
        ...artistResponse,
      };

      handleNotification(data, filterArtist[0]);

    } else {
      //Send to multiple artist request

      //If makeup artist not available then no action
      if (sendCartItems.length > filterArtist.length) {

      } else {
        for (let i = 0; i < sendCartItems.length; i++) {
          const data = {
            totalAmount,
            bookingFee: cartType == "later" ? 0 : bookingFees,
            artistBookingCount: finalCount,
            userToken: fcmToken || "", // accept send notification
            cartDetails: sendCart,
            artistDetails: filterArtist[i],
            cartItems: sendCartItems[i],
            ...artistResponse,
          };

          console.log('Hair notification artist filterArtist[i]', filterArtist[i])
          setTimeout(() => {
            handleNotificationForMultipleArtist(data, filterArtist[i]);
          }, i * 3000);
        }
      }

    }
  }

  const sendNotificationsHair = (filterArtist, finalCount, artistResponse, sendCartItems) => {
    setNotificationSentArtists((prev) => [...prev, filterArtist[0]?.artistId]);
    setIsNotificationSended(true);

    // if (finalCount > filterArtist.length) {
    //   resetSearchState();
    //   return showToast("Artist not available! Please try after some time!");
    // }

    const sendCart = {
      addressId: cartDetails?.addressId,
      userId: cartDetails?.userId,
      bookingTime: cartDetails?.bookingTime
    }


    if (finalCount == 1) {
      const data = {
        totalAmount,
        bookingFee: cartType == "later" ? 0 : bookingFees,
        artistBookingCount: finalCount,
        userToken: fcmToken || "", // accept send notification
        cartDetails: sendCart,
        artistDetails: filterArtist[0],
        cartItems: sendCartItems[0],
        ...artistResponse,
      };

      handleNotification(data, filterArtist[0]);

    } else {
      //Send to multiple artist request
      console.log('Hair notification sendCartItems >>> ', sendCartItems)
      //If hair artist not available then no action
      if (sendCartItems.length > filterArtist.length) {

      } else {
        for (let i = 0; i < sendCartItems.length; i++) {
          const data = {
            totalAmount,
            bookingFee: cartType == "later" ? 0 : bookingFees,
            artistBookingCount: finalCount,
            userToken: fcmToken || "", // accept send notification
            cartDetails: sendCart,
            artistDetails: filterArtist[i],
            cartItems: sendCartItems[i],
            ...artistResponse,
          };

          console.log('Hair notification artist filterArtist[i]', filterArtist[i])
          console.log('Hair notification artist filterArtist[i] data ', data)

          setTimeout(() => {
            handleNotificationForMultipleArtist(data, filterArtist[i]);
          }, i * 3000);
        }
      }

    }
  }

  const handleError = (error) => {
    if (error?.response?.status === 404) {
      // showToast(error?.response?.data?.message);
      // const [hairCount, makeCount] = returnRequestedArtistCount();
      // if(hairCount>0&& makeCount>0&&!isSeperateSend){
      //   setIsSeperateSend(true)
      //   setTimerModalVisible(true);
      //   setRequestTimer(100)
      //   getHairArtistByBookingId();
      //   getMakeupArtistByBookingId()
      // }
      setRequestTimer(90);
      setTimerModalVisible(true);
      handleSeperateArtistRequest(artistFinalCount);

      // if (error?.response?.data?.message == "No artists found within 150 miles.") {

      //   setIsSeperateSend(true)
      //   //FIXME:
      //   setIsHairArtistCountFulfilled(false)
      //   setIsMakeUpArtistCountFulfilled(false)
      //   setRequestTimer(0)
      //   setTimerModalVisible(true);
      //   setIsNotificationSended(true)
      //   setRequestTimerBoth(100);
      // }


      console.error("error getArtistByBookingId >>>", error?.response?.data?.message);
    } else {
      console.error("error getArtistByBookingId >>>", error);
    }
  };

  const handleErrorHair = (error) => {
    if (error?.response?.status === 404) {



      console.error("error handleErrorHair >>>", error?.response?.data?.message);
    } else {
      console.error("error getArtistByBookingId >>>", error);
    }
  };

  const handleErrorMakeup = (error) => {
    if (error?.response?.status === 404) {

      console.error("error handleErrorMakeup >>>", error?.response?.data?.message);
    } else {
      console.error("error getArtistByBookingId >>>", error);
    }
  };

  function groupItemsWithoutRemoving(items, groupQty) {
    let grouped = [];
    let remaining = [...items]; // Keep original list intact
    let totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    let targetPerGroup = Math.ceil(totalQuantity / groupQty); // Evenly distribute items

    for (let i = 0; i < groupQty; i++) {
      let currentGroup = [];
      let currentTotal = 0;

      for (let item of remaining) {
        if (currentTotal + item.quantity <= targetPerGroup) {
          currentGroup.push(item);
          currentTotal += item.quantity;
        }

        if (currentTotal >= targetPerGroup) break;
      }

      grouped.push(currentGroup);
      remaining = remaining.filter(item => !currentGroup.includes(item));

      if (remaining.length === 0) break;
    }

    return grouped;
  }
  // function groupItemsWithoutRemovingWithCategoyId(items, groupQty, categoryId) {

  //   let filteredItems = items.filter(item => item.categoryId === categoryId);

  //   if (filteredItems.length === 0) return []; // Return empty if no items match

  //   let grouped = [];
  //   let remaining = [...filteredItems]; // Keep original list intact
  //   let totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  //   let targetPerGroup = Math.ceil(totalQuantity / groupQty); // Evenly distribute items

  //   for (let i = 0; i < groupQty; i++) {
  //     let currentGroup = [];
  //     let currentTotal = 0;

  //     for (let item of remaining) {
  //       if (currentTotal + item.quantity <= targetPerGroup) {
  //         currentGroup.push(item);
  //         currentTotal += item.quantity;
  //       }

  //       if (currentTotal >= targetPerGroup) break;
  //     }

  //     grouped.push(currentGroup);
  //     remaining = remaining.filter(item => !currentGroup.includes(item));

  //     if (remaining.length === 0) break;
  //   }

  //   return grouped;
  // }

  function groupItemsWithoutRemovingWithCategoyId(items, groupQty, categoryId) {
    const filteredItems = items.filter(item => item.categoryId === categoryId);

    if (filteredItems.length === 0) return [];

    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const targetPerGroup = Math.floor(totalQuantity / groupQty);
    const remainder = totalQuantity % groupQty;

    let result = [];
    let remainingQty = totalQuantity;
    let itemIndex = 0;
    let currentItem = { ...filteredItems[itemIndex] }; // Clone to avoid mutation
    let currentItemQtyLeft = currentItem.quantity;

    for (let i = 0; i < groupQty; i++) {
      let groupQtyTarget = targetPerGroup + (i < remainder ? 1 : 0); // Distribute remainders first
      let group = [];

      while (groupQtyTarget > 0 && itemIndex < filteredItems.length) {
        const takeQty = Math.min(groupQtyTarget, currentItemQtyLeft);

        group.push({ ...currentItem, quantity: takeQty });

        groupQtyTarget -= takeQty;
        currentItemQtyLeft -= takeQty;

        if (currentItemQtyLeft === 0 && itemIndex < filteredItems.length - 1) {
          itemIndex++;
          currentItem = { ...filteredItems[itemIndex] };
          currentItemQtyLeft = currentItem.quantity;
        }
      }

      result.push(group);
    }

    return result;
  }


  const handleNotification = debounce(async (sendData, data) => {
    const receiver = data?.devices?.[0]?.deviceToken;
    if (!receiver) return;

    const requestData = { customData: JSON.stringify(sendData) };
    try {
      await axiosInstance.post('/send-notification', {
        receiver,
        title: 'Booking request received!',
        body: 'Tap to open app and accept request',
        data: requestData,
      });
    } catch (err) {
      console.error('handleNotification send error >>>', err);
    }

    const sendArtistData = await AsyncStorage.getItem(asynchEnums.SEND_NOTI_ARTIST);
    const parseData = sendArtistData && JSON.parse(sendArtistData);
    if (parseData) {
      const finalData = [...parseData];
      finalData.push(data?.artistId);
      console.log('finalData  artist >>>>', finalData);
      await AsyncStorage.setItem(asynchEnums.SEND_NOTI_ARTIST, JSON.stringify(finalData));
    } else {
      const finalData = [data?.artistId];
      console.log('finalData  else >>>>', finalData);
      await AsyncStorage.setItem(asynchEnums.SEND_NOTI_ARTIST, JSON.stringify(finalData));
    }
  }, 5000);

  const handleNotificationForMultipleArtist = async (sendData, data) => {
    const receiver = data?.devices?.[0]?.deviceToken;
    if (!receiver) return;

    const requestData = { customData: JSON.stringify(sendData) };
    try {
      await axiosInstance.post('/send-notification', {
        receiver,
        title: 'Booking request received!',
        body: 'Tap to open app and accept request',
        data: requestData,
      });
      console.log('notification sent to', receiver);
    } catch (err) {
      console.error('handleNotificationForMultipleArtist error >>>', err);
    }

    const sendArtistData = await AsyncStorage.getItem(asynchEnums.SEND_NOTI_ARTIST);
    const parseData = sendArtistData && JSON.parse(sendArtistData);
    console.log('parseData  artist >>>>', parseData);
    if (parseData) {
      const finalData = [...parseData];
      finalData.push(data?.artistId);
      console.log('finalData  artist >>>>', finalData);
      await AsyncStorage.setItem(asynchEnums.SEND_NOTI_ARTIST, JSON.stringify(finalData));
    } else {
      const finalData = [data?.artistId];
      console.log('finalData  else >>>>', finalData);
      await AsyncStorage.setItem(asynchEnums.SEND_NOTI_ARTIST, JSON.stringify(finalData));
    }
  }


  const handleNotificationHair = debounce(async (sendData, data) => {
    const receiver = data?.devices?.[0]?.deviceToken;
    if (!receiver) return;

    const requestData = { customData: JSON.stringify(sendData) };
    try {
      await axiosInstance.post('/send-notification', {
        receiver,
        title: 'Booking request received!',
        body: 'Tap to open app and accept request',
        data: requestData,
      });
    } catch (err) {
      console.error('handleNotificationHair error >>>', err);
    }

    const sendArtistData = await AsyncStorage.getItem(asynchEnums.SEND_NOTI_ARTIST);
    const parseData = sendArtistData && JSON.parse(sendArtistData);
    console.log('parseData  artist >>>>', parseData);
    if (parseData) {
      const finalData = [...parseData];
      finalData.push(data?.artistId);
      console.log('finalData  artist >>>>', finalData);
      await AsyncStorage.setItem(asynchEnums.SEND_NOTI_ARTIST, JSON.stringify(finalData));
    } else {
      const finalData = [data?.artistId];
      console.log('finalData  else >>>>', finalData);
      await AsyncStorage.setItem(asynchEnums.SEND_NOTI_ARTIST, JSON.stringify(finalData));
    }
  }, 5000);
  // }

  const handleCancelNotification = debounce(async (data) => {
    try {
      const receiver = data?.devices?.[0]?.deviceToken;
      if (!receiver) return;

      const requestData = { customData: '' };
      await axiosInstance.post('/send-notification', {
        receiver,
        title: 'Booking Cancelled!',
        body: `Booking scheduled on ${dateTime} is cancelled by ${user.firstName} ${user.lastName}`,
        data: requestData,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, 3000);


  const handleCheckoutSummary = async () => {
    try {

      if (paymentInitiated) {
        setCheckOutSummaryModal(false)
        return;
      }

      var bookingId = ""
      const temp = await AsyncStorage.getItem(asynchEnums.CART_BOOKING)
      const cartBookingDataAsynch = temp && JSON.parse(temp)
      const id = await AsyncStorage.getItem("id");

      if (!cartBookingDataAsynch?.bookingId) {
        const response = await axiosInstance.post(`/create-booking`, {
          "userId": id,
          "cartId": cartDetails?.Id
        })
        console.log('create-booking response >>>', response?.data?.data)
        bookingId = response?.data?.data?.bookingId || "";
      } else {
        bookingId = cartBookingDataAsynch?.bookingId;
      }

      const cartBookingData = {
        bookingId: bookingId,
        cartId: cartDetails?.Id
      }

      await AsyncStorage.setItem(asynchEnums.CART_BOOKING, JSON.stringify(cartBookingData))

      const request = {
        "bookingId": bookingId,
        // "totalAmount": totalAmount,
        "totalAmount": totalAmount,
        "amountPaid": cartType == 'later' ? payNowAmount : totalAmount,
      }

      console.log('request handleCheckoutSummary >>>', request)

      const updateResponse = await axiosInstance.post(`/update-booking-payment`, request)
      console.log('updateResponse?.data >>>>', updateResponse?.data);
      const data = { bookingId: bookingId, ...updateResponse?.data }
      console.log('final Data >>>', data)
      initiatePayment(data);
      setCheckOutSummaryModal(false)
      setPaymentInitiated(true);
      setIsLoading(true);
      isConditionFulfilledRef.current = false
      //update response >>>
      //   {
      //     "status": "success",
      //     "message": "payment intent created.",
      //     "clientSecret": "pi_3Qp2Da2M3iXRRKjE0639P0M7_secret_5Au2ZSsOquAooTsWJqUgzkBpr",
      //     "transactionId": "cb5421c6-769a-4650-9e5a-e7f4743d3f55",
      //     "customer": {
      //         "id": "cus_RfpfU604HvsNFN",
      //         "object": "customer",
      //         "address": null,
      //         "balance": 0,
      //         "created": 1738129167,
      //         "currency": null,
      //         "default_source": null,
      //         "delinquent": false,
      //         "description": null,
      //         "discount": null,
      //         "email": "m20@gmail.com",
      //         "invoice_prefix": "7E11DD03",
      //         "invoice_settings": {
      //             "custom_fields": null,
      //             "default_payment_method": null,
      //             "footer": null,
      //             "rendering_options": null
      //         },
      //         "livemode": false,
      //         "metadata": {
      //             "userId": "8a1bb191-d879-4dc5-b802-15792600fdae"
      //         },
      //         "name": "Mahesh r",
      //         "next_invoice_sequence": 1,
      //         "phone": "9975464428",
      //         "preferred_locales": [],
      //         "shipping": null,
      //         "tax_exempt": "none",
      //         "test_clock": null
      //     }
      // }


    } catch (err) {
      console.log(`payment error >>>`, err);
      setIsLoading(false);
      setIsHairArtistCountFulfilled(false)
      setIsMakeUpArtistCountFulfilled(false)
      setPaymentInitiated(false);
    }
  }

  const confirmBooking = async orderObj => {
    console.log('confirmBooking orderObj >>>', orderObj);
    setPaymentInitiated(false);
    // setIsLoading(true);
    try {
      const response = await axiosInstance.post(`/confirm-booking`,
        {
          "transactionId": orderObj?.transactionId,
          "bookingId": orderObj?.bookingId
        },
      );
      setPaymentInitiated(false);
      setIsLoading(false);
      await AsyncStorage.removeItem(asynchEnums.CART_BOOKING)
      await AsyncStorage.removeItem(asynchEnums.CART_ID)
      await AsyncStorage.removeItem(asynchEnums.SEND_NOTI_ARTIST)
      console.log('Order Confirm Response', response.data);
      if (response?.data?.status === 'success') {
        console.log('Order Confirm Data', JSON.stringify(response.data.data));
        setAcceptedArtist([]);
        await AsyncStorage.removeItem('summary');
        setBookingConfirmed(true);
        setRequestTimer(0)
      } else {
        setIsLoading(false);
      }

    } catch (err) {
      console.log('error confirmBooking >>>', err)
      showToast(`${err}`)
      setPaymentInitiated(false);
      setIsLoading(false);
    }
  };

  const handleEmail = () => {

    const email = 'team@totallyflawless.co';
    const subject = `For Totally Flawless booking`;
    const body = 'Hi ,';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url).catch(err => console.error('Error:', err));
  }

  const handleContact = () => {
    Linking.openURL('tel:+(832) 898-7753');
  };

  const TooltipComponent = () => {
    return (
      <View>
        <Text style={[GlobalStyles.txtR12Dark, {}]} >Travel fee charges
          {"\n"}Up to 10 miles: Free
          {"\n"}11-25 miles: $30
          {"\n"}26-50 miles: $1 per mile (e.g., 50 miles = $55).</Text>
      </View>
    )
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_KEY}
      merchantIdentifier="merchant.com.flawless">
      <View style={{ backgroundColor: '#FFF', flex: 1 }}>
        <TopBar drawer={drawer} />
        <Loader loading={loaderLoading} />
        <View style={{ flexGrow: 1, backgroundColor: '#FFF' }}>
          {serviceList && serviceList.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>

              <View style={styles.headerTitleView} >
                <TouchableOpacity style={styles.backBtn} onPress={() => changeNavigation(screenNames.HOME)} >
                  <CommonSvg.back />
                </TouchableOpacity>
                <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >My Cart</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('BookAppointment', {
                    guestUser: false,
                    cartId: cartDetails.Id,
                    cartDetails: JSON.stringify(cartDetails),
                  });
                }}
                style={{
                  marginTop: 10,
                  paddingHorizontal: 5,
                  marginHorizontal: 15,
                }}>
                <Text
                  style={{
                    fontFamily: 'Poppins-Regular',
                    fontSize: 17,
                    fontWeight: 500,
                    color: 'black',
                    textDecorationLine: 'underline',
                    fontWeight: '800',
                  }}>
                  Choose Date and Time
                </Text>
              </TouchableOpacity>
              <View style={{ paddingHorizontal: 15 }}>
                <View
                  style={{
                    padding: 15,
                    borderColor: '#000',
                    borderWidth: 0.45,
                    borderRadius: 10,
                    marginTop: 10,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <View style={{ flexDirection: 'column' }}>
                      <View>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#000',
                            fontWeight: 'bold',
                          }}>
                          Address :
                        </Text>
                      </View>
                      <View style={{ width: width / 1.5 }}>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            fontSize: 14,
                            fontWeight: 400,
                            color: '#000',
                          }}>
                          {address ? address : "-"}
                        </Text>
                      </View>
                      <View style={{ marginTop: 5 }}>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#000',
                            fontWeight: 'bold',
                          }}>
                          Date and Time :
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            fontSize: 14,
                            fontWeight: 400,
                            color: '#000',
                            fontWeight: 'bold',
                          }}>
                          {dateTime || '-'}
                        </Text>
                      </View>
                    </View>
                    <View>
                      <Icon
                        disabledStyle={{
                          backgroundColor: '#FFF',
                        }}
                        disabled={isLoading || loading}
                        onPress={() => {
                          navigation.navigate('BookAppointment', {
                            guestUser: false,
                            cartId: cartDetails.Id,
                            cartDetails: JSON.stringify(cartDetails),
                          });
                        }}
                        color="#000"
                        name="square-edit-outline"
                        size={25}
                        type="material-community"
                      />
                    </View>
                  </View>
                </View>
                {serviceList &&
                  serviceList.length > 0 &&
                  serviceList.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        padding: 15,
                        borderColor: '#000',
                        borderWidth: 0.45,
                        borderRadius: 10,
                        marginTop: 10,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <View style={{ flexDirection: 'row' }}>
                          <View>
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={{
                                width: 100,
                                height: 120,
                                borderRadius: 5,
                              }}
                              resizeMode='contain'
                            />
                          </View>
                          <View
                            style={{
                              width: width / 1.95,
                              flexDirection: 'column',
                              flexWrap: 'wrap',
                              paddingHorizontal: 10,
                            }}>
                            <View>
                              <Text
                                style={{
                                  fontFamily: 'Poppins-Regular',
                                  fontSize: 14,
                                  fontWeight: 400,
                                  color: 'black',
                                }}>
                                {`${item.name}-${item.artist}`}
                              </Text>
                            </View>
                            <View>
                              <Text
                                style={{
                                  fontFamily: 'Poppins-Regular',
                                  fontSize: 14,
                                  fontWeight: 400,
                                  color: 'black',
                                }}>
                                {`($${item.price})`}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              flexDirection: 'row',
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                            }}>
                            <View
                              style={{
                                justifyContent: 'center',
                                alignContent: 'center',
                              }}>
                              <Text
                                style={{
                                  color: '#000',
                                  fontFamily: 'Poppins-Regular',
                                  fontSize: 12,
                                  paddingHorizontal: 7,
                                }}>
                                Qty:
                              </Text>
                            </View>
                            <View
                              style={{
                                borderColor: '#7E7E7E',
                                borderRadius: 5,
                                borderWidth: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                <View
                                  style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderColor: '#7E7E7E',
                                    borderRightWidth: 1,
                                  }}>
                                  <Icon
                                    disabledStyle={{
                                      backgroundColor: '#FFF',
                                    }}
                                    disabled={isLoading || loading}
                                    onPress={() => {
                                      item?.quantity > 1 &&
                                        changeHandler(index, false);
                                    }}
                                    color="#000"
                                    name="minus"
                                    size={25}
                                    type="material-community"
                                  />
                                </View>
                                <Text
                                  style={{
                                    color: '#747474',
                                    fontFamily: 'Poppins-Regular',
                                    fontSize: 15,
                                    paddingHorizontal: 7,
                                    paddingTop: 3,
                                  }}>
                                  {item?.quantity}
                                </Text>
                                <View
                                  style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderLeftWidth: 1,
                                    borderColor: '#7E7E7E',
                                    paddingHorizontal: 4,
                                  }}>
                                  <Icon
                                    disabled={isLoading || loading}
                                    onPress={() => {
                                      changeHandler(index, true);
                                    }}
                                    disabledStyle={{
                                      backgroundColor: '#FFF',
                                    }}
                                    color="#000"
                                    name="plus"
                                    size={25}
                                    type="material-community"
                                  />
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View>
                          <Icon
                            disabledStyle={{
                              backgroundColor: '#FFF',
                            }}
                            disabled={isLoading || loading}
                            onPress={() => deleteServiceListHandler(index)}
                            color="#000"
                            name="trash-can-outline"
                            size={25}
                            type="material-community"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
              <View
                style={{
                  width: width,
                  marginTop: 10,
                  backgroundColor: '#FFF8F0',
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                }}>
                <Text
                  style={{
                    color: '#000',
                    fontFamily: 'Poppins-Regular',
                    fontSize: 12,
                  }}>
                  Standard service time is approximately 1 hour.{"\n"}Extra time (e.g., 30 min) should be compensated.
                </Text>
              </View>

              {
                returnRequestedArtistCount()[0] != 0 &&
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 20,
                    paddingHorizontal: 15,
                    justifyContent: 'space-between',
                  }}>
                  <View style={{ justifyContent: 'center' }}>
                    <Text
                      style={GlobalStyles.txtM14Dark}>
                      Number of Hair Artists
                    </Text>
                  </View>
                  <View>
                    <View style={styles.numberOfArtistBox} >

                      <Text style={[GlobalStyles.txtM14Dark, {}]} >{returnRequestedArtistCount()[0]}</Text>
                    </View>
                    {/* <SelectList
                      defaultOption={{key: 1, value: 1}}
                      boxStyles={{padding: 0, width: 90, height: 40}}
                      inputStyles={{
                        color: '#000',
                        padding: 0,
                        fontSize: 11,
                        textAlign: 'center',
                      }}
                      search={false}
                      dropdownStyles={{padding: 0}}
                      dropdownItemStyles={{padding: 0}}
                      dropdownTextStyles={{color: '#000', padding: 0}}
                      setSelected={val => setSelectedNumberHA(val)}
                      data={noOfArtist}
                      save="HANumber"
                    />  */}
                  </View>
                </View>
              }

              {
                returnRequestedArtistCount()[1] != 0 &&
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 20,
                    paddingHorizontal: 15,
                    justifyContent: 'space-between',
                  }}>
                  <View style={{ justifyContent: 'center' }}>
                    <Text style={GlobalStyles.txtM14Dark}>
                      Number of Makeup Artists
                    </Text>
                  </View>
                  <View>
                    <View style={styles.numberOfArtistBox} >
                      <Text style={[GlobalStyles.txtM14Dark, {}]} >{returnRequestedArtistCount()[1]}</Text>
                    </View>
                    {/* <SelectList
                  boxStyles={{padding: 0, width: 110, height: 40}}
                  inputStyles={{
                    color: '#000',
                    padding: 0,
                    fontSize: 11,
                    textAlign: 'center',
                  }}
                  dropdownStyles={{padding: 0}}
                  dropdownItemStyles={{padding: 0}}
                  dropdownTextStyles={{color: '#000', padding: 0}}
                  setSelected={val => setSelectedNumberMA(val)}
                  data={noOfArtist}
                  save="MANumber"
                /> */}
                  </View>
                </View>
              }


              {serviceList.length > 0 && (
                <View style={{ marginTop: 10, paddingHorizontal: 15 }}>
                  <View>
                    <Text
                      style={{
                        color: '#000',
                        fontFamily: FONTS.regular,
                        fontSize: 17,
                        fontWeight: 'bold',
                        textDecorationLine: 'underline',
                      }}>
                      Price Details
                    </Text>
                  </View>
                  {serviceList &&
                    serviceList.length > 0 &&
                    serviceList.map((item, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginTop: index === 0 ? 10 : 0,
                          marginBottom: Platform.OS == "ios" ? 10 : 5,
                        }}>
                        <View>
                          <Text
                            style={{
                              color: '#101010',
                              fontFamily: FONTS.regular,
                              fontSize: 14,
                              fontWeight: 500,
                            }}>
                            {item?.name}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: '#000',
                              fontFamily: FONTS.regular,
                              fontSize: 14,
                              fontWeight: 700,
                            }}>
                            ${item?.price * item?.quantity}
                          </Text>
                        </View>
                      </View>
                    ))}

                  {
                    addOnServiceAmount != 0 &&
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
                            fontWeight: 500,
                          }}>
                          Add on blowout
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            color: '#000',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${addOnServiceAmount}
                        </Text>
                      </View>
                    </View>
                  }


                  {
                    longHairAmount != 0 &&
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
                            fontWeight: 500,
                          }}>
                          Textured Hair
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            color: '#000',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${longHairAmount}
                        </Text>
                      </View>
                    </View>
                  }

                  {cartType == 'now' && (
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
                            fontWeight: 500,
                          }}>
                          Booking Fee (24 hours or less)
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            color: '#000',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${cartDetails?.bookingFee * returnRequestedArtistCount()[2]}
                        </Text>
                      </View>
                    </View>
                  )}
                  {
                    totalTravelFee != 0 &&

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: Platform.OS == "ios" ? 10 : 5,
                      }}>
                      <View style={[GlobalStyles.rowCenter, {}]} >
                        <Text
                          style={{
                            color: '#101010',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 500,
                          }}>
                          Travel Fee
                        </Text>
                        <View style={{ marginLeft: ms(10), alignItems: 'center' }} >
                          <Tooltip
                            isVisible={toolTipVisible}
                            content={<TooltipComponent />}
                            placement="top"
                            onClose={() => setToolTipVisible(false)}
                          >
                            <TouchableOpacity onPress={() => setToolTipVisible(true)}>
                              <Icons name='infocirlceo' size={20} color={COLORS.theme} />
                            </TouchableOpacity>
                          </Tooltip>
                        </View>
                      </View>

                      <View>
                        <Text
                          style={{
                            color: '#000',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${totalTravelFee}
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
                        style={GlobalStyles.txtM14Dark}>
                        Total Amount Payable
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={{
                          color: '#000',
                          fontFamily: FONTS.regular,
                          fontSize: 14,
                          fontWeight: 700,
                        }}>
                        ${totalAmount}
                      </Text>
                    </View>
                  </View>
                  {cartType == 'later' && (
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
                            fontWeight: 500,
                          }}>
                          Advance Amount Payable (50%)
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            color: '#000',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${payNowAmount}
                        </Text>
                      </View>
                    </View>
                  )}
                  {cartType == 'later' && (
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
                            fontWeight: 500,
                          }}>
                          Remaning Amount Payable
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            color: '#000',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${totalAmount + - payNowAmount}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 10,
                  marginHorizontal: 15,
                }}>
                <TouchableOpacity
                  disabled={addServiceFlag || isLoading || loading}
                  onPress={() =>
                    navigation.navigate('Home', { guestUser: false })
                  }
                  style={{
                    flexDirection: 'row',
                    backgroundColor: '#FFF',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 15,
                    borderRadius: 35,
                    borderWidth: 1,
                    borderColor:
                      addServiceFlag || isLoading || loading
                        ? '#b5b5b5'
                        : '#000',
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color:
                        addServiceFlag || isLoading || loading
                          ? '#b5b5b5'
                          : '#000',
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Add Another Service
                  </Text>
                  <View>
                    <Icon
                      disabled={addServiceFlag || isLoading || loading}
                      disabledStyle={{
                        backgroundColor: '#FFF',
                      }}
                      color={
                        addServiceFlag || isLoading || loading
                          ? '#b5b5b5'
                          : '#000'
                      }
                      style={{ paddingHorizontal: 10 }}
                      name="plus-circle-outline"
                      size={30}
                      type="material-community"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 15,
                  justifyContent: 'space-evenly',
                  marginTop: 10,
                  marginBottom: 180,
                }}>
                {/* <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 10,
                    marginBottom: 30,
                    marginRight: 5,
                  }}>
                  <Pressable
                    disabled={isLoading || loading}
                    style={{
                      backgroundColor: '#FFF',
                      width: '100%',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: 35,
                      borderWidth: 2,
                      borderColor: '#000',
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#000',
                        fontFamily: 'Poppins-Regular',
                        fontWeight: 'bold',
                      }}>
                      ${payNowAmount}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#000',
                        fontFamily: 'Poppins-Regular',
                        fontWeight: 'bold',
                      }}>
                      {cartType == 'now' ? 'Total Payment' : 'Advance Payment'}
                    </Text>
                  </Pressable>
                </View> */}
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 10,
                    marginBottom: 30,
                    marginLeft: 5,
                  }}>
                  <TouchableOpacity
                    disabled={isLoading || loading}
                    onPress={() => {

                      handleFindArtist()

                    }}
                    style={{
                      backgroundColor: '#000',
                      width: '100%',
                      alignItems: 'center',
                      paddingVertical: 17,
                      borderRadius: 35,
                      borderWidth: 2,
                      borderColor: '#000',
                    }}>
                    {isLoading || loading ? (
                      <ActivityIndicator size={'small'} color={'#FFF'} />
                    ) : (
                      <Text
                        style={{
                          fontSize: 20,
                          color: '#FFF',
                          fontWeight: 'bold',
                          fontFamily: 'Poppins-Regular',
                        }}>
                        {acceptedArtist.length > 0 ? "Continue" : "Find Artist"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={{
                  height: Platform.OS == 'ios' ? 30 : 20,
                }}></View>
            </ScrollView>
          ) : (
            <View style={{ flexGrow: 1, backgroundColor: '#FFF' }}>
              <View
                style={{
                  height: height / 3,
                  width: width,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={{ fontSize: 20, fontFamily: 'Poppins-Regular' }}>
                  {
                    !isCartData && "No selected services."
                  }

                </Text>
              </View>
            </View>
          )}
        </View>
        <BottomBar navigation={changeNavigation} page={'selected'} />

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
                  You Have Successfully Booked Appointments
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
                    setIsLoading(false)
                    setCartDetails();
                    // returnRequestedArtistCount([])
                    setServiceList();
                    setBookingConfirmed(false);
                    navigation.navigate(screenNames.USER_BOOKING);
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

        {checkOutSummaryModal && (
          <Modal animationType="fade" visible={checkOutSummaryModal} transparent={true}>

            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { minHeight: Platform.OS == "ios" ? mvs(250) : mvs(305) }]}>
                {/* Close button */}
                <TouchableOpacity
                  style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
                  onPress={() => {
                    setCheckOutSummaryModal(false)
                    setRequestTimer(0)
                    isConditionFulfilledRef.current = false
                  }}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>


                <View>
                  <Text style={[GlobalStyles.txtM16Dark, { textDecorationLine: 'underline', }]}>
                    Checkout Summary
                  </Text>
                </View>

                {serviceList && serviceList.length > 0 && (
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
                    {serviceList &&
                      serviceList.length > 0 &&
                      serviceList.map((item, index) => (
                        <View
                          key={index}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: index === 0 ? 10 : 0,
                            marginBottom: Platform.OS == "ios" ? 10 : 5,
                          }}>
                          <View>
                            <Text
                              style={{
                                color: '#101010',
                                fontFamily: FONTS.regular,
                                fontSize: 14,
                                fontWeight: 500,
                              }}>
                              {item?.name}
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={{
                                color: '#000',
                                fontFamily: FONTS.regular,
                                fontSize: 14,
                                fontWeight: 700,
                              }}>
                              ${item?.price * item?.quantity}
                            </Text>
                          </View>
                        </View>
                      ))}

                    {
                      addOnServiceAmount != 0 &&
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
                              fontWeight: 500,
                            }}>
                            Add on blowout
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: '#000',
                              fontFamily: FONTS.regular,
                              fontSize: 14,
                              fontWeight: 700,
                            }}>
                            ${addOnServiceAmount}
                          </Text>
                        </View>
                      </View>
                    }


                    {
                      longHairAmount != 0 &&
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
                              fontWeight: 500,
                            }}>
                            Textured Hair
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: '#000',
                              fontFamily: FONTS.regular,
                              fontSize: 14,
                              fontWeight: 700,
                            }}>
                            ${longHairAmount}
                          </Text>
                        </View>
                      </View>
                    }

                    {cartType == 'now' && (
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
                              fontWeight: 500,
                            }}>
                            Booking Fee (24 hours or less)
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: '#000',
                              fontFamily: FONTS.regular,
                              fontSize: 14,
                              fontWeight: 700,
                            }}>
                            ${cartDetails?.bookingFee * returnRequestedArtistCount()[2]}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: Platform.OS == "ios" ? 10 : 5,
                      }}>
                      <View style={[GlobalStyles.rowCenter, {}]} >
                        <Text
                          style={{
                            color: '#101010',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 500,
                          }}>
                          Travel Fee
                        </Text>
                        <View style={{ marginLeft: ms(10), alignItems: 'center' }} >
                          <Tooltip
                            isVisible={toolTipModalVisible}
                            content={<TooltipComponent />}
                            placement="top"
                            onClose={() => setToolTipModalVisible(false)}
                          >
                            <TouchableOpacity onPress={() => setToolTipModalVisible(true)}>
                              <Icons name='infocirlceo' size={20} color={COLORS.theme} />
                            </TouchableOpacity>
                          </Tooltip>
                        </View>
                      </View>
                      <View>
                        <Text
                          style={{
                            color: '#000',
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${totalTravelFee}
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
                            fontFamily: FONTS.regular,
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                          ${totalAmount}
                        </Text>
                      </View>
                    </View>
                    {cartType == 'later' && (
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
                              fontWeight: 500,
                            }}>
                            Advance Amount Payable (50%)
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: '#000',
                              fontFamily: FONTS.regular,
                              fontSize: 14,
                              fontWeight: 700,
                            }}>
                            ${payNowAmount}
                          </Text>
                        </View>
                      </View>
                    )}
                    {cartType == 'later' && (
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
                              fontWeight: 500,
                            }}>
                            Remaning Amount Payable
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: '#000',
                              fontFamily: FONTS.regular,
                              fontSize: 14,
                              fontWeight: 700,
                            }}>
                            ${totalAmount - payNowAmount}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  disabled={isLoading || loading}
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

        {timerModalVisible && (
          <Modal animationType="fade"
            visible={timerModalVisible}
            transparent={true}
            onRequestClose={() => {
              setTimerModalVisible(false)
            }}
          >

            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { width: SIZES.cardWidth, minHeight: mvs(200), backgroundColor: COLORS.bgPink }]}>
                {/* Close button */}
                {/* <TouchableOpacity
                  style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
                  onPress={() => {
                    setTimerModalVisible(false)
                    setRequestTimer(0)
                    setRequestTimerBoth(0)
                    setIsNotificationSended(false)
                  }}>
                  <Text style={[styles.closeButtonText, { color: COLORS.white }]}>✕</Text>
                </TouchableOpacity> */}

                <Gif source={require('../assets/appSplash2.gif')} resizeMode='contain' style={{ height: mvs(150), width: 200 }} />
                {/* <Gif
                  //source={require('../assets/flawlessmp4.gif')} 
                  source={images.appLogo}
                  resizeMode='contain' style={{ height: mvs(150), width: 200 }} /> */}
                {/* {
                  isSeperateSend ?
                    <View style={{ alignSelf: 'center', marginTop: mvs(10) }} >
                      <Text style={[GlobalStyles.txtM16Dark, { fontSize: ms(20), color: COLORS.white }]} >{requestTimerBoth == 1 ? "0" : requestTimerBoth}</Text>
                    </View>
                    :
                    <View style={{ alignSelf: 'center', marginTop: mvs(10) }} >
                      <Text style={[GlobalStyles.txtM16Dark, { fontSize: ms(20), color: COLORS.white }]} >{requestTimer == 1 ? "0" : requestTimer}</Text>
                    </View>

                } */}

                <View style={{ marginTop: 20 }} >
                  <Text style={[GlobalStyles.txtR16Dark, { color: COLORS.white, textAlign: 'center' }]}>
                    Searching for your artist.{"\n"}Please do not close this window until your artist is confirmed.{"\n"}
                    Closing this popup may cancel your request.
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={isLoading || loading}
                  onPress={() => {
                    // if (isRetry) {
                    //   handleRetry()
                    // } else {

                    //FIXME:
                    setTimerModalVisible(false);
                    setRequestTimer(0);
                    setRequestTimerBoth(0);
                    // setIsNotificationSended(false)

                    // setNotificationSendArtistIndex(0)
                    // }
                  }}
                  style={{
                    backgroundColor: COLORS.white,
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 17,
                    borderRadius: 35,
                    // borderWidth: 2,
                    // borderColor: '#000',
                    marginTop: mvs(30)
                  }}>

                  <Text
                    style={{
                      fontSize: 20,
                      color: COLORS.darkTxt,
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {isRetry ? "Retry" : "Cancel"}
                  </Text>

                </TouchableOpacity>
              </View>
            </View>

          </Modal>
        )}

        {unableToFindModal && (
          <Modal animationType="fade"
            visible={unableToFindModal}
            transparent={true}
            onRequestClose={() => {
              setUnableToFindModal(false)
            }}
          >

            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { width: SIZES.cardWidth, minHeight: mvs(200), backgroundColor: COLORS.white }]}>
                {/* Close button */}
                <TouchableOpacity
                  style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
                  onPress={() => {
                    setUnableToFindModal(false)
                  }}>
                  <Text style={[styles.closeButtonText, { color: COLORS.theme }]}>✕</Text>
                </TouchableOpacity>


                <Image source={require("../assets/not-found.png")} style={{ height: 150, width: SIZES.cardWidth }} resizeMode='contain' />

                <View style={{ marginTop: 10 }} >
                  <Text style={[GlobalStyles.txtR16Dark, { textAlign: 'center' }]}>
                    Unable to find the artist.{"\n"}Please try again after sometime.
                  </Text>
                </View>
                <View style={{ marginTop: 10 }} >
                  <Text style={[GlobalStyles.txtM16Dark, { textAlign: 'center' }]}>
                    Contact us
                  </Text>
                </View>

                <View style={[GlobalStyles.rowCenter, { alignSelf: 'center' }]} >
                  <TouchableOpacity onPress={handleEmail} >
                    <Text
                      style={{
                        fontFamily: 'Poppins-Regular',
                        fontSize: SIZES.f14,
                        color: 'blue',
                        textAlign: 'center',
                        // textDecorationLine: 'underline'
                      }}>team@totallyflawless.co</Text>

                  </TouchableOpacity>
                  <Text style={[GlobalStyles.txtR14Dark, {}]} > | </Text>
                  <TouchableOpacity onPress={handleContact} >
                    <Text
                      style={{
                        fontFamily: 'Poppins-Regular',
                        fontSize: SIZES.f14,
                        color: 'blue',
                        textAlign: 'center',
                        // textDecorationLine: 'underline'
                      }}>(832) 898-7753</Text>

                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  disabled={isLoading || loading}
                  onPress={() => {

                    setUnableToFindModal(false)
                    setTimerModalVisible(false);
                    setRequestTimer(0);
                    setRequestTimerBoth(0);

                  }}
                  style={{
                    backgroundColor: COLORS.theme,
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 17,
                    borderRadius: 35,
                    // borderWidth: 2,
                    // borderColor: '#000',
                    marginTop: mvs(30)
                  }}>

                  <Text
                    style={{
                      fontSize: 20,
                      color: COLORS.white,
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {"Okay"}
                  </Text>

                </TouchableOpacity>
              </View>
            </View>

          </Modal>
        )}

        {bothServiceInfoModal && (
          <Modal animationType="fade"
            visible={bothServiceInfoModal}
            transparent={true}
            onRequestClose={() => {
              setBothServiceInfoModal(false)
            }}
          >

            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { minHeight: mvs(200), backgroundColor: COLORS.bgPink }]}>
                {/* Close button */}
                {/* <TouchableOpacity
                  style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
                  onPress={() => {
                    setBothServiceInfoModal(false)
                  }}>
                  <Text style={[styles.closeButtonText, { color: COLORS.white }]}>✕</Text>
                </TouchableOpacity> */}

                <Gif source={require('../assets/appSplash2.gif')} resizeMode='contain' style={{ height: mvs(150), width: 200 }} />

                {/* <Gif 
                  // source={require('../assets/flawlessmp4.gif')} 
                  source={images.appLogo}
                  resizeMode='contain' style={{ height: mvs(150), width: 200 }} /> */}
                {/* {
                  isSeperateSend ?
                    <View style={{ alignSelf: 'center', marginTop: mvs(10) }} >
                      <Text style={[GlobalStyles.txtM16Dark, { fontSize: ms(20), color: COLORS.white }]} >{requestTimerBoth == 1 ? "0" : requestTimerBoth}</Text>
                    </View>
                    :
                    <View style={{ alignSelf: 'center', marginTop: mvs(10) }} >
                      <Text style={[GlobalStyles.txtM16Dark, { fontSize: ms(20), color: COLORS.white }]} >{requestTimer == 1 ? "0" : requestTimer}</Text>
                    </View>

                } */}

                <View style={{ marginTop: 20 }} >
                  <Text style={[GlobalStyles.txtR16Dark, { color: COLORS.white, textAlign: 'center' }]}>
                    {"We strive to provide an artist who can do both hair and makeup. If none are available in your area, we will search for two separate artists. Please note this may result in two separate fees."}
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={isLoading || loading}
                  onPress={() => {
                    setBothServiceInfoModal(false)
                    getArtistByBookingId()
                  }}
                  style={{
                    backgroundColor: COLORS.white,
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 17,
                    borderRadius: 35,
                    // borderWidth: 2,
                    // borderColor: '#000',
                    marginTop: mvs(30)
                  }}>

                  <Text
                    style={{
                      fontSize: 20,
                      color: COLORS.darkTxt,
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Okay
                  </Text>

                </TouchableOpacity>
              </View>
            </View>

          </Modal>
        )}

        {DeviceInfo.hasNotch() ? <Toast topOffset={80} /> : <Toast />}
      </View>
    </StripeProvider>
  );
};


const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: 'black',
  },
  image: {
    width: 250,
    height: 400,
    marginTop: 30, // To give space for the close button
  },
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
  numberOfArtistBox: {

    backgroundColor: '#FFF',
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  headerTitleView: {
    ...GlobalStyles.rowCenter,
    // height:mvs(30),
    paddingTop: mvs(15),
    paddingBottom: mvs(10),
    paddingLeft: ms(15)
  },
  backBtn: {
    ...GlobalStyles.alignJustifyCenter,
    height: 30,
    width: 25,
  },
})

export default Cart;
