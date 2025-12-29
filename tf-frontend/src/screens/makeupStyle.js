import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { Icon, Input } from '@rneui/base';
import { CheckBox } from '@rneui/themed';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CART_DATA, CART_ITEMS } from '../store/allactionsTypes';
import { useDispatch, useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import { COLORS, SIZES } from '../style/theme';
import { showToast } from '../components/Toast';
import { asynchEnums } from '../constants/enums';
import { GlobalStyles } from '../style/GlobalStyles';
import screenNames from '../constants/screenNames';

const { width, height } = Dimensions.get('window');


const MakeStyle = ({ navigation }) => {
  // const APIURLBASE = 'http://164.52.197.9:3001';
  const route = useRoute();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { categoryId, serviceId, guestUser, serviceName } = route.params;
  const [selectedIndex, setIndex] = useState();
  const [serviceType, setServiceType] = useState(0);
  const [selectedHair, setSelectedHair] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [artistLevel, setArtistLevel] = useState('');
  const [artistLevelError, setArtistLevelError] = useState();
  const [priceId, setPriceId] = useState();
  const [gratuityExists, setGratuityExists] = useState(false);
  const [gratuity, setGraruity] = useState();
  const [gratuityAmount, setGraruityAmount] = useState(0);
  const [price, setPrice] = useState(0);
  const [manualGratuity, setManualGratuity] = useState(0);
  const [rememberIt, setRememberIt] = useState(false);
  const [hairService, setHairService] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedService, setSelectedService] = useState({});
  const [selectedServicePrev, setSelectedServicePrev] = useState([]);
  const [artistExperince, setArtistExperince] = useState('');
  const [serviceTypeFontSize, setServiceFontSize] = useState(16);
  const [cartDetails, setCartDetails] = useState(null);
  const [cartFlag, setCartFlag] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [clearCart, setClearCart] = useState(false);
  const [currSummary, setCurrSummary] = useState('');
  const [gratuityError, setGratuityError] = useState('');
  const [lookModal, setLookModal] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState({})
  const [modalText, setModalText] = useState(
    'Items are already in cart clear cart',
  );

  const { cartItems, isAddedCart, cartData, isGuest } = useSelector(state => state.AppReducer);
  // const { isGuest } = useSelector(state => state.AppReducer);
  const cardChangeHandler = (item, index) => {
    setSelectedService(item);
    setIndex(index);
    setSelectedHair(item.name);
    setLookModal(true)
    //setSelectedServiceId(item.serviceId);
  };
  const artistChangeHandler = item => {
    setPrice(item.price);
    setPriceId(item.priceId);
    setArtistLevel(item.levelName);
    setArtistExperince(item?.description || '2-5');
    setSelectedArtist(item)
    setArtistLevelError();
  };

  const changeGratuity = value => {
    if (value == gratuity) {
      setGraruity();
      setManualGratuity(0);
      setGraruityAmount(0);
    } else {
      setGratuityError('');
      setGraruity(value);
    }
  };

  const getSubCategoriesByServiceId = async () => {
    try {
      const response = await axiosInstance.get(
        `/get-subcategories-by-serviceid?serviceId=${serviceId}`,
      );
      //console.log(response.data);
      if (response.data.status === 'success') {
        var list = response.data.data;
        console.log(list);
        list.map((item, index) => {
          if (index == 0) {
            setSelectedService(item);
            setSelectedHair(item.name);
            setIndex(index);
          }
        });
        setHairService(list);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getAllArtistPackage = async () => {
    try {
      const response = await axiosInstance.get(
        `/get-levels-with-prices?serviceId=${serviceId}`,
      );
      //console.log(response.data);
      if (response.data.status === 'success') {
        //console.log(response.data.data);
        response?.data?.data?.map(item => {
          if (item?.levelName == "Platinum") {
            artistChangeHandler(item)
          }
        })
        setPackages(response.data.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    console.log('cartData >>>>', cartData)
    if (cartData?.now?.length > 0) {
      setCurrSummary("now");
    } else if (cartData?.later?.length > 0) {
      setCurrSummary("later");
    } else {
      setCurrSummary("")
    }
  }, [cartData])

  useEffect(() => {
    if (serviceId) {
      setSelectedServiceId(serviceId);
      getAllArtistPackage();
      getSubCategoriesByServiceId();
      //console.log(categoryId);
    }
  }, [serviceId]);

  useEffect(() => {
    if (gratuity === 0 || gratuity === 1) {
      if (gratuity === 0) {
        var amount = price * 0.15;
        setGraruityAmount(0);
        // setGraruityAmount(amount);
      } else {
        var amount = price * 0.2;
        // setGraruityAmount(amount);
        setGraruityAmount(0);
      }
    } else if (gratuity === 2) {
      var amount = parseInt(manualGratuity);
      //amount += price;
      // setGraruityAmount(amount);
      setGraruityAmount(0);

    }
  }, [gratuity, price, gratuityAmount]);

  const updateUserGratuity = async () => {
    try {
      const id = await AsyncStorage.getItem('id');
      let gratuityPercent = '';
      if (gratuity === 0 || gratuity === 1) {
        if (gratuity === 0) {
          gratuityPercent = '15%';
        } else {
          gratuityPercent = '20%';
        }
      } else if (gratuity === 2) {
        gratuityPercent = manualGratuity;
      }
      console.log('updateUserGratuity', {
        id,
        gratuity: gratuityPercent,
      });
      const response = await axiosInstance.post(`/update-user-gratuity`, {
        id,
        gratuity: gratuityPercent,
      });
      if (response.data.status === 'success') {
        console.log('gratuityPercent updated');
        await AsyncStorage.setItem('gratuity', gratuityPercent.toString());
      }
    } catch (err) {
      console.log(err);
    }
  };

  const submitHandler = async flag => {

    console.log('isGuest', isGuest)

    if (isGuest) {
      showToast("Please login to add services!")
      navigation?.navigate("Auth")
      return
    }

    if (priceId === undefined) {
      setArtistLevelError('Please select an artist level');
      return;
    } else {
      setArtistLevelError();
    }
    if (gratuityError) {
      return false;
    }

    await AsyncStorage.removeItem(asynchEnums.CART_BOOKING)
    // if (gratuity === undefined) {
    //   ToastAndroid.showWithGravity(
    //     'Please select a gratuity',
    //     ToastAndroid.SHORT,
    //     ToastAndroid.CENTER,
    //   );
    //   return;
    // }

    //console.log(gratuityAmount);
    const serviceJson = selectedService;
    serviceJson.price = price.toString();
    serviceJson.artist = artistLevel;
    serviceJson.gratuity = "0";
    serviceJson.addOnAmount = "0",
      serviceJson.longHairAmount = "0",
      serviceJson.count = 1;
    var prev = [...selectedServicePrev];
    prev.push(serviceJson);
    console.log('selectedServicePrev', selectedServicePrev);
    let nowCount = cartDetails?.data?.now.length || 0;
    let laterCount = cartDetails?.data?.later.length || 0;
    let sameSelected = false;
    let sameSummarySelected = false;
    console.log('selectedService.id', selectedService.id);
    if (selectedServicePrev?.length > 0) {
      for (const service of selectedServicePrev) {
        if (service.id == selectedService.id) {
          console.log('service.id', service.id);
          sameSummarySelected = true;
        }
      }
    }
    console.log('cartDetails>>>>>' + cartDetails);
    if (laterCount) {
      for (const laterService of cartDetails?.data?.later) {
        if (laterService.subId == selectedService.id) {
          console.log('laterService.subId', laterService.subId);
          sameSelected = true;
        }
      }
    }
    if (nowCount) {
      for (const nowService of cartDetails?.data?.now) {
        if (nowService.subId == selectedService.id) {
          console.log('nowService.subId', nowService.subId);
          sameSelected = true;
        }
      }
    }
    console.log('sameSelected', sameSelected);
    console.log(nowCount, laterCount);
    if (flag === true) {
      if (laterCount > 0) {
        setModalVisible(true);
        setModalText(
          'You can only add either immediate booking or future booking. Clear cart!',
        );
        setClearCart(true);
      } else if (currSummary == 'later') {
        setModalVisible(true);
        setModalText(
          'You can only add either immediate booking or future booking. Clear booking summary!',
        );
        setClearCart(false);
      } else if (prev.length > 2 && nowCount === 0) {
        setModalText(
          'You can only add 2 services in immediate booking. Clear booking summary!',
        );
        setModalVisible(true);
        setClearCart(false);
      } else if (nowCount === 2) {
        setModalText(
          'You can only add 2 services in immediate booking. Clear cart!',
        );
        setModalVisible(true);
        setClearCart(true);
      } else if (sameSelected) {
        setModalText('Service is already added. Clear cart!');
        setModalVisible(true);
        setClearCart(true);
      } else if (sameSummarySelected) {
        setModalText('Service is already added. Clear booking summary!');
        setModalVisible(true);
        setClearCart(false);
      } else {
        if (rememberIt) {
          updateUserGratuity();
        } else {
          await AsyncStorage.removeItem('gratuity');
        }
        await AsyncStorage.setItem('serviceJson', JSON.stringify(prev));
        await AsyncStorage.setItem('summary', 'now');
        navigation.navigate('Summary', {
          price: price,
          gratuity: gratuityAmount,
          addOnServiceAmt: 0,
          longHair: 0,
          summary: 'now',
          guestUser: guestUser,
        });
      }
    } else {
      if (nowCount > 0) {
        setModalText(
          'You can only add either immediate booking or future booking. Clear cart!',
        );
        setModalVisible(true);
        setClearCart(true);
      } else if (currSummary == 'now') {
        setModalText(
          'You can only add either immediate booking or future booking. Clear booking summary!',
        );
        setModalVisible(true);
        setClearCart(false);
      } else if (sameSelected) {
        setModalText('Service is already added. Clear cart!');
        setModalVisible(true);
        setClearCart(true);
      } else if (sameSummarySelected) {
        setModalText('Service is already added. Clear booking summary!');
        setModalVisible(true);
        setClearCart(false);
      } else {
        if (rememberIt) {
          updateUserGratuity();
        } else {
          await AsyncStorage.removeItem('gratuity');
        }
        await AsyncStorage.setItem('serviceJson', JSON.stringify(prev));
        await AsyncStorage.setItem('summary', 'later');
        navigation.navigate('SummaryLater', {
          price: price,
          gratuity: gratuityAmount,
          addOnServiceAmt: 0,
          longHair: 0,
          summary: 'later',
          guestUser: guestUser,
        });
      }
    }
  };

  const getCartItem = async userId => {
    try {
      const response = await axiosInstance.get(
        `/get-cart?userId=${userId}`,
      );
      console.log('CartDetails', response.data);
      if (response.data.message === 'Cart not found!') {
        dispatch({ type: CART_DATA, payload: [] });
        setCartFlag(false);
        setCartDetails(null);
      } else {
        setCartFlag(true);
        setCartDetails(response.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getLocalStorageItem = async () => {
    const id = await AsyncStorage.getItem('id');
    if (id) {
      console.log(id);
      await getCartItem(id);
    }
    const serviceJson = await AsyncStorage.getItem('serviceJson');
    console.log('serviceJson>>>>>>>>' + serviceJson);
    if (serviceJson) {
      setSelectedServicePrev(JSON.parse(serviceJson));
    }
    const currSummary = await AsyncStorage.getItem('summary');
    // if (cartData?.now?.length > 0) {
    //   setCurrSummary("now");
    // } else if (cartData?.later?.length > 0) {
    //   setCurrSummary("later");
    // }
    setCurrSummary(currSummary);
    const existingGratuity = await AsyncStorage.getItem('gratuity');
    if (existingGratuity) {
      console.log('existingGratuity>>>' + existingGratuity);
      setGratuityExists(true);
      if (existingGratuity.includes('%')) {
        if (existingGratuity == '15%') {
          setGraruity(0);
        } else if (existingGratuity == '20%') {
          setGraruity(1);
        }
      } else {
        setGraruity(2);
        setManualGratuity(parseInt(existingGratuity));
        // setGraruityAmount(parseInt(existingGratuity));
        setGraruityAmount(0);
      }
      setRememberIt(true);
    }
  };

  useEffect(() => {
    getLocalStorageItem();
  }, [isFocused]);

  const updateFontSize = () => {
    const baseFontSize = 16;

    if (width <= 400) {
      setServiceFontSize(baseFontSize * 0.8);
    } else if (width <= 600) {
      setServiceFontSize(baseFontSize * 0.9);
    } else {
      setServiceFontSize(baseFontSize);
    }
  };

  useEffect(() => {
    updateFontSize();
    const screenSize = Dimensions.addEventListener('change', updateFontSize);
    return () => {
      screenSize?.remove();
    };
  }, []);

  const clearCartHandler = async () => {
    console.log('clearCartHandler');
    if (clearCart) {
      console.log('clearCart');
      try {
        if (cartDetails) {
          let payload = cartDetails.data;
          payload['actionType'] = 'C';
          const response = await axiosInstance.post(`/cart`, payload);
          if (response) {
            console.log(response?.data);
          }
        }
        dispatch({ type: CART_ITEMS, payload: 0 });
        await AsyncStorage.setItem('summary', '');
        setCurrSummary("")
        setCartDetails(null);
        getLocalStorageItem();
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log('clearSummary');
      await AsyncStorage.removeItem('serviceJson');
      await AsyncStorage.removeItem('summary');
      setCurrSummary("")
      setSelectedServicePrev([]);
      await getLocalStorageItem();
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

  const handleVirtualTrainingBook = () => {



    if (isGuest) {
      showToast("Please login to add services!")
      navigation?.navigate("Auth")
      return
    }

    const bookingFee = 70;
    const totalPrice = parseInt(price) + bookingFee;

    const sendData = {
      bookingFee: 70,
      addOnAmt: 0,
      artistPrice: parseInt(price),
      selectedArtist: selectedArtist,
      longHairAmt: 0,
      totalPrice: totalPrice,
      serviceData: selectedService
    }

    console.log('sendData', sendData)

    navigation.navigate(screenNames.BOOK_VIRTUAL_TRAINIG, { routeData: sendData })


  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={[styles.centeredView]}>
          <View
            style={[
              styles.modalView,
              { width: width * 0.7, height: height * 0.25 },
            ]}>
            <View>
              <Text style={styles.modalText}>{modalText}</Text>
            </View>
            <View
              style={{
                position: 'absolute',
                bottom: height * 0.025,
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <View>
                <Pressable
                  style={[styles.button, styles.buttonOpen]}
                  onPress={() => setModalVisible(!modalVisible)}>
                  <Text style={styles.textStyleBlack}>Cancel</Text>
                </Pressable>
              </View>
              <View>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => {
                    setModalVisible(!modalVisible);
                    clearCartHandler();
                  }}>
                  <Text style={styles.textStyle}>Clear</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={lookModal}
        onRequestClose={() => setLookModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
              onPress={() => setLookModal(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Image in modal */}
            <Image
              source={{ uri: selectedService?.imgUrl }}
              style={{ width: '100%', height: 400, borderRadius: 8 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>

      <View
        style={{ flexDirection: 'row', marginTop: 10, paddingHorizontal: 15 }}>
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
            Makeup Styles
          </Text>
        </View>
      </View>

      <ScrollView style={{ height: height }}>
        <View style={{ paddingHorizontal: 15 }}>
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                textDecorationLine: 'underline',
                color: 'black',
                fontSize: 20,
                fontWeight: 500,
                fontFamily: 'Poppins-Regular',
              }}>
              Choose Your Desired Look
            </Text>
          </View>
          <ScrollView horizontal={true}>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {hairService.map((item, index) => {
                return (
                  <TouchableOpacity
                    onPress={() => cardChangeHandler(item, index)}
                    key={index}
                    style={{
                      backgroundColor: '#FAFAFB',
                      width: width / 2.7,
                      borderRadius: 10,
                      overflow: 'hidden',
                      marginBottom: 10,
                      elevation: 5,
                      shadowColor: '#000',
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      marginRight: 15,
                      position: 'relative', // Added position relative
                      borderWidth: selectedIndex === index ? 1.5 : 0,
                      borderColor: 'gray',
                    }}>
                    <Image
                      source={{ uri: item.imgUrl }}
                      style={{
                        width: width / 2.7,
                        height: width / 2.5,
                        borderRadius: 10,
                        zIndex: 0, // Set the zIndex of the image
                      }}
                      resizeMode="contain"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1,
                      }}>
                      {/* Set the zIndex of the CheckBox to a higher value */}
                      {
                        selectedIndex === index &&
                        <View style={[styles.checkBoxView, {}]} >
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color={COLORS.white}
                          />
                        </View>
                      }
                      {/* <CheckBox
                        checked={selectedIndex === index}
                        onPress={() => {
                          cardChangeHandler(item, index);
                        }}
                        iconType="material-community"
                        checkedIcon={
                          <MaterialCommunityIcons
                            name="checkbox-marked-circle"
                            size={24}
                            color={COLORS.yellow}
                          />
                        }
                        uncheckedIcon={
                          <MaterialCommunityIcons
                            name="checkbox-blank-circle-outline"
                            size={24}
                             color={COLORS.darkTxt}
                          />
                        }
                        containerStyle={{
                          padding: 0,
                          margin: 0,
                          backgroundColor: 'transparent',
                        }}
                      /> */}
                    </View>
                    {/* <View>
                      <Text
                        style={{
                          color: 'black',
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          textAlign: 'center',
                          paddingVertical: 11,
                          fontWeight: 700,
                        }}></Text>
                    </View> */}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontFamily: 'Poppins-Reglar',
                fontSize: 20,
                fontWeight: 700,
                color: 'black',
              }}>
              {serviceName} Style
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <View>
              <Text
                style={{
                  marginTop: 2,
                  fontFamily: 'Poppins-Regular',
                  fontSize: serviceTypeFontSize,
                  color: '#000',
                  fontWeight: 600,
                }}>
                Service Type
              </Text>
            </View>
            <View>
              <CheckBox
                checked={serviceType === 0}
                onPress={() => setServiceType(0)}
                title={'On Location'}
                checkedIcon={
                  <MaterialCommunityIcons
                    name="radiobox-marked"
                    size={24}
                    color="black"
                  />
                }
                uncheckedIcon={
                  <MaterialCommunityIcons
                    name="radiobox-blank"
                    size={24}
                    color="black"
                  />
                }
                containerStyle={{
                  padding: 0,
                  margin: 0,
                  backgroundColor: 'transparent',
                }}
                titleProps={{
                  style: {
                    marginTop: 2,
                    fontWeight: '400',
                    fontFamily: 'Poppins-Regular',
                    fontSize: serviceTypeFontSize,
                  },
                }}
              />
            </View>
            {/* <View style={{ marginLeft: -10 }}>
              <CheckBox
                checked={serviceType === 1}
                onPress={() => setServiceType(1)}
                title={'Virtual Training'}
                checkedIcon={
                  <MaterialCommunityIcons
                    name="radiobox-marked"
                    size={24}
                    color="black"
                  />
                }
                uncheckedIcon={
                  <MaterialCommunityIcons
                    name="radiobox-blank"
                    size={24}
                    color="black"
                  />
                }
                containerStyle={{
                  padding: 0,
                  margin: 0,
                  backgroundColor: 'transparent',
                }}
                checkedColor="black"
                titleProps={{
                  style: {
                    marginTop: 2,
                    fontWeight: 400,
                    fontFamily: 'Poppins-Regular',
                    fontSize: serviceTypeFontSize,
                  },
                }}
              />
            </View> */}
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 20,
              alignItems: 'center',
              width: width,
            }}>
            <View>
              <Text
                style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: serviceTypeFontSize,
                  color: '#000',
                  fontWeight: 500,
                }}>
                Artist Level
              </Text>
            </View>
            <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
              {packages.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'column',
                    marginHorizontal: 5,
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() => artistChangeHandler(item)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        height: width / 9,
                        width: width / 9,
                        borderRadius: width / 4.5,
                        borderWidth: 2,
                        borderColor:
                          item.priceId === priceId ? '#007AFF' : '#000',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <View
                        style={{
                          height: width / 9,
                          width: width / 9,
                          borderRadius: width / 4.5,
                          backgroundColor:
                            item.priceId === priceId ? '#000' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Text
                          style={{
                            color: item.priceId === priceId ? '#FFF' : '#000',
                            fontWeight: 'bold',
                            fontSize: 11,
                            textAlign: 'center',
                          }}>
                          ${item.price}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View
                    style={{
                      width: width / 7.5,
                      marginTop: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        color: '#000',
                        fontSize: 11,
                        textAlign: 'center',
                        flexWrap: 'wrap',
                      }}>
                      {item.levelName}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          {priceId && (
            <View
              style={{
                flexDirection: 'row',
                marginTop: 5,
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
                paddingHorizontal: 20,
              }}>
              <Text style={{ color: '#595959' }}>{artistExperince}</Text>
            </View>
          )}
          {artistLevelError && (
            <Text
              style={{
                marginTop: 20,
                color: 'red',
                fontFamily: 'Poppins-Regular',
                fontSize: 14,
                fontWeight: 500,
                textAlign: 'center',
              }}>
              {artistLevelError}
            </Text>
          )}

          {/* <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                paddingRight: 5,
              }}>
              <Icon color="#000" name="add" size={14} type="material" />
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text
                style={{
                  color: 'black',
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                Gratuity
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: 15,
            }}>
            <View
              style={{
                flexDirection: 'row',
                marginRight: 25,
              }}>
              <TouchableOpacity
                onPress={() => changeGratuity(0)}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    height: 40,
                    width: 56,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#000',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      height: 40,
                      width: 56,
                      borderRadius: 12,
                      backgroundColor: gratuity === 0 ? '#000' : 'transparent',
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: gratuity === 0 ? '#FFF' : '#000',
                    fontWeight: 'bold',
                    fontSize: 11,
                    marginLeft: -37,
                  }}>
                  15%
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                marginRight: 25,
              }}>
              <TouchableOpacity
                onPress={() => changeGratuity(1)}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    height: 40,
                    width: 56,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#000',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      height: 40,
                      width: 56,
                      borderRadius: 12,
                      backgroundColor: gratuity === 1 ? '#000' : 'transparent',
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: gratuity === 1 ? '#FFF' : '#000',
                    fontWeight: 'bold',
                    fontSize: 11,
                    marginLeft: -37,
                  }}>
                  20%
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                marginRight: 25,
              }}>
              <TouchableOpacity
                onPress={() => changeGratuity(2)}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    height: 40,
                    width: 70,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#000',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: gratuity === 2 ? '#000' : 'transparent',
                  }}>
                  <View
                    style={{
                      height: 40,
                      width: 56,
                      borderRadius: 12,
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: gratuity === 2 ? '#FFF' : '#000',
                    fontWeight: 'bold',
                    fontSize: 11,
                    marginLeft: -57,
                  }}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {gratuity === 2 ? (
            <View style={{ marginTop: 10 }}>
              <Text
                style={{
                  color: '#595959',
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                  paddingHorizontal: 10,
                }}>
                Enter gratuity amount (in $)
              </Text>
              <Input
                keyboardType="numeric"
                value={
                  manualGratuity ? manualGratuity.toString() : manualGratuity
                }
                errorStyle={{ display: 'none' }}
                onChangeText={value => {
                  if (value == '') {
                    setGratuityError('');
                    setGraruityAmount(0);
                    setManualGratuity(0);
                  } else {
                    if (!/^[0-9]*$/.test(value) || value === '') {
                      console.log('not number' + value);
                      setGratuityError('Enter number only');
                      return;
                    } else {
                      console.log('number' + value);
                      setGratuityError('');
                      setGraruityAmount(parseInt(value));
                      setManualGratuity(parseInt(value));
                    }
                  }
                }}
                rightIcon={
                  <Icon
                    name="close"
                    onPress={() => setManualGratuity(0)}
                    size={20}
                  />
                }
              />
              {gratuityError && (
                <Text style={styles.errorText}>{gratuityError}</Text>
              )}
            </View>
          ) : null} */}


          {/* 
          <View>
            <CheckBox
              checked={rememberIt}
              onPress={() => setRememberIt(!rememberIt)}
              title="Add this gratuity automatically for future orders"
              checkedColor="black"
              titleProps={{ style: { fontWeight: 400 } }}
              containerStyle={{ marginLeft: 0, marginRight: 0 }}
            />
          </View> */}


          <View style={{ marginTop: 40, alignItems: "center", }} >
            <Text style={[GlobalStyles.txtR14Dark, {}]} >For pageants and large parties,</Text>
            <Text style={[GlobalStyles.txtR14Dark, {}]} >please email support:</Text>
          </View>
          <View style={[GlobalStyles.rowCenter, { alignSelf: 'center', marginBottom: 20 }]} >
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

          {/* <Text
                       style={{
                         fontFamily: 'Poppins-Regular',
                         fontSize: SIZES.f16,
                         color: '#000',
                         fontWeight: 600, textAlign: 'center'
                       }}>This app does not assist for pageant bookings.</Text> */}

          {
            serviceType == 0 ?
              <>
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                  }}>
                  <TouchableOpacity
                    onPress={() => submitHandler(true)}
                    style={{
                      backgroundColor: '#000',
                      width: '100%',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: 50,
                    }}>
                    <Text
                      style={{
                        fontSize: 18,
                        color: '#FFF',
                        fontWeight: 'bold',
                        fontFamily: 'Poppins-Regular',
                      }}>
                      Immediate Booking
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#FFF',
                        fontWeight: 'bold',
                        fontFamily: 'Poppins-Regular',
                      }}>
                      (24hrs or less)
                    </Text>
                  </TouchableOpacity>
                </View>


                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                  }}>
                  <TouchableOpacity
                    onPress={() => submitHandler(false)}
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
                        fontSize: 20,
                        color: '#000',
                        fontWeight: 'bold',
                        fontFamily: 'Poppins-Regular',
                      }}>
                      Future Booking
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
              :
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 20,
                }}>
                <TouchableOpacity
                  onPress={() => handleVirtualTrainingBook()}
                  style={{
                    backgroundColor: '#000',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 15,
                    borderRadius: 50,
                  }}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Book Now
                  </Text>

                </TouchableOpacity>
              </View>
          }



        </View>
        <View
          style={{
            marginTop: 20,
            paddingVertical: 15,
            backgroundColor: '#FFF8F0',
          }}>
          <Text
            style={{
              color: '#000',
              fontFamily: 'Poppins-Regular',
              fontSize: 11,
              textAlign: 'center',
              fontWeight: '300',
            }}>
            *Immediate Booking (24hrs or less) will incur additional fees
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};


export default MakeStyle;

const styles = StyleSheet.create({
  checkBoxView: {
    height: 25,
    width: 25,
    borderRadius: 13,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    width: width * 0.25,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
  buttonClose: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#000',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textStyleBlack: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: 'black',
    alignContent: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
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
    height: 435,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden'
  },

});
