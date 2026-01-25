import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '@rneui/base';
import { Tooltip } from '@rneui/themed';
import { useIsFocused, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';

const ControlledTooltip = React.forwardRef((props, ref) => {
  const { click } = props;
  const [open, setOpen] = useState(false);

  const childFunction = () => {
    setOpen(false);
    click('flex');
  };

  React.useImperativeHandle(ref, () => ({
    childFunction,
  }));

  return (
    <Tooltip
      backgroundColor={'#FFF'}
      containerStyle={{ borderWidth: 0.4, borderColor: '#000' }}
      visible={open}
      withOverlay={false}
      height={70}
      onOpen={() => {
        setOpen(true);
        click('none');
      }}
      onClose={() => {
        setOpen(false);
        click('flex');
      }}
      {...props}
    />
  );
});

const SavedAddress = ({ navigation }) => {
  const routes = useRoute();
  const { guestUser, cartId, cartDetails } = routes.params;
  const isFocused = useIsFocused();
  // const APIBASEURL = 'http://164.52.197.9:3001';
  const height = Dimensions.get('window').height;
  const [addressList, setAddressList] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState();
  const [selectedIndex, setSelectedIndex] = useState();
  const [isShow, setIsShow] = useState('flex');

  const childRefs = useRef([]);

  const callChildFunction = index => {
    const childRef = childRefs.current[index];
    if (childRef && typeof childRef.childFunction === 'function') {
      childRef.childFunction();
    }
  };

  const changeNavigation = page => {
    if (cartId == 0) {
      navigation.goBack()
    } else {
      navigation.navigate(page, {
        guestUser: guestUser,
        cartId: cartId,
        cartDetails: cartDetails,
      });
    }

  };

  const getAllAddress = async () => {
    try {
      const userId = await AsyncStorage.getItem('id');
      console.log('userId >>>', userId)
      if(!userId){
        return
      }
      const response = await axiosInstance.get(
        `/get-addresses?userId=${userId}`,
      );
      const list = response.data.data;

      console.log('list >>>', list)
      list.map((item, index) => {
        if (item.isdefault === 1) {
          console.log('default>>>>', index);
          setSelectedIndex(index);
        }
      });
      setAddressList(response.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const setDefault = async (item, index, confirm = false) => {
    try {

      const request = {
        id: item.id,
        userId: item.userid,
        street: item.street,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        isDefault: 1,
      }
      console.log('request >>>', request)
      await axiosInstance
        .post(`/update-address`, request)
        .then(response => {
          !confirm && callChildFunction(index);
          confirm && changeNavigation('BookAppointment');
        });
    } catch (err) {
      console.log(err);
    }
  };

  const deleteAddress = async (id, index) => {
    try {
      const response = await axiosInstance.get(
        `/delete-address?addressId=${id}`,
      );
      if (response.status === 200) {
        callChildFunction(index);
        getAllAddress();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const selectedAddress = (item, index) => {
    setDefaultAddress(item);
    setSelectedIndex(index);
  };

  useEffect(() => {
    getAllAddress();
  }, [isFocused]);

  const handleConfirm = () => {

    if(cartId==0){
      navigation.goBack()
      return
    }

    if (!defaultAddress) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select an address before confirming.',
      });
      return;
    }
    setDefault(defaultAddress, 0, true);
  };

  useEffect(() => {
    console.log(
      guestUser,
      cartId,
      typeof cartDetails,
      '>>>>>>>>>>>>>>>>>>> Hello world',
    );
  }, [guestUser, cartId, cartDetails]);

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
            Saved Address
          </Text>
        </View>
      </View>
      <ScrollView
        style={{
          backgroundColor: 'white',
          flex: 1,
          paddingHorizontal: 15,
        }}>
        {addressList.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => selectedAddress(item, index)}
            style={{
              flexDirection: 'row',
              paddingVertical: 15,
              paddingHorizontal: 15,
              borderWidth: selectedIndex === index ? 1 : 0.5,
              borderColor: selectedIndex === index ? '#D69316' : '#000',
              borderRadius: 10,
              marginTop: 10,
            }}>
            <View>
              <Icon
                color="#D69316"
                name="map-pin"
                size={18}
                type="font-awesome"
              />
            </View>
            <View style={{ flexWrap: 'nowrap', paddingHorizontal: 10, flex: 4 }}>
              <Text
                style={{
                  color: 'black',
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  textAlign: 'left',
                  flexWrap: 'nowrap',
                }}>
                {`${item?.street ? item?.street + ', ' : ''}${item?.city}`}
              </Text>
              <Text
                style={{
                  color: 'black',
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                }}>
                {`${item?.state}, ${item?.pincode}`}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <ControlledTooltip
                ref={ref => (childRefs.current[index] = ref)}
                popover={
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      paddingVertical: 10,
                      paddingLeft: 10,
                      flexWrap: 'nowrap',
                    }}>
                    <TouchableOpacity onPress={() => setDefault(item, index)}>
                      <Text style={{ color: '#000', paddingBottom: 5 }}>
                        Set Default
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteAddress(item.id, index)}>
                      <Text style={{ color: '#000' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                }
                withPointer={false}
                width={110}
                click={setIsShow}>
                <Icon
                  containerStyle={{ display: isShow }}
                  color="#C4C4C4"
                  name="more-vert"
                  size={18}
                  type="material"
                />
              </ControlledTooltip>
            </View>
          </TouchableOpacity>
        ))}


        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddAddress', {
              guestUser: guestUser,
              cartId: cartId,
              cartDetails: cartDetails,
            })
          }
          style={{ flexDirection: 'row', marginTop: 20 }}>
          <View>
            <Icon
              color="#000"
              name="add-circle-outline"
              size={30}
              type="material"
            />
          </View>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 10,
            }}>
            <Text
              style={{
                color: '#000',
                fontSize: 18,
                fontFamily: 'Poppins-Regular',
              }}>
              Add New Address
            </Text>
          </View>
        </TouchableOpacity>

        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 30,
          }}>
          <TouchableOpacity
            onPress={handleConfirm}
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
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default SavedAddress;
