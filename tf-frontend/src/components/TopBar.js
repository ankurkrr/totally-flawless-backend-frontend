import { View, Text, Image, Pressable, TouchableOpacity } from 'react-native';
import * as React from 'react';
import { Icon } from '@rneui/base';
import Icons from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native';
import images from '../constants/images';
import { COLORS, FONTS } from '../style/theme';
import { ms, mvs } from 'react-native-size-matters';
import { useSelector } from 'react-redux';
import screenNames from '../constants/screenNames';
import { navigationRef } from '../Navigation';
import UserContext from '../screens/UserContext';

const TopBar = props => {
  const { drawer } = props;
  const navigation = useNavigation();

  const { cartItems, isAddedCart, isGuest } = useSelector(state => state.AppReducer);
  const { user } = React.useContext(UserContext);

  const changeNavigation = page => {
    navigation.navigate(page);
  };

  // React.useEffect(() => {

  //   getCurrentScreen()
  // }, [])


  const getCurrentScreen = () => {
    if (navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute();

      // console.log('Current screen name:', currentRoute.name);
      return currentRoute.name == "Cart" || user?.userType == 'Artist' ? false : true;
    } else {
      return true
    }
  };

  const handleNavigate = () => {
    if (isGuest) {

      navigation.navigate("Auth")
    } else {
      navigation.navigate('Cart')
    }
  }

  return (
    <View style={{ backgroundColor: COLORS.bgPink, paddingVertical: 10, zIndex: 99 }}>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 99,
        }}>
        <Pressable
          style={{
            zIndex: 99,
          }}
          onPress={() => {
            console.log('openDrawer');
            navigation?.openDrawer();
          }}>
          <Icon
            color="#FFF"
            iconStyle={{ padding: 0 }}
            style={{
              padding: 0,
              zIndex: 2,
            }}
            name="menu"
            size={35}
            type="fontAwesome"
          />
        </Pressable>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            // marginLeft:getCurrentScreen()?0: -40,
            zIndex: 1,
          }}>
          <Image
            source={images.logoFinal}
            style={{ height: 60, width: 60, objectFit: 'cover' }}
          />
          {/* <Image
            source={require('../assets/logo1.jpg')}
            style={{height: 60, width: 60, objectFit: 'cover'}}
          /> */}
        </View>
        {
          getCurrentScreen() ?
            <TouchableOpacity
              onPress={handleNavigate}
              style={{ height: mvs(40), width: ms(40), alignItems: 'center', justifyContent: 'center', }}>
              <Icons name='cart-outline' size={35} color={COLORS.white} />
              {cartItems > 0 && (
                <View
                  style={{
                    width: 18,
                    height: 18,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: COLORS.greyTxt,
                    borderRadius: 50,
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 12,
                      fontFamily: FONTS.medium,
                      textAlign: 'center',
                    }}>
                    {cartItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            :
            <View style={{ height: mvs(40), width: ms(40), }} />
        }


      </View>
    </View>
  );
};

export default TopBar;
