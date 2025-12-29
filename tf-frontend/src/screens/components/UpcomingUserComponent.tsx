import { View, Text, Image, TouchableOpacity, FlatList, Alert, Platform } from 'react-native'
import React, { useState } from 'react'
import { styles } from './style'
import { GlobalStyles } from '../../style/GlobalStyles'
import { ms, mvs } from 'react-native-size-matters'
import images from '../../constants/images'
import { COLORS, SIZES } from '../../style/theme'
import CommonSvg from '../../components/CommonSvg'
import moment from 'moment'
import { dateTimeFormat } from '../../services/utils'
import { bookingStatusEnums, bookingType } from '../../constants/enums'
import { useNavigation } from '@react-navigation/native'
import screenNames from '../../constants/screenNames'
import Icon from 'react-native-vector-icons/AntDesign'
import Icons from 'react-native-vector-icons/MaterialCommunityIcons'
import { showToast } from '../../components/Toast'

type Props = {
  data?: any,
  handleDeleteBooking?: (booking, item, index) => void
  handleUpcomingAddWishlistArtist?: (booking: any, isAdded: boolean) => void,
  handleProfileClick?: (data: any) => void,
  handleCall?: (data: any) => void,
  bookType: string
}


const UpcomingUserComponent = ({ data, bookType, handleProfileClick, handleDeleteBooking, handleCall, handleUpcomingAddWishlistArtist }: Props) => {

  const navigation = useNavigation<any>();

  const [selectedItem, setSelectedItem] = useState({})
  const [selectedBooking, setSelectedBooking] = useState({})
  const [selectedIndex, setSelectedIndex] = useState(0)



  const canCancelBooking = (bookingTime) => {
    const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
    const currentDateTime = moment(); // Get current time
    const hoursDifference = bookingDateTime.diff(currentDateTime, 'hours'); // Get difference in hours
    // console.log('hoursDifference', hoursDifference)
    return hoursDifference < 24;
  };

  const CheckBookingTime = (bookingTime) => {
    const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
    const currentDateTime = moment(); // Get current time
    const minsDifference = bookingDateTime.diff(currentDateTime, 'minutes'); // Get difference in hours

    return minsDifference < 11 && minsDifference > 0;
  };

  const CheckBookingTimeForCall = (bookingTime) => {
    const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
    const currentDateTime = moment(); // Get current time
    const minsDifference = bookingDateTime.diff(currentDateTime, 'minutes'); // Get difference in hours
    return minsDifference < 11 && minsDifference > 0;
  };

  const CheckBookingTimePassedTwoHoursForChat = (bookingTime) => {
    const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
    const currentDateTime = moment(); // Get current time
    // const hoursDifference = currentDateTime.diff(bookingDateTime, 'hours'); // Get difference in hours
    // console.log('hoursDifference bookingTime>>>>', hoursDifference,bookingTime);
    // return hoursDifference >= 2&& hoursDifference > 0;

    const minsDifference = bookingDateTime.diff(currentDateTime, 'minutes'); // Get difference in hours
    console.log('minsDifference. bookingTime>>>>', minsDifference,bookingTime)
    return minsDifference <120;
  };

  const handleCancelBooking = (item, index, booking) => {

    // Alert.alert("Booking Alert", "Booking cannot be cancelled as the ETA of artist is less than 24 hours.")

    if (canCancelBooking(item?.bookingTime)) {
      Alert.alert("Booking Alert", "Booking cannot be cancelled as the ETA of artist is less than 24 hours.")
    } else {
      setSelectedItem(item)
      setSelectedIndex(index)
      Alert.alert(
        "Booking Alert",
        // "You will be charged as the cancellation deadline has passed. Do you still wish to cancel?",
        "If you cancel the appointment only 50% of your booking amount will be refunded. Are you sure you want to cancel the booking ?",
        [
          {
            text: "No",
            onPress: () => console.log("No Pressed"),
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: () => handleDeleteBooking(booking, item, index),

          },
        ],
        { cancelable: false }
      );
    }
  }

  const virtualDateFormat = (item: any) => {

    // Format date (ISO format preserved)
    const formattedDate = moment(item.training_date, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    // Format time
    const formattedTime = moment(item.training_time, 'HH:mm:ss').format('hh:mm a');

    return dateTimeFormat(`${formattedDate}, ${formattedTime}`)

  }

  const returnAmt = (item, booking) => {
    const bookingFee = item?.bookingType == "now" ? 35 : 0

    const travelFee = parseInt(item?.travelFee) || 0
    // const travelFee = parseInt(item?.travelFee)/booking?.bookingItems?.length||0

    return (parseInt(item?.price) * parseInt(item?.quantity)) +
      (parseInt(item?.addOnAmount || 0) * parseInt(item?.quantity)) +
      (parseInt(item?.longHairAmount || 0) * parseInt(item?.quantity)) +
      travelFee + bookingFee
  }

  const BookingCard = ({ booking, item, index }) => {

    const artist = item?.artists;

    return (
      <View key={`${index}`} style={styles.cardOuterContainer} >
        <View style={[styles.cardContainer, {
          backgroundColor: CheckBookingTime(item?.bookingTime) ? COLORS.purple : COLORS.white,
          width: SIZES.cardWidth - ms(10), height: CheckBookingTime(item?.bookingTime) ? Platform.OS == 'ios' ? ms(135) : ms(145) : ms(115)
        }]} >
          <View style={[GlobalStyles.rowCenterSpaceBetween, {
            width: '100%',
            height: CheckBookingTime(item?.bookingTime) ? '80%' : '100%', borderBottomLeftRadius: CheckBookingTime(item?.bookingTime) ? 0 : 10,
          }]} >
            <Image source={{ uri: item?.imageUrl }} style={styles.bookingImg} resizeMode='contain' />
            <View style={styles.infoView} >
              <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                <Text style={[GlobalStyles.txtSB14Dark, {}]} >{item?.serviceName}<Text style={[GlobalStyles.txtM12Dark, {}]} >{parseInt(item?.addOnAmount) > 0 ? " (Styling Blowout)" : ""}</Text></Text>
                <Text style={[GlobalStyles.txtSB14Dark, {}]} >${returnAmt(item, booking)}</Text>
              </View>

              <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
                <Text style={[GlobalStyles.txtM14Dark]}>#{item?.booking_id?.slice(-4)}</Text>

                <Text style={[GlobalStyles.txtSB14Dark, {
                  color: item.artist == 'Silver'
                    ? '#939393'
                    : item.artist == 'Gold'
                      ? '#ee9313'
                      : item.artist == 'Elite'
                        ? 'black'
                        : '#304cc0'
                }]} >{item?.artist?.toUpperCase()}</Text>
              </View>

              <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: 2 }]} >
                <View style={[GlobalStyles.rowCenter, {}]} >
                  <Image
                    source={images.calendar}
                    style={{ width: 14, height: 14, alignSelf: 'center' }}
                  />
                  <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{dateTimeFormat(item?.bookingTime)}</Text>
                </View>
                {
                  // true?
                  CheckBookingTimeForCall(item?.bookingTime) &&
                  <TouchableOpacity
                    onPress={() => handleCall(item?.artists)}
                    style={[GlobalStyles.button, {
                      backgroundColor: COLORS.green, width: ms(60), ...GlobalStyles.rowCenter, borderWidth: 0, height: ms(25)
                    }]} >
                    <CommonSvg.phone />
                    <Text style={[GlobalStyles.txtR12Dark, { marginLeft: 5 }]} >Call</Text>
                  </TouchableOpacity>
                }

              </View>
              <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: 5 }]} >
                {
                  item?.artists == null ?
                    <View style={[GlobalStyles.rowCenter, { width: '60%' }]} >
                    </View>
                    :
                    <View style={[GlobalStyles.rowCenter, { width: '60%' }]} >
                      {
                        artist?.profileImage ?
                          <TouchableOpacity activeOpacity={0.8} onPress={() => handleProfileClick(item?.artists)}>
                            <Image source={{ uri: artist?.profileImage }} style={{ height: 25, width: 25, borderRadius: 13 }} />
                          </TouchableOpacity>
                          :

                          <CommonSvg.userBooking />
                      }
                      <TouchableOpacity activeOpacity={0.8} style={{ marginHorizontal: 5, maxWidth: '60%' }} onPress={() => handleProfileClick(item?.artists)}>

                        <Text style={[GlobalStyles.txtL12Dark, {}]} numberOfLines={1}>{artist?.firstName}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        if (item?.artists == null) {
                          showToast("Artists not found")
                          return;
                        }
                        if (item?.isWishlist) {
                          handleUpcomingAddWishlistArtist(item, false)
                        } else {
                          handleUpcomingAddWishlistArtist(item, true)
                        }
                      }}>

                        {
                          item?.isWishlist ?
                            <Icon name="heart" size={20} color={COLORS.red} />
                            :
                            <Icon name="hearto" size={20} color={COLORS.red} />
                        }
                      </TouchableOpacity>
                    </View>
                }

                <View style={[GlobalStyles.rowCenter, {}]} >



                  {
                    item?.artists ?
                      <>
                        {
                          // true?
                          (CheckBookingTime(item?.bookingTime) || CheckBookingTimePassedTwoHoursForChat(item?.bookingTime)) ?
                            <TouchableOpacity style={[GlobalStyles.button, {
                              marginLeft: Platform.OS == "ios" ? 0 : ms(10),
                              backgroundColor: COLORS.darkTxt, width: ms(60), ...GlobalStyles.rowCenter, borderWidth: 0, height: ms(25)
                            }]}
                              onPress={() => {
                                if (item?.artists) {
                                  const bookingTime = item?.bookingTime;
                                  // if (CheckBookingTime(bookingTime)&&CheckBookingTimePassedTwoHoursForChat(bookingTime)) {
                                  navigation.navigate(screenNames.USER_CHAT, { data: item });
                                  // } else if (CheckBookingTimePassedTwoHoursForChat(bookingTime)) {
                                  //   showToast("You cannot chat as your booking time has exceeded by 2 hours.");
                                  // } else {
                                  //   showToast("You can chat before 10 minutes are left in the booking time.");
                                  // }
                                } else {
                                  showToast("Artists not found.")
                                }

                              }}
                            >
                              <CommonSvg.chat />
                              <Text style={[GlobalStyles.txtR12Dark, { marginLeft: 5, color: COLORS.white }]} >Chat</Text>
                            </TouchableOpacity>
                            :
                            <View />
                        }
                      </>
                      :
                      <View/>
                }




                </View>
              </View>
            </View>
          </View>
               
          {
     
            CheckBookingTime(item?.bookingTime) &&
            <TouchableOpacity
              // disabled={item?.rating?true:false} 
              onPress={() => {
                navigation.navigate(screenNames.TRACK_ARTIST, { artist })
              }} activeOpacity={0.8} style={[styles.bookingReviewContainer, { backgroundColor: COLORS.lightGreen }]} >
              <Text style={[GlobalStyles.txtR12Dark, { marginRight: ms(10) }]} >Track Artist</Text>
            </TouchableOpacity>
          }

        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleCancelBooking(item, index, booking)}>
          {/* <CommonSvg.deleteBooking /> */}
          <Icons name='close' size={25} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    )
  }

  const VirtualCard = ({ item, index }) => {
    return (
      <View key={`${index}`} style={styles.cardContainer} >

        <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '100%' }]} >
          <Image source={{ uri: item?.imgUrl }} style={styles.bookingImg} resizeMode='contain' />
          <View style={{ flex: 1, alignSelf: 'flex-start', paddingVertical: mvs(5), paddingHorizontal: ms(10) }} >
            <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
              <Text style={[GlobalStyles.txtSB14Dark, {}]} >{item?.service_name}</Text>
              <Text style={[GlobalStyles.txtSB14Dark, {}]} >${item.price}</Text>
            </View>

            <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: 5 }]} >
              <View style={[GlobalStyles.rowCenter, {}]} >
                <Image
                  source={images.calendar}
                  style={{ width: 14, height: 14, alignSelf: 'center' }}
                />
                <Text style={[GlobalStyles.txtL12Dark, { marginLeft: ms(5) }]} >{virtualDateFormat(item)}</Text>
              </View>
            </View>
          </View>

        </View>

      </View>
    )
  }

  if (bookType == bookingType.VIRTUAL) {

    return (

      <>

        <FlatList
          data={data}
          keyExtractor={(item) => `virtual-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{}}
          ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
            <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
          </View>}
          renderItem={({ item: booking, index }) => {
            return (
              <>
                <VirtualCard item={booking} index={index} />
              </>
            )
          }}
        />

      </>
    )

  } else {

    return (
      <>
        <FlatList
          data={data?.sort((a, b) =>
            moment(b.updatedAt, 'YYYY-MM-DD, hh:mm A').diff(
              moment(a.updatedAt, 'YYYY-MM-DD, hh:mm A'),
            ),
          )?.filter((b: any) => b.status == bookingStatusEnums.CONFIRMED
            && b.totalAmount <= b.amountPaid
          ) || []}
          // data={data}
          keyExtractor={(item, index) => `upcoming-${index}`}
          showsVerticalScrollIndicator={false}
          // contentContainerStyle={{paddingBottom:mvs(30)}}
          ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
            <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
          </View>}
          renderItem={({ item: booking, index }) => {
            return (
              <>

                {booking.bookingItems?.map(item => {
                  if (item?.serviceId) {
                    return (
                      <BookingCard
                        booking={booking}
                        item={item}
                        index={index}></BookingCard>
                    )
                  } else {
                    return null
                  }
                })}
                {/* {booking.bookingItems?.map(item => (
                <BookingCard
                  booking={booking}
                  item={item}
                  index={index}></BookingCard>
              ))} */}
              </>
            )
          }}
        />
        {/* {
       data&& data.filter((b: any) => b.status == bookingStatusEnums.ACCEPTED)
          .map((booking: any, index: any) => (
            <>

              {booking.cartData?.now.map(item => (
                <BookingCard
                  booking={booking}
                  item={item}
                  index={index}></BookingCard>
              ))}
              {booking.cartData?.later.map(item => (
                <BookingCard
                  booking={booking}
                  item={item}
                  index={index}></BookingCard>
              ))}
            </>
          ))
      } */}




      </>
    )
  }
}

export default UpcomingUserComponent