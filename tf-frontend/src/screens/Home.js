import {
  Modal,
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  RefreshControl,
} from 'react-native';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import { Image } from '@rneui/base/dist/Image/Image';
import { useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import Swiper from 'react-native-swiper';
import dayjs from 'dayjs';
import UserContext from './UserContext';
import LinearGradient from 'react-native-linear-gradient';
import HairGuide from '../assets/HairGuide.png';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import DeviceInfo from 'react-native-device-info';
import { IS_ADDED_CART } from '../store/allactionsTypes';
import { useDispatch } from 'react-redux';
import { COLORS, FONTS, SIZES } from '../style/theme';

const Home = ({ navigation }) => {
  const { updateUser } = useContext(UserContext);

  // const APIURLBASE = 'http://164.52.197.9:3001';
  const width = Dimensions.get('window').width;
  const routes = useRoute();
  const { guestUser } = routes.params?.guestUser || false;
  const data = [
    { key: 0, value: require('../assets/carousel5.jpeg') },
    { key: 1, value: require('../assets/carousel2.jpeg') },
    { key: 2, value: require('../assets/carousel3.jpg') },
    { key: 3, value: require('../assets/carousel4.jpg') },
  ];
  const changeNavigation = page => {
    console.log('Hello>>>', page);

    if (page === 'Slider') {
      navigation.reset({
        index: 0,
        routes: [{ name: page }],
      });
    }
    navigation.navigate(page, {
      guestUser: guestUser,
    });
  };
  const [makeupService, setMakeupService] = useState([]);
  const [hairService, setHairService] = useState([]);
  const [hairCategoryId, setHairCategoryId] = useState();
  const [makeupCategoryId, setMakeupCategoryId] = useState();
  const [modalVisible, setModalVisible] = useState(false);

  const dispatch = useDispatch();

  const cardClickHandler = async (item, categoryId, serviceName) => {
    //console.log(item, categoryId);
    await AsyncStorage.setItem('categoryId', categoryId.toString());
    await AsyncStorage.setItem('seriveId', item.serviceId.toString());
    if (categoryId === 1) {
      navigation.navigate('HairStyle', {
        categoryId: categoryId,
        serviceId: item.serviceId,
        guestUser: guestUser,
        serviceName: serviceName,
      });
    } else if (categoryId === 2) {
      navigation.navigate('makeupStyle', {
        categoryId: categoryId,
        serviceId: item.serviceId,
        guestUser: guestUser,
        serviceName: serviceName,
      });
    }
  };

  const getAllServices = async () => {
    try {
      const response = await axiosInstance.get(
        `/get-categories-with-services`,
      );
      // console.log('Response>>>>>>', response.data.data);
      var makeup = [];
      var hair = [];
      var data = response.data.data;
      data.map((item, index) => {
        if (item.categoryId === 2) {
          // console.log(item.services);
          setMakeupCategoryId(item.categoryId);
          makeup.push(item.services);
        } else if (item.categoryId === 1) {
          // console.log(item.services);
          setHairCategoryId(item.categoryId);
          hair.push(item.services);
        }
      });
      //console.log(makeup.pop());
      setMakeupService(makeup.pop());
      setHairService(hair.pop());
      dispatch({ type: IS_ADDED_CART, payload: true });
      await AsyncStorage.removeItem('serviceJson');
    } catch (err) {
      console.log(err);
    }
  };

  const getUserDetails = async id => {
    try {
      // console.log(id);
      // console.log(
      //   userType === 'Client'
      //     ? 'get-userdetails?userId'
      //     : 'get-artistdetails?artistId',
      // );
      // const userType = await AsyncStorage.getItem('userType');
      const response = await axiosInstance.get(
        `/get-userdetails?userId=${id}`,
      );
      console.log('get user Home>>>', response.data.data[0]);
      if (
        response.data?.data &&
        response.data?.data.length &&
        response.data.data[0].gratuity
      ) {
        console.log('setItem', 'gratuity');
        // await AsyncStorage.setItem(
        //   'gratuity',
        //   response.data.data[0].gratuity.toString(),
        // );
      }
      var fullName = `${response.data.data[0].firstName} ${response.data.data[0].lastName}`;
      var dateOfJoining = dayjs(response.data.data[0].createdDate).format(
        'MMMM, YYYY',
      );
      const data = response.data.data[0];
      // console.log('data', data)
      updateUser({
        firstName: data.firstName,
        lastName: data.lastName,
        createdDate: data.createdDate,
        countryCode: data?.countryCode,
        phone: data?.phone,
        email: data.email,
        profileImage: data.profileImage,
        isAvailable: data.isAvailable == 1 ? true : false,
        userType: 'Client',
      });
    } catch (err) {
      console.log(err);
    }
  };

  const getLocalStorageItem = async () => {
    const id = await AsyncStorage.getItem('id');
    console.log('id', id);
    if (id) {
      getUserDetails(id);
    } else {
      updateUser(null);
    }

  };

  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', () => {
      getLocalStorageItem();
    })

    return () => {
      unsubscribe();
    }
  }, [])





  useEffect(() => {

    getAllServices();
    checkApplicationPermission()
  }, []);


  const checkApplicationPermission = async () => {

    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch (error) {
      }
    }
  }

  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', () => {
      updateFcmToken();
      //  if(Platform.OS=="ios"){
      //                 setTimeout(() => {
      //                     setLoading(false)
      //                 }, 1500);
      //             }
    })

    return () => {
      unsubscribe();
    }
  }, [])


  const updateFcmToken = async () => {

    try {

      const id = await AsyncStorage.getItem("id")
      const fcmToken = await AsyncStorage.getItem("fcmToken")
      if (!fcmToken) {
        return
      }
      const deviceId = Platform.OS == 'ios' ? DeviceInfo.getDeviceId() : await DeviceInfo.getAndroidId();
      const request = {
        "userId": id,
        "deviceId": deviceId,
        "deviceType": Platform.OS,
        "deviceToken": fcmToken
      }

      // console.log('request updateFcmToken >>>', request)
      const response = await axiosInstance.post(`/manageDevice`, request);
      // console.log('response?.data', response?.data)

    } catch (error) {

    }

  }

  return (
    <View style={{ backgroundColor: '#FFF', flex: 1 }}>
      <TopBar navigation={navigation} />
      <View style={{ flexGrow: 1, backgroundColor: '#FFF' }}>
        <ScrollView style={{ backgroundColor: 'white' }} refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={getAllServices}
          />
        }>
          <View
            style={{
              marginBottom: 10,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              //borderRadius: 20,
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#FFF',
            }}>
            <View style={{ width: width }}>
              <Swiper
                autoplay={true}
                index={0}
                autoplayTimeout={2}
                dotColor="#E0E0E0"
                activeDotColor="#000"
                paginationStyle={{ bottom: -20 }}
                style={{
                  height: width / 2,
                }}>
                {data.map((item, index) => {
                  return (
                    <View
                      key={index}
                      style={{
                        justifyContent: 'center',
                      }}>
                      <View
                        style={{
                          zIndex: 1,
                        }}>
                        <Image
                          source={item.value}
                          style={{
                            width: '100%',
                            height: width / 2,
                          }}
                        />
                      </View>
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          zIndex: 2,
                          width: width,
                          height: 'auto',
                          flexDirection: 'column',
                        }}>
                        <LinearGradient
                          colors={['#FFFFFF', '#FFFFFF'
                            // '#FFC55A'
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          locations={[0, 1]}
                          style={{
                            paddingVertical: 5,
                            width: '100%',
                          }}>
                          <Text
                            style={{
                              fontFamily: FONTS.regular,
                              color: '#000',
                              fontSize: 18,
                              fontWeight: 600,
                              textAlign: 'center',
                            }}
                            testID="homeHeader"
                            nativeID="homeHeader"
                            accessibilityLabel="homeHeader">
                            Your Time, Your Place, Your Look!
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>
                  );
                })}
              </Swiper>
            </View>
          </View>

          <View style={{ flexDirection: 'column', paddingHorizontal: 10 }}>
            <View
              style={{
                marginTop: 25,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <View style={{ paddingHorizontal: 10 }}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: Platform.OS == 'ios' ? 14 : 16,
                    fontFamily: 'Poppins-Regular',
                    fontWeight: 700,
                  }}>
                  Choose Your Desired Makeup Looks
                </Text>
              </View>
              {/* <View style={{paddingHorizontal: 10}}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 14,
                    fontFamily: 'Poppins-Regular',
                  }}>
                  View All
                </Text>
              </View> */}
            </View>
            <ScrollView
              horizontal={true}
              contentContainerStyle={{ paddingLeft: 5 }}
              style={{
                paddingHorizontal: 5,
                flexDirection: 'row',
                marginVertical: 10,
                height: width / 1.9,
              }}>
              {makeupService.map((item, index) => {
                return (
                  <TouchableOpacity
                    onPress={() => cardClickHandler(item, 2, item.serviceName)}
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
                    }}
                    testID={`serviceCard_makeup_${index}`}
                    nativeID={`serviceCard_makeup_${index}`}
                    accessibilityLabel={`serviceCard_makeup_${index}`}>
                    <View>
                      <Image
                        source={{ uri: item.imgUrl || item.imgurl }}
                        style={{
                          width: width / 2.7,
                          height: width / 2.5,
                          borderRadius: 10,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          color: 'black',
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          textAlign: 'center',
                          paddingVertical: 11,
                        }}>
                        {item.serviceName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View
            style={{
              flexDirection: 'column',
              paddingHorizontal: 10,
              marginBottom: 160,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <View style={{ paddingHorizontal: 10 }}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: Platform.OS == 'ios' ? 14 : 16,
                    fontFamily: 'Poppins-Regular',
                    fontWeight: 700,
                  }}>
                  Choose Your Desired Hair Styles
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <View style={{ paddingHorizontal: 0 }}>
                  <Text
                    style={{
                      color: '#D69316',
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      marginTop: '3.5%',

                    }}>
                    Hair Length Guide
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal={true}
              contentContainerStyle={{ paddingLeft: 5 }}
              style={{
                flexDirection: 'row',
                marginVertical: 10,
                height: width / 1.9,
                paddingHorizontal: 5,
              }}>
              {hairService.map((item, index) => {
                return (
                  <TouchableOpacity
                    onPress={() =>
                      cardClickHandler(item, hairCategoryId, item.serviceName)
                    }
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
                    }}
                    testID={`serviceCard_makeup_${index}`}
                    nativeID={`serviceCard_makeup_${index}`}
                    accessibilityLabel={`serviceCard_makeup_${index}`}>
                    <View>
                      <Image
                        source={{ uri: item.imgUrl || item.imgurl }}
                        style={{
                          width: width / 2.7,
                          height: width / 2.5,
                          borderRadius: 10,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          color: 'black',
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          textAlign: 'center',
                          paddingVertical: 11,
                        }}>
                        {item.serviceName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  {/* Close button */}
                  <TouchableOpacity
                    style={[styles.closeButton, { height: 25, width: 20, zIndex: 1 }]}
                    onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>

                  {/* Image in modal */}
                  <Image
                    source={HairGuide}
                    // style={{width: 375, height: '100%',}}
                    style={{ width: SIZES.cardWidth, height: '100%', }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </View>
      <BottomBar navigation={changeNavigation} page={'home'} />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default Home;
