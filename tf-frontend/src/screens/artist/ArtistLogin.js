import {
  ActivityIndicator,
  Dimensions,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import React, { useEffect, useState, useRef, useContext } from 'react';
import { TextInput } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { CheckBox, Overlay } from '@rneui/themed';
import Toast from 'react-native-toast-message';
import RNFetchBlob from 'rn-fetch-blob';
// Removed client-side AWS SDK and Buffer usage. Use backend upload via `uploadToS3`.
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon, Image } from '@rneui/base';
import Carousel from 'react-native-snap-carousel';
import { Dropdown } from 'react-native-element-dropdown';
import UserContext from '../UserContext';
import { createThumbnail } from 'react-native-create-thumbnail';
// Import images from your assets folder

import image1 from '../../assets/ref1.png';

import image2 from '../../assets/ref2.png';

import image3 from '../../assets/ref3.png';

import image4 from '../../assets/ref4.png';
import { useIsFocused } from '@react-navigation/native';
import { API_URL, PRIVACY_URL, TERMS_URL } from '../../store/url';
import { uploadToS3 } from '../../services/S3UploadService';
import axiosInstance from '../../services/axiosInterceptor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CommonPhotoClick from '../../components/CommonPhotoClick';
import { FONTS, SIZES } from '../../style/theme';
import { ms } from 'react-native-size-matters';

const { height, width } = Dimensions.get('window');

