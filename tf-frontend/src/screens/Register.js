import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Linking,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { CheckBox } from '@rneui/themed';
const { height, width } = Dimensions.get('window');
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import RNFetchBlob from 'rn-fetch-blob';
import { Overlay } from '@rneui/themed';
import { LogBox } from 'react-native';
// Buffer removed; client no longer uses private keys or base64 signing for uploads
import { Icon } from '@rneui/base';
import { API_URL, PRIVACY_URL, TERMS_URL } from '../store/url';
import { uploadToS3 } from '../services/S3UploadService';
import axiosInstance from '../services/axiosInterceptor';
import { mvs } from 'react-native-size-matters';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CommonPhotoClick from '../components/CommonPhotoClick';

const Register = ({ navigation }) => {
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 0;

  const options = {
    keyPrefix: 'uploads/',
    bucket: 'flawless-dev',
    region: 'ap-south-1',
    successActionStatus: 201,
  };
  const [geocode, setGeoCode] = useState('');
  // AWS credentials removed from client. Use backend upload via `uploadToS3`.

  const requestCameraPermission = async () => {
    try {
      console.log('check camera');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs camera permission',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };
  const requestExternalStoragePermission = async () => {
    try {
      if (Number(Platform.Version) >= 33) {
        return true;
      }
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'External Storage Write Permission',
          message: 'App needs write permission',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      console.log(granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const [search, setSearch] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [imageUri, setImageUri] = useState(null);
  const [visible, setVisible] = useState(false);
  const [placeId, setPlaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  //const routes = useRoute();
  //const {guestUser} = routes.params;
  // const APIBASEURL = 'http://164.52.197.9:3001';
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    imgUrl: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState();

  const handleChange = (name, value, click = false) => {
    console.log(name, value);
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: '', // Reset error message when user starts typing
    });

    click && setSearch(false);
  };

  const changeNavigation = page => {
    navigation.navigate(page);
  };

  const handleLinkPress = url => {
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };
  const handleRegister = async () => {
    try {
      // if (
      //   formData.email === '' ||
      //   formData.address === '' ||
      //   formData.firstName === '' ||
      //   formData.lastName === ''
      // ) {
      //   Toast.show({
      //     type: 'error',
      //     text1: 'Error',
      //     text2: 'Please Fill all the required Fields',
      //   });
      //   return;
      // }
      // if (formData.imgUrl === '') {
      //   Toast.show({
      //     type: 'error',
      //     text1: 'Error',
      //     text2: 'Please upload your image',
      //   });
      //   return;
      // }

      // if (!formData.agreeTerms) {
      //   Toast.show({
      //     type: 'error',
      //     text1: 'Error',
      //     text2: 'Please Check Terms and Conditions',
      //   });
      //   return;
      // }
      // const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      // if (!emailRegex.test(formData.email)) {
      //   Toast.show({
      //     type: 'error',
      //     text1: 'Error',
      //     text2: 'Invalid Email Address',
      //   });
      //   return;
      // }
      let valid = true;
      let validationErrors = {};

      // First Name validation (only alphabets and spaces allowed)
      const nameRegex = /^[A-Za-z\s]+$/;
      if (formData.firstName.trim() === '') {
        validationErrors.firstName = 'First Name is required';
        valid = false;
      } else if (!nameRegex.test(formData.firstName)) {
        validationErrors.firstName = 'First Name should contain only alphabets';
        valid = false;
      }

      // Last Name validation (only alphabets and spaces allowed)
      if (formData.lastName.trim() === '') {
        validationErrors.lastName = 'Last Name is required';
        valid = false;
      } else if (!nameRegex.test(formData.lastName)) {
        validationErrors.lastName = 'Last Name should contain only alphabets';
        valid = false;
      }

      // Email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (formData.email.trim() === '') {
        validationErrors.email = 'Email is required';
        valid = false;
      } else if (!emailRegex.test(formData.email)) {
        validationErrors.email = 'Please enter a valid email address';
        valid = false;
      }

      // Address validation
      if (formData.address.trim() === '') {
        validationErrors.address = 'Address is required';
        valid = false;
      }

      // Terms and Conditions validation
      if (!formData.agreeTerms) {
        validationErrors.agreeTerms =
          'You must agree to the terms and conditions';
        valid = false;
      }

      // Image Upload validation
      if (formData.imgUrl.trim() === '') {
        validationErrors.imgUrl = 'Please Upload your image';
        valid = false;
      }

      if (!valid) {
        setErrors(validationErrors);
        return;
      }
      console.log(formData);
      const response = await axiosInstance.post(`/update-user`, formData);
      if (response.status === 200) {
        setAddress();
        await AsyncStorage.setItem('isNewUser', 'false');
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Home',
              params: {
                guestUser: false,
              },
            },
          ],
        });
      }
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error: /update-user >>>>', error);

      // show an error message to the user
    }
  };

  const setAddress = async () => {
    try {
      const getAddressDetails = await axiosInstance.get(
        `/maps/place?placeId=${placeId}`,
      );
      // console.log('getAddressDetails', JSON.stringify(getAddressDetails.data));
      const latlong =
        getAddressDetails.data.result?.geometry?.location?.lat +
        ',' +
        getAddressDetails.data.result?.geometry?.location?.lng;
      setGeoCode(latlong);
      let location_obj = {
        formatted_address: '',
        locality: '',
        street_number: '',
        admin_area_l1: '',
        route: '',
        country: '',
        sublocality: '',
        postal_code: '',
        latitude: '',
        longitude: '',
      };
      for (let i in getAddressDetails.data.result.address_components) {
        let item = getAddressDetails.data.result.address_components[i];
        location_obj['formatted_address'] =
          getAddressDetails.data.result.formatted_address ||
          getAddressDetails.data.result.formatted_address;
        if (
          item['types'].indexOf('locality') > -1 ||
          item['types'].indexOf('administrative_area_level_2') > -1
        ) {
          location_obj['locality'] = item['long_name'];
        } else if (item['types'].indexOf('administrative_area_level_1') > -1) {
          location_obj['admin_area_l1'] = item['long_name'];
        } else if (item['types'].indexOf('street_number') > -1) {
          location_obj['street_number'] = item['long_name'];
        } else if (item['types'].indexOf('route') > -1) {
          location_obj['route'] = item['long_name'];
        } else if (item['types'].indexOf('country') > -1) {
          location_obj['country'] = item['long_name'];
        } else if (item['types'].indexOf('postal_code') > -1) {
          location_obj['postal_code'] = item['long_name'];
        } else if (item['types'].indexOf('sublocality') > -1) {
          location_obj['sublocality'] = item['long_name'];
        }
      }
      console.log('location_obj', location_obj);
      // let street = getAddressDetails.data.result.name || '';
      // if (location_obj.street_number) {
      //   street = street
      //     ? street + ', ' + location_obj.street_number
      //     : location_obj.street_number;
      // }
      // if (location_obj.route) {
      //   street = street
      //     ? street + ', ' + location_obj.route
      //     : location_obj.route;
      // }
      // let street=location_obj?.formatted_address;
      let street = location_obj.street_number || "";

      if (street == "") {
        street = getAddressDetails.data.result.name
      }

      if (location_obj.route) {
        street = street + ", " + location_obj.route
      }
      const response = await axiosInstance.post(`/add-address`, {
        userId: formData.id,
        street: street,
        city: location_obj.locality,
        state: location_obj.admin_area_l1,
        pincode: location_obj.postal_code,
        isDefault: true,
        geocode: latlong,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const getLocalStorage = async () => {
    const id = await AsyncStorage.getItem('id');
    setFormData({
      ...formData,
      id: id,
    });
  };



  const openCamera = async () => {
    const isCameraPermitted =
      Platform.OS == 'android' ? await requestCameraPermission() : true;
    const isStoragePermitted =
      Platform.OS == 'android'
        ? await requestExternalStoragePermission()
        : true;
    if (isCameraPermitted && isStoragePermitted) {
      console.log('open camera');
      const options = {
        mediaType: 'photo',
        cameraType: 'back',
      };
      launchCamera(options, async response => {
        setVisible(false);
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          console.log('Response = ', response);
          setImageUri(response.assets[0].uri);
          const name = formData?.id ? `profile_${formData.id}` : ""
          const imgUrl = await uploadToS3(response.assets[0], name);
          setIsLoading(false);
          setFormData({ ...formData, imgUrl: imgUrl });
          setErrors({ ...errors, imgUrl: "" });
          // Handle the response (e.g., display the image or upload it)
        }
      });
    }
  };

  const openFileStorage = async () => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };
      launchImageLibrary(options, async response => {
        setVisible(false);
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('Image picker error: ', response.error);
        } else {
          console.log('Response = ', response);
          let imageUri = response.uri || response.assets?.[0]?.uri;
          setImageUri(imageUri);
          const name = formData?.id ? `profile_${formData.id}` : ""
          const imgUrl = await uploadToS3(response.assets[0], name);
          setIsLoading(false);
          setFormData({ ...formData, imgUrl: imgUrl });
          setErrors({ ...errors, imgUrl: "" });
        }
      });
    } catch (error) {
      setVisible(false);
      console.log(error);
    }
  };

  const handleUpload = async file => {
    setIsLoading(true);
    try {
      const uploaded = await uploadToS3(file);
      setIsLoading(false);
      // `uploadToS3` should return the uploaded file URL in `uploaded` or `uploaded.url`
      return uploaded?.url || uploaded;
    } catch (e) {
      console.log('err', e);
      setIsLoading(false);
      throw e;
    }
  };

  const handleChangeText = async text => {
    //setSearch(text);
    try {
      const response = await axiosInstance.get(
        `/maps/autocomplete?input=${encodeURIComponent(text)}`,
      );
      setPredictions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const toggleOverlay = () => {
    setVisible(!visible);
  };

  useEffect(() => {
    getLocalStorage();
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {/* Top App Bar with Back Button */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => changeNavigation('Auth')}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            color="#000"
            name="arrow-back-ios"
            size={25}
            type="material"
          />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 100}
        extraHeight={150}
        showsVerticalScrollIndicator={true}
        onScrollBeginDrag={dismissKeyboard}
      >
      {isLoading && (
        <Modal animationType="fade" transparent={true}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}>
            <ActivityIndicator size={'large'} color={'#FFF'} />
          </View>
        </Modal>
      )}
      {/* <KeyboardAvoidingView
        behavior="height"
        style={{flex:1}} 
        keyboardVerticalOffset={keyboardVerticalOffset}> */}
      <View style={styles.container}>


        {/* Logo Image */}
        <Image
          source={require('../../src/assets/logo2.png')}
          style={styles.logo}
        />

        {/* Header */}
        <Text style={styles.header}>
          Please upload a current picture of yourself
        </Text>

        {/* Image Upload */}
        <TouchableOpacity
          onPress={() => toggleOverlay()}
          style={{
            height: height * 0.14,
            width: height * 0.14,
            borderRadius: height * 0.7,
          }}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                height: height * 0.14,
                width: height * 0.14,
                borderRadius: height * 0.7,
              }}
            />
          ) : (
            <CommonPhotoClick />

          )}
          {/* <Image
                source={require('../../src/assets/photo.png')}
                style={{
                  height: height * 0.14,
                  width: height * 0.14,
                  borderRadius: height * 0.7,
                }}
              /> */}
        </TouchableOpacity>
        <View>
          {errors?.imgUrl && (
            <Text style={styles.errorText}>{errors.imgUrl}</Text>
          )}
        </View>

        {/* Register Header */}
        <Text style={{ ...styles.registerHeader, marginTop: 10 }}>Register</Text>

        {/* Form */}
        <View style={styles.form}>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: '#E8E8E8', zIndex: 99 },
            ]}>
            <Image
              source={require('../assets/username.png')}
              style={{
                marginRight: 10,
                height: 25,
                width: 25,
                objectFit: 'contain',
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#888"
              value={formData.firstName}
              onChangeText={text => handleChange('firstName', text)}
              onFocus={() => setSearch(false)}
              testID="registerFirstName"
              nativeID="registerFirstName"
              accessibilityLabel="registerFirstName"
            />
          </View>
          <View>
            {errors?.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>
          <View style={[styles.inputContainer, { backgroundColor: '#E8E8E8' }]}>
            <Image
              source={require('../assets/username.png')}
              style={{
                marginRight: 10,
                height: 25,
                width: 25,
                objectFit: 'contain',
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#888"
              value={formData.lastName}
              onChangeText={text => handleChange('lastName', text)}
              onFocus={() => setSearch(false)}
              testID="registerLastName"
              nativeID="registerLastName"
              accessibilityLabel="registerLastName"
            />
          </View>
          <View>
            {errors?.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>
          <View style={[styles.inputContainer, { backgroundColor: '#E8E8E8' }]}>
            <Image
              source={require('../assets/mail.png')}
              style={{
                marginRight: 10,
                height: 25,
                width: 25,
                objectFit: 'contain',
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCorrect={false}
              autoCapitalize="none"
              value={formData.email}
              onChangeText={text => handleChange('email', text)}
              onFocus={() => setSearch(false)}
              testID="registerEmail"
              nativeID="registerEmail"
              accessibilityLabel="registerEmail"
            />
          </View>
          <View>
            {errors?.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>
          <View
            style={[
              styles.inputContainer, { marginBottom: 0 }, { backgroundColor: '#E8E8E8' },
            ]}>
            <Image
              source={require('../assets/Group.png')}
              style={{
                marginRight: 10,
                height: 25,
                width: 25,
                objectFit: 'contain',
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor="#888"
              value={formData.address}
              autoCorrect={false}
              onChangeText={text => {
                handleChange('address', text);
                handleChangeText(text);
              }}
              onFocus={() => setSearch(true)}
              testID="registerAddress"
              nativeID="registerAddress"
              accessibilityLabel="registerAddress"
            />
          </View>
          <View>
            {errors?.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>
          {search && predictions && predictions.length > 0 && (
            <ScrollView
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              nestedScrollEnabled={true}
              style={{
                maxHeight: height / 8,
                overflowY: 'scroll',
                borderWidth: 1,
                borderColor: 'gray',
                zIndex: 99,
              }}>
              {predictions.map(item => (
                <TouchableOpacity
                  key={item.place_id}
                  onPress={() => {
                    setPlaceId(item.place_id);
                    handleChange('address', item.description, true);
                  }}
                  style={{
                    flex: 1,
                    paddingHorizontal: 5,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: 'gray',
                  }}>
                  <View>
                    <Text style={{ color: '#000', fontSize: 12 }}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Terms and Conditions */}
        <View style={[styles.termsContainer, { justifyContent: 'flex-start' }]}
        //onPress={() => handleChange('agreeTerms', !formData.agreeTerms)}
        >
          <CheckBox
            checked={formData.agreeTerms}
            onPress={() => handleChange('agreeTerms', !formData.agreeTerms)}
            title={
              <View style={{ paddingRight: 3 }}>
                <Text style={styles.text}>
                  By continuing to use this site you agree with our{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      handleLinkPress(TERMS_URL)
                    }>
                    Terms of use
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      handleLinkPress(PRIVACY_URL)
                    }>
                    Privacy policy.
                  </Text>
                </Text>
                <View>
                  {errors?.agreeTerms && (
                    <Text style={[styles.errorText, styles.errorTextfix]}>
                      {errors.agreeTerms}
                    </Text>
                  )}
                </View>
              </View>
            }
            checkedColor="black"
            wrapperStyle={styles.wrapperStyle}
            containerStyle={styles.containerStyle}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleRegister}
          testID="registerContinue"
          nativeID="registerContinue"
          accessibilityLabel="registerContinue">
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        {!visible && <Toast />}
      </View>
      </KeyboardAwareScrollView>

      <Overlay isVisible={visible} onBackdropPress={toggleOverlay}>
        <View style={{ width: width / 1.5, padding: 10 }}>
          <View style={{ marginVertical: 5 }}>
            <Text style={{ textAlign: 'center' }}>Action for Image upload</Text>
          </View>
          <TouchableOpacity
            onPress={() => openCamera()}
            style={{
              padding: 10,
              borderWidth: 0.5,
              marginVertical: 5,
              backgroundColor: 'black',
            }}>
            <Text style={{ textAlign: 'center', color: '#FFF' }}>
              Open Camera
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openFileStorage()}
            style={{
              padding: 10,
              borderWidth: 0.5,
              marginVertical: 5,
              backgroundColor: 'black',
            }}>
            <Text style={{ textAlign: 'center', color: '#FFF' }}>
              Open Gallery
            </Text>
          </TouchableOpacity>
        </View>
      </Overlay>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  topAppBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: 'white',
  },
  logo: {
    height: height / 7,
    objectFit: 'contain',
  },
  header: {
    fontFamily: 'Poppins-Regular',
    marginBottom: 20,
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  registerHeader: {
    fontFamily: 'Poppins-Regular',
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontSize: 20,
    color: '#000',
    fontWeight: '600',
  },
  text: {
    fontFamily: 'Poppins-Regular',
    fontSize: 17,
    color: '#000',
    paddingHorizontal: 10,
  },
  linkText: {
    fontWeight: 'bold',
    color: 'black',
  },
  wrapperStyle: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  form: {
    width: width,
    paddingHorizontal: 25,
    zIndex: 99,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  input: {
    height: 50,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    color: '#000',
    backgroundColor: '#E8E8E8',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    marginHorizontal: 0,
    width: width,
    paddingHorizontal: 8,
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
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 75,
    borderRadius: 50,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  errorTextfix: {
    marginLeft: '-7.5%',
  },
});

export default Register;
