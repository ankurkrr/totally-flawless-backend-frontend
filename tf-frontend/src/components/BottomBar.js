import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { CART_DATA, CART_ITEMS, IS_ADDED_CART } from '../store/allactionsTypes';
import DeviceInfo from 'react-native-device-info';
import { API_URL } from '../store/url';
import screenNames from '../constants/screenNames';
import axiosInstance from '../services/axiosInterceptor';
import { asynchEnums } from '../constants/enums';
import { Icon } from '@rneui/base';


const BottomBar = ({ navigation, page }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState('Home');
  const { cartItems, isAddedCart, isGuest } = useSelector(state => state.AppReducer);
  // const APIBASEURL = 'http://164.52.197.9:3001';
  // const [guestUser, setGuestUser] = useState(false);
  useEffect(() => {
    page === 'home' && setCurrentPage('Home');
    page === 'selected' && setCurrentPage('Selected');
    page === screenNames.USER_BOOKING && setCurrentPage(screenNames.USER_BOOKING);
    // page === "Bookings" && setCurrentPage(screenNames.USER_BOOKING);
    page === screenNames.USER_PROFILE && setCurrentPage(screenNames.USER_PROFILE);
    page === screenNames.MAP_SCREEN && setCurrentPage(screenNames.MAP_SCREEN);
  }, []);

  const getCartItems = async id => {
    console.log('in cart >>>>>>>>>>>>>>>>>>>>>>>>>');
    try {
      const response = await axiosInstance.get(`/get-cart?userId=${id}`);
      console.log('getcart res>>>>>' + JSON.stringify(response.data));
      if (response?.data?.message !== 'Cart not found!') {
        const data = response.data.data || [];
        dispatch({ type: CART_DATA, payload: data });
        if (data?.later.length > 0) {
          dispatch({ type: CART_ITEMS, payload: data?.later.length });

          console.log('ItemsLength', data?.later.length);
        } else if (data?.now.length > 0) {
          dispatch({ type: CART_ITEMS, payload: data?.now.length });
          console.log('ItemsLength', data?.now.length);
        } else {
          dispatch({ type: CART_DATA, payload: [] });
          dispatch({ type: CART_ITEMS, payload: 0 });
        }
        dispatch({ type: IS_ADDED_CART, payload: false });
      } else {
        dispatch({ type: CART_DATA, payload: [] });
        dispatch({ type: IS_ADDED_CART, payload: false });
        dispatch({ type: CART_ITEMS, payload: 0 });
        await AsyncStorage.removeItem(asynchEnums.CART_BOOKING)
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getLocalStorage = async () => {
    const id = await AsyncStorage.getItem('id');
    console.log('ingetlocalstorae>>>>>>>>>>>', id);
    if (id) {
      getCartItems(id);
    } else {
      dispatch({ type: CART_ITEMS, payload: 0 });
    }
  };

  useEffect(() => {
    if (isAddedCart) {
      console.log("<<<<<<<<< isAddedCart >>>>>>>", isAddedCart)
      getLocalStorage();
    }
  }, [isAddedCart]);

  // useEffect(() => {
  //   console.log('cartItems', cartItems);
  // }, [cartItems]);

  return (
    <View
      style={{
        backgroundColor: '#f9f9f9',
        paddingVertical: 5,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingBottom: Math.max(insets.bottom, Platform.OS == 'ios' ? 10 : 6),
      }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
        <TouchableOpacity
          style={styles.bottomIconDiv}
          onPress={() => navigation('Home')}>
          <Image
            source={require('../assets/home.png')}
            style={{ height: 35, width: 35 }}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === 'Home' ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomIconDiv}
          onPress={() => navigation('Cart')}>
          <Image
            source={require('../assets/haircut.png')}
            style={{ height: 35, width: 35 }}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === 'Selected' ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Selected
          </Text>
          {cartItems > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                position: 'absolute',
                top: 0,
                right: 18,
                backgroundColor: 'black',
                borderRadius: 50,
              }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 12,
                  textAlign: 'center',
                }}>
                {cartItems}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation(screenNames.USER_BOOKING)}
          style={styles.bottomIconDiv}>
          <Image
            source={require('../assets/booking.png')}
            style={{ height: 35, width: 35 }}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === screenNames.USER_BOOKING ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Booking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation(screenNames.MAP_SCREEN)}
          style={styles.bottomIconDiv}>
          <View style={{ height: 35, width: 35, justifyContent: 'center', alignItems: 'center' }}>
            <Icon
              name="location-on"
              type="material"
              size={32}
              color="#444444"
            />
          </View>
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === screenNames.MAP_SCREEN ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation(screenNames.USER_PROFILE)}
          style={styles.bottomIconDiv}>
          <Image
            source={require('../assets/user.png')}
            style={{ height: 35, width: 35 }}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === screenNames.USER_PROFILE ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomIconDiv: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomBar;
