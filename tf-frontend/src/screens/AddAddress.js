import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {CheckBox, Icon, Input} from '@rneui/base';
import dayjs from 'dayjs';
import {useState} from 'react';
import DateTimePicker from 'react-native-ui-datepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {useIsFocused, useRoute} from '@react-navigation/native';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import { showToast } from '../components/Toast';
import { debounce } from "lodash";

const AddAddress = ({navigation}) => {
  const routes = useRoute();
  const {guestUser, cartId, cartDetails} = routes.params;
  const height = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pin, setPin] = useState('');
  const [defaultFlag, setDefaultFlag] = useState(false);
  const [placeId, setPlaceId] = useState('');
  const [search, setSearch] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [errorText, setErrorText] = useState('');
  const [geocode, setGeoCode] = useState('');

  const setAddressData = async () => {
    if (city === '' || state === '' || pin === '' || address === '') {
      var errorText = '';
      errorText =
        address === ''
          ? 'Please search address on street field'
          : state === ''
          ? 'Enter State manually or search address again'
          : pin === ''
          ? 'Enter Postal-code manually or search address again'
          : city === ''
          ? 'Enter City manually or search address again'
          : '';
      console.log(errorText);
      // Toast.show({
      //   type: 'error',
      //   text1: 'Error',
      //   text2: errorText,
      // });
      showToast(errorText)
      return;
    }
    // const APIBASEURL = 'http://164.52.197.9:3001';
    const userId = await AsyncStorage.getItem('id');
    const isDefault = defaultFlag ? 1 : 0;
    try {
      const request={
        userId: userId,
        street: address,
        city: city,
        state: state,
        pincode: pin,
        isDefault: isDefault,
        geocode: geocode,
      }
      console.log('request >>>', request)
      const response = await axiosInstance.post(`/add-address`, request);
      console.log(response);
      if (response.status === 200) {
        navigation.navigate('SavedAddress', {
          guestUser: guestUser,
          cartId: cartId,
          cartDetails: cartDetails,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleChangeText = debounce(async text => {
    //setSearch(text);
    try {
      const response = await axiosInstance.get(
        `/maps/autocomplete?input=${encodeURIComponent(text)}`,
      );
      console.log(response.data);
      setPredictions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  }, 1500);

  const findPlaceDetails = async placeId => {
    try {
      const getAddressDetails = await axiosInstance.get(
        `/maps/place?placeId=${placeId}`,
      );
      const address = getAddressDetails.data.result.adr_address;
      const latlong =
        getAddressDetails.data.result?.geometry?.location?.lat +
        ',' +
        getAddressDetails.data.result?.geometry?.location?.lng;
        console.log('getAddressDetails.data.result?.geometry >>>>', getAddressDetails.data.result?.geometry )
        console.log('latlong >>>>', latlong )
      setGeoCode(latlong);
      let location_obj = {
        formatted_address: '',
        locality: '',
        street_number: '',
        admin_area_l1: '',
        route: '',
        country: '',
        sublocality: '',
        postal_code: '',
        latitude: '',
        longitude: '',
      };
      for (let i in getAddressDetails.data.result.address_components) {
        let item = getAddressDetails.data.result.address_components[i];
        location_obj['formatted_address'] =
          getAddressDetails.data.result.formatted_address ||
          getAddressDetails.data.result.formatted_address;
        if (
          item['types'].indexOf('locality') > -1 ||
          item['types'].indexOf('administrative_area_level_2') > -1
        ) {
          location_obj['locality'] = item['long_name'];
        } else if (item['types'].indexOf('administrative_area_level_1') > -1) {
          location_obj['admin_area_l1'] = item['long_name'];
        } else if (item['types'].indexOf('street_number') > -1) {
          location_obj['street_number'] = item['long_name'];
        } else if (item['types'].indexOf('route') > -1) {
          location_obj['route'] = item['long_name'];
        } else if (item['types'].indexOf('country') > -1) {
          location_obj['country'] = item['long_name'];
        } else if (item['types'].indexOf('postal_code') > -1) {
          location_obj['postal_code'] = item['long_name'];
        } else if (item['types'].indexOf('sublocality') > -1) {
          location_obj['sublocality'] = item['long_name'];
        }
      }
      console.log('getAddressDetails.data.result >>', getAddressDetails.data.result);
      // let street = getAddressDetails.data.result.name || '';
      // if (location_obj.street_number) {
      //   street = street
      //     // ? street + ', ' + location_obj.street_number
      //     ? street 
      //     : location_obj.street_number;
      // }
      // if (location_obj.route) {
      //   street = street
      //     ? street + ', ' + location_obj.route
      //     : location_obj.route;
      // }

      console.log("location_obj.route >>>",location_obj.route)
      let street=location_obj.street_number ||"";

      if(street==""){
        street=getAddressDetails.data.result.name
      }

      if(location_obj.route){
        street=street+", "+location_obj.route
      }

      setAddress(street);
      setCity(location_obj.sublocality);
      setState(location_obj.admin_area_l1);
      setPin(location_obj.postal_code);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {/* Fixed Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFF' }}>
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
            Add new address
          </Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor: 'white',
          flex: 1,
          paddingHorizontal: 15,
          zIndex: 10,
        }}>
      <View style={{flexDirection: 'column', marginTop: 10, zIndex: 99}}>
        <View>
          <Input
            value={address}
            autoCorrect={false}
            errorStyle={{display: 'none'}}
            onChangeText={value => {
              setAddress(value);
              handleChangeText(value);
              setSearch(true);
            }}
            placeholder="Street"
            placeholderTextColor={'gray'}
          />
        </View>
        {search && predictions && predictions.length > 0 && (
          <ScrollView
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps={"always"}
            style={{
              height: height / 8,
              overflowY: 'scroll',
              borderWidth: 1,
              borderColor: 'gray',
              zIndex: 99,
            }}>
            {predictions.map(item => (
              <Pressable
                key={item.place_id}
                onPress={() => {
                  setPlaceId(item.place_id);
                  findPlaceDetails(item.place_id);
                  setPredictions([]);
                  setSearch(false);
                }}
                style={{
                  flex: 1,
                  paddingHorizontal: 5,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderColor: 'gray',
                  zIndex: 99,
                }}>
                <View>
                  <Text style={{color: '#000', fontSize: 12}}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View>
          <Input
            value={city}
            errorStyle={{display: 'none'}}
            onChangeText={value => setCity(value)}
            placeholder="City"
            placeholderTextColor={'gray'}
          />
        </View>
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}>
            <Input
              value={state}
              errorStyle={{display: 'none'}}
              onChangeText={value => setState(value)}
              placeholder="State"
              placeholderTextColor={'gray'}
            />
          </View>
          <View style={{flex: 1}}>
            <Input
              value={pin}
              errorStyle={{display: 'none'}}
              onChangeText={value => setPin(value)}
              placeholder="ZipCode"
              placeholderTextColor={'gray'}
            />
          </View>
        </View>
      </View>
      <View style={{flexDirection: 'row', marginTop: 10}}>
        <View>
          <CheckBox
            checked={defaultFlag}
            onPress={() => setDefaultFlag(!defaultFlag)}
            title={'Set as default'}
            titleProps={{style: {paddingHorizontal: 10, color: 'black'}}}
            checkedColor="black"
          />
        </View>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 30,
        }}>
        <TouchableOpacity
          onPress={() => setAddressData()}
          style={{
            backgroundColor: '#000',
            width: '100%',
            alignItems: 'center',
            paddingVertical: 15,
            borderRadius: 35,
          }}>
          <Text
            style={{
              fontSize: 20,
              color: '#FFF',
              fontWeight: 'bold',
              fontFamily: 'Poppins-Regular',
            }}>
            Add Address
          </Text>
        </TouchableOpacity>
      </View>
        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default AddAddress;
