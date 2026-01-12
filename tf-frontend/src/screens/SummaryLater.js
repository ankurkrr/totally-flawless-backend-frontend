import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Image } from '@rneui/base';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import DateTimePicker from 'react-native-ui-datepicker';
import { SelectList } from 'react-native-dropdown-select-list';
import { useRoute, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CART_ITEMS } from '../store/allactionsTypes';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import { showToast } from '../components/Toast';
import { asynchEnums } from '../constants/enums';

const SummaryLater = ({ navigation }) => {
  const isFocused = useIsFocused();
  // const APIBASEURL = 'http://164.52.197.9:3001';
  const routes = useRoute();
  const dispatch = useDispatch();
  const { guestUser, addOnServiceAmt, longHair } = routes.params;
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const [selectedNumberHA, setSelectedNumberHA] = useState(1);
  const [selectedNumberMA, setSelectedNumberMA] = useState(1);
  const [gratuityAmount, setGratuityAmount] = useState(0);
  const [totalAddOnAmt, setTotalAddOnAmt] = useState(0);
  const [totalLongHairAmt, setTotalLongHairAmt] = useState(0)
  const [address, setAddress] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [serviceList, setServiceList] = useState([]);
  const bookingFees = 0;
  const [priceDetails, setPriceDetails] = useState([]);
  const [userId, setUserId] = useState(null);
  const [defaultAddress, setDeafultAddress] = useState('');
  const [cartDetails, setCartDetails] = useState(null);
  const [cartFlag, setCartFlag] = useState(false);

  useEffect(() => {
    console.log(guestUser, '>>>santosh');
    if (guestUser) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
            params: {
              userType: 'Client',
            },
          },
        ],
      });
    }
  }, []);

  const getCartItem = async userId => {
    try {
      const response = await axiosInstance.get(
        `/get-cart?userId=${userId}`,
      );
      console.log(response.data);
      if (response.data.message === 'Cart not found!') {
        setCartFlag(false);
      } else {
        setCartFlag(true);
        setCartDetails(response.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const noOfArtist = [
    { key: '1', value: '1' },
    { key: '2', value: '2' },
    { key: '3', value: '3' },
  ];

  const getAddress = async userId => {
    try {
      const response = await axiosInstance.get(
        `/get-addresses?userId=${userId}`,
      );
      console.log('Get Address>>>>>', response.data);
      if (response.data.status === 'success') {
        var list = response.data.data;
        if (list.length > 0) {
          list.map(item => {
            if (item.isdefault === 1) {
              setDeafultAddress(item.id);
            }
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getAllLocalStorage = async () => {
    const id = await AsyncStorage.getItem('id');
    if (id) {
      console.log(id);
      getCartItem(id);
      getAddress(id);
      setUserId(id);
    }
    setPriceDetails([]);
    const serviceJson = await AsyncStorage.getItem('serviceJson');
    const address = await AsyncStorage.getItem('address');
    const dateTime = await AsyncStorage.getItem('dateTime');
    // let formatDate = dateTime.split(',');
    // let dateFormat = dayjs(formatDate[0]).format('DD MMMM YYYY');
    // let newDate = `${dateFormat}, ${formatDate[1]}`;
    // setAddress(address);
    // setDateTime(newDate);
    var list = JSON.parse(serviceJson);
    var GA = 0;
    var addOn = 0;
    var longHair = 0;
    list.map((item, index) => {
      GA += parseInt(item.gratuity);
      addOn += parseInt(item.addOnAmount);
      longHair += parseInt(item.longHairAmount);
      setPriceDetails(prev => [
        ...prev,
        {
          serviceName: item.name,
          price: item.price,
          gratuity: item.gratuity,
          addOnAmount: item.addOnAmount,
          longHairAmount: item.longHairAmount,
          count: item.count,
        },
      ]);
    });
    setGratuityAmount(GA);
    setTotalAddOnAmt(addOn)
    setTotalLongHairAmt(longHair)
    setServiceList(JSON.parse(serviceJson));
  };

  const changeHandler = (index, flag) => {
    let priceTemp = [...priceDetails];
    if (flag) {
      priceTemp[index].count = priceTemp[index].count + 1;
    } else if (!flag) {
      //console.log(priceTemp[index]);
      priceTemp[index].count = priceTemp[index].count - 1;
    }
    setPriceDetails(priceTemp);
  };

  const deleteServiceListHandler = async index => {
    let list = [...serviceList];
    list.splice(index, 1);
    setServiceList(list);
    let priceList = [...priceDetails];
    priceList.splice(index, 1);
    setPriceDetails(priceList);
    await AsyncStorage.setItem('serviceJson', JSON.stringify(list));
  };

  useEffect(() => {
    getAllLocalStorage();
  }, [isFocused]);

  useEffect(() => {
    var totalSum = 0;
    var GA = 0;
    var addOn = 0;
    var longHair = 0;
    totalSum += bookingFees;
    priceDetails.map((item, index) => {
      totalSum += parseInt(item.price) * item.count;
      totalSum += parseInt(item.gratuity) * item.count;
      totalSum += parseInt(item.addOnAmount) * item.count;
      totalSum += parseInt(item.longHairAmount) * item.count;
      GA += parseInt(item.gratuity) * item.count;
      addOn += parseInt(item.addOnAmount) * item.count;
      longHair += parseInt(item.longHairAmount) * item.count;

    });
    setTotalAmount(totalSum);
    setGratuityAmount(GA);
    setTotalAddOnAmt(addOn)
    setTotalLongHairAmt(longHair)
    serviceList.length > 0 && priceDetails.length > 0 && changeCount();
  }, [priceDetails]);

  const changeCount = async () => {
    console.log(priceDetails, '>>>>santosh');
    var list = [];
    serviceList.map((item, index) => {
      list.push(item);
      list[index].count = priceDetails[index]?.count;
    });
    await AsyncStorage.setItem('serviceJson', JSON.stringify(list));
  };

  const submitHandler = async () => {
    if (cartDetails) {
      let sameSelected = false;
      for (const item of serviceList) {
        if (cartDetails?.data?.later.length) {
          for (const laterService of cartDetails?.data?.later) {
            if (laterService.subId == item.id) {
              console.log('laterService.subId', laterService.subId);
              sameSelected = true;
            }
          }
        }
        console.log('sameSelected', sameSelected);
        if (sameSelected) {
          Toast.showWithGravity(
            'Service is already added! ' + item.name,
            Toast.SHORT,
            Toast.BOTTOM,
          );
          break;
        }
      }
      if (sameSelected) {
        return;
      }
      console.log('in submit');
      let totalAmount = 0;
      let bookingFee = 0;
      let totalGratuity = 0;
      let totalAddOnAmt = 0;
      let totalLongHair = 0;
      let now = [];
      let later = [];
      var list = [];
      serviceList.map((item, index) => {
        console.log(item);
        const body = {
          cartId: cartDetails.data.Id,
          serviceId: item.serviceid,
          subCategoryId: item.id,
          quantity: item.count,
          price: parseInt(item.price),
          gratuity: parseFloat(item.gratuity),
          addOnAmount: parseFloat(item.addOnAmount),
          longHairAmount: parseFloat(item.longHairAmount),
          imageUrl: item.imgUrl || item.imgurl,
          artist: item.artist,
        };
        later.push(body);
        list.push(item);
        list[index].count = priceDetails[index].count;
        totalAmount +=
          parseInt(item.price) * item.count +
          parseInt(item.gratuity * item.count) +
          parseInt(item.addOnAmount * item.count) +
          parseInt(item.longHairAmount * item.count)

          ;
        bookingFee = 0;
        totalGratuity += parseInt(item.gratuity) * item.count;
        totalAddOnAmt += parseInt(item.addOnAmount) * item.count;
        totalLongHair += parseInt(item.longHairAmount) * item.count;

      });
      cartDetails?.data?.later.map((item, index) => {
        totalAmount +=
          item.price * item.quantity + item.gratuity * item.quantity +
          parseInt(item.addOnAmount * item.quantity) +
          parseInt(item.longHairAmount * item.quantity)
          ;

        totalGratuity += item.gratuity * item.quantity;
        totalAddOnAmt += parseInt(item.addOnAmount) * item.quantity;
        totalLongHair += parseInt(item.longHairAmount) * item.quantity;
        item.subCategoryId = item?.subId
        later.push(item);
      });
      // console.log("Santosh add to cart body", list);
      // await AsyncStorage.setItem('serviceJson', JSON.stringify(list));
      const body = {
        actionType: 'U',
        userId: userId,
        cartId: cartDetails.data.Id,
        totalAmount: (totalAmount + bookingFee).toString(),
        bookingFee: '0',
        addressId: defaultAddress,
        totalGratuity: totalGratuity.toString(),
        addOnAmount: totalAddOnAmt.toString(),
        longHairAmount: totalLongHair.toString(),
        now: now,
        later: later,
        bookingTime: cartDetails?.bookingTime || '',
      };
      console.log("Add to cart update >>>>", body);
      try {
        const response = await axiosInstance.post(`/cart`, body);
        console.log(response.data);
        if (response.data.status === 'success') {
          dispatch({ type: CART_ITEMS, payload: later.length });
          await AsyncStorage.removeItem('serviceJson');
          navigation.navigate('Cart');
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      addNewCart();
    }
  };

  const addNewCart = async () => {
    console.log('addNewCart');
    let totalAmount = 0;
    let bookingFee = 0;
    let totalGratuity = 0;
    let totalAddOnAmt = 0;
    let totalLongHair = 0;
    let later = [];
    let now = [];
    var list = [];
    serviceList.map((item, index) => {
      console.log(item);
      const body = {
        serviceId: item.serviceid,
        subCategoryId: item.id,
        quantity: item.count,
        price: parseInt(item.price),
        gratuity: parseFloat(item.gratuity),
        addOnAmount: parseInt(item.addOnAmount),
        longHairAmount: parseInt(item.longHairAmount),
        imageUrl: item.imgUrl || item.imgurl,
        artist: item.artist,
      };
      later.push(body);
      list.push(item);
      list[index].count = priceDetails[index].count;
      totalAmount +=
        parseInt(item.price) * item.count +
        parseInt(item.gratuity * item.count) +
        parseInt(item.addOnAmount * item.count) +
        parseInt(item.longHairAmount * item.count)

        ;
      bookingFee = 0;
      totalGratuity += parseInt(item.gratuity) * item.count;
      totalAddOnAmt += parseInt(item.addOnAmount) * item.count;
      totalLongHair += parseInt(item.longHairAmount) * item.count;
    });
    const body = {
      actionType: 'A',
      userId: userId,
      totalAmount: (totalAmount + bookingFee).toString(),
      bookingFee: '0',
      addressId: defaultAddress,
      totalGratuity: totalGratuity.toString(),
      addOnAmount: totalAddOnAmt.toString(),
      longHairAmount: totalLongHair.toString(),
      now: now,
      later: later,
    };
    console.log("Add to cart >>>>", body);
    await AsyncStorage.removeItem(asynchEnums.SEND_NOTI_ARTIST)
    try {
      await AsyncStorage.removeItem('serviceJson');
      const response = await axiosInstance.post(`/cart`, body);
      console.log(response.data);
      if (response.data.status === 'success') {
        dispatch({ type: CART_ITEMS, payload: later.length });
        navigation.navigate('Cart');
      }
    } catch (err) {
      console.log(err);
      showToast(`${err}`)
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Fixed Header */}
      <View
        style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#FFF' }}>
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
            Summary
          </Text>
        </View>
      </View>

      <ScrollView
        style={{
          backgroundColor: 'white',
          flex: 1,
        }}>
        <View
          style={{ marginTop: 10, paddingHorizontal: 5, marginHorizontal: 15 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 17,
              fontWeight: 500,
              color: 'black',
              textDecorationLine: 'underline',
              fontWeight: '800',
            }}>
            Service Details
          </Text>
        </View>
        <View style={{ paddingHorizontal: 15 }}>
          {/* <View
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
              <View style={{flexDirection: 'column'}}>
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
                <View style={{width: width / 1.5}}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: 14,
                      fontWeight: 400,
                      color: '#000',
                    }}>
                    {address}
                  </Text>
                </View>
                <View style={{marginTop: 5}}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#000',
                      fontWeight: 'bold',
                    }}>
                    Date and Time
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
                    {dateTime}
                  </Text>
                </View>
              </View>
              <View>
                <Icon
                  onPress={() => {
                    navigation.navigate('BookAppointment', {guestUser: false});
                  }}
                  color="#000"
                  name="square-edit-outline"
                  size={25}
                  type="material-community"
                />
              </View>
            </View>
          </View> */}
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
                        source={{ uri: item.imgUrl || item.imgurl }}
                        resizeMode='contain'
                        style={{ width: 100, height: 120, borderRadius: 5 }}
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
                          {`($ ${item.price})`}
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
                              onPress={() => {
                                priceDetails[index]?.count > 1 &&
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
                            {priceDetails[index]?.count}
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
                              onPress={() => {
                                changeHandler(index, true);
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
        {/* <View
          style={{
            flexDirection: 'row',
            marginTop: 10,
            paddingHorizontal: 15,
            justifyContent: 'space-between',
          }}>
          <View style={{justifyContent: 'center'}}>
            <Text
              style={{
                color: 'black',
                fontFamily: 'Poppins-Regular',
                fontSize: 12,
              }}>
              Number of hair artists requested
            </Text>
          </View>
          <View>
            <SelectList
              boxStyles={{padding: 0, width: 110, height: 40}}
              inputStyles={{
                color: '#000',
                padding: 0,
                fontSize: 11,
                textAlign: 'center',
              }}
              search={false}
              defaultOption={{key: 1, value: 1}}
              dropdownStyles={{padding: 0}}
              dropdownItemStyles={{padding: 0}}
              dropdownTextStyles={{color: '#000', padding: 0}}
              setSelected={val => setSelectedNumberHA(val)}
              data={noOfArtist}
              save="HANumber"
            />
          </View>
        </View> */}
        {/* <View
          style={{
            flexDirection: 'row',
            marginTop: 10,
            paddingHorizontal: 15,
            justifyContent: 'space-between',
          }}>
          <View style={{justifyContent: 'center'}}>
            <Text
              style={{
                color: 'black',
                fontFamily: 'Poppins-Regular',
                fontSize: 12,
              }}>
              Number of makeup artists requested
            </Text>
          </View>
          <View>
            <SelectList
              defaultOption={{key: 1, value: 1}}
              boxStyles={{padding: 0, width: 110, height: 40}}
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
              setSelected={val => setSelectedNumberMA(val)}
              data={noOfArtist}
              save="MANumber"
            />
          </View>
        </View> */}

        {serviceList.length > 0 && (
          <View style={{ marginTop: 10, paddingHorizontal: 15 }}>
            <View>
              <Text
                style={{
                  color: '#000',
                  fontFamily: 'Poppins-Reglar',
                  fontSize: 17,
                  fontWeight: 500,
                  textDecorationLine: 'underline',
                  fontWeight: 'bold',
                }}>
                Price Details
              </Text>
            </View>
            {priceDetails &&
              priceDetails.length > 0 &&
              priceDetails.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: index === 0 ? 10 : 0,
                    marginBottom: 5,
                  }}>
                  <View>
                    <Text
                      style={{
                        color: '#101010',
                        fontFamily: 'Poppins-Reglar',
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                      {item.serviceName}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        color: '#000',
                        fontFamily: 'Poppins-Reglar',
                        fontSize: 14,
                        fontWeight: 700,
                      }}>
                      ${item.price * item.count}
                    </Text>
                  </View>
                </View>
              ))}
            {
              totalAddOnAmt != 0 &&
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 5,
                }}>
                <View>
                  <Text
                    style={{
                      color: '#101010',
                      fontFamily: 'Poppins-Reglar',
                      fontSize: 14,
                      fontWeight: 500,
                    }}>
                    Add on {totalAddOnAmt != 0 ? "Blowout" : "Styling"}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      color: '#000',
                      fontFamily: 'Poppins-Reglar',
                      fontSize: 14,
                      fontWeight: 700,
                    }}>
                    ${totalAddOnAmt}
                  </Text>
                </View>
              </View>
            }


            {/* Long hair */}
            {
              totalLongHairAmt != 0 &&
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 5,
                }}>
                <View>
                  <Text
                    style={{
                      color: '#101010',
                      fontFamily: 'Poppins-Reglar',
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
                      fontFamily: 'Poppins-Reglar',
                      fontSize: 14,
                      fontWeight: 700,
                    }}>
                    ${totalLongHairAmt}
                  </Text>
                </View>
              </View>
            }

            {/* <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 5,
              }}>
              <View>
                <Text
                  style={{
                    color: '#101010',
                    fontFamily: 'Poppins-Reglar',
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                  Total Gratuity
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    color: '#000',
                    fontFamily: 'Poppins-Reglar',
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                  ${gratuityAmount}
                </Text>
              </View>
            </View> */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 5,
              }}>
              <View>
                <Text
                  style={{
                    color: '#101010',
                    fontFamily: 'Poppins-Reglar',
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                  Total Amount Payable
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    color: '#000',
                    fontFamily: 'Poppins-Reglar',
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                  ${totalAmount}
                </Text>
              </View>
            </View>
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
            onPress={() => navigation.navigate('Home', { guestUser: false })}
            style={{
              backgroundColor: '#FFF',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 15,
              borderRadius: 35,
              borderWidth: 1,
              borderColor: '#000',
              flexDirection: 'row',
            }}>
            <Text
              style={{
                fontSize: 16,
                color: '#000',
                fontWeight: 'bold',
                fontFamily: 'Poppins-Regular',
              }}>
              Add More Service
            </Text>
            <View>
              <Icon
                color="#000"
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
            marginBottom: 30,
          }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
              marginBottom: 30,
              marginRight: 5,
            }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
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
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
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
              onPress={() => submitHandler()}
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
                Add to Cart
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SummaryLater;
