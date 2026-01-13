import React, { useEffect, useState } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerMenu from '../screens/DrawerMenu';
import { Dimensions, Platform, StatusBar } from 'react-native';
import SplashScreen from '../screens/Splash';
import AuthLinkPage from '../screens/AuthLink';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Slider from '../screens/Slider';
import VerifyMobile from '../screens/VerifyMobile';
import VerifyOTP from '../screens/VerifyOTP';
import Home from '../screens/Home';
import HairStyle from '../screens/HairStyle';
import BookAppointment from '../screens/BookAppointment';
import Summary from '../screens/Summary';
import SummaryLater from '../screens/SummaryLater';
import SavedAddress from '../screens/SavedAddress';
import AddAddress from '../screens/AddAddress';
import Cart from '../screens/Cart';
import { UserProvider } from '../screens/UserContext';
import ArtistLogin from '../screens/artist/ArtistLogin';
import MakeStyle from '../screens/makeupStyle';
import Booking from '../screens/Booking';
import ApplicationReviewPage from '../screens/ApplicationReview';
import DeviceInfo from 'react-native-device-info';
import screenNames from '../constants/screenNames';
import ArtistHome from '../screens/artist/ArtistHome';
import ArtistBooking from '../screens/artist/ArtistBooking';
import ArtistProfile from '../screens/artist/ArtistProfile';
import ArtistChat from '../screens/artist/ArtistChat';
import UserBookings from '../screens/UserBookings';
import UserProfile from '../screens/UserProfile';
import UserWishlist from '../screens/UserWishlist';
import UserChat from '../screens/UserChat';
import ArtistSavedAddress from '../screens/artist/ArtistSavedAddress';
import TrackArtistInUserBooking from '../screens/TrackArtistInUserBooking';
import MyGallery from '../screens/MyGallery';
import { COLORS } from '../style/theme';
import BookVirtualAppointment from '../screens/BookVirtualAppointment';
import MapScreen from '../screens/MapScreen';
const { width, height } = Dimensions.get('window');

export const navigationRef = createNavigationContainerRef();

const AfterLoginStack = createStackNavigator();
const Drawer = createDrawerNavigator();

const Navigation = () => {

  useEffect(() => {
    // PushNotification logic removed
  }, []);


  const LoginStack = () => (
    <AfterLoginStack.Navigator initialRouteName="SplashScreen">
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="SplashScreen"
        component={SplashScreen}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="Auth"
        component={AuthLinkPage}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="Login"
        component={Login}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="ArtistLogin"
        component={ArtistLogin}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="ApplicationReviewPage"
        component={ApplicationReviewPage}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="Register"
        component={Register}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },

        }}
        name="Slider"
        component={Slider}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="SendOTP"
        component={VerifyMobile}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="VerifyOTP"
        component={VerifyOTP}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="Home"
        component={Home}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="HairStyle"
        component={HairStyle}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="BookAppointment"
        component={BookAppointment}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="Summary"
        component={Summary}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="SummaryLater"
        component={SummaryLater}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.MY_GALLERY}
        component={MyGallery}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="SavedAddress"
        component={SavedAddress}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.ARTIST_SAVED_ADDR}
        component={ArtistSavedAddress}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.USER_PROFILE}
        component={UserProfile}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="AddAddress"
        component={AddAddress}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="Cart"
        component={Cart}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="Booking"
        component={Booking}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.TRACK_ARTIST}
        component={TrackArtistInUserBooking}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.USER_BOOKING}
        component={UserBookings}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name="makeupStyle"
        component={MakeStyle}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.BOOK_VIRTUAL_TRAINIG}
        component={BookVirtualAppointment}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.USER_WISHLIST}
        component={UserWishlist}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.MAP_SCREEN}
        component={MapScreen}
      />

      {/* Artist */}

      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.ARTIST_HOME}
        component={ArtistHome}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.ARTIST_BOOKING}
        component={ArtistBooking}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.ARTIST_PROFILE}
        component={ArtistProfile}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.ARTIST_CHAT}
        component={ArtistChat}
      />
      <AfterLoginStack.Screen
        options={{
          header: () => {
            return null;
          },
        }}
        name={screenNames.USER_CHAT}
        component={UserChat}
      />

    </AfterLoginStack.Navigator>
  );

  const AfterLogin = () => (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
      }}
      drawerContent={props => <DrawerMenu {...props} />}>
      <Drawer.Screen name={'AppScreen'} component={LoginStack} />
    </Drawer.Navigator>
  );
  return (
    <UserProvider>
      <SafeAreaProvider
        style={{
          paddingTop:
            Platform.OS == 'ios'
              ? DeviceInfo.hasNotch()
                ? height / 17
                : 0
              : 0,
          backgroundColor: COLORS.white,
        }}>
        <StatusBar />
        <NavigationContainer ref={navigationRef}>
          <AfterLogin />
        </NavigationContainer>
      </SafeAreaProvider>
    </UserProvider>
  );
};

export default Navigation;