const ArtistLogin = ({ navigation }) => {
  const isFocus = useIsFocused();
  const options = {
    keyPrefix: 'uploads/',
    bucket: 'flawless-dev',
    region: 'ap-south-1',
    successActionStatus: 201,
  };
  // AWS credentials removed from client. Backend handles S3 uploads.

  const { updateUser } = useContext(UserContext);

  const data = [
    { key: '1', value: 'Hair Stylist' },
    { key: '2', value: 'MakeUp' },
    { key: '3', value: 'Both' },
  ];

  // Step 1: Define state to manage all input fields
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    // address2:'',
    businessType: 1,
    images: [],
    videoUrl: '',
    sin: '',
    profileImage: "",
    facebook: '',
    instagram: '',
    licenceUrl: '',
    mobile: '',
    countryCode: '+1',
  });
  // console.log('======================================', formData);

  // const APIBASEURL = 'http://164.52.197.9:3001';
  // const APIBASEURL = 'http://164.52.197.9:3001';

  const emailRef = useRef();

  const [currentStep, setCurrentStep] = useState(1);
  const [selected, setSelected] = React.useState('');
  const [visible, setVisible] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [imageUris, setImageUris] = useState([]);
  const [videoUri, setVideoUris] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [drivingLicence, setDrivingLicence] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [currentImg, setCurrentImg] = useState('imageUrl');
  const [mediaType, setMediaType] = useState('photo');
  const [hasMobile, setHasMobile] = useState('true');

  const [userId, setUserId] = useState("")
  const [mobileNo, setMobileNo] = useState("")
  // const [isModalVisible, setModalVisible] = useState(false);

  const [profileVisible, setProfileVisible] = useState(false)
  const [profileImgUri, setProfileImgUri] = useState("")

  const [modalVisible, setModalVisible] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [placeId, setPlaceId] = useState('');
  const [search, setSearch] = useState(false);
  const [geocode, setGeoCode] = useState('');
  const [errors, setErrors] = useState({});
  // Step 2: Create update functions for each input field
  // const handleInputChange = (field, value) => {
  //   setFormData({
  //     ...formData,
  //     [field]: value,
  //   });
  // };


  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', () => {
      getData();
    })

    return () => {
      unsubscribe();
    }
  }, [])


  const getData = async () => {

    try {
      const id = await AsyncStorage.getItem('id');
      const response = await axiosInstance.get(`/get-artistdetails?artistId=${id}`)
      console.log('getData Register respose?.data?.data >>>>', response?.data?.data);
      const data = response?.data?.data || ""
      const temp = { ...formData }
      temp.id = data?.id;
      temp.mobile = data?.mobile;
      temp.countryCode = data?.countryCode;
      setFormData(temp);
      //setUserId(response?.data?.data?.id)

    } catch (error) {

    }

  }

  const changeNavigation = page => {
    navigation.navigate(page);
  };

  const handleLinkPress = url => {
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  useEffect(() => {
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      businessType: 1,
      images: [],
      videoUrl: '',
      profileImage: "",
      sin: '',
      facebook: '',
      instagram: '',
      licenceUrl: '',
      mobile: '',
      countryCode: '+1',
    });
  }, [isFocus]);

  const validateForm = () => {
    let formErrors = {};

    // Trim inputs before validation

    const trimmedFirstName = formData.firstName.trim();

    const trimmedLastName = formData.lastName.trim();

    const trimmedEmail = formData.email.trim();

    const trimmedMobile = formData.mobile ? formData.mobile.trim() : '';

    const trimmedFacebook = formData.facebook.trim();

    const trimmedInstagram = formData.instagram.trim();

    const trimmedSSN = formData.sin.trim();

    if (!profileImgUri) {
      formErrors.profile = "Please upload a profile image"
    }

    // First Name validation

    if (!trimmedFirstName) {
      formErrors.firstName = 'First name is required';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedFirstName)) {
      formErrors.firstName = 'First name should contain only alphabets';
    }

    // Last Name validation

    if (!trimmedLastName) {
      formErrors.lastName = 'Last name is required';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedLastName)) {
      formErrors.lastName = 'Last name should contain only alphabets';
    }

    // Email validation

    if (!trimmedEmail) {
      formErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      formErrors.email = 'Please enter a valid email address';
    }
    // Mobile validation (if mobile is required)

    if (!trimmedMobile && hasMobile === 'false') {
      formErrors.mobile = 'Mobile number is required';
    } else if (
      trimmedMobile &&
      (trimmedMobile.length < 8 || trimmedMobile.length > 15)
    ) {
      formErrors.mobile = 'Please enter a valid mobile number';
    }
    // Address validation

    if (!formData.address.trim()) {
      formErrors.address = 'Address is required';
    }

    // Facebook validation (Required and No Spaces)

    if (trimmedFacebook && /\s/.test(trimmedFacebook)) {
      formErrors.facebook = 'Please enter a valid Facebook URL';
    }

    // Instagram validation (Required and No Spaces)

    // if (!trimmedInstagram) {
    //   formErrors.instagram = 'Instagram URL is required';
    // } else 
    if (trimmedInstagram &&/\s/.test(trimmedInstagram)) {
      formErrors.instagram = 'Please enter a valid Instagram username';
    }

    // SSN validation (9-digit number)

    // if (!trimmedSSN) {
    //   formErrors.sin = 'Social Security Number is required';
    // } else
     if (trimmedSSN && !/^\d{9}$/.test(trimmedSSN)) {
      formErrors.sin = 'SSN must be a 9-digit number';
    }

    if (!drivingLicence) {
      // if (!formData.licenceUrl) {
      formErrors.drivingLicence = 'Driving Licence image is required';
    }
    setErrors(formErrors);
    return Object.keys(formErrors).length;
  };

  const handleInputChange = (name, value, click = false) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    click && setSearch(false);
  };

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

  const toggleOverlay = (val, type) => {
    setCurrentImg(val);
    setMediaType(type);
    setVisible(!visible);
  };

  const removeVideo = () => {
    setVideoUris('');
    setVideoThumbnail(null);
    setFormData({ ...formData, videoUrl: '' });
  };

  const removeImage = index => {
    console.log('index', index);
    console.log('imageUris', imageUris);
    console.log('formData.images', formData.images);
    let newImageUris = [...imageUris];
    let newFormImages = [...formData.images];
    newImageUris.splice(index, 1);
    newFormImages.splice(index, 1);
    setImageUris(newImageUris);
    setFormData({
      ...formData,
      images: newFormImages,
    });
  };

  const getLocalStorage = async () => {
    const hasMobile = await AsyncStorage.getItem('hasMobile');
    console.log('hasMobile>>>>>>' + hasMobile);
    if (hasMobile) {
      setHasMobile(hasMobile);
    }
    const id = await AsyncStorage.getItem('id');
    const artistResponse = await AsyncStorage.getItem('artistResponse');
    let newFormData = { ...formData };

    newFormData.id = id;

    if (artistResponse) {
      const jsonResponse = JSON.parse(artistResponse);
      console.log('LOCAL STORAGE>>>>>>>', jsonResponse);
      // Update formData with artistResponse values if present
      newFormData = {
        ...newFormData,
        firstName: jsonResponse.firstName,
        lastName: jsonResponse.lastName,
        email: jsonResponse.email,
      };
    }
    setFormData(newFormData);
  };

  useEffect(() => {
    getLocalStorage();
  }, []);

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
        mediaType: mediaType,
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
          setIsLoading(true)
          if (currentImg == 'imageUrl') {
            console.log('imageUrl');
            let newImageUris = [...imageUris];
            newImageUris.push(response.assets[0].uri);
            setImageUris(newImageUris);
            setErrors({ ...errors, images: "" })
          } else if (currentImg == 'videoUrl') {
            console.log('videoUrl');
            setVideoUris(response.assets[0].uri);
            createThumbnail({
              url: response.assets[0].uri,
              timeStamp: 0,
            })
              .then(response => {
                setVideoThumbnail(response.path);
                console.log(response);
              })
              .catch(err => console.log({ err }));
          } else if (currentImg == 'drivingLicence') {
            console.log('drivingLicence');
            setDrivingLicence(response.assets[0].uri);
          }
          const imgUrl = await uploadToS3(response.assets[0]);
          console.log('!!!!!!!!!!!!!!!!!!!!!!!', imgUrl);
          setIsLoading(false)
          if (currentImg == 'imageUrl') {
            console.log('imageUrl');
            let formImages = [...(formData.images || [])];
            formImages.push(imgUrl);
            setFormData({
              ...formData,
              images: formImages,
            });
            setErrors({ ...errors, images: "" })
          } else if (currentImg == 'videoUrl') {
            console.log('videoUrl');
            setFormData({ ...formData, videoUrl: imgUrl });
          } else if (currentImg == 'drivingLicence') {
            console.log('drivingLicence');
            setFormData({ ...formData, licenceUrl: imgUrl });
          }
          // Handle the response (e.g., display the image or upload it)
        }
      });
    }
  };

  const openFileStorage = async () => {
    try {
      const options = {
        mediaType: mediaType,
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
          setIsLoading(true)
          let newImageUri = response.uri || response.assets?.[0]?.uri;
          if (currentImg == 'imageUrl') {
            console.log('imageUrl');
            let newImageUris = [...imageUris];
            newImageUris.push(newImageUri);
            setImageUris(newImageUris);
          } else if (currentImg == 'videoUrl') {
            console.log('videoUrl');
            setVideoUris(newImageUri);
            createThumbnail({
              url: response.assets[0].uri,
              timeStamp: 0,
            })
              .then(response => {
                setVideoThumbnail(response.path);
                console.log(response);
              })
              .catch(err => console.log({ err }));
          } else if (currentImg == 'drivingLicence') {
            console.log('drivingLicence');
            setDrivingLicence(newImageUri);
          }
          const imgUrl = await uploadToS3(response.assets[0]);
          setIsLoading(false)
          if (currentImg == 'imageUrl') {
            console.log('imageUrl');
            let formImages = [...(formData.images || [])];
            formImages.push(imgUrl);
            setFormData({
              ...formData,
              images: formImages,
            });
            setErrors({ ...errors, images: "" })
          } else if (currentImg == 'videoUrl') {
            console.log('videoUrl');
            setFormData({ ...formData, videoUrl: imgUrl });
          } else if (currentImg == 'drivingLicence') {
            console.log('drivingLicence');
            setFormData({ ...formData, licenceUrl: imgUrl });
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpload = async file => {
    setIsLoading(true);
    const fs = RNFetchBlob.fs;
    const fileData = await fs.readFile(
      Platform.OS == 'android' ? file.uri : file.uri.replace('file://', ''),
      'base64',
    );
    try {
      const uploaded = await uploadToS3(file);
      setIsLoading(false);
      return uploaded?.url || uploaded;
    } catch (e) {
      setIsLoading(false);
      console.log('err', e);
    }
  };

  const handleNext = () => {
    var validate = validateForm();
    console.log('validated>>>>>>' + validate);
    if (validate === 0) {
      setIsLoading(true);
      console.log(
        'url>>>' + `/getIsEmailExist?emailId=${formData.email}`,
      );
      axiosInstance
        .get(`/getIsEmailExist?emailId=${formData.email}`)
        .then(res => {
          console.log('getIsEmailExist>>>>>>' + JSON.stringify(res.data));
          if (res.data?.isEmailExist && !hasMobile) {
            setIsLoading(false);
            setErrors({
              email: 'Email already registered',
            });
            if (emailRef.current) {
              emailRef.current.focus();
            }
          } else if (res.data?.isPhoneExist && hasMobile) {
            setIsLoading(false);
            setErrors({
              mobile: 'Phone already registered',
            });
          } else {
            setIsLoading(false);
            setCurrentStep(prev => prev + 1);
          }
        })
        .catch(error => {
          setIsLoading(false);
          console.error(error);
          Toast.show({
            type: 'error',
            text1: 'Exception',
            text2: error.message,
          });
        });
    }
  };

  const handlePrev = () => {
    console.log('handlePrev>>>>>>>>>' + handlePrev);
    // Proceed to the next step
    setCurrentStep(prev => prev - 1);
  };

  const SignUpApi = async () => {
    console.log('SignUpApi');
    try {
      let formErrors = {};

      if (selected === '') {
        formErrors.businessType = 'Artist Type is required';
        console.log('Booking Type Required');
      }

      if (formData.images.length == 0) {
        formErrors.images = 'Images Required';
        // console.log('Images Required');
      }
      if (!agreeTerms) {
        formErrors.agreeTerms = 'You must agree to the terms and conditions';
        // valid = false;
      }


      setErrors(formErrors);
      if (Object.keys(formErrors).length) {
        return;
      }

      console.log("formData >>>>>", formData);
      setIsLoading(true);
      const response = await axiosInstance.post(
        `/update-artist`,
        formData,
      );
      console.log(
        '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-',
        JSON.stringify(response.data),
      );

      if (response.status === 200) {
        setAddress();
        // const response1 = await axiosInstance.post(
        //   `/update-artist`,
        //   formData,
        // );
        updateUser({
          firstName: formData.firstName,
          email: formData.email,
          profileImage: formData.profileImage,
          userType: 'Artist',
        });
        await AsyncStorage.setItem('isNewUser', 'false');
        await AsyncStorage.setItem('isRegistered', 'true');
        await AsyncStorage.setItem('artistName', formData.firstName);
        if (formData.videoUrl) {
          const response1 = await axiosInstance.post(`/update-artist-video`, {
            videos: [formData.videoUrl],
            id: formData.id,
          });
          await AsyncStorage.setItem('isArtistDataUploaded', 'true');
        }
        setIsLoading(false);
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'ApplicationReviewPage',
            },
          ],
        });
      }
      setIsLoading(false);
      console.log('Response:', response.data);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };

  const ImageCarousel = ({ images }) => {
    const carouselRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const renderItem = ({ item }) => (
      <Image source={item} style={styles.imageModel} resizeMode="cover" />
    );

    return (
      <View style={styles.containerModel}>
        <Carousel
          ref={carouselRef}
          data={images}
          renderItem={renderItem}
          sliderWidth={width}
          itemWidth={width}
          onSnapToItem={index => setActiveIndex(index)}
        />
        <View style={styles.dotContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex ? '#000' : '#ccc',
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const images = [image1, image2, image3, image4];
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

  const setAddress = async () => {
    try {
      const getAddressDetails = await axiosInstance.get(
        `/maps/place?placeId=${placeId}`,
      );
      // console.log(getAddressDetails.data);
      const latlong =
        getAddressDetails.data.result?.geometry?.location?.lat +
        ',' +
        getAddressDetails.data.result?.geometry?.location?.lng;
      setGeoCode(latlong);
      console.log('latlong >>>>', latlong)
      const address = getAddressDetails.data.result.adr_address;
      const patterns = {
        'extended-address': /<span class="extended-address">([^<]+)<\/span>/,
        locality: /<span class="locality">([^<]+)<\/span>/,
        region: /<span class="region">([^<]+)<\/span>/,
        'postal-code': /<span class="postal-code">([^<]+)<\/span>/,
      };
      const extractValue = pattern => {
        const match = address.match(pattern);
        return match ? match[1] : null;
      };
      const extractedValues = {
        'extended-address': extractValue(patterns['extended-address']) || '',
        locality: extractValue(patterns['locality']) || '',
        region: extractValue(patterns['region']) || '',
        'postal-code': extractValue(patterns['postal-code']) || '',
      };
      console.log('extractedValues', extractedValues);
      const request = {
        userId: formData.id,
        street: extractedValues['extended-address'],
        city: extractedValues.locality,
        state: extractedValues.region,
        pincode: extractedValues['postal-code'],
        isDefault: true,
        geocode: latlong,
      }

      console.log('/add-address request >>>', request)
      const response = await axiosInstance.post(`/add-address`, request);
      console.log('/add-address response?.data >>>>', response?.data)
    } catch (err) {
      console.log(err);
    }
  };


  const toggleProfileImg = () => {
    setProfileVisible(!profileVisible);
  };

  const openCameraProfile = async () => {
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

      launchCamera(options, async (response) => {

        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          setProfileVisible(false);
          setIsLoading(true);
          console.log('Response = ', response);
          const imgUrl = await uploadToS3(response.assets[0]);
          console.log('imgUrl camera >>>>', imgUrl)
          setFormData({ ...formData, profileImage: imgUrl });
          setProfileImgUri(imgUrl);
          setErrors({ ...errors, profile: "" })
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
          // Handle the response (e.g., display the image or upload it)
        }
      });
    }
  };

  const openFileStorageProfile = () => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };
      // setProfileVisible(false);
      launchImageLibrary(options, async (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('Image picker error: ', response.error);
        } else {
          setProfileVisible(false);
          setIsLoading(true);
          console.log('Response = ', response);
          let imageUri = response.uri || response.assets?.[0]?.uri;
          const imgUrl = await uploadToS3(response.assets[0]);
          setProfileImgUri(imgUrl);
          setFormData({ ...formData, profileImage: imgUrl });
          setErrors({ ...errors, profile: "" })
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      });
    } catch (error) {
      setVisible(false);
      console.log(error);
    }
  }

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps="always" style={{ flex: 1, backgroundColor: '#FFF' }}>
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
            onPress={() => changeNavigation('Auth')}
            size={25}
            type="material"
          />
        </View>
      </View>
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}>
              <Text style={styles.modalHeading}>Reference Images</Text>
              <Pressable onPress={() => setModalVisible(!modalVisible)}>
                <Text style={styles.closeText}>X</Text>
              </Pressable>
            </View>
            <ImageCarousel images={images} />
          </View>
        </View>
      </Modal>
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
      <View
        style={{
          paddingVertical: 10,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 2,
          marginTop: 10,
          marginBottom: 10,
          backgroundColor: '#FFF',
        }}>
        <Image
          source={require('../../../src/assets/logo2.png')}
          style={styles.image}
        />
      </View>

      <View style={styles.container}>
        {/* Header */}
        <View
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}>
          <Text style={styles.header}>Sign In</Text>
        </View>

        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}>
          <View>
            <Image
              source={require('../../assets/signUpNewUserIcon.png')}
              style={{ height: 34, width: 34 }}
            />
          </View>
          <View
            style={{
              height: 5,
              width: '21%',
              backgroundColor: currentStep >= 2 ? '#F2B235' : '#EAEAEA',
            }}
          />
          <View>
            <Image
              source={
                currentStep >= 2
                  ? require('../../assets/edit.png')
                  : require('../../assets/UpdateOutLineIcon.png')
              }
              style={{ height: 34, width: 34 }}
            />
          </View>
          <View
            style={{
              height: 5,
              width: '21%',
              backgroundColor: currentStep >= 2 ? '#F2B235' : '#EAEAEA',
            }}
          />
          <View>
            <Image
              source={
                currentStep >= 2
                  ? require('../../assets/houseIcon.png')
                  : require('../../assets/houseOutLineIcon.png')
              }
              style={{ height: 34, width: 34 }}
            />
          </View>
          <View
            style={{
              height: 5,
              width: '21%',
              backgroundColor: currentStep >= 3 ? '#F2B235' : '#EAEAEA',
            }}
          />
          <View>
            <Image
              source={
                currentStep >= 3
                  ? require('../../assets/completeIcon.png')
                  : require('../../assets/completeOutLineIcon.png')
              }
              style={{ height: 34, width: 34 }}
            />
          </View>
        </View>

        {/* Step 1 */}
        {currentStep == 1 && (
          <View style={{ width: '100%' }}>
            {/* Sub Title */}

            <View
              style={{
                width: '100%',
                marginTop: 24,
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}>
              {/* <Text style={styles.subTitle}>
                Lorem ipsum dolor sit amet, consectetur elit, sed do eiusmod
                tempor incididunt ut labore ore magna aliqua
              </Text> */}
            </View>




            {/* Personal Information Title */}
            <View
              style={{
                width: '100%',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}>
              <Text style={styles.personalInformationText}>
                Personal Information
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                // showToast("temporarily unavailable");
                toggleProfileImg()
              }}
              style={{
                height: height * 0.14,
                width: height * 0.14,
                borderRadius: height * 0.7,
                marginTop: 20,
                alignSelf: 'center'
              }}>
              {profileImgUri ? (
                <Image
                  source={{ uri: profileImgUri }}

                  style={{
                    height: height * 0.14,
                    width: height * 0.14,
                    borderRadius: height * 0.7,
                  }}
                  resizeMode='cover'

                />
              ) : (
                <CommonPhotoClick />

              )}

              {/* <Image
                  source={require('../../../src/assets/photo.png')}
                  style={{
                    height: height * 0.14,
                    width: height * 0.14,
                    borderRadius: height * 0.7,
                  }}
                /> */}
            </TouchableOpacity>

            {errors.profile && (
              <Text style={[styles.errorText, { textAlign: 'center' }]}>{errors.profile}</Text>
            )}


            {/* Input Section */}
            <View style={styles.inputContainer}>
              {/* First Name Input */}
              <TextInput
                style={styles.input}
                value={formData.firstName}
                placeholder="First Name"
                placeholderTextColor="#888"
                onChangeText={text => handleInputChange('firstName', text)}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
              {/* Last Name Input */}
              <TextInput
                style={styles.input}
                value={formData.lastName}
                placeholder="Last Name"
                placeholderTextColor="#888"
                onChangeText={text => handleInputChange('lastName', text)}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
              {/* Email Input */}
              <TextInput
                ref={emailRef}
                style={styles.input}
                value={formData.email}
                placeholder="Email"
                keyboardType="email-address"
                autoCorrect={false}
                autoCapitalize="none"
                placeholderTextColor="#888"
                editable={hasMobile ? true : false}
                onChangeText={text => handleInputChange('email', text)}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
              {hasMobile === 'false' && (
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <TextInput
                      style={styles.input}
                      placeholder="+1"
                      placeholderTextColor="#888"
                      value={formData.countryCode}
                      keyboardType="phone-pad"
                      onChangeText={text =>
                        handleInputChange('countryCode', text)
                      }
                    />
                  </View>
                  <View style={{ flex: 4.5 }}>
                    <TextInput
                      style={styles.input}
                      value={formData.mobile}
                      placeholder="Mobile Number"
                      keyboardType="phone-pad"
                      maxLength={13}
                      placeholderTextColor="#888"
                      onChangeText={text => handleInputChange('mobile', text)}
                    />
                    {errors.mobile && (
                      <Text style={styles.errorText}>{errors.mobile}</Text>
                    )}
                  </View>
                </View>
              )}
              {/* Address Input */}
              <TextInput
                style={styles.input}
                value={formData.address}
                placeholder="Address"
                autoCorrect={false}
                placeholderTextColor="#888"
                onChangeText={text => {
                  handleInputChange('address', text);
                  handleChangeText(text);
                }}
                onFocus={() => setSearch(true)}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
              {search && predictions && predictions.length > 0 && (
                <ScrollView
                  nestedScrollEnabled={true}
                  style={{
                    height: height / 6,
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
                        handleInputChange('address', item.description, true);
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
              {/* <View>
                <TextInput
                  style={styles.input}
                  value={formData.address2}
                  placeholder="Address 2"
                  placeholderTextColor="#888"
                  onChangeText={text => handleInputChange('address2', text)}
                />
              </View> */}
              {/* Facebook Input */}
              <View>
                <TextInput
                  style={styles.input}
                  value={formData.facebook}
                  placeholder="https://www.facebook.com/"
                  placeholderTextColor="#888"
                  onChangeText={text => handleInputChange('facebook', text)}
                />
                {
                  errors?.facebook &&
                  <Text style={styles.errorText}>{errors.facebook}</Text>
                }

              </View>
              {/* Instagram Input */}
              <View>
                <TextInput
                  style={styles.input}
                  value={formData.instagram}
                  placeholder="https://www.instagram.com/"
                  placeholderTextColor="#888"
                  onChangeText={text => handleInputChange('instagram', text)}
                />
                {
                  errors?.instagram &&
                  <Text style={styles.errorText}>{errors.instagram}</Text>
                }

              </View>
              <View>
                {/* SSN Input */}
                <TextInput
                  style={styles.input}
                  value={formData.sin}
                  maxLength={9}
                  keyboardType="numeric"
                  placeholder="Social Security Number"
                  placeholderTextColor="#888"
                  onChangeText={text => handleInputChange('sin', text)}
                />
                {
                  errors?.sin &&
                  <Text style={styles.errorText}>{errors.sin}</Text>
                }

              </View>
              <View
                style={{
                  alignItems: 'flex-start',
                  width: '100%',
                  marginTop: 32,
                }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    color: '#000000',
                  }}>
                  Driver's License
                </Text>
              </View>
              <View
                style={{
                  padding: 15,
                  backgroundColor: '#F0F0F0',
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: 18,
                  alignItems: 'center',
                  borderRadius: 6,
                }}>
                <TouchableOpacity
                  onPress={() => toggleOverlay('drivingLicence', 'photo')}>
                  {drivingLicence ? (
                    <Image
                      source={{ uri: drivingLicence }}
                      style={{
                        height: 75,
                        width: 75,
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <Image
                      source={require('../../assets/uploadImageIcon.png')}
                      style={{ height: 75, width: 75 }}
                    />
                  )}
                </TouchableOpacity>
              </View>
              {errors.drivingLicence && (
                <Text style={styles.errorText}>{errors.drivingLicence}</Text>
              )}
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                marginTop: 41,
                marginBottom: 10,
              }}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 10,
                  marginBottom: 15,
                  marginLeft: 5,
                }}>
                <TouchableOpacity
                  onPress={() => handleNext()}
                  style={{
                    backgroundColor: '#000',
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: 35,
                    borderWidth: 2,
                    borderColor: '#000',
                  }}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Step 2 */}
        {currentStep == 2 && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            {/* Update Profile Title */}
            <View
              style={{
                width: '100%',
                justifyContent: 'center',
                alignItems: 'flex-start',
                marginTop: 25,
              }}>
              <Text
                style={{
                  ...styles.personalInformationText,
                  ...{
                    fontSize: 16,
                    fontWeight: 'bold',
                  },
                }}>
                Update Profile
              </Text>
            </View>

            {/* Update Profile */}
            <Dropdown
              value={selected}
              data={data}
              placeholder="Artist Type"
              onChange={item => {
                setSelected(item.key);
                console.log(item);
                setFormData({ ...formData, businessType: item.key });
              }}
              placeholderStyle={{
                color: 'black',
              }}
              itemTextStyle={{
                color: 'black',
                padding: 0,
                margin: 0,
                lineHeight: 16,
              }}
              itemContainerStyle={{
                paddingVertical: 0,
                margin: -5,
              }}
              labelField="value"
              valueField="key"
              selectedTextStyle={{
                color: 'black',
              }}
              style={{
                width: '100%',
                marginTop: 15,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 6,
                paddingHorizontal: 15,
                opacity: 0.6,
                fontSize: 14,
                fontWeight: '400',
                backgroundColor: '#E8E8E8',
                color: 'black',
                height: 40,
              }}
            />
            {errors.businessType && (
              <Text style={styles.errorText}>{errors.businessType}</Text>
            )}

            <View
              style={{
                alignItems: 'flex-start',
                width: '100%',
                marginTop: 10,
              }}>
              <Text style={{ fontSize: 14, fontWeight: '400', color: '#000000' }}>
                Please upload Images of your past work.
              </Text>
            </View>

            <View
              style={{
                paddingVertical: 15,
                backgroundColor: '#F0F0F0',
                width: '100%',
                justifyContent: 'center',
                marginTop: 18,
                alignItems: 'center',
                borderRadius: 6,
              }}>
              <View>
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                  }}
                  onPress={() => toggleOverlay('imageUrl', 'photo')}>
                  <Image
                    source={require('../../assets/uploadImageIcon.png')}
                    style={{ height: 75, width: 75, margin: 'auto' }}
                  />
                </TouchableOpacity>
                {imageUris.length > 0 && (
                  <Text
                    style={{
                      color: 'black',
                      textAlign: 'center',
                    }}>
                    Upload More Images
                  </Text>
                )}
              </View>
              <ScrollView
                horizontal
                style={{
                  width: '90%',
                  margin: 'auto',
                  paddingTop: imageUris.length > 0 ? 10 : 'auto',
                }}>
                {imageUris.map((image, index) => (
                  <View
                    key={index}
                    style={{
                      padding: 10,
                    }}>
                    <Image
                      source={{ uri: image }}
                      style={{
                        height: 75,
                        width: 75,
                        borderRadius: 4,
                      }}
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#000',
                        width: 'auto',
                        borderRadius: 50,
                        width: 25,
                        height: 25,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: 2,
                        right: 2,
                      }}
                      onPress={() => removeImage(index)}>
                      <Icon
                        color="#FFF"
                        name="close-thick"
                        size={18}
                        type="material-community"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
            {errors.images && (
              <Text style={styles.errorText}>{errors.images}</Text>
            )}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                marginTop: 20,
              }}>
              <Text style={{ fontSize: 14, fontWeight: '400', color: '#000000' }}>
                A Short Video Presentation.
              </Text>
              <Icon
                onPress={() => setModalVisible(true)}
                color={'rgba(0, 148, 255, 1)'}
                iconStyle={{ padding: 0 }}
                style={{
                  padding: 0,
                  zIndex: 2,
                  marginLeft: 5,
                }}
                name="information-outline"
                size={20}
                type="material-community"
              />
            </View>

            <View
              style={{
                padding: 15,
                backgroundColor: '#F0F0F0',
                width: '100%',
                justifyContent: 'center',
                marginTop: 18,
                alignItems: 'center',
                borderRadius: 6,
              }}>
              <TouchableOpacity
                onPress={() => toggleOverlay('videoUrl', 'video')}>
                {videoThumbnail ? (
                  <>
                    <Image
                      source={{ uri: videoThumbnail }}
                      style={{
                        height: 75,
                        width: 75,
                        borderRadius: 4,
                      }}
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#000',
                        width: 'auto',
                        borderRadius: 50,
                        width: 25,
                        height: 25,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        zIndex: 99,
                      }}
                      onPress={() => removeVideo()}>
                      <Icon
                        color="#FFF"
                        name="close-thick"
                        size={18}
                        type="material-community"
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Image
                    source={require('../../assets/uploadImageIcon.png')}
                    style={{ height: 75, width: 75 }}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={[styles.termsContainer, { marginVertical: 0, marginTop: 15, justifyContent: 'flex-start' }]}
            //onPress={() => handleChange('agreeTerms', !formData.agreeTerms)}
            >
              <CheckBox
                checked={agreeTerms}
                onPress={() => setAgreeTerms(!agreeTerms)}
                title={
                  <View style={{ paddingRight: 3 }}>
                    <Text style={styles.text}>
                      I acknowledge that I have read and agree to the TF App{' '}
                      <Text
                        style={styles.linkText}
                        onPress={() =>
                          handleLinkPress(PRIVACY_URL)
                        }>
                        Privacy policy
                      </Text>,{' '}
                      TF App{' '}
                      <Text
                        style={styles.linkText}
                        onPress={() =>
                          handleLinkPress(TERMS_URL)
                        }>
                        Terms and Conditions.
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

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center', // Align items vertically
                marginTop: 41,
                marginBottom: 10,
              }}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 5,
                }}>
                <TouchableOpacity
                  onPress={() => handlePrev()}
                  style={{
                    backgroundColor: '#FFF',
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: 35,
                    borderWidth: 2,
                    borderColor: '#000',
                    height: 50, // Set height for alignment
                  }}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: '#000',
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Previous
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                <TouchableOpacity
                  onPress={() => SignUpApi()}
                  style={{
                    backgroundColor: '#000',
                    width: 168,
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: 35,
                    borderWidth: 2,
                    borderColor: '#000',
                    height: 50,
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {currentStep == 3 && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.personalInformationText}>
              Thank you for submission, give us some time to evaluate your
              application
            </Text>

            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 40,
                padding: 30,
                backgroundColor: '#ebebeb',
                borderRadius: 30,
              }}>
              <Text
                style={{
                  color: '#f2b235',
                  fontSize: 25,
                  fontWeight: 'bold',
                }}>
                COMPLETED
              </Text>
              <Image
                source={require('../../assets/artist-profile-complete.png')}
                style={{ width: 125, height: 125, marginTop: 20 }}
              />
            </View>
          </View>
        )}

        <Overlay
          isVisible={visible}
          onBackdropPress={() => toggleOverlay('imageUrl1', 'photo')}>
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

        <Overlay isVisible={profileVisible} onBackdropPress={toggleProfileImg}>
          <View style={{ width: width / 1.5, padding: 10 }}>
            <View style={{ marginVertical: 5 }}>
              <Text style={{ textAlign: 'center' }}>Action for Image upload</Text>
            </View>
            <TouchableOpacity
              onPress={() => openCameraProfile()}
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
              onPress={() => openFileStorageProfile()}
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
        <Toast />
      </View>
    </KeyboardAwareScrollView>
  );
};

