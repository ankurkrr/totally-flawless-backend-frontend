import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  InteractionManager,
  Platform,
  NativeModules,
} from 'react-native';

const { TestFlightCheck } = NativeModules;
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message'; // Import Toast
import UserContext from './UserContext';
import { Icon } from '@rneui/base';
import { API_URL } from '../store/url';
import screenNames from '../constants/screenNames';
import { IS_GUEST } from '../store/allactionsTypes';
import { useDispatch } from 'react-redux';

const { height, width } = Dimensions.get('window');

const VerifyOTP = ({ navigation }) => {
  // const APIBASEURL = 'http://164.52.197.9:3001';
  const [otp, setOtp] = useState(['', '', '', '']);
  const route = useRoute();
  const { isNewUser, phone, userType } = route.params;
  const inputRefs = useRef([]); // Array of refs for each input field
  const resendTimeout = 59; // Resend timeout in seconds
  const [remainingTime, setRemainingTime] = useState(resendTimeout);
  const [userId, setUserId] = useState('');
  const [otpId, setOtpId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTestFlight, setIsTestFlight] = useState(false);
  const otpLength = 4;

  const dispatch = useDispatch();

  const { updateUser } = useContext(UserContext);

  useEffect(() => {
    getLocalStorageItem();

    // Wait for navigation animation to complete before focusing
    // This ensures the keyboard stays open seamlessly from the previous screen
    const focusTask = InteractionManager.runAfterInteractions(() => {
      // Small additional delay to ensure the input is fully ready
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    });

    if (Platform.OS === 'ios') {
      TestFlightCheck?.isTestFlight()
        .then(isTF => {
          console.log('Is TestFlight:', isTF);
          setIsTestFlight(isTF);
        })
        .catch(err => {
          console.log('TestFlight check error:', err);
          setIsTestFlight(false);
        });
    }

    return () => focusTask.cancel();
  }, []);

  const getLocalStorageItem = async () => {
    const id = await AsyncStorage.getItem('id');
    setUserId(id);
  };

  useEffect(() => {
    // Start countdown for resend timer if applicable
    if (remainingTime > 0) {
      const intervalId = setInterval(() => {
        setRemainingTime(prevTime => Math.max(0, prevTime - 1));
      }, 1000);
      return () => clearInterval(intervalId); // Clear timer on unmount
    }
  }, [remainingTime]);

  const handleChangeText = (text, index) => {
    const updatedOtp = [...otp];
    updatedOtp[index] = text;
    setOtp(updatedOtp);
    if (text !== '' && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    setErrorMessage('');
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResend = () => {
    if (remainingTime === 0) {
      sendOtp();
      setRemainingTime(resendTimeout);
    }
  };

  const sendOtp = async () => {
    try {
      const phoneNumber = phone.split(' ');
      console.log(phoneNumber);
      await axios
        .get(
          `${API_URL}/get-otp?phone=${phoneNumber[1]}&countryCode=${phoneNumber[0]}`,
        )
        .then(async res => {
          if (res.status === 200) {
            console.log('Response:', res.data);
          }
        });
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  const handleSubmit = () => {
    if (otp.includes('')) {
      // Toast.show({
      //   type: 'error',
      //   text1: 'Please enter the OTP',
      // });
      setErrorMessage('Please enter all code digits');
      return;
    }
    verifyOtp();
  };

  const handleLoginSuccess = async (data) => {
    // Store access token for authenticated API calls
    if (data?.item?.accessToken) {
      await AsyncStorage.setItem('ACCESS_TOKEN', data.item.accessToken);
    }
    dispatch({ type: IS_GUEST, payload: false })
    await AsyncStorage.setItem('guestUser', 'false');
    if (isNewUser) {
      await AsyncStorage.setItem('isNewUser', isNewUser.toString());
      await AsyncStorage.setItem(
        'userType',
        userType === 'Client' ? userType : 'Artist',
      );
      await AsyncStorage.setItem('hasMobile', 'true');
      {
        userType === 'Client'
          ? navigation.reset({
            index: 0,
            routes: [{ name: 'Register' }],
          })
          : navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ArtistLogin',
                params: {
                  hasMobile: 'true',
                },
              },
            ],
          });
      }
    } else {
      console.log(data.item);
      console.log('userType', userType);
      await AsyncStorage.setItem(
        'userType',
        userType === 'Client' ? userType : 'Artist',
      );
      await AsyncStorage.setItem('isNewUser', isNewUser.toString());

      if (userType == 'Client') {
        if (data.item.firstName || data.item.email) {

          updateUser({
            firstName: data.item.firstName,
            lastName: data.item.lastName,
            email: data.item.email,
            userType: 'Client',
          });
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home', params: { guestUser: false } }],
          });
        } else {

          navigation.reset({
            index: 0,
            routes: [{ name: 'Register' }],
          });
        }
      } else {
        if (data.item.firstName) {
          updateUser({
            firstName: data.item.firstName,
            lastName: data.item.lastName,
            email: data.item.email,
            userType: 'Artist',
          });
          await AsyncStorage.setItem('isRegistered', 'true');
          await AsyncStorage.setItem(
            'artistName',
            data.item.firstName,
          );
          if (data.item.isVideoUploaded == 1) {
            await AsyncStorage.setItem('isArtistDataUploaded', 'true');
          }
          if (data.item.isApproved == 1) {
            // await AsyncStorage.setItem('isArtistDataUploaded', 'true');
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: screenNames.ARTIST_HOME,
                },
              ],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'ApplicationReviewPage',
                },
              ],
            });
          }
        } else {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ArtistLogin',
                params: {
                  hasMobile: 'true',
                },
              },
            ],
          });
        }
      }
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join('');

    // ANDROID TEST BUILD BYPASS
    if (enteredOtp === '0000') {
      if (Platform.OS === 'android' && __DEV__) {
        console.log('Bypassing OTP for Android DEV build');
        const mockData = {
          item: {
            accessToken: "TEST_DEV_TOKEN_0000",
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            isApproved: 1,
            isVideoUploaded: 1,
            _id: userId || "test_id"
          }
        };
        await handleLoginSuccess(mockData);
        return;
      }

      // IOS TESTFLIGHT BYPASS
      if (Platform.OS === 'ios' && isTestFlight && phone.includes('5555555555')) {
        console.log('Bypassing OTP for iOS TestFlight build');
        const mockData = {
          item: {
            accessToken: "TEST_FLIGHT_TOKEN_0000",
            firstName: "Test",
            lastName: "Flight",
            email: "testflight@example.com",
            isApproved: 1,
            isVideoUploaded: 1,
            _id: userId || "test_flight_id"
          }
        };
        await handleLoginSuccess(mockData);
        return;
      }
    }

    try {
      await axios
        .post(`${API_URL}/token`, {
          id: userId,
          otp: enteredOtp,
          userType: userType === 'Client' ? 1 : 2,
        })
        .then(async res => {

          console.log('res?.data verify Otp>>>', res?.data)
          if (res.status === 200) {
            await handleLoginSuccess(res.data);
            // navigateToPage(isNewUser ? 'Register' : 'Home');
          } else {
            setErrorMessage('Enter correct OTP');
            // Toast.show({
            //   type: 'error',
            //   text1: 'Invalid OTP',
            // });
          }
        });
    } catch (err) {
      console.log(err);
      setErrorMessage('Invalid OTP');
      // Toast.show({
      //   type: 'error',
      //   text1: 'Invalid OTP',
      // });
    }
  };

  const navigateToPage = page => {
    navigation.navigate(page, {
      guestUser: false,
    });
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginTop: 10,
          marginHorizontal: 15,
          marginBottom: 5,
        }}>
        <View>
          <Icon
            color="#000"
            name="arrow-back-ios"
            onPress={() => navigation.goBack()}
            size={25}
            type="material"
          />
        </View>
      </View>
      <Image
        source={require('../../src/assets/logo2.png')}
        style={styles.image}
      />
      <Text style={styles.header}>
        Verify your One Time Code sent to + {phone}
      </Text>
      <View style={styles.inputContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            ref={ref => (inputRefs.current[index] = ref)}
            style={styles.smallInput}
            placeholder="0"
            placeholderTextColor="#888"
            maxLength={1}
            keyboardType="numeric"
            value={value}
            onChangeText={text => handleChangeText(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            testID={`otpInput${index}`}
            accessibilityLabel={`otpInput${index}`}
            nativeID={`otpInput${index}`}
          />
        ))}
      </View>
      <View>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>
      {remainingTime > 0 ? (
        <Text style={styles.link}>
          Did not recieve Code?{' '}
          <Text style={styles.linkText} onPress={handleResend}>
            Resend
          </Text>
        </Text>
      ) : (
        <Text style={styles.linkText} onPress={handleResend}>
          Resend Code
        </Text>
      )}
      <Text style={styles.time}>
        {remainingTime > 0
          ? `00:${remainingTime < 10 ? `0${remainingTime}` : remainingTime}`
          : "Time's up"}
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleSubmit} testID="verifyButton" accessibilityLabel="verifyButton" nativeID="verifyButton">
        <Text style={styles.buttonText}>Verify Now</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: 'white',
  },
  errorText: {
    color: 'red',
    marginBottom: 5,
  },
  image: {
    height: height / 7,
    objectFit: 'contain',
  },
  header: {
    fontSize: 16,
    marginBottom: 40,
    color: '#333',
    fontFamily: 'Poppins',
    textAlign: 'center',
    width: '80%'
    // paddingRight: 50,
    // paddingLeft: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  smallInput: {
    width: 70, // Adjust the width as needed
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    opacity: 0.6,
    backgroundColor: '#E8E8E8',
    color: 'black',
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 75,
    borderRadius: 50,
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    color: '#555',
    marginBottom: 25,
    fontSize: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: 'black',
  },
  time: {
    color: '#777',
  },
});

export default VerifyOTP;
