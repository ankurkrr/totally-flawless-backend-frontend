import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Keyboard,
  Linking,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Icon } from '@rneui/base';
import { API_URL, CONTACT_URL, PRIVACY_URL, TERMS_URL } from '../store/url';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { showToast } from '../components/Toast';
import { CheckBox } from '@rneui/themed';
import { COLORS, FONTS, SIZES } from '../style/theme';
import { ms, mvs } from 'react-native-size-matters';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { height, width } = Dimensions.get('window');

const codes = require("../json/countryCodes.json")

const Login = ({ navigation, route }) => {
  const userType = route.params?.userType || 'Client';

  // const APIBASEURL = 'http://164.52.197.9:3001';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneError, setPhoneError] = useState('');
  const [countryCodeError, setCountryCodeError] = useState('');
  const [search, setSearch] = useState(false)
  const [dialCodeData, setDialCodeData] = useState([])
  const [dialCodeDataCopy, setDialCodeDataCopy] = useState([])

  const phoneRegex = /^\d{8,14}$/;
  const callingCodePattern = /^\+\d{1,4}$/;

  const mobileRef = useRef();

  const requestNotificationPermission = async () => {
    const result = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.NOTIFICATIONS
        : PERMISSIONS.ANDROID.POST_NOTIFICATIONS
    );

    console.log('result >>>', result)

    // switch (result) {
    //   case RESULTS.UNAVAILABLE:
    //     Alert.alert('Notification permission is not available on this device.');
    //     break;
    //   case RESULTS.DENIED:
    //     Alert.alert('Notification permission denied.');
    //     break;
    //   case RESULTS.LIMITED:
    //     // Alert.alert('Notification permission is limited.');
    //     break;
    //   case RESULTS.GRANTED:
    //     // Alert.alert('Notification permission granted!');
    //     break;
    //   case RESULTS.BLOCKED:
    //     Alert.alert('Notification permission is blocked.');
    //     break;
    // }
  };

  useEffect(() => {
    // requestNotificationPermission();
    loadDialCodes()
  }, []);


  const loadDialCodes = () => {

    // const temp = codes?.map(item => {
    //   return {
    //     search: item.replace("+", ""),
    //     value: item

    //   }
    // }).sort((a, b) => parseInt(a) - parseInt(b))

    // const uniqueArray = [...new Set(temp)];
    // console.log(uniqueArray)

    setDialCodeData(codes)
    setDialCodeDataCopy(codes)
    setCountryCode(codes[0]?.value)
  }

  // Function to handle sending OTP
  const handleSendOTP = async () => {
    console.log(userType);
    // if (!phoneNumber.trim()) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: 'Phone number cannot be empty',
    //   });
    //   return;
    // }

    // if (phoneNumber.length > 10) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: 'Phone number is not valid',
    //   });
    //   return;
    // }

    // if (!phoneRegex.test(phoneNumber)) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: 'Invalid phone number format',
    //   });
    //   return;
    // }

    // if (!callingCodePattern.test(countryCode)) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: 'Invalid country code format',
    //   });
    //   return;
    // }

    setPhoneError('');
    setCountryCodeError('');

    if (!phoneNumber.trim()) {
      setPhoneError('Phone number cannot be empty');
      return;
    }

    // if (phoneNumber.length > 10) {
    //   setPhoneError('Phone number is not valid');
    //   return;
    // }

    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError('Phone Number is not valid');
      return;
    }

    if (!callingCodePattern.test(countryCode)) {
      setCountryCodeError('Invalid country code format');
      return;
    }

    console.log(phoneNumber, countryCode.replace('+', ''));
    try {
      const url = `${API_URL}/${userType === 'Artist' ? 'get-artist-otp' : 'get-otp'
        }?userType=${userType}&phone=${phoneNumber}&countryCode=${countryCode.replace(
          '+',
          '',
        )}`
      console.log('url', url)
      await axios.get(url)
        .then(async res => {
          if (res.status === 200) {
            // if(res?.data?.isApproved==false){
            //   showToast("Your registration request not approved! Please contact to admin.")
            // }else{
            console.log('Response:', res.data);
            await AsyncStorage.setItem('id', res.data.id);
            navigation.navigate('VerifyOTP', {
              isNewUser: res.data.isNewUser,
              phone: `${countryCode.replace('+', '')} ${phoneNumber}`,
              userType: userType,
            });
            // }

          }
        });
    } catch (error) {
      alert(error);
      console.error('Error sending OTP:', error);
    }
  };

  const handleSearch = (txt) => {
    let text = txt.replace("+", "");
    let states = dialCodeDataCopy;
    let filteredName = states && states.filter((item) => {
      return item.search?.toLowerCase().match(text)
    })
    if (!text || text === '') {
      setDialCodeData(dialCodeDataCopy)
    } else if (Array.isArray(filteredName)) {
      setDialCodeData(filteredName)
    }

  }

  const handleLinkPress = url => {
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  return (
    <View style={styles.container}>


      <KeyboardAwareScrollView bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, }}
        contentContainerStyle={{ paddingTop: mvs(30), paddingBottom: mvs(50) }}
        keyboardShouldPersistTaps='never'>
        <View style={{ flex: 1, alignItems: 'center' }} >
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

          {/* Image */}
          <Image
            source={require('../../src/assets/logo2.png')}
            style={styles.image}
          />

          {/* Header */}
          <View
            style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.header}>Login with mobile number</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputContainer}>
            <View>

              {/* Country Code Input */}
              <TextInput
                style={styles.smallInput}
                placeholder="+1"
                placeholderTextColor="#888"
                value={countryCode}
                keyboardType="phone-pad"
                onChangeText={(txt) => {
                  setCountryCode(txt)
                  setSearch(true)
                  handleSearch(txt)
                }}
                onFocus={() => setSearch(true)}
              />
              {search && dialCodeData && dialCodeData.length > 0 && (
                <ScrollView
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                  style={{
                    height: height / 5.5,
                    overflowY: 'scroll',
                    borderWidth: 1,
                    borderTopStartRadius: 6,
                    borderTopEndRadius: 6,
                    borderColor: 'gray',
                    zIndex: 99,
                    // position:'absolute',
                    // top:60
                  }}>
                  {dialCodeData.map(item => (
                    <TouchableOpacity
                      key={item.search}
                      onPress={() => {
                        setSearch(false)
                        setCountryCode(item?.value)
                        Keyboard.dismiss()
                        mobileRef.current?.focus()
                      }}
                      style={{
                        flex: 1,
                        paddingHorizontal: 5,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderColor: 'gray',
                      }}>
                      <View>
                        <Text style={{ color: '#000', fontSize: SIZES.f14, fontFamily: FONTS.medium }}>
                          {item.value}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            {/* Phone Number Input */}
            <TextInput
              style={styles.input}
              placeholder="9999999999"
              placeholderTextColor="#888"
              maxLength={13}
              ref={mobileRef}
              value={phoneNumber}
              keyboardType="numeric"
              onChangeText={setPhoneNumber} // Update phoneNumber state
              onFocus={() => setSearch(false)}
              testID="phoneInput"
              accessibilityLabel="phoneInput"
              nativeID="phoneInput"
            />
          </View>
          <View>
            {phoneError ? <Text style={styles.errorText} testID="errorText" accessibilityLabel="errorText" nativeID="errorText">{phoneError}</Text> : null}
          </View>
          <View>
            {countryCodeError ? (
              <Text style={styles.errorText}>{countryCodeError}</Text>
            ) : null}
          </View>
          <View style={[styles.termsContainer, { justifyContent: 'flex-start' }]}
          //onPress={() => handleChange('agreeTerms', !formData.agreeTerms)}
          >
            <CheckBox
              checked={true}
              onPress={() => null}
              title={
                <View style={{ paddingRight: 3, top: -5 }}>
                  <Text style={styles.text}>
                    By tapping Send Code, you agree to receive a one-time SMS with your verification code for login. No recurring marketing texts. Message & data rates may apply.
                    <Text
                      style={styles.linkText}
                      onPress={() =>
                        handleLinkPress(TERMS_URL)
                      }>
                      {"\n"}Terms & Conditions
                    </Text>
                    {/* and{' '} */}{' '}•{' '}
                    <Text
                      style={styles.linkText}
                      onPress={() =>
                        handleLinkPress(PRIVACY_URL)
                      }>
                      Privacy Policy
                    </Text>
                    {/* {"\n"}Terms:{" "}
                    <Text
                      style={[styles.linkText,{textDecorationLine:"underline"}]}
                      onPress={() =>
                        handleLinkPress(TERMS_URL)
                      }>
                      https://totallyflawless.co/terms-and-conditions
                    </Text>
                    {"\n"}Privacy:{" "}
                    <Text
                      style={[styles.linkText,{textDecorationLine:"underline"}]}
                      onPress={() =>
                        handleLinkPress(PRIVACY_URL)
                      }>
                      https://totallyflawless.co/privacy-policy
                    </Text> */}
                  </Text>


                  {/*   <Text style={styles.text}>
                    By tapping Send Code, you agree to receive SMS messages from TF App related to login, bookings, and updates. Msg & data rates may apply. Reply
                    <Text
                      style={styles.linkText}
                      onPress={() =>
                        handleLinkPress(CONTACT_URL)
                      }> STOP</Text> to unsubscribe,
                    <Text
                      style={styles.linkText}
                      onPress={() =>
                        handleLinkPress(CONTACT_URL)
                      }> HELP</Text> for help.
                    <Text
                      style={styles.linkText}
                      onPress={() =>
                        handleLinkPress(TERMS_URL)
                      }>
                      {"\n"}Terms of use
                    </Text>{' '}
                    and{' '}
                    <Text
                      style={styles.linkText}
                      onPress={() =>
                        handleLinkPress(PRIVACY_URL)
                      }>
                      Privacy policy.
                    </Text>
                  </Text>*/}

                </View>
              }
              checkedColor="black"
              wrapperStyle={styles.wrapperStyle}
              containerStyle={styles.containerStyle}
            />
          </View>


          {/* Send OTP Button */}
          <TouchableOpacity style={styles.button} onPress={handleSendOTP} testID="loginButton" accessibilityLabel="loginButton" nativeID="loginButton">
            <Text style={styles.buttonText}>Send Code</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* <Toast /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    // paddingVertical: 30,
    backgroundColor: 'white',
  },
  errorText: {
    color: 'red',
    marginTop: '-1.5%',
  },
  image: {
    height: height / 7,
    objectFit: 'contain',
  },
  wrapperStyle: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: SIZES.cardWidth - ms(30)
  },
  header: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    opacity: 0.6,
    backgroundColor: '#E8E8E8',
    color: 'black',
    fontSize: SIZES.f14,
    fontFamily: FONTS.semiBold,
    width: 200,
    height: 60
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 75,
    borderRadius: 50,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallInput: {
    height: 60,
    width: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    opacity: 0.7,
    backgroundColor: '#E8E8E8',
    color: 'black',
    fontSize: SIZES.f14,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    marginHorizontal: 0,
    width: SIZES.cardWidth,
    //paddingHorizontal: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 3,
    marginRight: 10,
    marginLeft: 50,
  },
  checked: {
    backgroundColor: 'black',
    marginLeft: 50,
  },
  termsText: {
    fontSize: 14,
    color: '#000',
    padding: 20,
    marginRight: 40,
  },
  text: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#000',
    paddingHorizontal: 10,
  },
  linkText: {
    fontWeight: FONTS.bold,
    color: COLORS.yellow,
  },
});

export default Login;
