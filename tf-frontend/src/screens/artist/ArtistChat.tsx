import { View, Text, TouchableOpacity, ScrollView, FlatList, TextInput, Keyboard, Image, Platform } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import screenNames from '../../constants/screenNames';
import { COLORS, SIZES } from '../../style/theme';
import { styles } from './style';
import CommonSvg from '../../components/CommonSvg';
import TopBar from '../../components/TopBar';
import { GlobalStyles } from '../../style/GlobalStyles';
import { ms, mvs } from 'react-native-size-matters';
import ArtistBottomBar from '../../components/ArtistBottomBar';
import axiosInstance from '../../services/axiosInterceptor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKeyboardVisible } from '../../services/useKeyboardVisible';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { IS_CHAT } from '../../store/allactionsTypes';
import { bookingStatusEnums } from '../../constants/enums';
import UserContext from '../UserContext';

type Props = {}

let intervalId; // Store the interval ID

// Notifications are proxied to backend; client must not generate service-account JWTs.

const ArtistChat = (props: Props) => {

  const navigation = useNavigation<any>();

  const [chatData, setChatData] = useState<any[]>([]);
  const [chat, setChat] = useState("");
  const [isChat, setIsChat] = useState(false)
  const [chatUserListData, setChatUserListData] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>({})
  const [userId, setUserId] = useState("")
  const [userData, setUserData] = useState<any>({})

  const [userDeviceToken, setUserDeviceToken] = useState("")


  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const isKeyboard = useKeyboardVisible()

  const flatRef = useRef<FlatList>()

  const dispatch = useDispatch();

  const { user } = useContext(UserContext);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      console.log("event.endCoordinates.height >>>", event.endCoordinates.height)
      setKeyboardHeight(parseInt(event.endCoordinates.height));
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);



  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', () => {
      dispatch({ type: IS_CHAT, payload: false })
      getData();
      setUserData(user)
    })

    return () => {
      clearInterval(intervalId)
      unsubscribe();
    }
  }, [])


  useEffect(() => {

    if (isChat) {
      intervalId = setInterval(() => {
        getChatData(selectedUser?.id)
      }, 3000);
    } else {
      clearInterval(intervalId)
    }

  }, [isChat])


  const getData = async () => {
    try {
      const userId = await AsyncStorage.getItem("id");
      setUserId(userId)
      if (!userId) {
        console.error("User ID is null or undefined.");
        return;
      }

      const chatListResponse = await axiosInstance.get(`/chat-list?userId=${userId}`);
      console.log("getData response?.data>>>", chatListResponse?.data);

      const chatList = chatListResponse?.data?.data || [];
      if (chatList.length === 0) {
        console.log("No chats found.");
        return;
      }

      // Fetch all user details concurrently
      const userDetailsPromises = chatList.map((chatItem) =>
        axiosInstance.get(`/get-userdetails?userId=${chatItem}`).then((res) => res.data?.data[0])
      );

      const userDetails = await Promise.all(userDetailsPromises);
      setChatUserListData(userDetails)
      console.log("User Details:", userDetails);


    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getChatUserToken = async (item: any) => {


    const response = await axiosInstance.get(`/get-userdetails?userId=${item?.id}`);
    const data = response.data.data[0];

    if (data?.deviceDetail) {
      setUserDeviceToken(data?.deviceDetail[0]?.deviceToken)
    }

    // const [upcomingData, completedData] = await Promise.all([
    //   getBookingsByStatusAndType(bookingStatusEnums.CONFIRMED, ""),
    //   getBookingsByStatusAndType(bookingStatusEnums.COMPLETED, ""),
    // ])

    // const bookingData = [...upcomingData, ...completedData]

    // const foundBooking = bookingData.find(
    //   (data) => data.userId === item?.id && data?.deviceData?.deviceToken
    // );

    // if (foundBooking) {
    //   setUserDeviceToken(foundBooking.deviceData.deviceToken);
    //   console.log("Device Token >", foundBooking.deviceData.deviceToken);
    // }

  }


  const handleNotification = async (sendData: any) => {
    if (!userDeviceToken) return;
    const receiver = userDeviceToken;
    const requestData = { customData: JSON.stringify(sendData) };
    try {
      await axiosInstance.post('/send-notification', {
        receiver,
        title: `New message from ${userData.firstName}`,
        body: chat,
        data: requestData,
      });
    } catch (err) {
      console.error('ArtistChat send-notification error >>>', err);
    }
  }

  const getBookingsByStatusAndType = async (status: any, type?: any) => {
    try {
      const id = await AsyncStorage.getItem("id");
      console.log('getBookingsByStatusAndType >>>', `/get-artistbooking?artistId=${id}&bookingitemstatus=${status}`)
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



  const getChatData = async (senderId: any) => {
    try {

      const id = await AsyncStorage.getItem("id")
      // const id = "5f4de70b-7860-46e9-aacb-22427f7773b8";
      const url = `/chat-message?senderId=${senderId}&receiverId=${id}`
      const response = await axiosInstance.get(url);
      setChatData(response?.data?.data)
      console.log('response?.data', response?.data)
    } catch (error) {

    }

  }

  const sendChat = async () => {

    try {
      const request = {
        "senderId": userId,
        "receiverId": selectedUser?.id,
        "message": chat
      }

      setChat("")
      const response = await axiosInstance.post(`/chat`, request);
      console.log('response?.data', response?.data)
      if (response?.data?.status == "success") {
       await getChatData(selectedUser?.id)
        const data = {
          type: "chat",
          userId: userId,
        }
        setTimeout(() => {
          flatRef?.current?.scrollToEnd({ animated: true })
        }, 1500);

        setTimeout(() => {
          handleNotification(data)
        }, 2500);


        // 
      }
      dispatch({ type: IS_CHAT, payload: false })
    } catch (error) {

    }
  }


  const changeNavigation = page => {

    navigation.navigate(page);
  };


  const handleChatTextChange = (input: string) => {
    // const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g; // Matches email-like text
    // const phonePattern = /\b\d{10,}\b/g; // Matches 10 or more consecutive digits

    // // Remove detected emails and phone numbers
    // let filteredText = input.replace(emailPattern, "").replace(phonePattern, "");
    let filteredText = input.replace(/[@.0-9]/g, '');

    setChat(filteredText);

  };

  const ChatComponent = () => {
    return (
      <>
        <View style={styles.headerTitleView} >
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            setIsChat(false)
            setChatData([])

          }} >
            <CommonSvg.back />
          </TouchableOpacity>

          <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >{selectedUser?.firstName} {selectedUser?.lastName}</Text>
        </View>
        <View style={styles.chatBottomStrip} />


        <View style={{ flex: 1 }} >

          <View style={{ height: SIZES.height - 220 }} >
            <FlatList
              data={chatData}
              // ref={flatRef}
              keyExtractor={(item) => `-${item.id}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: isKeyboard ? keyboardHeight + 30 : mvs(40) }}
              style={{
                height: SIZES.height - 220, width: SIZES.cardWidth, alignSelf: 'center',
                paddingTop: mvs(20), marginBottom: mvs(10)
              }}
              renderItem={({ item, index }) => {

                if (item?.senderId == userId) {
                  return (
                    <View  >
                      <View style={styles.ownChatDisplay} >
                        <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                      </View>
                      <View style={{ alignSelf: 'flex-end' }} >
                        <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                      </View>
                    </View>

                  )
                } else {
                  return (
                    <View style={{ paddingBottom: 10 }} >
                      <View style={styles.sendChatDisplay} >
                        <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                      </View>
                      <View style={{}} >
                        <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                      </View>
                    </View>
                  )
                }
              }}
            />

          </View>

          {/* <View style={[styles.bottomChatView, {
                alignSelf: 'center',
                bottom: isKeyboard ? mvs(0) : mvs(50),
                backgroundColor: COLORS.white,
                height: mvs(70),
                width: '100%', alignItems: 'center',
                // paddingBottom: 50,
            }]} >
                <View style={styles.inputContainer} >
                    <TextInput
                        value={chat}
                        style={styles.chatInput}
                        onChangeText={(txt) => setChat(txt)}
                        autoCapitalize='none'
                        placeholder={'Write your message'}
                        placeholderTextColor={COLORS.borderColor}
                        onSubmitEditing={Keyboard.dismiss}
                        onFocus={() => {
                            scrollToEnd()
                            // flatRef.current?.sc({y:0,animated:true})
                        }}
                        multiline={true}
                        keyboardType='default'
                    />

                    <TouchableOpacity onPress={sendChat}>
                        <CommonSvg.send />
                    </TouchableOpacity>

                </View>
            </View> */}


        </View>
        {/* 
        <FlatList
          data={chatData}
          keyExtractor={(item) => `-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{}}
          style={{ width: SIZES.cardWidth, alignSelf: 'center' }}
          renderItem={({ item, index }) => {
            if (item?.senderId == userId) {
              return (
                <View  >
                  <View style={styles.ownChatDisplay} >
                    <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                  </View>
                  <View style={{ position: 'absolute', right: 10, bottom: 0 }} >
                    <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                  </View>
                </View>

              )
            } else {
              return (
                <View  >
                  <View style={styles.sendChatDisplay} >
                    <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                  </View>
                  <View style={{ position: 'absolute', left: 10, bottom: 0 }} >
                    <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                  </View>
                </View>
              )
            }
          }}
        /> */}


      </>
    )
  }


  return (
    <View style={{ backgroundColor: '#FFF', flex: 1 }}>
      {/* <TopBar navigation={navigation} /> */}

      {
        isChat ?
          <>
            <View style={styles.headerTitleView} >
              <TouchableOpacity style={styles.backBtn} onPress={() => {
                setIsChat(false)
                setChatData([])

              }} >
                <CommonSvg.back />
              </TouchableOpacity>

              <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >{selectedUser?.firstName} {selectedUser?.lastName}</Text>
            </View>
            <View style={styles.chatBottomStrip} />


            <View style={{ flex: 1 }} >

              <View style={{ height: SIZES.height - 220 }} >

                <FlatList
                  data={chatData}
                  ref={flatRef}
                  keyExtractor={(item) => `-${item.id}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: isKeyboard ? mvs(250) : mvs(40) }}
                  style={{
                    height: SIZES.height - 220, width: SIZES.cardWidth, alignSelf: 'center',
                    paddingTop: mvs(20), marginBottom: mvs(10)
                  }}
                  // ListEmptyComponent={<View style={{marginTop:mvs(200)}} >
                  //   <Text style={[GlobalStyles.txtM14Dark,{}]} >No chats found.</Text>
                  // </View>}
                  renderItem={({ item, index }) => {

                    if (item?.senderId == userId) {
                      return (
                        <View style={{ paddingBottom: 20 }} >
                          <View style={styles.ownChatDisplay} >
                            <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                          </View>
                          <View style={{ alignSelf: 'flex-end' }} >
                            <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                          </View>
                        </View>

                      )
                    } else {
                      return (
                        <View style={{ paddingBottom: 20 }} >
                          <View style={styles.sendChatDisplay} >
                            <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                          </View>
                          <View style={{}} >
                            <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                          </View>
                        </View>
                      )
                    }
                  }}
                />

              </View>

              {/* <View style={[styles.bottomChatView, {
                alignSelf: 'center',
                bottom: isKeyboard ? mvs(0) : mvs(50),
                backgroundColor: COLORS.white,
                height: mvs(70),
                width: '100%', alignItems: 'center',
                // paddingBottom: 50,
            }]} >
                <View style={styles.inputContainer} >
                    <TextInput
                        value={chat}
                        style={styles.chatInput}
                        onChangeText={(txt) => setChat(txt)}
                        autoCapitalize='none'
                        placeholder={'Write your message'}
                        placeholderTextColor={COLORS.borderColor}
                        onSubmitEditing={Keyboard.dismiss}
                        onFocus={() => {
                            scrollToEnd()
                            // flatRef.current?.sc({y:0,animated:true})
                        }}
                        multiline={true}
                        keyboardType='default'
                    />

                    <TouchableOpacity onPress={sendChat}>
                        <CommonSvg.send />
                    </TouchableOpacity>

                </View>
            </View> */}


            </View>
            {/* 
        <FlatList
          data={chatData}
          keyExtractor={(item) => `-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{}}
          style={{ width: SIZES.cardWidth, alignSelf: 'center' }}
          renderItem={({ item, index }) => {
            if (item?.senderId == userId) {
              return (
                <View  >
                  <View style={styles.ownChatDisplay} >
                    <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                  </View>
                  <View style={{ position: 'absolute', right: 10, bottom: 0 }} >
                    <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                  </View>
                </View>

              )
            } else {
              return (
                <View  >
                  <View style={styles.sendChatDisplay} >
                    <Text style={[GlobalStyles.txtM16Dark, { color: COLORS.white }]} >{item?.message}</Text>
                  </View>
                  <View style={{ position: 'absolute', left: 10, bottom: 0 }} >
                    <Text style={[GlobalStyles.txtR10Dark, {}]} >{moment(item?.createdAt).format("hh:mm A")}</Text>
                  </View>
                </View>
              )
            }
          }}
        /> */}


          </>
          :
          <>
            <View style={styles.headerTitleView} >
              <TouchableOpacity style={styles.backBtn} onPress={() => changeNavigation(screenNames.ARTIST_HOME)} >
                <CommonSvg.back />
              </TouchableOpacity>

              <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >My Chat</Text>
            </View>
            <View style={styles.chatBottomStrip} />
            {
              chatUserListData.length < 1 ?
                <View style={{ marginTop: mvs(200), alignSelf: 'center' }} >
                  <Text style={[GlobalStyles.txtM14Dark, {}]} >No chats found.</Text>
                </View>
                :

                <FlatList
                  data={chatUserListData}
                  keyExtractor={(item) => `chats-${item.id}`}
                  showsVerticalScrollIndicator={false}
                  style={{ marginTop: mvs(20) }}
                  contentContainerStyle={{}}
                  ItemSeparatorComponent={() => <View style={styles.chatBottomStrip} />}
                  renderItem={({ item, index }) => {
                    return (
                      <View style={[GlobalStyles.rowCenter, { width: SIZES.cardWidth, alignSelf: 'center' }]} >
                        <Image source={{ uri: item?.profileImage }} style={{ height: 50, width: 50, borderRadius: 25 }} />
                        <View style={{ paddingLeft: ms(20), alignSelf: 'flex-start' }} >
                          <Text style={[GlobalStyles.txtM16Dark, {}]} >{item?.firstName} {item?.lastName}</Text>
                          <TouchableOpacity style={[GlobalStyles.button, {
                            marginTop: mvs(10),
                            backgroundColor: COLORS.darkTxt, width: ms(80), ...GlobalStyles.rowCenter, borderWidth: 0, height: ms(25)
                          }]}
                            onPress={() => {
                              setSelectedUser(item)
                              setIsChat(true)
                              getChatData(item?.id)
                              getChatUserToken(item)
                              setTimeout(() => {
                                flatRef?.current?.scrollToEnd({ animated: true })
                              }, 2000);
                            }}
                          >
                            <CommonSvg.chat />
                            <Text style={[GlobalStyles.txtR12Dark, { marginLeft: 5, color: COLORS.white }]} >View</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  }}
                />
            }
          </>
      }




      {/* <ScrollView
        keyboardShouldPersistTaps="always"
        automaticallyAdjustKeyboardInsets={true}
        style={{ backgroundColor: '#FFF', height: SIZES.height }}>

          ft

      </ScrollView> */}
      {
        isChat &&
        <View style={[styles.bottomChatView, {
          alignSelf: 'center',
          bottom: isKeyboard ? Platform.OS == "ios" ? keyboardHeight : 0 : mvs(60),
          backgroundColor: COLORS.white,
          height: mvs(70),
          width: '100%', alignItems: 'center',
          // paddingBottom: 50,
        }]} >
          <View style={styles.inputContainer} >
            <TextInput
              value={chat}
              style={Platform.OS == "android" ? styles.chatInput : styles.chatInputIos}
              onChangeText={(txt) => handleChatTextChange(txt)}
              autoCapitalize='none'
              placeholder={'Write your message'}
              placeholderTextColor={COLORS.borderColor}
              onSubmitEditing={Keyboard.dismiss}
              onFocus={() => {
                // scrollToEnd()
                // flatRef.current?.sc({y:0,animated:true})
              }}
              multiline={true}
              keyboardType='default'
            />

            <TouchableOpacity onPress={sendChat}>
              <CommonSvg.send />
            </TouchableOpacity>

          </View>
        </View>
      }

      {
        !isKeyboard &&
        <ArtistBottomBar navigation={changeNavigation} page={screenNames.ARTIST_CHAT} />
      }

    </View>
  )
}


export default ArtistChat