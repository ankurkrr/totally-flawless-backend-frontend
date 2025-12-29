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
import Icons from 'react-native-vector-icons/AntDesign';
import { CART_DATA, CART_ITEMS } from '../store/allactionsTypes';
import { useDispatch, useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import HairGuide from '../assets/HairGuide.png';
import { GlobalStyles } from '../style/GlobalStyles';
import CommonSvg from '../components/CommonSvg';
import { COLORS, SIZES } from '../style/theme';
import { ms } from 'react-native-size-matters';
import Tooltip from 'react-native-walkthrough-tooltip';
import { showToast } from '../components/Toast';
import { asynchEnums } from '../constants/enums';
import screenNames from '../constants/screenNames';
import { BLOW_AMOUNT } from '../services/utils';


const { width, height } = Dimensions.get('window');

const addOns = {
  styling: "styling",
  blowout: "blowout",
  blowoutOnly: "blowoutOnly"
}

const HairStyle = ({ navigation }) => {
  // const APIURLBASE = 'http://164.52.197.9:3001';
  const route = useRoute();
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const { categoryId, serviceId, guestUser, serviceName } = route.params;
  // console.log('serviceName >>>', serviceName)
  const [selectedIndex, setIndex] = useState();
  const [serviceType, setServiceType] = useState(0);
  const [addOnServiceType, setAddOnServiceType] = useState("");
  const [subAddOnServiceType, setSubAddOnServiceType] = useState("");
  const [selectedHair, setSelectedHair] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [artistLevel, setArtistLevel] = useState('');
  const [selectedArtist, setSelectedArtist] = useState({})
  const [artistLevelError, setArtistLevelError] = useState();
  const [priceId, setPriceId] = useState();
  const [gratuity, setGraruity] = useState();
  const [gratuityAmount, setGraruityAmount] = useState(0);
  const [gratuityExists, setGratuityExists] = useState(false);
  const [price, setPrice] = useState(0);
  const [manualGratuity, setManualGratuity] = useState(0);
  const [rememberIt, setRememberIt] = useState(false);
  const [hairService, setHairService] = useState([]);
  const [isLongTexturedHair, setIsLongTexturedHair] = useState(true)
  const [packages, setPackages] = useState([]);
  const [selectedService, setSelectedService] = useState({});
  const [selectedServicePrev, setSelectedServicePrev] = useState([]);
  const [artistExperince, setArtistExperince] = useState('');
  const [serviceTypeFontSize, setServiceFontSize] = useState(16);
  const [toolTipVisible, setToolTipVisible] = useState(false)
  const [toolTipServiceVisible, setToolTipServiceVisible] = useState(false)
  const [cartDetails, setCartDetails] = useState(null);
  const [cartFlag, setCartFlag] = useState(false);
  const [currSummary, setCurrSummary] = useState('');
  const [gratuityError, setGratuityError] = useState('');
  const [textGratuity, setTextGratuity] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [hairMeasureModal, setHairMeasureModal] = useState(false);
  const [lookModal, setLookModal] = useState(false)
  const [modalText, setModalText] = useState(
    'Items are already in cart clear cart',
  );
  const [clearCart, setClearCart] = useState(false);

  const { cartItems, isAddedCart, cartData, isGuest } = useSelector(state => state.AppReducer);

  console.log('currSummary', currSummary)

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

  const isTexture = () => {
    return serviceName == "Texture";
  }

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
      console.log("getSubCategoriesByServiceId >>>>", response.data);
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
        // setGraruityAmount(amount);
        setGraruityAmount(0);
      } else {
        var amount = price * 0.2;
        setGraruityAmount(0);
        // setGraruityAmount(amount);
      }
    } else if (gratuity === 2) {
      var amount = parseInt(manualGratuity);
      //amount += price;
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
    console.log('submitHandler');

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
    console.log('gratuityAmount>>>>>' + gratuityAmount);
    if (gratuityError) {
      return false;
    }

    await AsyncStorage.removeItem(asynchEnums.CART_BOOKING)

    console.log(cartDetails);
    const addOnAmt = subAddOnServiceType == addOns.blowout ? BLOW_AMOUNT : 0;
    const serviceJson = selectedService;
    serviceJson.price = price.toString();
    serviceJson.artist = artistLevel;
    serviceJson.gratuity = gratuityAmount.toString();
    // serviceJson.
    serviceJson.addOnAmount = addOnAmt,
      serviceJson.longHairAmount = isLongTexturedHair && !isTexture() ? "50" : "0",
      serviceJson.count = 1;
    var prev = [...selectedServicePrev];
    prev.push(serviceJson);
    // console.log('Santosh>>>>>>>>>>>>>>>>>>>>>>>>>>', prev);

    let nowCount = cartDetails?.data?.now.length || 0;
    let laterCount = cartDetails?.data?.later.length || 0;
    let sameSelected = false;
    let sameSummarySelected = false;
    console.log('selectedService.id', selectedService.id);
    if (selectedServicePrev?.length) {
      for (const service of selectedServicePrev) {
        if (service.id == selectedService.id) {
          console.log('service.id', service.id);
          sameSummarySelected = true;
        }
      }
    }
    if (cartDetails?.data?.later.length) {
      for (const laterService of cartDetails?.data?.later) {
        if (laterService.subId == selectedService.id) {
          console.log('laterService.subId', laterService.subId);
          sameSelected = true;
        }
      }
    }
    if (cartDetails?.data?.now.length) {
      for (const nowService of cartDetails?.data?.now) {
        if (nowService.subId == selectedService.id) {
          console.log('nowService.subId', nowService.subId);
          sameSelected = true;
        }
      }
    }
    console.log('sameSelected', sameSelected);
    console.log(nowCount, laterCount);
    console.log('cartData', cartData)

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
        console.log('currSummary>>>>>>>>' + currSummary);
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
          gratuity: 0,
          addOnServiceAmt: addOnAmt,
          longHair: isLongTexturedHair && !isTexture() ? 50 : 0,
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
          gratuity: 0,
          addOnServiceAmt: addOnAmt,
          longHair: isLongTexturedHair && !isTexture() ? 50 : 0,
          summary: 'later',
          guestUser: guestUser,
        });
      }
    }
  };

  const handleVirtualTrainingBook = () => {



    if (isGuest) {
      showToast("Please login to add services!")
      navigation?.navigate("Auth")
      return
    }

    const bookingFee = 70;
    const addOnAmt = subAddOnServiceType == addOns.blowout ? BLOW_AMOUNT : 0;
    const longHairAmt = isLongTexturedHair && !isTexture() ? 50 : 0

    const totalPrice = addOnAmt + longHairAmt + parseInt(price) + bookingFee;

    const sendData = {
      bookingFee: 70,
      addOnAmt: addOnAmt,
      artistPrice: parseInt(price),
      selectedArtist: selectedArtist,
      longHairAmt: longHairAmt,
      totalPrice: totalPrice,
      serviceData: selectedService
    }

    console.log('sendData', sendData)

    navigation.navigate(screenNames.BOOK_VIRTUAL_TRAINIG, { routeData: sendData })


  }

  const getCartItem = async userId => {
    try {
      const response = await axiosInstance.get(
        `/get-cart?userId=${userId}`,
      );
      console.log(response.data);
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

  const getLocalStorageItem = async () => {
    const id = await AsyncStorage.getItem('id');
    if (id) {
      console.log(id);
      await getCartItem(id);
    }
    const serviceJson = await AsyncStorage.getItem('serviceJson');
    if (serviceJson) {
      setSelectedServicePrev(JSON.parse(serviceJson));
    }
    const currSummary = await AsyncStorage.getItem('summary');
    setCurrSummary(currSummary);


    const existingGratuity = await AsyncStorage.getItem('gratuity');
    if (existingGratuity) {
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
    if (clearCart) {
      try {
        let payload = cartDetails.data;
        payload['actionType'] = 'C';
        const response = await axiosInstance.post(`/cart`, payload);
        console.log(response.data);
        dispatch({ type: CART_ITEMS, payload: 0 });
        await AsyncStorage.setItem('summary', '');
        setCartDetails(null);
        getLocalStorageItem();
      } catch (err) {
        console.log(err);
      }
    } else {
      await AsyncStorage.removeItem('serviceJson');
      await AsyncStorage.removeItem('summary');
      setSelectedServicePrev([]);
      setCurrSummary('');
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


  const AddOnServiceTypeComponent = () => {
    return (
      <>
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
              checked={addOnServiceType === addOns.styling}
              onPress={() =>{ 
                setAddOnServiceType(addOns.styling)
               
                }}
              title={'Styling'}
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
                marginLeft:ms(55)
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

          <View style={{ marginLeft: -10 }}>

            {/* {
            addOnServiceType === addOns.styling ?
              <></>
              : */}
            <CheckBox
              checked={addOnServiceType === addOns.blowoutOnly}
              onPress={() => {
                setAddOnServiceType(addOns.blowoutOnly)
                 setSubAddOnServiceType("")
                }}
              title={'Blowout Only'}
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
                marginLeft:ms(20)
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
            {/* } */}

          </View>

        </View>
        {
          addOnServiceType === addOns.styling ?
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
                  Add on service
                </Text>
              </View>
              <View style={{ marginLeft: ms(5), marginTop: 2, marginRight: ms(10) }} >
                <Tooltip
                  isVisible={toolTipServiceVisible}
                  content={<TooltipServiceComponent />}
                  placement="top"
                  onClose={() => setToolTipServiceVisible(false)}
                >
                  <TouchableOpacity onPress={() => setToolTipServiceVisible(true)}>
                    <Icons name='infocirlceo' size={20} color={'blue'} />
                  </TouchableOpacity>
                </Tooltip>

              </View>
              <CheckBox
                checked={subAddOnServiceType === addOns.blowout}
                onPress={() => {
                  setSubAddOnServiceType(subAddOnServiceType==addOns.blowout?"": addOns.blowout)
                  }}
                title={'Blowout'}
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
                  // marginLeft: ms(30)
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

            :
            <></>
        }
      </>

    )
  }
  const TooltipComponent = () => {
    return (
      <View>
        <Text style={[GlobalStyles.txtR12Dark, {}]} >Textured: Hair with an undesired wave pattern for the finished look.{"\n"}Please note: styling is done on already dried and smoothed hair.{"\n"}If smoothing is required, there is an added fee.{"\n"}If blowdry and smoothing are required prior to styling, additional fees will apply, and prior notice is needed.</Text>
      </View>
    )
  }
  const TooltipServiceComponent = () => {
    return (
      <View>
        <Text style={[GlobalStyles.txtR12Dark, {}]} >Blowout will add $30 to total.</Text>
      </View>
    )
  }

  const LongHairTexturedYesOrNotComponent = () => {
    return (
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
            If you have textured hair?
          </Text>
        </View>
        <View style={{ marginLeft: ms(5), marginTop: 2, marginRight: ms(10) }} >
          <Tooltip
            isVisible={toolTipVisible}
            content={<TooltipComponent />}
            placement="top"
            onClose={() => setToolTipVisible(false)}
          >
            <TouchableOpacity onPress={() => setToolTipVisible(true)}>
              <Icons name='infocirlceo' size={20} color={'blue'} />
            </TouchableOpacity>
          </Tooltip>

        </View>
        <View>
          <CheckBox
            checked={isLongTexturedHair}
            onPress={() => setIsLongTexturedHair(true)}
            title={'Yes'}
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
        <View style={{ marginLeft: -10 }}>
          <CheckBox
            checked={!isLongTexturedHair}
            onPress={() => setIsLongTexturedHair(false)}
            title={'No'}
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
        </View>
      </View>
    )
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
              { width: width * 0.7, height: height * 0.2 },
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
        visible={hairMeasureModal}
        onRequestClose={() => setHairMeasureModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { padding: 0, paddingTop: 20 }]}>
            {/* Close button */}
            <TouchableOpacity
              style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
              onPress={() => setHairMeasureModal(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Image in modal */}
            <Image
              source={HairGuide}
              style={{ width: SIZES.cardWidth, height: '100%', }}
              resizeMode="cover"
            />
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
              style={{ width: 375, height: 420, borderRadius: 8 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>

      <View style={{ flexDirection: 'row', marginTop: 10, paddingHorizontal: 15 }}>
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
            Hair Styles
          </Text>
        </View>
      </View>
      <ScrollView style={{ height: height }} showsVerticalScrollIndicator>
        <View style={{ paddingHorizontal: 15 }}>
          <View style={{ marginTop: 10, ...GlobalStyles.rowCenterSpaceBetween }}>
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
            {/* setHairMeasureModal(false) */}
            <TouchableOpacity onPress={() => setHairMeasureModal(true)}>
              <CommonSvg.measure />
            </TouchableOpacity>
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
                      source={{ uri: item.imgUrl || item.imgurl }}
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
              {serviceName} Hair
            </Text>
          </View>
          {/* Service Locaion */}
          {/* <View style={{ flexDirection: 'row', marginTop: 20 }}>
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
            <View style={{ marginLeft: -10 }}>
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
            </View>
          </View> */}

          {/* Service Type */}
          <AddOnServiceTypeComponent />
          {/*  */}
          {/* Artist Level */}
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

          {/* Long hair if */}
          {
            !isTexture() &&
            <LongHairTexturedYesOrNotComponent />
          }



          {/* static info line */}
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

          {
            serviceType === 0 ?
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

export default HairStyle;

const styles = StyleSheet.create({
  checkBoxView: {
    height: 25,
    width: 25,
    borderRadius: 13,
    backgroundColor: COLORS.yellow,
    alignItems: 'center', justifyContent: 'center',
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
    color: '#000',
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
    width: SIZES.cardWidth,
    height: 435,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden'
  },
});
