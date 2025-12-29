import { Icon } from '@rneui/base';
import { useEffect, useState, useContext } from 'react';
import { Dimensions, Image, View, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import dayjs from 'dayjs';
import UserContext from './UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import screenNames from '../constants/screenNames';
import { useSelector } from 'react-redux';
import { COLORS, FONTS } from '../style/theme';
import CustomSwitch from '../components/CustomSwitch';
import images from '../constants/images';
import axiosInstance from '../services/axiosInterceptor';
import { showToast } from '../components/Toast';

import { Loader } from './components';
import HairGuide from '../assets/HairGuide.png';
import { mvs } from 'react-native-size-matters';
import Icons from "react-native-vector-icons/Feather"
import MIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { GlobalStyles } from '../style/GlobalStyles';

const DrawerMenu = ({ navigation }) => {
  const { user, updateUser } = useContext(UserContext);
  const [isArtist, setIsArtist] = useState(false);
  const [availableSwitch, setAvailableSwitch] = useState(false)
  const { height, width } = Dimensions.get('window');
  const { isGuest } = useSelector(state => state.AppReducer);
  const [loading, setLoading] = useState(false)
  const isFocus = useIsFocused();

  const getLocalStorage = async () => {
    const userType = await AsyncStorage.getItem('userType');
    console.log("userType>>>>." + userType);
    const isRegistered = await AsyncStorage.getItem('isRegistered');
    if (userType == 'Artist' && isRegistered == 'true') {
      setIsArtist(true);
      setAvailableSwitch(user?.isAvailable || false)
    }
  };

  useEffect(() => {
    console.log('Drawer menu>>>>>>', user);
    getLocalStorage();
  }, []);

  useEffect(() => {
    console.log('Drawer menu>>>>>>', user);
    if (user && user.userType == 'Artist') {
      setAvailableSwitch(user?.isAvailable || false)
      setIsArtist(true);
    } else {
      setIsArtist(false);
    }
  }, [user]);

  const changeNavigation = async (page) => {
    if (page === 'Auth') {
      if (user) {


        // console.log( user.userType)
        // return
        setLoading(true)
        if (user.userType == 'Artist') {

          handleAvailableSwitch(false)
        }


        await AsyncStorage.removeItem('isNewUser');
        await AsyncStorage.removeItem('userType');
        await AsyncStorage.removeItem('hasMobile');
        await AsyncStorage.removeItem('isRegistered');


        // Remove token from AsyncStorage
        await AsyncStorage.removeItem('fcmToken');

        // requestUserPermission()



        navigation?.closeDrawer();

        setLoading(false)
        setTimeout(() => {
          AsyncStorage.removeItem('id');
          AsyncStorage.removeItem('isArtistDataUploaded');
        }, 1000);
        navigation.reset({
          index: 0,
          routes: [{ name: page }],
        });
        updateUser(null);
      } else {
        navigation?.closeDrawer();
        navigation.navigate(page)
      }

    } else if (isGuest) {
      navigation?.closeDrawer();
      navigation.navigate("Auth")
    }
    else {
      navigation?.closeDrawer();
      navigation.navigate(page)
    }
  };
  const handleEmail = () => {
    Linking.openURL('mailto:support@totallyflawless.co');
  };

  const handleContact = () => {
    Linking.openURL('tel:+(832) 898-7753');
  };

  const handleAvailableSwitch = async (visible) => {

    try {
      setAvailableSwitch(visible)

      updateUser({
        ...user,
        isAvailable: visible
      })

      const id = await AsyncStorage.getItem("id")
      console.log('id >>>', id)
      const request = {
        "artistId": id,
        "isAvailable": visible ? "1" : "0" // 1,0
      }

      console.log('request handleAvailableSwitch >>>>', request)

      const response = await axiosInstance.post(`/artist-available`, request);
      showToast(response?.data?.message)

      console.log('response', response.data)
    } catch (error) {
      setLoading(false)
      console.log('error handleAvailableSwitch  >>>', error)
    }
  }


  const handleDelete = async () => {

    try {

      setLoading(true)
      const id = await AsyncStorage.getItem("id");
      let userData = {};

      if (user?.userType != 'Artist') {
        const userResponse = await axiosInstance.get(
          `/get-userdetails?userId=${id}`,
        );
        userData = userResponse.data.data[0];
      } else {
        const userResponse = await axiosInstance.get(`/get-artistdetails?artistId=${id}`);
        userData = userResponse?.data?.data || "";
      }

      let request = {};
      if (user?.userType != 'Artist') {
        request = {
          "id": id,
          "mobile": userData?.phone || "",
          "userType": 2  // 1 for artist and 2 for client
        }
      } else {
        request = {
          "id": id,
          "mobile": userData?.mobile || "",
          "userType": 1 // 1 for artist and 2 for client
        }

      }
      console.log('request handleDelete >>>', request)

      // setLoading(false)
      const response = await axiosInstance.post(`/delete-user`, request);
      console.log('handleDelete response?.data >>>>', response?.data)
      if (response.status == 200) {
        showToast("Account deleted successfully!")
        changeNavigation("Auth")
      } else {
        setLoading(false)
      }

    } catch (error) {
      setLoading(false)
      console.error(error)
      changeNavigation("Auth")
    }

  }


  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Deletion cancelled'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Place your account deletion logic here
            handleDelete()
          },
        },
      ],
      { cancelable: true }
    );
  };


  return (
    <>

      <Loader loading={loading} />
      <View
        style={{
          height: height,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          backgroundColor: '#FFF',
        }}>
        {!isArtist && (
          <>
            {user ? (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 30,
                  paddingHorizontal: 30,
                  paddingBottom: 10,
                  borderBottomWidth: 0.4,
                  borderColor: '#000',
                }}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  {
                    user?.profileImage ?
                      <Image
                        source={{ uri: user?.profileImage }}
                        style={{ height: 80, width: 80, borderRadius: 50, backgroundColor: COLORS.input }}
                      />

                      :
                      <View style={{
                        height: 80, width: 80,
                        ...GlobalStyles.alignJustifyCenter, backgroundColor: COLORS.darkWhite, borderRadius: 40,
                      }} >
                        <Icons name='user' size={35} color={"grey"} />
                      </View>

                  }

                </View>
                <View
                  style={{
                    flex: 2,
                    flexDirection: 'column',
                    paddingLeft: 25,
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {`${user.firstName} ${user.lastName}`}
                  </Text>
                  {
                    user.createdDate &&
                    <Text
                      style={{
                        color: 'black',
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: 'Poppins-Regular',
                      }}>
                      {dayjs(user.createdDate).format('MMMM, YYYY')}
                    </Text>
                  }

                  <TouchableOpacity onPress={() => changeNavigation(screenNames.USER_PROFILE)} >
                    <Text
                      style={{
                        color: 'black',
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: 'Poppins-Regular',
                        textDecorationLine: 'underline',
                      }}>
                      View Profile
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 30,
                  paddingHorizontal: 30,
                  paddingBottom: 10,
                  borderBottomWidth: 0.4,
                  borderColor: '#000',
                }}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={{
                    ...GlobalStyles.alignJustifyCenter, height: 80, width: 80, borderRadius: 50,
                    backgroundColor: COLORS.input
                  }}>
                    <Image
                      source={images.logoFinal}
                      // source={require('../../src/assets/logo1.jpg')}
                      style={{ height: 80, width: 80, borderRadius: 50, }}
                      resizeMode='cover'
                    // tintColor={COLORS.greyTxt}
                    />
                  </View>
                </View>
                <View
                  style={{
                    flex: 2,
                    flexDirection: 'column',
                    paddingLeft: 25,
                    paddingTop: 10,
                    justifyContent: 'center',
                    alignSelf: 'flex-start',
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Guest User
                  </Text>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {dayjs(new Date()).format('MMMM, YYYY')}
                  </Text>
                  {/* <Text
                    style={{
                      color: 'black',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    April, 2024
                  </Text> */}
                  {/* <Text
                    style={{
                      color: 'black',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'Poppins-Regular',
                      textDecorationLine: 'underline',
                    }}>
                    View Profile
                  </Text> */}
                </View>
              </View>
            )}
          </>
        )}
        <View style={{ paddingHorizontal: 20 }}>
          {isArtist ? (
            <>

              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 30,
                  paddingHorizontal: 10,
                  paddingBottom: 10,
                  borderBottomWidth: 0.4,
                  borderColor: '#000',
                }}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  {
                    user?.profileImage ?
                      <Image
                        source={{ uri: user?.profileImage }}
                        style={{ height: 80, width: 80, borderRadius: 50, backgroundColor: COLORS.input }}
                      />

                      :
                      <View style={{
                        height: 80, width: 80,
                        ...GlobalStyles.alignJustifyCenter, backgroundColor: COLORS.darkWhite, borderRadius: 40,
                      }} >
                        <Icons name='user' size={35} color={"grey"} />
                      </View>

                  }
                </View>
                <View
                  style={{
                    flex: 2,
                    flexDirection: 'column',
                    paddingLeft: 25,
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {`${user?.firstName} ${user?.lastName == undefined ? "" : user.lastName}`}
                  </Text>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {dayjs(user?.createdDate).format('MMMM, YYYY')}
                  </Text>
                  <TouchableOpacity onPress={() => changeNavigation(screenNames.ARTIST_PROFILE)} >
                    <Text
                      style={{
                        color: 'black',
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: 'Poppins-Regular',
                        textDecorationLine: 'underline',
                      }}>
                      View Profile
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}   >
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>

                  <Image
                    source={images.available}
                    style={{ height: 30, width: 30, resizeMode: 'contain' }}
                    tintColor={COLORS.yellow}
                  />
                </View>
                <View
                  style={{
                    flex: 4,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Available
                  </Text>
                </View>
                <View style={{ justifyContent: "center" }} >
                  <CustomSwitch
                    visible={availableSwitch}
                    handleNotificationOnOff={(visible) => {
                      handleAvailableSwitch(visible)

                    }}
                  />
                </View>

              </View>
              <TouchableOpacity style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}
                onPress={() => {

                  navigation.navigate(screenNames.ARTIST_SAVED_ADDR, {
                    guestUser: false,
                    cartId: 0,
                    cartDetails: {},
                  })

                }
                } >
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>

                  <Image
                    source={require('../assets/Group.png')}
                    style={{ height: 30, width: 30, resizeMode: 'contain' }}
                  />
                </View>
                <View
                  style={{
                    flex: 4,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Saved Addresses
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </TouchableOpacity>

              {/* Delete account Artist*/}
              {
                !isGuest &&
                <TouchableOpacity style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}
                  onPress={confirmDelete} >
                  <View
                    style={{
                      height: 50,
                      width: 50,
                      borderRadius: 25,
                      borderWidth: 0.7,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <MIcons name='account-remove' size={30} color={COLORS.yellow} />

                  </View>
                  <View
                    style={{
                      flex: 4,
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      paddingLeft: 10,
                    }}>
                    <Text
                      style={{
                        color: '#000',
                        fontSize: 16,
                        fontFamily: 'Poppins-Regular',
                      }}>
                      Delete Account
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                    }}>
                    <Icon
                      color="#000"
                      name="arrow-forward-ios"
                      size={25}
                      type="material"
                    />
                  </View>
                </TouchableOpacity>
              }


              <TouchableOpacity
                onPress={() => {
                  // AsyncStorage.removeItem('id');
                  // AsyncStorage.removeItem('isNewUser');
                  // AsyncStorage.removeItem('userType');
                  // AsyncStorage.removeItem('hasMobile');
                  AsyncStorage.removeItem('guestUser');
                  // 
                  changeNavigation('Auth');
                }}
                style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}
                testID="logoutButton"
                nativeID="logoutButton"
                accessibilityLabel="logoutButton">

                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../assets/logout.png')}
                    style={{ height: 30, width: 30 }}
                  />
                </View>
                <View
                  style={{
                    flex: 3,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {'Logout'}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* <TouchableOpacity onPress={() => changeNavigation(screenNames.USER_BOOKING)} style={{ flexDirection: 'row', marginTop:Platform.OS=='ios'?8: 15 }}>
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image source={require('../assets/shopping-bag.png')} />
                </View>
                <View
                  style={{
                    flex: 3,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Your Orders
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </TouchableOpacity> */}

              <TouchableOpacity onPress={() => changeNavigation(screenNames.USER_WISHLIST)} style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}>
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',

                  }}>
                  <Image source={require('../assets/heart.png')} />
                </View>
                <View
                  style={{
                    flex: 3,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Favorites
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}
                onPress={() => {
                  if (isGuest) {
                    changeNavigation("Auth")
                  } else {
                    navigation.navigate('SavedAddress', {
                      guestUser: false,
                      cartId: 0,
                      cartDetails: {},
                    })
                  }
                }} >
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>

                  <Image
                    source={require('../assets/Group.png')}
                    style={{ height: 30, width: 30, resizeMode: 'contain' }}
                  />
                </View>
                <View
                  style={{
                    flex: 4,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Saved Addresses
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}
                onPress={() => {
                  if (isGuest) {
                    navigation?.closeDrawer();
                    showToast("Please login to add gallery photos")
                    navigation.navigate("Auth")
                  } else {
                    navigation.navigate(screenNames.MY_GALLERY)
                  }

                }} >
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>

                  <Image
                    source={require('../assets/gallery.png')}
                    style={{ height: 30, width: 30, resizeMode: 'contain', tintColor: COLORS.yellow }}
                  />
                </View>
                <View
                  style={{
                    flex: 4,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    My Gallery
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </TouchableOpacity>

              {/* Delete account Artist*/}
              {
                !isGuest &&
                <TouchableOpacity style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}
                  onPress={confirmDelete} >
                  <View
                    style={{
                      height: 50,
                      width: 50,
                      borderRadius: 25,
                      borderWidth: 0.7,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <MIcons name='account-remove' size={30} color={COLORS.yellow} />
                    {/* <Image
                    source={require('../assets/Group.png')}
                    style={{ height: 30, width: 30, resizeMode: 'contain' }}
                  /> */}
                  </View>
                  <View
                    style={{
                      flex: 4,
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      paddingLeft: 10,
                    }}>
                    <Text
                      style={{
                        color: '#000',
                        fontSize: 16,
                        fontFamily: 'Poppins-Regular',
                      }}>
                      Delete Account
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                    }}>
                    <Icon
                      color="#000"
                      name="arrow-forward-ios"
                      size={25}
                      type="material"
                    />
                  </View>
                </TouchableOpacity>
              }

              {/* <View style={{ flexDirection: 'row', marginTop:Platform.OS=='ios'?8: 15 }}>
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../assets/payment.png')}
                    style={{ height: 30, width: 30 }}
                  />
                </View>
                <View
                  style={{
                    flex: 4,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Payment Method
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </View> */}
              <TouchableOpacity
                onPress={() => {
                  // AsyncStorage.removeItem("guestUser")
                  changeNavigation('Auth');
                }}
                style={{ flexDirection: 'row', marginTop: Platform.OS == 'ios' ? 8 : 15 }}>
                <View
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 0.7,
                    borderColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../assets/logout.png')}
                    style={{ height: 30, width: 30 }}
                  />
                </View>
                <View
                  style={{
                    flex: 3,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {user ? 'Logout' : 'Login'}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                  }}>
                  <Icon
                    color="#000"
                    name="arrow-forward-ios"
                    size={25}
                    type="material"
                  />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* {
          user?.userType != 'Artist' &&
          <View style={{ alignSelf: 'center', marginTop: Platform.OS == "ios" ? 0 : mvs(5), width: '100%', }} >
            <Image
              source={HairGuide}
              style={{ width: '100%', height: Platform.OS == "ios" ? 200 : 200, backgroundColor: COLORS.greyTxt }}
              resizeMode="cover"
            />
          </View>
        } */}


      </View>


      <View
        style={{ marginTop: 'auto', paddingHorizontal: 15, paddingBottom: 20 }}>
        <TouchableOpacity
          onPress={handleContact}
          style={{
            backgroundColor: '#000',
            paddingVertical: 18,
            borderRadius: 25,
            alignItems: 'left',
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'left',
            paddingLeft: 10,
            paddingRight: 10,
          }}>
          <Icon
            name="phone"
            type="material-outlined" // Use outlined version
            color="#FFF"
            size={14}
            style={{ marginRight: 5 }} // Space between icon and text
          />

          <Text
            style={{
              color: '#FFF',
              fontSize: 10,
              fontFamily: FONTS.bold,
            }}>Contact Us - (832) 898-7753</Text>

        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleEmail}
          style={{
            backgroundColor: '#000',
            paddingVertical: 18,
            borderRadius: 25,
            marginBottom: 10,
            alignItems: 'left',
            flexDirection: 'row', // Align icon and text in a row
            justifyContent: 'left',
            paddingLeft: 10,
            paddingRight: 10,
          }}>
          <Icon
            name="email"
            type="material-outlined" // Use outlined version
            color="#FFF"
            size={14}
            style={{ marginRight: 5 }} // Space between icon and text
          />

          <Text
            style={{
              color: '#FFF',
              fontSize: 10,
              fontFamily: FONTS.bold,
            }}> Email Us - support@totallyflawless.co
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default DrawerMenu;
