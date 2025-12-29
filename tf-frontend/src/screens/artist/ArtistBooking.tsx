import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import TopBar from '../../components/TopBar';
import { COLORS, FONTS, SIZES } from '../../style/theme';
import { ms, mvs } from 'react-native-size-matters';
import PendingComponent from './PendingComponent';
import ArtistBottomBar from '../../components/ArtistBottomBar';
import screenNames from '../../constants/screenNames';
import CommonSvg from '../../components/CommonSvg';
import { GlobalStyles } from '../../style/GlobalStyles';
import { styles } from './style';
import OngoingAndUpcomingComponent from './OngoingAndUpcomingComponent';
import CompletedAndRejectedComponent from './CompletedAndRejectedComponent';
import axiosInstance from '../../services/axiosInterceptor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingStatusEnums } from '../../constants/enums';
import { showToast } from '../../components/Toast';
import { AddRatingModal, Loader } from '../components';
import UpcomingComponent from './UpcomingComponent';
import { useRoute } from '@react-navigation/native';
import { RefreshControl } from 'react-native';
// Notifications are proxied to backend; client must not generate service-account JWTs.
import UserContext from '../UserContext';
import CustomImageView from '../../components/CustomImageView';

type Props = {}

// fcmService removed from client bundle

const ArtistBooking = ({ navigation }) => {

  const routeIndex = useRoute()?.params?.index || 0;

  const { user } = useContext(UserContext);

  const [routes] = useState([
    // { key: 'pending', title: 'Pending' },
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'ongoing', title: 'Ongoing' },
    { key: 'completed', title: 'Completed' },
    { key: 'cancelled', title: 'Cancelled' },
  ]);
  const [selectedParentIndex, setSelectedParentIndex] = useState(0);
  const [childLists, setChildLists] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addRatingModal, setAddRatingModal] = useState(false)
  const parentFlatListRef = useRef<FlatList>();
  const scrollViewRef = useRef<ScrollView>();
  const windowWidth = Dimensions.get('window').width;
  const [selectedBookingItem, setSelectedBookingItem] = useState<any>({})
  const [selectedBooking, setSelectedBooking] = useState<any>({})

  const [serviceImgModal, setServiceImgModal] = useState(false)
  const [serviceImgSrc, setServiceImgSrc] = useState("")

  useEffect(() => {

    // const subscribe = navigation.addListener('focus', () => {
    setLoading(true)
    getData();
    scrollUsingStatus(routeIndex)
    // })

    return () => {
      // subscribe;
    }
  }, [])


  const scrollUsingStatus = (routeIndex: any) => {
    setTimeout(() => {
      setSelectedParentIndex(routeIndex)
    }, 700);
    setTimeout(() => {
      scrollViewRef.current.scrollTo({ x: routeIndex * windowWidth, animated: true });
      parentFlatListRef.current?.scrollToIndex({
        animated: true,
        index: routeIndex,
        viewPosition: 0.5
      })
    }, 700);
  }


  const getData = async () => {


    try {
      const [upcomingData, completedData, cancelledData] = await Promise.all([
        getBookingsByStatusAndType(bookingStatusEnums.CONFIRMED, ""),
        // getBookingsByStatusAndType(bookingStatusEnums.ACCEPTED, ""),
        // getBookingsByStatusAndType(bookingStatusEnums.ACCEPTED, ""),
        getBookingsByStatusAndType(bookingStatusEnums.COMPLETED, ""),
        getBookingsByStatusAndType(bookingStatusEnums.CANCELLED, ""),
      ])
      // const data=[];
      // data[0]=pendingData;
      // data[1]=ongoingData;
      // data[2]=upcomingData;
      // data[3]=completedData;
      console.log('upcomingData >>>>>', JSON.stringify(upcomingData))
      // const filteredData=await getUpcomingFilterData(upcomingData)
      // console.log('filteredData >>>>>', JSON.stringify(filteredData))
      // console.log('completedData artist >>>>>', JSON.stringify(completedData))
      setLoading(false)
      const data = [[upcomingData ? upcomingData : []], [upcomingData], [completedData], [cancelledData]]
      // console.log('pendingData >>>>', JSON.stringify(data))
      setChildLists(data)

    } catch (error) {
      setLoading(false)
      setChildLists([[], [], [], [], []])
      console.log('error', error)
    }

  }

  const getUpcomingFilterData = (data: any) => {

  }

  const getBookingsByStatusAndType = async (status: any, type?: any) => {
    try {
      const id = await AsyncStorage.getItem("id");
      // console.log('`/get-artistbooking?artistId=${id}&status=${status}`', `/get-artistbooking?artistId=${id}&status=${status}`)
      const response = await axiosInstance.get(`/get-artistbooking?artistId=${id}&bookingitemstatus=${status}`)
      //  console.log('response', response)
      if (response?.status == 200) {
        return response?.data?.data || []
      } else {
        return []
      }
    } catch (error) {

    }
  }

  const handleChangeBookingStatus = async (item?: any, status?: any, booking?: any) => {

    try {

      setLoading(true)
      const id = await AsyncStorage.getItem("id");

      const request = {
        "artistId": id,
        "bookingItemId": item?.id,
        "status": status //completed, cancelled
      }

      const userResponse = await axiosInstance.get(`/get-userdetails?userId=${item?.userId}`)
      console.log('get user >>>>', userResponse.data.data[0]);
      const userData = userResponse.data.data[0];

      console.log('handleChangeBookingStatus request >>>', request)
      const response = await axiosInstance.post(`/artist-bookingitem-status-change`, request);
      console.log('handleChangeBookingStatus response?.data >>>>', response?.data)



      if (status == bookingStatusEnums.CANCELLED) {
        const sendData = {
          name: user?.firstName,
          time: item?.bookingTime
        }
        handleNotificationBookingDelete(userData?.deviceDetail[0]?.deviceToken, sendData)
      }
      getData()
      showToast(`Booking is ${status}.`)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log('error', error)
    }
  }

  const handleNotificationBookingDelete = async (deviceToken: any, client: any) => {
    const receiver = deviceToken;
    if (!receiver) return;
    try {
      await axiosInstance.post('/send-notification', {
        receiver,
        title: 'Booking Cancelled!',
        body: `${client?.name} has cancelled your booking on ${client?.time}. Your payment amount will be refunded soon.`,
        data: { customData: '', userType: 'Artist' },
      });
    } catch (err) {
      console.error('handleNotificationBookingDelete error >>>', err);
    }
  }

  const returnTabColor = (item: any) => {

    switch (item?.key) {

      case "upcoming":
        return COLORS.yellow
      case "ongoing":
        return COLORS.black
      case "completed":
        return COLORS.green
      case "cancelled":
        return COLORS.red
      default:
        break;
    }

  }

  const callDevice = async (payload: any) => {
    await axiosInstance.post(`/device/create/call`, payload).then((res) => {
      console.log('Device call >>>>', res.data);
      showToast("Call request sent. We’ll be calling shortly. ");
    }).catch((err) => {
      showToast("Insufficient funds. Please try after some time.")
      console.log('Device call error >>>>', err);
    });
  };


  const getCallDetails = async (bookingData: any) => {

    try {
      const id = bookingData?.userId;
      const artistId = bookingData?.artistId;
      if (id) {
        await axiosInstance.get(`/get-userdetails?userId=${id}`).then(async (res) => {
          console.log('get user >>>>', res.data.data[0]);
          const userData = res.data.data[0];
          const artistResponse = await axiosInstance.get(`/get-artistdetails?artistId=${artistId}`);
          const artistData = artistResponse?.data?.data || "";
          const payload = {
            "from": "+" + userData?.countryCode + userData?.phone,
            "to": "+" + artistData?.countryCode + artistData?.mobile
            // "to":  "+919657795194"
          }
          console.log('Calldata >>>', payload);
          callDevice(payload);
          // setUserDetail(res?.data?.data[0])
        }).catch((err) => {
          console.log('get user error >>>>', err);
        });
      } else {
        showToast("User mobile number not available!")
      }
    } catch (error) {

    }

  }

  const onChildScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    if (index !== selectedParentIndex) {

      setSelectedParentIndex(index);

      setTimeout(() => {
        parentFlatListRef.current?.scrollToIndex({
          animated: true,
          index: index,
          viewPosition: 0.5
        })
      }, 200);
    }
  };

  const onRefresh = () => {
    //TODO: CALL APIS BY TYPE
    getData()
  }

  const renderChildItem = ({ item }) => {
    const componentMap = {
      // 0: <PendingComponent data={item}
      //   handleChangeBookingStatus={(booking, status) => {
      //     handleChangeBookingStatus(booking, status)
      //   }}
      // />,
      0: <UpcomingComponent
        data={item}
        type="Upcoming"
        handleChangeBookingStatus={(booking, status, data) => {
          handleChangeBookingStatus(booking, status, data)
        }}
        handleServiceImageOpen={(img) => {
          setServiceImgSrc(img)
          setServiceImgModal(true)
        }}
        handleCall={(data) => {

          console.log('data', data)

          getCallDetails(data)

          return


        }}

      />,
      1: <OngoingAndUpcomingComponent data={item} type="Ongoing"
        handleChangeBookingStatus={(booking, status, data) => {
          handleChangeBookingStatus(booking, status, data)
        }}
        handleServiceImageOpen={(img) => {
          setServiceImgSrc(img)
          setServiceImgModal(true)
        }}
      />,
      2: <CompletedAndRejectedComponent data={item}
        type={bookingStatusEnums.COMPLETED}
        handleReview={(item1, booking) => {
          console.log('item1', item1)
          console.log('booking', booking)
          setSelectedBookingItem(item1)
          setSelectedBooking(booking)
          setAddRatingModal(true)
        }}
        handleServiceImageOpen={(img) => {
          setServiceImgSrc(img)
          setServiceImgModal(true)
        }}
      />,
      3: <CompletedAndRejectedComponent data={item} type={bookingStatusEnums.CANCELLED}
        handleServiceImageOpen={(img) => {
          setServiceImgSrc(img)
          setServiceImgModal(true)
        }}
      />,
    };
    return componentMap[selectedParentIndex] || null;
  };

  const renderParentItem = ({ item, index }) => (

    <TouchableOpacity
      disabled={selectedParentIndex == index}
      onPress={() => {
        setTimeout(() => {
          setSelectedParentIndex(index)
        }, 200);
        scrollViewRef.current.scrollTo({ x: index * windowWidth, animated: true });
        parentFlatListRef.current?.scrollToIndex({
          animated: true,
          index: index,
          viewPosition: 0.5
        })
      }}
      style={[styles.typesBtn, {
        backgroundColor: COLORS.white,
      }]} >
      <Text style={[styles.label, {
        color: selectedParentIndex == index ? returnTabColor(item) : COLORS.greyTxt,
        fontFamily: selectedParentIndex == index ? FONTS.medium : FONTS.light
      }]} >{item.title}</Text>
      <View style={[styles.indicator, { backgroundColor: selectedParentIndex == index ? returnTabColor(item) : COLORS.white }]} />
    </TouchableOpacity>

  );


  const changeNavigation = page => {

    navigation.navigate(page);
  };

  return (
    <View style={{ backgroundColor: '#FFF', flex: 1 }}>

      <Loader loading={loading} />

      <TopBar navigation={navigation} />

      <View style={styles.headerTitleView} >
        <TouchableOpacity style={styles.backBtn} onPress={() => changeNavigation(screenNames.ARTIST_HOME)} >
          <CommonSvg.back />
        </TouchableOpacity>

        <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >My Booking</Text>
      </View>

      <View style={{ flexGrow: 1, backgroundColor: '#FFF' }}>

        <FlatList
          ref={parentFlatListRef}
          data={routes}
          renderItem={renderParentItem}
          // initialScrollIndex={selectedParentIndex}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScrollToIndexFailed={info => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              parentFlatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewOffset: 2,
                viewPosition: 0.1,
              });
            });
          }}
          style={{ flexGrow: 0, borderBottomWidth: 0.57, borderColor: COLORS.greyTxt, marginBottom: 5 }}
          contentContainerStyle={{ paddingTop: mvs(10), paddingLeft: ms(15) }}
        />

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          onScroll={onChildScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 1, }}
          contentContainerStyle={{ paddingBottom: mvs(200) }}
        >
          {childLists.map((childList, index) => (
            <View key={index} style={{ width: windowWidth }}>
              <FlatList
                data={childList}
                renderItem={renderChildItem}
                contentContainerStyle={{ paddingBottom: mvs(70) }}
                keyExtractor={(item, index) => `${index}`}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    onRefresh={onRefresh}
                    refreshing={false}
                  />
                }
                ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
                  <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
                </View>}
                ItemSeparatorComponent={() => <View style={{ marginTop: mvs(10) }} />}
              />
            </View>
          ))}
        </ScrollView>

        {
          addRatingModal &&
          <AddRatingModal
            visible={addRatingModal}
            visibleFunction={() => {
              setAddRatingModal(false)
            }}
            isEdited={false}
            data={{
              title: selectedBookingItem?.serviceName,
              name: selectedBooking?.user_firstName + " " + selectedBooking?.user_lastName,
              rate: parseInt(selectedBookingItem?.rating),
              how_ser: selectedBookingItem?.how_service,
              how_art: selectedBookingItem?.how_artist
            }}
            onSelect={(rate, data) => {

            }}
          />
        }

        {
          serviceImgModal &&

          <CustomImageView
            imageVisible={serviceImgModal}
            index={0}
            imgData={[{
              uri: serviceImgSrc
            }]}
            imageVisibleFunction={() => {
              setServiceImgModal(false)
              setServiceImgSrc("")
            }}
          />
        }

        {/* <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: '100%' }}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              indicatorStyle={styles.indicator}
              style={styles.tabBar}
              labelStyle={styles.label}
            />
          )}
        /> */}
      </View>
      <ArtistBottomBar navigation={changeNavigation} page={screenNames.ARTIST_BOOKING} />
    </View>
  )
}




export default ArtistBooking