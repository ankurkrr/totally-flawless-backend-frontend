import {View, Text} from 'react-native';
import {Icon, Image} from '@rneui/base';
import moment from 'moment';

const BookingCard = props => {
  const {booking, item, index} = props;

  return (
    <View
      key={'s' + index}
      style={{
        marginTop: 25,
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 8,
        borderColor: '#bebebe',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <View style={{width: '28%'}}>
        <Image
          source={{uri: item.imageUrl || item.imgUrl || item.imgurl}}
          style={{
            height: '100%',
            borderRadius: 5,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
      </View>
      <View
        style={{
          width: '72%',
          paddingHorizontal: 10,
          paddingVertical: 10,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginVertical: 5,
          }}>
          <Text
            style={{
              color: 'black',
              fontSize: 14,
              fontWeight: 600,
            }}>
            {item.name}
          </Text>
          <Text
            style={{
              color: 'black',
              fontSize: 14,
              fontWeight: 600,
            }}>
            ${`${Number(item.price).toFixed(2) * Number(item.quantity)}`}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginVertical: 5,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginVertical: 5,
            }}>
            <Image
              source={require('../../src/assets/calendar.png')}
              style={{width: 14, height: 14, marginRight: 5}}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: 300,
                color: '#939393',
              }}>
              {booking.cartData.bookingTime
                ? moment(
                    booking.cartData.bookingTime,
                    'YYYY-MM-DD, hh:mm A',
                  ).format('DD MMM, YYYY, hh:mm A')
                : moment().format('DD MMM, YYYY, hh:mm A')}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 700,
              color:
                item.artist == 'Silver'
                  ? '#939393'
                  : item.artist == 'Gold'
                  ? '#ee9313'
                  : item.artist == 'Elite'
                  ? 'black'
                  : '#304cc0',
            }}>
            {item.artist.toUpperCase()}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginVertical: 5,
          }}>
          {(booking.artist_firstName || booking.artist_lastName) && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginVertical: 5,
              }}>
              <Image
                source={require('../../src/assets/user-white.png')}
                style={{width: 14, height: 14, marginRight: 5}}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 300,
                  color: '#939393',
                }}>
                {(booking.artist_firstName || '') +
                  (booking.artist_lastName
                    ? ' ' + booking.artist_lastName
                    : '')}
              </Text>
            </View>
          )}
          {item.quantity && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginVertical: 5,
              }}>
              <Text
                style={{
                  color: 'black',
                  fontSize: 14,
                  fontWeight: 600,
                }}>
                Qty: {item.quantity}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default BookingCard;
