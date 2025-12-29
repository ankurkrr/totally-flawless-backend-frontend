import { View, Text, Image, TouchableOpacity, FlatList, Platform } from 'react-native'
import React from 'react'
import { styles } from './style'
import { GlobalStyles } from '../../style/GlobalStyles'
import images from '../../constants/images'
import { COLORS } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import CommonSvg from '../../components/CommonSvg'
import CustomStarRating from '../../components/CustomStarRating'
import { dateTimeFormat } from '../../services/utils'
import { showToast } from '../../components/Toast'
import Icon from 'react-native-vector-icons/AntDesign'
import { bookingStatusEnums, bookingType } from '../../constants/enums'
import moment from 'moment'
import screenNames from '../../constants/screenNames'
import { useNavigation } from '@react-navigation/native'

type Props = {
  data?: any,
  handleAddGratuity?: (data: any, item: any, index: any) => void
  handleAddRating?: (data: any, item: any, index: any) => void,
  handleUpcomingAddWishlistArtist?: (booking: any, isAdded: boolean) => void,
  handleProfileClick?: (data: any) => void,
  bookType?: string
}

const CompletedUserComponent = ({ data, bookType, handleProfileClick, handleAddGratuity, handleAddRating, handleUpcomingAddWishlistArtist }: Props) => {


  const navigation = useNavigation<any>();

  const returnAmt = (item, booking) => {
    const bookingFee = item?.bookingType == "now" ? 35  : 0
    const travelFee = parseInt(item?.travelFee) || 0
    // const travelFee = parseInt(item?.travelFee) / booking?.bookingItems?.length || 0

    return (parseInt(item?.price) * parseInt(item?.quantity)) +
      (parseInt(item?.addOnAmount || 0) * parseInt(item?.quantity)) +
      (parseInt(item?.longHairAmount || 0) * parseInt(item?.quantity)) +
      travelFee + bookingFee
  }


  const CheckBookingTime = (bookingTime: any) => {
    const bookingDateTime = moment(bookingTime, 'YYYY-MM-DD, hh:mm A'); // Parse booking time
    const currentDateTime = moment(); // Get current time
    const minsDifference = bookingDateTime.diff(currentDateTime, 'minutes') > -61 ? 59 : bookingDateTime.diff(currentDateTime, 'minutes'); // Get difference in hours
    // console.log('minsDifference',bookingTime,bookingDateTime.diff(currentDateTime, 'minutes'), minsDifference,minsDifference >-60)
    return minsDifference > -60;
  };

  const checkChatBookingEnabled = (updatedAt: any) => {
    const localTime = moment.utc(updatedAt).local(); // Convert UTC to local time

    // console.log("Local Time >>>", localTime.format("YYYY-MM-DD, hh:mm A"));

    const currentDateTime = moment(); // Get current time in local timezone
    const hoursDifference = currentDateTime.diff(localTime, 'hours'); // Get difference in hours

    // console.log('hoursDifference >>>>', hoursDifference);

    return hoursDifference < 1;
  };

  const virtualDateFormat = (item: any) => {

    // Format date (ISO format preserved)
    const formattedDate = moment(item.training_date, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    // Format time
    const formattedTime = moment(item.training_time, 'HH:mm:ss').format('hh:mm a');

    return dateTimeFormat(`${formattedDate}, ${formattedTime}`)

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



  const BookingCard = ({ booking, item, index }) => {
    const artist = item?.artists;
    // console.log('artist', booking)
    return (
      <View style={[styles.cardContainer,
      {
        height: CheckBookingTime(item?.bookingTime) ? Platform.OS == 'ios' ? ms(170) : ms(177)
          : Platform.OS == 'ios' ? ms(130) : ms(137),
      }]} >
        {/* <View style={[styles.cardContainer, { height: Platform.OS == 'ios' ? ms(130) : ms(137), }]} > */}

        <View style={[GlobalStyles.rowCenterSpaceBetween, { width: '100%', height: "80%" }]} >
          <Image source={{ uri: item?.imageUrl }} resizeMode='contain' style={[styles.bookingImg, { height: CheckBookingTime(item?.bookingTime) ? ms(147) : ms(110), alignSelf: 'flex-start' }]} />

          <View style={[styles.infoView, { height: "90%", }]} >
            <View style={[GlobalStyles.rowCenterSpaceBetween, {}]} >
              <Text style={[GlobalStyles.txtSB14Dark, {}]} >{item?.serviceName}<Text style={[GlobalStyles.txtM12Dark, {}]} >{parseInt(item?.addOnAmount)>0?" (Styling Blowout)":""}</Text></Text>
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
                        <TouchableOpacity activeOpacity={0.8} onPress={() => handleProfileClick(item?.artists)}>
                          <CommonSvg.userBooking />
                        </TouchableOpacity>
                    }
                    <TouchableOpacity activeOpacity={0.8} style={{ marginHorizontal: 5, maxWidth: '60%' }} onPress={() => handleProfileClick(item?.artists)}>

                      <Text style={[GlobalStyles.txtL12Dark, {}]} numberOfLines={1}>{artist?.firstName}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
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

              {

                checkChatBookingEnabled(booking?.updatedAt) ?
                  <TouchableOpacity style={[GlobalStyles.button, {
                    marginLeft: Platform.OS == "ios" ? 0 : ms(10),
                    backgroundColor: COLORS.darkTxt, width: ms(60), 
                    ...GlobalStyles.rowCenter, borderWidth: 0, height: ms(25)
                  }]}
                    onPress={() => {
                      if (item?.artists) {

                        const bookingTime = item?.bookingTime;

                        navigation.navigate(screenNames.USER_CHAT, { data: item });

                        // if (CheckBookingTime(bookingTime)) {
                        //   navigation.navigate(screenNames.USER_CHAT, { data: item });
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
                  <>
                    {
                      !item?.gratuity || item?.gratuity == 0 ?
                        <TouchableOpacity onPress={() => {
                          if (item?.artists == null) {
                            showToast("artists not found")
                            return;
                          }
                          handleAddGratuity(booking, item, index)
                        }}>
                          <Text style={[GlobalStyles.txtM12Dark, { marginHorizontal: 5, textDecorationLine: 'underline' }]} >Add gratuity</Text>
                        </TouchableOpacity>
                        :
                        <Text style={[GlobalStyles.txtR10Dark, { marginHorizontal: 5, }]} >Gratuity- ${parseFloat(item?.gratuity)?.toFixed(1)}</Text>
                    }
                  </>
              }




            </View>

            {
              CheckBookingTime(item?.bookingTime) &&
              <>
                {
                  (!item?.gratuity || item?.gratuity == 0) ?

                    <TouchableOpacity onPress={() => {
                      if (item?.artists == null) {
                        showToast("artists not found")
                        return;
                      }
                      handleAddGratuity(booking, item, index)
                    }} style={{ marginVertical: 10, }} >
                      <Text style={[GlobalStyles.txtR10Dark, { marginHorizontal: 5, textDecorationLine: 'underline' }]} >Add gratuity</Text>
                    </TouchableOpacity>
                    :
                    <Text style={[GlobalStyles.txtR10Dark, { marginHorizontal: 5,marginVertical: 10 }]} >Gratuity- ${parseFloat(item?.gratuity)?.toFixed(1)}</Text>
             }
              </>

            }

          </View>
        </View>

        <TouchableOpacity
          // disabled={item?.rating?true:false} 
          onPress={() => {
            if (item?.rating) {
              showToast("Review added previously")
            } else {
              handleAddRating(booking, item, index)
            }
          }} activeOpacity={0.8} style={styles.bookingReviewContainer} >
          <Text style={[GlobalStyles.txtR12Dark, { marginRight: ms(10) }]} >Share review</Text>
          <CustomStarRating
            rate={parseInt(item?.rating) || 0}
            starSize={18}
            containerStyle={{ padding: 0 }}
          />
        </TouchableOpacity>

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

      <FlatList
        data={data?.sort((a, b) =>
          moment(b.updatedAt, 'YYYY-MM-DD, hh:mm A').diff(
            moment(a.updatedAt, 'YYYY-MM-DD, hh:mm A'),
          ),
        ) || []}
        keyExtractor={(item, index) => `completed-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{}}
        ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
          <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Bookings.</Text>
        </View>}
        renderItem={({ item: booking, index }) => {
          return (
            <>
              {booking?.bookingItems?.map(item => (
                <BookingCard
                  booking={booking}
                  item={item}
                  index={index}></BookingCard>
              ))}
              {/* {booking.cartData?.later.map(item => (
              <BookingCard
                booking={booking}
                item={item}
                index={index}></BookingCard>
            ))} */}
            </>
          )
        }}
      />

    )
  }
}

{/* <>
      {
       data && 
       
       data.filter((b: any) => b.status == 'completed')
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
      }

    </> */}

export default CompletedUserComponent