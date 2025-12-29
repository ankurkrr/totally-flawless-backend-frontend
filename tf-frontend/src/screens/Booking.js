import {View, Text, Dimensions, DrawerLayoutAndroid} from 'react-native';
import {Icon, Image} from '@rneui/base';
import {useEffect, useState, useRef} from 'react';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrawerMenu from './DrawerMenu';
import axios from 'axios';
import moment from 'moment';
import {useIsFocused} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import {ScrollView} from 'react-native';
import BookingCard from '../components/BookingCard';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';



const Booking = ({navigation}) => {
  const isFocused = useIsFocused();
  // const APIBASEURL = 'http://164.52.197.9:3001';
  const drawer = useRef(null);
  const [guestUser, setGuestUser] = useState(false);
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;

  const [bookings, setBookings] = useState([]);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {key: 'pending', title: 'Pending'},
    {key: 'upcoming', title: 'Upcoming'},
    {key: 'completed', title: 'Completed'},
  ]);

  const changeNavigation = page => {
    if (page === 'Slider') {
      navigation.reset({
        index: 0,
        routes: [{name: page}],
      });
    }
    navigation.navigate(page, {guestUser: guestUser});
  };

  const getLocalStorage = async () => {
    const flag = await AsyncStorage.getItem('guestUser');
    if (flag === 'true') {
      navigation?.navigate("Auth")
    
    }
    const id = await AsyncStorage.getItem('id');
    if (id) {
      console.log(id);
      getBookingsItems(id);
    }
  };

  const getBookingsItems = async id => {
    try {
      console.log('id>>>>' + id);
      const response = await axiosInstance.get(
        `/get-bookings?userId=${id}`,
      );
      if (response?.data?.message !== 'Bookings not found!') {
        console.log('bookings', JSON.stringify(response.data.data));
        const data = response.data.data;
        setBookings(data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getLocalStorage();
  }, [isFocused]);

  const PendingRoute = () => (
    <ScrollView
      style={{
        flex: 1,
      }}>
      {bookings
        .sort((a, b) =>
          moment(b.createdAt, 'YYYY-MM-DD, hh:mm A').diff(
            moment(a.createdAt, 'YYYY-MM-DD, hh:mm A'),
          ),
        )
        .map((booking, index) => (
          <>
            {booking.cartData.now.map(item => (
              <BookingCard
                booking={booking}
                item={item}
                index={index}></BookingCard>
            ))}
            {booking.cartData.later.map(item => (
              <BookingCard
                booking={booking}
                item={item}
                index={index}></BookingCard>
            ))}
          </>
        ))}
      <View style={{height: 100}}></View>
    </ScrollView>
  );

  const UpcomingRoute = () => (
    <ScrollView
      style={{
        flex: 1,
      }}>
      {bookings
        .filter(b => b.status == 'accepted')
        .map((booking, index) => (
          <>
            {booking.cartData.now.map(item => (
              <BookingCard
                booking={booking}
                item={item}
                index={index}></BookingCard>
            ))}
            {booking.cartData.later.map(item => (
              <BookingCard
                booking={booking}
                item={item}
                index={index}></BookingCard>
            ))}
          </>
        ))}
      <View style={{height: 100}}></View>
    </ScrollView>
  );

  const CompletedRoute = () => (
    <ScrollView
      style={{
        flex: 1,
      }}>
      {bookings
        .filter(b => b.status == 'completed')
        .map((booking, index) => (
          <>
            {booking.cartData.now.map(item => (
              <BookingCard
                booking={booking}
                item={item}
                index={index}></BookingCard>
            ))}
            {booking.cartData.later.map(item => (
              <BookingCard
                booking={booking}
                item={item}
                index={index}></BookingCard>
            ))}
          </>
        ))}
      <View style={{height: 100}}></View>
    </ScrollView>
  );

  const renderScene = SceneMap({
    pending: PendingRoute,
    upcoming: UpcomingRoute,
    completed: CompletedRoute,
  });
  const renderTabBar = props => (
    <TabBar
      {...props}
      style={{backgroundColor: 'white'}}
      indicatorStyle={{
        backgroundColor: '#666',
      }}
      renderLabel={({route, focused}) => {
        let textColor;

        // Apply different colors based on the tab and whether it is selected (focused)
        if (focused) {
          if (route.key === 'pending') {
            textColor = 'red';
          } else if (route.key === 'upcoming') {
            textColor = 'grey';
          } else if (route.key === 'completed') {
            textColor = 'green';
          }
        } else {
          // If not selected, use black
          textColor = 'black';
        }

        return (
          <Text style={{color: textColor, fontSize: 15, fontWeight: '500'}}>
            {route.title.toUpperCase()}
          </Text>
        );
      }}
      activeColor={'#e31414'}
    />
  );

  return (
    <View style={{backgroundColor: '#FFF', flex: 1}}>
      <TopBar drawer={drawer} />
      <View style={{flexGrow: 1, backgroundColor: '#FFF'}}>
        <TabView
          renderTabBar={renderTabBar}
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{width: width}}
        />
      </View>
      <BottomBar navigation={changeNavigation} page={'selected'} />
      <Toast />
    </View>
  );
};

export default Booking;
