import React, { useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Button } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { fbLogin } from '../components/FacebookService';

import axios from 'axios';
import UserContext from './UserContext';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import { useDispatch, useSelector } from 'react-redux';
import { CART_ITEMS, IS_GUEST } from '../store/allactionsTypes';

const { width, height } = Dimensions.get('window');

const AuthLinkPage = ({ navigation }) => {
  const [userInfo, setUserInfo] = React.useState(null);

  const { isGuest } = useSelector(state => state.AppReducer);

  const changeNavigation = async (page, type) => {
    console.log('Clicked', type);

    await AsyncStorage.setItem('guestUser', 'false');
    dispatch({ type: CART_ITEMS, payload: 0 });
    navigation.navigate(page, { guestUser: false, userType: type });
  };

  const { updateUser } = useContext(UserContext);
  const dispatch = useDispatch();

  const guestChangeNavigation = async () => {
    await AsyncStorage.removeItem('id');
    await AsyncStorage.removeItem('isNewUser');
    await AsyncStorage.removeItem('hasMobile');
    await AsyncStorage.removeItem('userType');
    await AsyncStorage.removeItem('isRegistered');
    await AsyncStorage.setItem('guestUser', 'true');
    dispatch({ type: CART_ITEMS, payload: 0 });
    dispatch({ type: IS_GUEST, payload: true })
    navigation.navigate('Home', { guestUser: true });
  };




  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../../src/assets/megan.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.container}>
        <View
          testID="loginAsClient"
          nativeID="loginAsClient"
          accessibilityLabel="loginAsClient">
          <TouchableOpacity
            style={[styles.buttonContainer, styles.clientButton]}
            onPress={() => changeNavigation('Login', 'Client')}>
            <Text style={styles.clientButtonText.style}>Login as a Client</Text>
          </TouchableOpacity>
        </View>

        <View
          testID="exploreAsGuest"
          nativeID="exploreAsGuest"
          accessibilityLabel="exploreAsGuest">
          <TouchableOpacity onPress={guestChangeNavigation}>
            <Text style={styles.link}>Explore as a Guest</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            height: 1,
            width: width,
            backgroundColor: 'black',
            marginBottom: 20,
            marginTop: 10,
          }}
        />

        {/* <View style={styles.separator} /> */}

        <View
          testID="loginAsArtist"
          nativeID="loginAsArtist"
          accessibilityLabel="loginAsArtist">
          <TouchableOpacity
            style={[styles.buttonContainer, styles.artistButton]}
            onPress={() => changeNavigation('Login', 'Artist')}>
            <Text style={styles.artistButtonText.style}>Login as an Artist</Text>
          </TouchableOpacity>
        </View>




        {/* <LoginButton
          onLoginFinished={handleLoginFinished}
          onLogoutFinished={() => setUserInfo(null)}
          permissions={['public_profile', 'email']}
        /> */}
        {/* <LoginButton
          onLoginFinished={handleLoginFinished}
          onLogoutFinished={() => console.log("logout.")} 
          permissions={['public_profile', 'email']}
        /> */}
        {userInfo && (
          <Text>
            Name: {userInfo.name}
            {'\n'}
            Email: {userInfo.email}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    height: height,
    backgroundColor: 'white',
  },
  container: {
    backgroundColor: 'white',
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: width,
    marginBottom: 36,
  },
  image: {
    width: width,
    height: height * 0.6,
  },
  clientButton: {
    width: 'auto',
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 75,
    borderColor: 'black',
    backgroundColor: 'black',
  },
  buttonContainer: {
    borderRadius: 50,
    marginBottom: 20,
  },
  clientButtonText: {
    style: { color: 'white', fontSize: 16, fontWeight: '400' },
  },
  link: {
    marginVertical: 10,
    color: 'black',
    textDecorationLine: 'underline',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: 'black',
    marginBottom: 20,
    marginTop: 5,
  },
  artistButton: {
    width: 'auto',
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 75,
    borderColor: 'black',
    backgroundColor: 'white',
  },
  artistButtonText: {
    style: { color: 'black', fontSize: 16, fontWeight: '400' },
  },
});

export default AuthLinkPage;
