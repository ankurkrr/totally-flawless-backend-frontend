import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { CART_ITEMS, IS_CHAT } from '../store/allactionsTypes';
import DeviceInfo from 'react-native-device-info';
import { API_URL } from '../store/url';
import screenNames from '../constants/screenNames';
import axiosInstance from '../services/axiosInterceptor';
import { COLORS } from '../style/theme';

const ArtistBottomBar = ({ navigation, page }) => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(screenNames.ARTIST_HOME);
  const { cartItems,isNewChat } = useSelector(state => state.AppReducer);
  // const APIBASEURL = 'http://164.52.197.9:3001';
  // const [guestUser, setGuestUser] = useState(false);
  useEffect(() => {
    page === screenNames.ARTIST_HOME && setCurrentPage(screenNames.ARTIST_HOME);
    page === screenNames.ARTIST_CHAT && setCurrentPage(screenNames.ARTIST_CHAT);
    page === screenNames.ARTIST_BOOKING && setCurrentPage(screenNames.ARTIST_BOOKING);
    page === screenNames.ARTIST_PROFILE && setCurrentPage(screenNames.ARTIST_PROFILE);
  }, []);


  const getLocalStorage = async () => {
    const id = await AsyncStorage.getItem('id');
    console.log('ingetlocalstorae>>>>>>>>>>>', id);
    if (id) {
      // getCartItems(id);
    }
  };

  useEffect(() => {
    // getLocalStorage();
  }, []);

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
        paddingBottom: Platform.OS == 'ios' ? 10 : 6,
      }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
        <TouchableOpacity
          style={styles.bottomIconDiv}
          onPress={() => navigation(screenNames.ARTIST_HOME)}>
          <Image
            source={require('../assets/home.png')}
            style={{ height: 35, width: 35 }}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === screenNames.ARTIST_HOME ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{...styles.bottomIconDiv,paddingTop:5}}
          onPress={() => {
            dispatch({type:IS_CHAT,payload:false})
            navigation(screenNames.ARTIST_CHAT)
            }}>
          <Image
            source={require('../assets/chat.png')}
            style={{ height: 30, width: 35 ,}}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === screenNames.ARTIST_CHAT ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Chat
          </Text>
          {isNewChat&& (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: 10,
                height: 10,
                position: 'absolute',
                top: 5,
                right: 25,
                backgroundColor: COLORS.red,
                borderRadius: 50,
              }}>
              {/* <Text
                style={{
                  color: 'white',
                  fontSize: 12,
                  textAlign: 'center',
                }}>
                {cartItems}
              </Text> */}
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation(screenNames.ARTIST_BOOKING)}
          style={styles.bottomIconDiv}>
          <Image
            source={require('../assets/booking.png')}
            style={{ height: 35, width: 35 }}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === screenNames.ARTIST_BOOKING ? 'bold' : 'normal',
              fontSize: 12,
            }}>
            Booking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomIconDiv}
          onPress={() => navigation(screenNames.ARTIST_PROFILE)}
        >
          <Image
            source={require('../assets/user.png')}
            style={{ height: 35, width: 35 }}
          />
          <Text
            style={{
              color: 'black',
              fontWeight: currentPage === screenNames.ARTIST_PROFILE ? 'bold' : 'normal',
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

export default ArtistBottomBar;
