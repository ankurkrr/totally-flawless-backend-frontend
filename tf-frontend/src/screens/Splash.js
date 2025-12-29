import React, { useContext, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Gif from 'react-native-gif';
const { width, height } = Dimensions.get('window');
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { ReadableStream } from 'web-streams-polyfill';
import screenNames from '../constants/screenNames';
import axiosInstance from '../services/axiosInterceptor';
import { asynchEnums } from '../constants/enums';
import { useDispatch, useSelector } from 'react-redux';
import { IS_CHAT, IS_ORDER, IS_ORDER_ACCEPTED } from '../store/allactionsTypes';
import UserContext from './UserContext';
import images from '../constants/images';
import { COLORS, SIZES } from '../style/theme';
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream;
}

const SplashScreen = ({ navigation }) => {


  const dispatch = useDispatch();

  const { user, updateUser } = useContext(UserContext);

  const getLocalStorageItem = async () => {
    const splash = await AsyncStorage.getItem(asynchEnums.SPLASH);
    const id = await AsyncStorage.getItem('id');
    const newUser = await AsyncStorage.getItem('isNewUser');
    const userType = await AsyncStorage.getItem('userType');
    const hasMobile = await AsyncStorage.getItem('hasMobile');
    const isRegistered = await AsyncStorage.getItem('isRegistered');
    // console.log(id, newUser);
    // if (id && newUser) {
    //   if (newUser === 'true') {
    //     setTimeout(() => {
    //       if (userType == 'Client') {
    //         navigation.reset({
    //           index: 0,
    //           routes: [{ name: 'Register' }],
    //         });
    //       } else {
    //         navigation.reset({
    //           index: 0,
    //           routes: [
    //             {
    //               name: 'ArtistLogin',
    //               params: {
    //                 hasMobile: hasMobile,
    //               },
    //             },
    //           ],
    //         });
    //       }
    //     }, 2000);
    //   } else if (newUser === 'false') {
    //     setTimeout(async () => {
    //       if (userType == 'Client') {
    //         navigation.reset({
    //           index: 0,
    //           routes: [{ name: 'Home', params: { guestUser: false } }],
    //         });
    //       } else {
    //         if (isRegistered) {

    //           console.log('Artist id >>>>', id)

    //           const response = await axiosInstance.get(`/get-artistdetails?artistId=${id}`);
    //           const data = response?.data?.data || "";
    //           updateUser({
    //             firstName: data.firstName,
    //             lastName: data.lastName,
    //             email:data.email,
    //             userType: 'Artist',
    //           });

    //           if (data && data?.isApproved == 1) {
    //             navigation.reset({
    //               index: 0,
    //               routes: [
    //                 {
    //                   name: screenNames.ARTIST_HOME,
    //                   params: {
    //                     hasMobile: hasMobile,
    //                   },
    //                 },
    //               ],
    //             });
    //           } else {
    //             navigation.reset({
    //               index: 0,
    //               routes: [
    //                 {
    //                   name: 'ApplicationReviewPage',
    //                   params: {
    //                     hasMobile: hasMobile,
    //                   },
    //                 },
    //               ],
    //             });
    //           }

    //         } else {
    //           navigation.reset({
    //             index: 0,
    //             routes: [
    //               {
    //                 name: 'ArtistLogin',
    //                 params: {
    //                   hasMobile: hasMobile,
    //                 },
    //               },
    //             ],
    //           });
    //         }
    //       }
    //     }, 2000);
    //   }
    // } else if (splash) {
    //   setTimeout(() => {
    //     navigation.reset({
    //       index: 0,
    //       routes: [{ name: 'Auth' }],
    //     });
    //     //navigation.navigate('Slider');
    //   }, 2000);
    // } else {
    //   setTimeout(() => {
    //     navigation.reset({
    //       index: 0,
    //       routes: [{ name: 'Slider' }],
    //     });
    //     //navigation.navigate('Slider');
    //   }, 2000);
    // }

    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Slider' }],
      });
      //navigation.navigate('Slider');
    }, 2000);
  };
  useEffect(() => {

    getLocalStorageItem();
    // firebaseNoti()
  }, []);


  /* const firebaseNoti = () => { ... } removed */

  return (
    <View style={styles.container}>
      {/* <Gif source={images.appLogo} style={styles.gif} />*/}
      <Gif source={require('../assets/appSplash2.gif')} style={styles.gif} />
      {/* <Image source={images.logoFinal} style={styles.gif}></Image> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#000',
    backgroundColor: COLORS.bgPink,
  },
  gif: {
    width: SIZES.cardWidth,
    height: 600,
    objectFit: 'contain',
  },
  // gif: {
  //   width: 600,
  //   height: 600,
  //   objectFit: 'contain',
  // },
});

export default SplashScreen;