export default ArtistLogin;

const styles = StyleSheet.create({
  containerSample: {
    flexDirection: 'row',
    //alignItems: 'center', // Aligns items vertically centered
    justifyContent: 'space-between', // Adjust spacing as needed
    marginTop: 15,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    marginHorizontal: 0,
    width: SIZES.cardWidth-ms(20),
    paddingHorizontal: 8,
  },
  wrapperStyle: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  errorTextfix: {
    marginLeft: '-7.5%',
  },
  text: {
    fontFamily: 'Poppins-Regular',
    fontSize: 17,
    color: '#000',
    paddingHorizontal: 10,
  },
  linkText: {
    // fontWeight: 'bold',
    fontFamily: FONTS.medium,
    color: 'black',
    textDecorationLine: 'underline'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginLeft: '-12.5%',
    alignItems: 'flex-start',
    marginRight: 10,
  },
  button: {
    // color: '#D79F0E',
    // textDecoration: 'underline',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D79F0E',
    textDecorationLine: 'underline',
  },
  modalView: {
    width: '90%', // Adjust width as needed
    height: height * 0.5, // 50% of the screen height
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 5,
    backgroundColor: 'transparent',
    padding: 10,
    zIndex: 1,
  },
  closeText: {
    fontSize: 24,
    color: '#000',
  },
  modalHeading: {
    width: '90%',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    width: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 36,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: 'white',
  },
  image: {
    height: height / 10,
    width: width / 2,
    objectFit: 'contain',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
    fontFamily: 'Poppins',
    textAlign: 'left',
    fontWeight: '700',
    marginTop: 23,
  },
  subTitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#333',
    fontFamily: 'Inter',
    textAlign: 'left',
    fontWeight: '400',
    marginRight: 42,
    lineHeight: 20,
    width: '100%',
    paddingHorizontal: 5,
  },
  personalInformationText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Inter',
    textAlign: 'left',
    fontWeight: '400',
  },
  inputContainer: {
    width: '100%',
    marginTop: 15,
  },
  input: {
    height: 50,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    opacity: 0.6,
    fontSize: 14,
    fontWeight: '400',
    backgroundColor: '#E8E8E8',
    color: 'black',
  },
  socialInput: {
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 18,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    opacity: 0.6,
    backgroundColor: '#E8E8E8',
  },
  socialTextInput: {
    fontSize: 12,
    fontWeight: '400',
    color: 'black',
  },
  containerModel: {
    position: 'relative',
  },
  imageModel: {
    width: '75%',
    height: 325,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '12.5%',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});
