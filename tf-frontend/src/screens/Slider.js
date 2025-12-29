import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useRef, useContext } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { asynchEnums } from '../constants/enums';
import { COLORS, FONTS, SIZES } from '../style/theme';
import axiosInstance from '../services/axiosInterceptor';
import UserContext from './UserContext';
import screenNames from '../constants/screenNames';
import { debounce } from 'lodash';
const { width, height } = Dimensions.get('window');
import Loader from '../screens/components/Loader'
import { IS_GUEST } from '../store/allactionsTypes';
import { useDispatch } from 'react-redux';
import { GlobalStyles } from '../style/GlobalStyles';
import { ms, mvs } from 'react-native-size-matters';
import images from '../constants/images';

const Slider = ({ navigation }) => {
  const [btnText, setBtnText] = useState('Learn More');
  const [slideIndex, setSlideIndex] = useState(0);
  const [hideSkip, setHideSkip] = useState(true);
  const swiperRef = useRef(null);

  const [loading, setLoading] = useState(false)

  const { user, updateUser } = useContext(UserContext);

  const indexChangeHandler = index => {
    if (index === 3) {
      setHideSkip(false);
      setBtnText('Get Started');
    } else {
      setHideSkip(true);
      setBtnText('Learn More');
    }
    // console.log('index >>>', index)
    setSlideIndex(index);
  };

  // const clearLocalStorage = async () => {
  //   await AsyncStorage.clear();
  // };
  // useEffect(() => {
  //   clearLocalStorage();
  // });
  const [serviceTypeFontSize, setServiceFontSize] = useState(16);
  const [serviceHeadingFontSize, setServiceHeadingFontSize] = useState(27);

  const dispatch = useDispatch();

  const updateFontSize = () => {
    const baseFontSize = 16;
    const headingFontSize = 27;

    if (width <= 400) {
      setServiceFontSize(baseFontSize * 0.8);
      setServiceHeadingFontSize(headingFontSize * 0.8);
    } else if (width <= 600) {
      setServiceFontSize(baseFontSize);
      setServiceHeadingFontSize(headingFontSize);
    } else {
      setServiceFontSize(baseFontSize);
      setServiceHeadingFontSize(headingFontSize);
    }
  };

  useEffect(() => {
    updateFontSize();
    const screenSize = Dimensions.addEventListener('change', updateFontSize);
    return () => {
      screenSize?.remove();
    };
  }, []);

  const handleSkip = async () => {
    setLoading(true)
    const guest = await AsyncStorage.getItem('guestUser');
    console.log('guest skip >>>>', guest)
    const id = await AsyncStorage.getItem('id');
    const newUser = await AsyncStorage.getItem('isNewUser');
    const userType = await AsyncStorage.getItem('userType');
    const hasMobile = await AsyncStorage.getItem('hasMobile');
    const isRegistered = await AsyncStorage.getItem('isRegistered');
    if (id && newUser) {
      if (newUser === 'true') {
        setLoading(false)
        setTimeout(() => {
          if (userType == 'Client') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Register' }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'ArtistLogin',
                  params: {
                    hasMobile: hasMobile,
                  },
                },
              ],
            });
          }
        }, 2000);
      } else if (newUser === 'false') {
        setTimeout(async () => {
          setLoading(false)
          if (userType == 'Client') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home', params: { guestUser: false } }],
            });
          } else {
            if (isRegistered) {

              console.log('Artist id >>>>', id)

              const response = await axiosInstance.get(`/get-artistdetails?artistId=${id}`);
              const data = response?.data?.data || "";
              updateUser({
                firstName: data.firstName,
                lastName: data.lastName,
                mobile: data?.mobile,
                email: data.email,
                userType: 'Artist',
              });

              if (data && data?.isApproved == 1) {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: screenNames.ARTIST_HOME,
                      params: {
                        hasMobile: hasMobile,
                      },
                    },
                  ],
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'ApplicationReviewPage',
                      params: {
                        hasMobile: hasMobile,
                      },
                    },
                  ],
                });
              }

            } else {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'ArtistLogin',
                    params: {
                      hasMobile: hasMobile,
                    },
                  },
                ],
              });
            }
          }
        }, 2000);
      }
    } else if (guest == "true") {
      dispatch({ type: IS_GUEST, payload: true })
      setLoading(false)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home', params: { guestUser: true } }],
      });
    } else {
      setTimeout(() => {
        setLoading(false)
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
        //navigation.navigate('Slider');
      }, 1500);
    }
  }


  const handleNext = async () => {

    if (btnText == "Learn More") {
      if (swiperRef.current) {
        swiperRef.current.scrollBy(1, true); // Scroll forward by one slide
      }
    } else {
      setLoading(true)
      const guest = await AsyncStorage.getItem('guestUser');
      console.log('guest >>>>', guest)
      const id = await AsyncStorage.getItem('id');
      const newUser = await AsyncStorage.getItem('isNewUser');
      const userType = await AsyncStorage.getItem('userType');
      const hasMobile = await AsyncStorage.getItem('hasMobile');
      const isRegistered = await AsyncStorage.getItem('isRegistered');
      if (id && newUser) {
        if (newUser === 'true') {
          setTimeout(() => {
            setLoading(false)
            if (userType == 'Client') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Register' }],
              });
            } else {

              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'ArtistLogin',
                    params: {
                      hasMobile: hasMobile,
                    },
                  },
                ],
              });
            }
          }, 2000);
        } else if (newUser === 'false') {
          setTimeout(async () => {
            setLoading(false)
            if (userType == 'Client') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home', params: { guestUser: false } }],
              });
            } else {
              if (isRegistered) {

                console.log('Artist id >>>>', id)

                const response = await axiosInstance.get(`/get-artistdetails?artistId=${id}`);
                const data = response?.data?.data || "";
                updateUser({
                  firstName: data.firstName,
                  lastName: data.lastName,
                  mobile: data?.mobile,
                  email: data.email,
                  userType: 'Artist',
                });

                if (data && data?.isApproved == 1) {
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: screenNames.ARTIST_HOME,
                        params: {
                          hasMobile: hasMobile,
                        },
                      },
                    ],
                  });
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'ApplicationReviewPage',
                        params: {
                          hasMobile: hasMobile,
                        },
                      },
                    ],
                  });
                }

              } else {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'ArtistLogin',
                      params: {
                        hasMobile: hasMobile,
                      },
                    },
                  ],
                });
              }
            }
          }, 2000);
        }
      } else if (guest == "true") {
        dispatch({ type: IS_GUEST, payload: true })
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home', params: { guestUser: true } }],
        });
      } else {
        setTimeout(() => {
          setLoading(false)
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
          //navigation.navigate('Slider');
        }, 1500);
      }
    }

  }


  const BeforeTextComponent = () => {
    return (
      <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
        <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
        <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
      </View>
    )
  }

  const BeforeImageComponent = ({ image1, image2 }) => {
    return (
      <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
        <View style={[styles.beforeContainerStyle, { marginLeft: '2%' }]} >

          <Image source={image1} style={styles.beforeImgStyle} />
        </View>
        <View style={[styles.beforeContainerStyle, { marginLeft: '5%' }]} >

          <Image source={image2} style={styles.beforeImgStyle} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>

      <Loader loading={loading} />


      {/* Skip link */}
      {hideSkip && (
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipLink}
          testID="skipButton"
          nativeID="skipButton"
          accessibilityLabel="skipButton">
          <Text style={styles.skipLinkText}>Skip</Text>
        </TouchableOpacity>
      )}



      <Swiper
        style={styles.wrapper}
        ref={swiperRef}
        showsButtons={false}
        autoplay={true}
        loop={false}
        index={0}
        autoplayTimeout={6}
        onIndexChanged={index => indexChangeHandler(index)}
        dotColor={"#666"}
        activeDotColor={"#000"}
        paginationStyle={{ bottom: 0 }}>
        <ScrollView contentContainerStyle={styles.cardContainer}>
          <View style={styles.card}>
            <Image
              source={require('../../src/assets/image1.jpeg')}
              style={styles.cardImage}
            />
            <Text style={[styles.heading, { fontSize: serviceHeadingFontSize }]}>
              Flawless Hair Styles
            </Text>
            <View style={{ paddingHorizontal: 35 }}>
              <Text style={[styles.paragraph, { fontSize: serviceTypeFontSize }]}>
                Whether you're prepping for a special occasion or simply want to
                elevate your everyday look, TF has something for every
                hair type and preference. Our expertly curated looks are
                tailored to suit your unique personality, style, and hair
                texture.
              </Text>
            </View>

            {/* <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Learn More</Text>
            </TouchableOpacity> */}
          </View>
        </ScrollView>

        <ScrollView contentContainerStyle={styles.cardContainer}>
          <View style={styles.card}>
            <Image
              source={require('../../src/assets/slider2.jpg')}
              style={styles.cardImage}
            />
            <Text style={[styles.heading, { fontSize: serviceHeadingFontSize }]}>
              Flawless Makeup Looks
            </Text>
            <View style={{ paddingHorizontal: 35 }}>
              <Text style={[styles.paragraph, { fontSize: serviceTypeFontSize }]}>
                Experience the joy of experimenting with makeup in a whole new
                way. With just a few swipes, you can explore a treasure trove of
                stunning looks, each designed to accentuate your beauty and
                elevate your confidence.
              </Text>
            </View>
            {/* <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Learn More</Text>
            </TouchableOpacity> */}
          </View>
        </ScrollView>

        <ScrollView contentContainerStyle={styles.cardContainer}>
          <View style={styles.card}>
            <Image
              source={require('../../src/assets/image3.jpg')}
              style={styles.cardImage}
            />
            <Text style={[styles.heading, { fontSize: serviceHeadingFontSize }]}>
              What We Do
            </Text>
            <View style={{ paddingHorizontal: 35 }}>
              <Text style={[styles.paragraph, { fontSize: serviceTypeFontSize }]}>
                At TF, we're committed to revolutionizing the beauty
                landscape by offering personalized recommendations and curated
                collections tailored to your unique features and style. Our team
                of experts scours the latest trends and timeless classics to
                inspire and delight, ensuring you feel supported, celebrated,
                and empowered every step of the way.
              </Text>
            </View>
            {/* <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Learn More</Text>
            </TouchableOpacity> */}
          </View>
        </ScrollView>

        <ScrollView contentContainerStyle={[styles.cardContainer]}>
          <ScrollView
            style={{
              position: 'absolute',
              top: 25,
              width: width,
              height: height / 1.15,

            }}
            contentContainerStyle={{
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}>
            <View style={{ paddingHorizontal: 30, paddingTop: 40 }}>
              <View
                style={{
                  flex: 1,

                  // flexDirection: 'row',
                  // justifyContent: 'space-between',
                  marginRight: 0,

                }}>
                <View style={{ width: SIZES.cardWidth, alignItems: 'center', justifyContent: 'center' }} >
                  <Image
                    source={require('../assets/ladyGroup.jpg')}
                    style={{
                      height: height / 1.8,
                      width: SIZES.cardWidth,
                      alignSelf: 'center',

                      borderRadius: 20,
                    }}
                  // resizeMode="contain"
                  />

                </View>

                <View style={{ height: height / 4.2, paddingBottom: Platform.OS == "ios" ? ms(40) : ms(25), alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.paragraph, { fontSize: 18, }]}>
                    Hair & Makeup Services On-Demand
                  </Text>
                  <Text style={[styles.paragraph, { fontSize: 18, marginTop: mvs(5) }]}>
                    Your Time. Your Place. Your Look.
                  </Text>
                </View>
              </View>


            </View>
          </ScrollView>
        </ScrollView>

        {/* Before 1 */}
        {/* <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>

         
          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

        
          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeContainerStyle, { marginLeft: '2%' }]} >

              <Image source={images.b1} style={styles.beforeImgStyle} />
            </View>
            <View style={[styles.beforeContainerStyle, { marginLeft: '5%' }]} >

              <Image source={images.a1} style={styles.beforeImgStyle} />
            </View>
          </View>

       
          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

        

           <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeContainerStyle, { marginLeft: '2%' }]} >

              <Image source={images.b2} style={styles.beforeImgStyle} />
            </View>
            <View style={[styles.beforeContainerStyle, { marginLeft: '5%' }]} >

              <Image source={images.a2} style={styles.beforeImgStyle} />
            </View>
          </View>


        </ScrollView> */}

        {/* Before 2 */}
        {/* <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>
          

          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeContainerStyle, { marginLeft: '2%' }]} >

              <Image source={images.b3} style={styles.beforeImgStyle} />
            </View>
            <View style={[styles.beforeContainerStyle, { marginLeft: '5%' }]} >

              <Image source={images.a3} style={styles.beforeImgStyle} />
            </View>
          </View>

          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeContainerStyle, { marginLeft: '2%' }]} >

              <Image source={images.b4} style={styles.beforeImgStyle} />
            </View>
            <View style={[styles.beforeContainerStyle, { marginLeft: '5%' }]} >

              <Image source={images.a4} style={styles.beforeImgStyle} />
            </View>
          </View>



        </ScrollView> */}

        {/* Before 3*/}
        {/* <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>

          
          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeContainerStyle, { marginLeft: '2%' }]} >

              <Image source={images.b5} style={styles.beforeImgStyle} />
            </View>
            <View style={[styles.beforeContainerStyle, { marginLeft: '5%' }]} >

              <Image source={images.a5} style={styles.beforeImgStyle} />
            </View>
          </View>


        </ScrollView> */}

        {/* //Before after seperate screens
        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.b1} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.a1} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.b2} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.a2} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.b3} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.a3} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>
        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.b4} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.a4} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>
        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >Before</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.b5} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: mvs(30), alignItems: 'center', paddingBottom: mvs(40) }}>


          <View style={[GlobalStyles.rowCenterSpaceBetween, { width: SIZES.cardWidth - 20, paddingTop: mvs(30) }]} >
            <Text style={[GlobalStyles.txtM16Dark, {}]} >After</Text>
          </View>

          <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth - 20, alignSelf: 'center' }]} >
            <View style={[styles.beforeScrollContainerStyle]} >
              <Image source={images.a5} style={styles.beforeScrollImgStyle} />
            </View>

          </View>

        </ScrollView>
        */}

      </Swiper>

      <View
        style={{
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          testID="getStartedButton"
          nativeID="getStartedButton"
          accessibilityLabel="getStartedButton">
          <Text style={styles.buttonText}>{btnText}</Text>
        </TouchableOpacity>
      </View>



    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipLink: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 999, // Ensure it's above other content
  },
  skipLinkText: {
    fontSize: 16,
    color: 'black',
    textDecorationLine: 'underline',
  },
  wrapper: {
    backgroundColor: 'white',
    // Add any additional styles you want for the Swiper wrapper
  },
  cardContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    top: 20,
    height: height / 1.25,
    width: width,
  },
  cardImage: {
    width: width / 1.05,
    height: height / 2.5,
    marginTop: 30,
    marginBottom: 20,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },
  heading: {
    color: '#333', // Replace with your desired color or use a color variable
    textAlign: 'center',
    fontFamily: FONTS.regular,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 32, // Adjust line height as needed
    letterSpacing: 0.54,
    marginBottom: 12,
  },
  paragraph: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 20.23,
  },
  button: {
    backgroundColor: 'black', // Set button background color to black
    padding: 15,
    borderRadius: 50,
    width: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  buttonText: {
    color: 'white', // Set button text color to white
    textAlign: 'center',
    fontWeight: 'bold',
  },
  beforeContainerStyle: {
    height: mvs(230),
    width: '44%',
    alignItems: 'flex-end',
    resizeMode: 'contain',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.input,

  },
  beforeImgStyle: {
    height: mvs(230),
    width: '100%',
    resizeMode: 'cover',
    borderRadius: 10
  },
  beforeScrollContainerStyle: {
    height: height / 1.5,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.input,

  },
  beforeScrollImgStyle: {
    height: height / 1.5,
    width: '100%',
    resizeMode: 'cover',
    borderRadius: 10
  },
});

export default Slider;
