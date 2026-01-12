import React, { useState, useEffect, useContext } from 'react';
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
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckBox } from '@rneui/themed';
const { height, width } = Dimensions.get('window');
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
// Removed direct AWS SDK imports; uploads are proxied via `uploadToS3` service.
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Overlay } from '@rneui/themed';
import { LogBox } from 'react-native';
import { Icon } from '@rneui/base';
import RNFetchBlob from 'rn-fetch-blob';
import { API_URL } from '../store/url';
import { uploadToS3, deleteFromStorage } from '../services/S3UploadService';
import TopBar from '../components/TopBar';
import { ms, mvs } from 'react-native-size-matters';
import { GlobalStyles } from '../style/GlobalStyles';
import CommonSvg from '../components/CommonSvg';
import screenNames from '../constants/screenNames';
import BottomBar from '../components/BottomBar';
import axiosInstance from '../services/axiosInterceptor';
import { showToast } from '../components/Toast';
import { COLORS, FONTS } from '../style/theme';
import UserContext from './UserContext'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomImageView from '../components/CustomImageView';
import CommonPhotoClick from '../components/CommonPhotoClick';

type Props = {}

const UserProfile = (props: Props) => {

    const { updateUser } = useContext(UserContext);

    const navigation = useNavigation<any>();
    const keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 0;

    const [geocode, setGeoCode] = useState('');
    const [search, setSearch] = useState(false);
    const [predictions, setPredictions] = useState([]);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [placeId, setPlaceId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddressChanged, setIsAddressChanged] = useState(false)
    const [userId, setUserId] = useState("")
    const [copyMobileNo, setCopyMobileNo] = useState("")
    const [imageVisible, setImageVisible] = useState(false);
    const [imageData, setImageData] = useState<any[]>([])

    const [formData, setFormData] = useState({
        id: '',
        firstName: '',
        lastName: '',
        phone: "",
        email: '',
        address: '',
        imgUrl: '',
        agreeTerms: true,
    });

    const [errors, setErrors] = useState<any>();

    useEffect(() => {

        const subscribe = navigation.addListener('focus', () => {
            setIsLoading(true)
            getData();
            setTimeout(() => {
                setIsLoading(false)
            }, 1000);
        })

        return () => {
            subscribe;
        }
    }, [])


    const getData = async () => {

        try {

            const flag = await AsyncStorage.getItem('guestUser');
            if (flag === 'true') {
                navigation?.navigate("Auth")
                return
            }
            const id = await AsyncStorage.getItem('id');
            setUserId(id ?? "")
            const response = await axiosInstance.get(`/get-userdetails?userId=${id}`);
            if (response?.status == 200) {
                const data = response?.data?.data[0];
                // console.log('data >>>>', data)
                const temp = formData;
                temp.id = id ?? "";
                temp.firstName = data?.firstName || "";
                temp.lastName = data?.lastName || "";
                temp.email = data?.email || "";
                temp.phone = data?.phone || "";
                temp.address = data?.address || "";
                // Treat 'DELETED' marker as no image
                const profileImg = data?.profileImage === 'DELETED' ? '' : (data?.profileImage || '');
                temp.imgUrl = profileImg;
                setCopyMobileNo(data?.phone || "")
                setImageUri(profileImg)
                console.log('Profile image URL:', data?.profileImage)
                setFormData({ ...formData, ...temp })
            }
            console.log('response?.data', response?.data)
        } catch (error) {
            console.error(error)
        }
    }


    const handleChange = (name: string, value: string | boolean, click = false) => {
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

    const handleRegister = async () => {

        try {

            let valid = true;
            let validationErrors: any = {};
            console.log('formData', formData)
            Keyboard.dismiss()

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
            // if (formData.address.trim() === '') {
            //     validationErrors.address = 'Address is required';
            //     valid = false;
            // }



            // Image Upload validation
            // if (formData.imgUrl.trim() === '') {
            //     validationErrors.imgUrl = 'Please Upload your image';
            //     valid = false;
            // }

            if (!valid) {
                setErrors(validationErrors);
                return;
            }
            setIsLoading(true)
            // console.log(formData);
            const response = await axiosInstance.post(`/update-user`, formData);
            console.log("response>>>", response);
            if (response.status === 200) {
                if (isAddressChanged) {
                    setAddress();
                }

                if (formData.phone == copyMobileNo) {

                    showToast("Information updated successfully")
                    getUserDetails()
                    changeNavigation(screenNames.HOME)


                } else {
                    showToast("Mobile number updated successfully! Please login again to continue.")
                    await AsyncStorage.removeItem('id');
                    await AsyncStorage.removeItem('isNewUser');
                    await AsyncStorage.removeItem('userType');
                    await AsyncStorage.removeItem('hasMobile');
                    await AsyncStorage.removeItem('isRegistered');
                    navigation.reset({
                        index: 0,
                        routes: [{
                            name: 'Login',
                            params: {
                                userType: 'Client',
                            },
                        }],

                    });
                }
            }
            setIsLoading(false)
            console.log('Response:', response.data);
        } catch (error) {
            console.error('Error:', error);
            // show an error message to the user
        }
    };

    const getUserDetails = async () => {


        try {
            const id = await AsyncStorage.getItem("id");
            const response = await axiosInstance.get(
                `/get-userdetails?userId=${id}`,
            );
            const data = response.data.data[0];
            console.log("getUserDetails >>>", response.data.data[0])
            if (data) {
                updateUser({
                    id: data.id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    createdDate: data.createdDate,
                    phone: data?.phone,
                    email: formData.email,
                    profileImage: formData.imgUrl,
                    isAvailable: data.isAvailable == 1 ? true : false,
                    userType: 'Client',
                });
            }

            // updateUser(response.data.data[0]);
        } catch (error) {

        }

    }

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

    const setAddress = async () => {
        try {
            // Proxy the Google Places request through the backend to protect API keys
            const getAddressDetails = await axiosInstance.get(
                `/maps/place?placeId=${placeId}`,
            );
            // console.log('getAddressDetails', JSON.stringify(getAddressDetails.data));
            const latlong =
                getAddressDetails.data.result?.geometry?.location?.lat +
                ',' +
                getAddressDetails.data.result?.geometry?.location?.lng;

            console.log('getAddressDetails.data.result?.geometry?.location', getAddressDetails.data.result?.geometry?.location)
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
            //     street = street
            //         ? street + ', ' + location_obj.street_number
            //         : location_obj.street_number;
            // }
            // if (location_obj.route) {
            //     street = street
            //         ? street + ', ' + location_obj.route
            //         : location_obj.route;
            // }
            // let street=location_obj?.formatted_address;
            let street = location_obj.street_number || "";

            if (street == "") {
                street = getAddressDetails.data.result.name
            }

            if (location_obj.route) {
                street = street + ", " + location_obj.route
            }

            const request = {
                userId: formData.id,
                street: street,
                city: location_obj.locality,
                state: location_obj.admin_area_l1,
                pincode: location_obj.postal_code,
                isDefault: true,
                geocode: latlong,
            }

            console.log('request >>> ', request)
            const response = await axiosInstance.post(`/add-address`, request);
            setIsAddressChanged(false)
        } catch (err) {
            console.log(err);
        }
    };

    const getLocalStorage = async () => {
        const id = await AsyncStorage.getItem('id');
        setFormData({
            ...formData,
            id: id ?? "",
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
            const options: any = {
                mediaType: 'photo',
                cameraType: 'back',
            };
            launchCamera(options, async (response: any) => {
                setVisible(false);
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.error) {
                    console.log('ImagePicker Error: ', response.error);
                } else {
                    setIsLoading(true);
                    console.log('Response = ', response);
                    setImageUri(response.assets[0].uri);
                    // const name = formData?.id ? `profile_${formData.id}` : ""
                    const imgUrl = await uploadToS3(response.assets[0]);
                    console.log('imgUrl camera >>>>', imgUrl)
                    setFormData({ ...formData, imgUrl: imgUrl });
                    setTimeout(() => {
                        setIsLoading(false);
                    }, 1000);
                    // Handle the response (e.g., display the image or upload it)
                }
            });
        }
    };

    const openFileStorage = async () => {
        try {
            const options: {
                mediaType: 'photo' | 'video' | 'mixed';
                includeBase64: boolean;
                maxHeight: number;
                maxWidth: number;
            } = {
                mediaType: 'photo',
                includeBase64: false,
                maxHeight: 2000,
                maxWidth: 2000,
            };
            launchImageLibrary(options, async response => {
                setVisible(false);
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.errorCode) {
                    console.log('Image picker error: ', response.errorMessage);
                } else {
                    setIsLoading(true);
                    console.log('Response = ', response);
                    let imageUri = response.assets?.[0]?.uri ?? null;
                    setImageUri(imageUri);
                    if (response.assets && response.assets[0]) {
                        const imgUrl = await uploadToS3(response.assets[0]);
                        setFormData({ ...formData, imgUrl: imgUrl });
                    }
                    setTimeout(() => {
                        setIsLoading(false);
                    }, 1000);
                }
            });
        } catch (error) {
            setVisible(false);
            console.log(error);
        }
    };

    const handleChangeText = async (text: any) => {
        //setSearch(text);
        try {
            // Proxy the autocomplete request through backend to hide API key
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

    const deleteImage = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'UserProfile.tsx:deleteImage:entry', message: 'deleteImage called', data: { currentImgUrl: formData.imgUrl, oderId: formData.id }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
        // #endregion

        setVisible(false);

        if (!formData.imgUrl) {
            showToast('No image to delete');
            return;
        }

        if (!formData.id) {
            showToast('User ID not found');
            return;
        }

        try {
            setIsLoading(true);
            const oldImageUrl = formData.imgUrl;
            const currentUserId = formData.id;

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'UserProfile.tsx:deleteImage:beforeDeleteStorage', message: 'About to delete from storage AND clear DB', data: { oldImageUrl, userId: currentUserId }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
            // #endregion

            // Delete from GCS storage AND clear profileImage in database (single call)
            const deleted = await deleteFromStorage(oldImageUrl, currentUserId);

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'UserProfile.tsx:deleteImage:afterDeleteStorage', message: 'deleteFromStorage returned', data: { deleted }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
            // #endregion

            if (deleted) {
                // Also update production database via update-user endpoint
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'UserProfile.tsx:deleteImage:callingUpdateUser', message: 'Calling update-user to clear imgUrl in production DB', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
                // #endregion

                // Clear imgUrl in production database
                // Use a special "deleted" marker since production ignores empty strings
                await axiosInstance.post(`/update-user`, {
                    id: currentUserId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    imgUrl: 'DELETED', // Marker to indicate deleted (production needs fix to handle empty)
                });

                // Update local state
                setImageUri(null);
                setFormData({ ...formData, imgUrl: '' });
                showToast('Image deleted successfully');

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'UserProfile.tsx:deleteImage:success', message: 'Image deleted successfully', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
                // #endregion
            } else {
                showToast('Failed to delete image');
            }
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'UserProfile.tsx:deleteImage:error', message: 'Error deleting image', data: { error: error?.message || String(error) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
            // #endregion
            console.error('Error deleting image:', error);
            showToast('Failed to delete image');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getLocalStorage();
    }, []);

    const changeNavigation = (page: any) => {
        navigation.navigate(page);
    };

    const handleLinkPress = (url: any) => {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    };

    return (
        <View style={{ backgroundColor: '#FFF', flex: 1 }}>
            <TopBar navigation={navigation} />
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="always"
                // automaticallyAdjustKeyboardInsets={true}
                style={{ backgroundColor: '#FFF', flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}>
                {/* <View
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
                  onPress={() => changeNavigation('Auth')}
                  size={25}
                  type="material"
                />
              </View>
            </View> */}
                <View style={styles.headerTitleView} >
                    <TouchableOpacity style={styles.backBtn} onPress={() => changeNavigation(screenNames.HOME)} >
                        <CommonSvg.back />
                    </TouchableOpacity>

                    <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >My Profile</Text>
                </View>
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
                    behavior="position"
                    keyboardVerticalOffset={keyboardVerticalOffset}> */}
                <View style={styles.container}>
                    {/* Logo Image */}
                    {/* <Image
                  source={require('../../src/assets/logo2.png')}
                  style={styles.logo}
                /> */}

                    {/* Header */}
                    {/* <Text style={styles.header}>
                  Please upload a current picture of yourself
                </Text> */}

                    {/* Image Upload */}
                    <TouchableOpacity
                        // disabled={!formData?.imgUrl}
                        activeOpacity={0.7}
                        onPress={() => {
                            // showToast("temporarily unavailable");
                            // toggleOverlay()
                            const hasValidImage = formData?.imgUrl && formData.imgUrl !== 'DELETED';
                            if (hasValidImage) {
                                setImageVisible(true)
                                setImageData([{ uri: formData?.imgUrl }])
                            } else {
                                toggleOverlay()
                            }

                        }}
                        style={{
                            height: height * 0.14,
                            width: height * 0.14,
                            borderRadius: height * 0.7,
                        }}>
                        {formData?.imgUrl && formData.imgUrl !== 'DELETED' ? (
                            <Image
                                source={{ uri: formData?.imgUrl }}
                                style={{
                                    height: height * 0.14,
                                    width: height * 0.14,
                                    borderRadius: height * 0.7,
                                    backgroundColor: '#E8E8E8',
                                }}
                                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                            />
                        ) : (
                            <CommonPhotoClick />
                            // <Image
                            //     source={require('../../src/assets/photo.png')}
                            //     style={{
                            //         height: height * 0.14,
                            //         width: height * 0.14,
                            //         borderRadius: height * 0.7,
                            //     }}
                            // />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => {
                        // showToast("temporarily unavailable");
                        toggleOverlay()
                    }} style={{ marginTop: mvs(10) }} >
                        <Text style={[GlobalStyles.txtM14Dark, { color: COLORS.blue }]} >Edit Picture</Text>
                    </TouchableOpacity>

                    <View>
                        {errors?.imgUrl && (
                            <Text style={styles.errorText}>{errors.imgUrl}</Text>
                        )}
                    </View>

                    {/* Register Header */}
                    <Text style={[styles.registerHeader, { marginTop: mvs(10) }]}>Personal Information</Text>

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
                            />
                        </View>
                        <View>
                            {errors?.lastName && (
                                <Text style={styles.errorText}>{errors.lastName}</Text>
                            )}
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: '#E8E8E8' }]}>
                            <Image
                                source={require('../assets/Vector.png')}
                                style={{
                                    marginRight: 10,
                                    height: 25,
                                    width: 25,
                                    objectFit: 'contain',
                                }}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor="#888"
                                keyboardType="phone-pad"
                                autoCorrect={false}
                                maxLength={13}
                                autoCapitalize="none"
                                value={formData.phone}
                                onChangeText={text => handleChange('phone', text)}
                                onFocus={() => setSearch(false)}
                            />
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
                            />
                        </View>

                        <View>
                            {errors?.email && (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            )}
                        </View>
                        {/*

                            <View
                                style={[
                                    styles.inputContainer,
                                    { marginBottom: 0 },
                                    { backgroundColor: '#E8E8E8' },
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
                                        setIsAddressChanged(true)
                                        handleChangeText(text);
                                    }}
                                    onFocus={() => setSearch(true)}
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
                                    {predictions.map((item: any) => (
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
                        
                            */}
                    </View>


                    {/* Continue Button */}
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleRegister}>
                        <Text style={styles.continueButtonText}>Update</Text>
                    </TouchableOpacity>
                    {!visible && <Toast />}
                </View>
                {/* </KeyboardAvoidingView> */}

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
                        {formData?.imgUrl ? (
                            <TouchableOpacity
                                onPress={() => deleteImage()}
                                style={{
                                    padding: 10,
                                    borderWidth: 0.5,
                                    marginVertical: 5,
                                    backgroundColor: '#D32F2F',
                                }}>
                                <Text style={{ textAlign: 'center', color: '#FFF' }}>
                                    Delete Image
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </Overlay>
            </KeyboardAwareScrollView>

            <BottomBar navigation={changeNavigation} page={screenNames.USER_PROFILE} />

            {
                imageVisible &&
                <CustomImageView
                    imageVisible={imageVisible}
                    index={0}
                    imgData={imageData}
                    imageVisibleFunction={() => {
                        setImageVisible(false)
                    }}
                />
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: 'white',
        zIndex: 99,
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
        marginVertical: mvs(30)
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: FONTS.medium
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
    },
    errorTextfix: {
        marginLeft: '-7.5%',
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
});
export default UserProfile