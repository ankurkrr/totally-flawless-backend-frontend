import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@rneui/base';
import dayjs from 'dayjs';
import { useEffect, useState, useRef } from 'react';
import DateTimePicker from 'react-native-ui-datepicker';
import { Button } from '@rneui/themed';
import { useIsFocused, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import TimePicker from '../components/TimePicker';
import moment from 'moment';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import { IS_ADDED_CART } from '../store/allactionsTypes';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../style/theme';
import { GlobalStyles } from '../style/GlobalStyles';
import { ms, mvs } from 'react-native-size-matters';
const { width, height } = Dimensions.get('window');

const BookAppointment = ({ navigation }) => {
  const isFocused = useIsFocused();
  // const APIBASEURL = 'http://164.52.197.9:3001';
  const routes = useRoute();
  const { guestUser, cartId, cartDetails } = routes.params;
  const height = Dimensions.get('window').height;
  const todaysDate = dayjs().subtract(1, 'day');
  const [defaultAddress, setDeafultAddress] = useState('');
  const [date, setDate] = useState(dayjs());
  const [maxDate, setMaxDate] = useState(dayjs());
  const [ampm, setAmpm] = useState('AM');
  const [hh, setHh] = useState('HH');
  const [mm, setMm] = useState('MM');
  const [flagDefault, setFlagDefault] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [bookingType, setBookingType] = useState('');
  const [addressId, setAddressId] = useState('');

  const [immediateBookModal, setImmediateBookModal] = useState(false)

  const { cartData } = useSelector(state => state.AppReducer);

  // console.log('cartData', cartDetails)

  const dispatch = useDispatch();

  const validateFutureTime = (hh, mm, ampm) => {
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

  const valid24Time = (hh, mm, ampm, date) => {
    var currentDateTime = new Date();
    var currentHour = currentDateTime.getHours();
    var currentMinute = currentDateTime.getMinutes();

    // Parse input time
    var inputHour = parseInt(hh, 10);
    var inputMinute = parseInt(mm, 10);

    // Adjust for AM/PM
    if (ampm === 'PM' && inputHour !== 12) {
      inputHour += 12;
    } else if (ampm === 'AM' && inputHour === 12) {
      inputHour = 0;
    }

    // Create Date object for input date and time
    var inputDate = new Date(date);
    inputDate.setHours(inputHour, inputMinute, 0, 0);

    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const inputTimeInMinutes = inputHour * 60 + inputMinute;

    console.log(inputTimeInMinutes, currentTimeInMinutes);
    console.log(dayjs(inputDate).isAfter(dayjs(), 'day'));
    console.log(
      dayjs(inputDate).isSame(dayjs(), 'date'),
      dayjs(currentDateTime).format('YYYY-MM-DD'),
    );
    if (
      dayjs(inputDate).isAfter(dayjs(), 'day') &&
      inputTimeInMinutes < currentTimeInMinutes
    ) {
      return true;
    }
    if (
      dayjs(inputDate).isSame(dayjs(), 'date') &&
      inputTimeInMinutes > currentTimeInMinutes
    ) {
      return true;
    }
    return false;
  };

  const CheckBookingTimePassedTwoHoursForChat = (hh, mm, ampm, date) => {
    console.log(hh, mm, ampm, date);
    // return true
    const formatDate = dayjs(date).format('YYYY-MM-DD')
    // console.log('formatDate', formatDate)
    const bookingTime = `${formatDate}, ${hh}:${mm} ${ampm}`;
    // console.log('bookingTime >>>', bookingTime);
    const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
    const currentDateTime = moment(); // Get current time
    const hoursDifference = bookingDateTime.diff(currentDateTime, 'minutes'); // Get difference in hours
    // console.log('hoursDifference >>>>', hoursDifference);
    // return true
    return hoursDifference < 1440;
  };

  const submitHandler = async () => {
    if (!validateFutureTime(hh, mm, ampm)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Past time cannot be selected',
      });
    } else if (bookingType === 'now' && !valid24Time(hh, mm, ampm, date)) {
      // Toast.show({
      //   type: 'error',
      //   text1: 'Error',
      //   text2: 'Immediate booking cannot be more than 24 hrs',
      // });
      setImmediateBookModal(true);
    } else if (bookingType === 'later' && CheckBookingTimePassedTwoHoursForChat(hh, mm, ampm, date)) {
      // Toast.show({
      //   type: 'error',
      //   text1: 'Error',
      //   text2: 'Future booking cannot be less than 24 hrs',
      // });
      setImmediateBookModal(true);
    } else if (hh === '' || mm === '') {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select Time.',
      });
      // return;
    } else if (defaultAddress === '') {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please add new address',
      });
    } else {
      const dateTime = `${date.format('YYYY-MM-DD')}, ${hh}:${mm} ${ampm}`;

      await AsyncStorage.setItem('dateTime', dateTime);
      await AsyncStorage.setItem('address', defaultAddress);
      const flag = await AsyncStorage.getItem('summary');
      updateCart(flag, dateTime);
      // flag === 'now' && navigation.navigate('Summary');
      // flag === 'later' && navigation.navigate('SummaryLater');
    }
  };

  const updateCart = async (flag, dateTime) => {
    try {
      const cartJson = JSON.parse(cartDetails);
      const body = {
        actionType: 'U',
        cartId: cartJson.Id,
        totalAmount: cartJson.totalAmount,
        bookingFee: cartJson.bookingFee,
        addressId: addressId,
        totalGratuity: cartJson.totalGratuity,
        addOnAmount: cartJson.addOnAmount,
        longHairAmount: cartJson.longHairAmount,
        later: cartJson.later,
        now: cartJson.now,
        bookingTime: dateTime,
        // addOnAmount:cartJson?.addOnAmount,
        // longHairAmount:cartJson?.longHairAmount,
      };
      console.log(body);
      const response = await axiosInstance.post(`/cart`, body);
      console.log(response.data);
      if (response.data.status === 'success') {
        navigation.navigate('Cart');
        dispatch({ type: IS_ADDED_CART, payload: false });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getAddress = async () => {
    const userId = await AsyncStorage.getItem('id');
    try {
      const response = await axiosInstance.get(
        `/get-addresses?userId=${userId}`,
      );
      console.log(response.data);
      if (response.data.status === 'success') {
        var list = response.data.data;
        if (list.length > 0) {
          var flag = false;
          list.map(item => {
            if (item.isdefault === 1) {
              var address = `${item?.street ? item?.street + ', ' : ''}${item?.city ? item?.city + ', ' : ''
                }${item?.state}, ${item?.pincode}`;
              setDeafultAddress(address);
              setAddressId(item.id);
              setFlagDefault(true);
              flag = true;
            }
          });
          !flag && setDeafultAddress('');
        } else {
          setDeafultAddress('');
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const changeTime = (hour, min, am_pm) => {
    // console.log(hour, min, am_pm);
    // setHh(hour);
    // setMm(min.toString());
    // setAmpm(am_pm);
    // if (Platform.OS == 'android') {
    //   setShowClock(false);
    // }

    console.log(hour, min, am_pm);
    setHh(hour);
    setMm(min.toString());
    setAmpm(am_pm);

    const hourInt = parseInt(hour, 10);
    const isPM = am_pm === 'PM';
    const militaryHour = isPM ? (hourInt % 12) + 12 : hourInt % 12;

    // Check if time is between 8 PM and 4 AM
    if (militaryHour >= 20 || militaryHour < 4) {
      Alert.alert(
        'Late-Night Hours Warning',
        'It may be difficult to secure an artist at this time. Would you still like to continue?',
        [
          {
            text: 'Cancel',
            onPress: () => {
              console.log('User canceled');
              if (Platform.OS === 'android') {
                setShowClock(false);
              }
              // setShowClock(true);
            },
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => {
              console.log('User chose to continue');
              if (Platform.OS === 'android') {
                setShowClock(false);
              }
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      if (Platform.OS === 'android') {
        setShowClock(false);
      }
    }


  };

  // console.log('bookingType', bookingType)
  const getLocalStorage = async () => {
    const bookingType = await AsyncStorage.getItem('summary');
    if (bookingType === 'now') {
      setMaxDate(dayjs().add(1, 'day'));
    } else {
      setMaxDate(dayjs().add(1, 'year'));
    }
    setBookingType(bookingType);

    const cartJson = JSON.parse(cartDetails);
    let dateTimeString = '';
    if (
      cartJson?.bookingTime !== undefined &&
      cartJson?.bookingTime !== null &&
      cartJson?.bookingTime !== 'NULL' &&
      cartJson?.bookingTime !== ''
    ) {
      dateTimeString = cartJson.bookingTime;
    } else {
      dateTimeString = moment().format('YYYY-MM-DD, hh:mm A');
    }
    console.log('date time>>>>>>', dateTimeString);
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
  };

  useEffect(() => {
    getAddress();
  }, [isFocused]);

  useEffect(() => {
    console.log(cartDetails);
    getLocalStorage();
  }, []);
  // useEffect(() => {
  //   console.log('cartData >>>>', cartData)
  //   if (cartData?.now?.length > 0) {
  //     setMaxDate(dayjs().add(1, 'day'));
  //     setBookingType("now");
  //   } else if (cartData?.later?.length > 0) {
  //     setMaxDate(dayjs().add(1, 'year'));
  //     setBookingType("later");
  //   }
  // }, [cartData]);

  console.log('maxDate', maxDate)

  useEffect(() => {
    console.log(guestUser,);
    if (guestUser) {
      navigation?.navigate("Login", { userType: 'Client' },)
      // navigation.reset({
      //   index: 0,
      //   routes: [
      //     {
      //       name: 'Login',
      //       params: {
      //         userType: 'Client',
      //       },
      //     },
      //   ],
      // });
    }
  }, []);


  const handleYesPress = () => {
    setImmediateBookModal(false)

    console.log('cartDetails', cartDetails?.now)

    const cDetails = JSON.parse(cartDetails)

    const item = bookingType === 'now' ? cDetails?.now[0] : cDetails?.later[0];

    if (item?.categoryId == 2) {
      navigation.navigate('makeupStyle', {
        categoryId: item?.categoryId,
        serviceId: item.serviceId,
        guestUser: guestUser,
        serviceName: item?.name,
      });
    } else {
      navigation.navigate('HairStyle', {
        categoryId: item?.categoryId,
        serviceId: item.serviceId,
        guestUser: guestUser,
        serviceName: item?.name,
      });
    }

  }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {/* Fixed Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFF' }}>
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
            Book Appointment
          </Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }}>
        <View style={{ padding: 15 }}>
        <View
          style={{ flexDirection: 'row', marginTop: 10, paddingHorizontal: 5 }}>
          <Text
            style={{
              color: 'black',
              fontSize: 17,
              fontWeight: 500,
              fontFamily: 'Poppins-Regular',
            }}>
            Enter your address
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            marginTop: 10,
            padding: 15,
            borderColor: '#eee',
            borderWidth: 1,
            justifyContent: 'space-between',
            borderRadius: 10,
          }}>
          <View>
            <Text
              style={{
                color: 'black',
                fontFamily: 'Poppins-Reglar',
                fontSize: 14,
                fontWeight: 600,
              }}>
              {defaultAddress.length > 40
                ? `${defaultAddress.slice(0, 39)}.......`
                : defaultAddress}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('SavedAddress', {
                guestUser: false,
                cartId: cartId,
                cartDetails: cartDetails,
              });
            }}>
            <Text
              style={{
                color: '#D69316',
                fontFamily: 'Poppins-Reglar',
                fontSize: 14,
                fontWeight: 600,
              }}>
              {defaultAddress.length > 0 ? 'Change' : 'Add Address'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 10 }}>
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
            onChange={params => {
              console.log(params.date)
              const date = params.date;
              setDate(date)
            }}
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
            <TouchableOpacity 
              activeOpacity={0.6}
              onPress={() => {
                console.log('Hour pressed - opening time picker');
                setShowClock(true);
              }}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'black',
                  padding: 10,
                  borderRadius: 10,
                  minWidth: 50,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    color: 'black',
                    textAlign: 'center',
                    fontSize: 18,
                  }}>
                  {hh}
                </Text>
              </View>
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
            <TouchableOpacity 
              activeOpacity={0.6}
              onPress={() => {
                console.log('Minute pressed - opening time picker');
                setShowClock(true);
              }}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'black',
                  padding: 10,
                  borderRadius: 10,
                  minWidth: 50,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    color: 'black',
                    textAlign: 'center',
                    fontSize: 18,
                  }}>
                  {mm}
                </Text>
              </View>
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
            marginTop: 10,
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
        <Toast />



      </View>

      <Modal animationType="fade"
        visible={immediateBookModal}
        transparent={true}
        onRequestClose={() => {
          setImmediateBookModal(false)
        }}
      >

        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { minHeight: mvs(250), backgroundColor: COLORS.white }]}>


            <View style={{ marginTop: 20 }} >
              {
                bookingType === 'now' ?
                  <Text style={[GlobalStyles.txtM16Dark, { textAlign: 'center' }]}>
                    The time you’ve selected is not within 24 hours. Would you like to go back and select 'Future Booking' instead?
                  </Text>
                  :
                  <Text style={[GlobalStyles.txtM16Dark, { textAlign: 'center' }]}>
                    The time you’ve selected is within 24 hours. Would you like to go back and select 'Immediate Booking' instead?
                  </Text>
              }


            </View>

            <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '100%', marginTop: mvs(50) }]} >

              <TouchableOpacity
                onPress={() => {

                  // 
                  handleYesPress();

                }}
                style={{
                  backgroundColor: COLORS.darkTxt,
                  width: '45%',
                  alignItems: 'center',
                  paddingVertical: 17,
                  borderRadius: 35,
                  // borderWidth: 2,
                  // borderColor: '#000',

                }}>

                <Text
                  style={{
                    fontSize: 20,
                    color: COLORS.white,
                    fontWeight: 'bold',
                    fontFamily: 'Poppins-Regular',
                  }}>
                  Yes
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setImmediateBookModal(false)
                }}
                style={{
                  backgroundColor: COLORS.greyTxt,
                  width: '45%',
                  alignItems: 'center',
                  paddingVertical: 17,
                  borderRadius: 35,
                  // borderWidth: 2,
                  // borderColor: '#000',

                }}>

                <Text
                  style={{
                    fontSize: 20,
                    color: COLORS.white,
                    fontWeight: 'bold',
                    fontFamily: 'Poppins-Regular',
                  }}>
                  No
                </Text>

              </TouchableOpacity>


            </View>



          </View>
        </View>

      </Modal>

      </ScrollView>
    </SafeAreaView>
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


export default BookAppointment;
