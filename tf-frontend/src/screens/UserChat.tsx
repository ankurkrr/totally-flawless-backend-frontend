import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native';
import { useKeyboardVisible } from '../services/useKeyboardVisible';
import axiosInstance from '../services/axiosInterceptor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ArtistBottomBar from '../components/ArtistBottomBar';
import screenNames from '../constants/screenNames';
import { COLORS, SIZES } from '../style/theme';
import { ms, mvs } from 'react-native-size-matters';
import { GlobalStyles } from '../style/GlobalStyles';
import CommonSvg from '../components/CommonSvg';
import BottomBar from '../components/BottomBar';
import moment from 'moment';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
// Notification sending moved to backend. Client now calls an API endpoint instead
import UserContext from './UserContext';

type Props = {}

let intervalId; // Store the interval ID

const UserChat = (props: Props) => {


    const senderData = useRoute()?.params?.data;

    const [artistDeviceToken, setArtistDeviceToken] = useState("")

    // console.log('data UserChat >>>', senderData)

    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // console.log('senderData', senderData)

    const navigation = useNavigation<any>();

    const [chatData, setChatData] = useState<any[]>([]);
    const [chat, setChat] = useState("");
    const [userId, setUserId] = useState("")
    const [userData, setUserData] = useState<any>({})

    const isKeyboard = useKeyboardVisible()
    const flatRef = useRef<FlatList>()
    const keyAwareRef = useRef<KeyboardAwareScrollView>()

    const { user, updateUser } = useContext(UserContext);

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
            getData()
            getChatData();
            intervalId = setInterval(() => {
                getChatData()
            }, 3000);
            setTimeout(() => {
                scrollToEnd()
            }, 1000)

            setArtistDeviceToken(senderData?.devices[0]?.deviceToken)
        })

        return () => {
            clearInterval(intervalId)
            unsubscribe();
        }
    }, [])


    const getData = async () => {

        const id = await AsyncStorage.getItem('id');

        // const response = await axiosInstance.get(`/get-userdetails?userId=${id}`);
        // if (response?.status==200) {
        //     const data = response?.data?.data[0];
        //     setUserData(data)
        // }

        setUserData(user)

    }



    const getChatData = async () => {

        try {
            const id = await AsyncStorage.getItem("id")
            setUserId(id)
            // const id = "5f4de70b-7860-46e9-aacb-22427f7773b8";
            const url = `/chat-message?senderId=${senderData?.artistId}&receiverId=${id}`
            const response = await axiosInstance.get(url);

            setChatData(response?.data?.data)

            // console.log('response?.data', response?.data)
        } catch (error) {
            setChatData([])
        }

    }

    const sendChat = async () => {

        try {
            const request = {
                "senderId": userId,
                "receiverId": senderData?.artistId,
                "message": chat
            }
            setChat("")
            const response = await axiosInstance.post(`/chat`, request);
            // console.log('response?.data', response?.data)
            if (response?.data?.status == "success") {
               await getChatData()

                const data={
                    type:"chat",
                    userId:userId,
                }
                setTimeout(() => {
                    flatRef?.current?.scrollToEnd({ animated: true })
                  
                }, 1500);

                setTimeout(() => {
                    handleNotification(data)
                  
                }, 2500);

               

            }
        } catch (error) {

        }
    }

    const handleNotification = async (sendData:any) => {

        if(!artistDeviceToken){
            return
        }

        const receiver = artistDeviceToken;

        console.log('receiver >>>', sendData)
        // Send notification request to backend; backend holds FCM credentials
        try {
            const payload = {
                receiver,
                title: `New message from ${userData?.firstName}`,
                body: chat,
                data: sendData,
            };
            await axiosInstance.post('/send-notification', payload);
        } catch (err) {
            console.error('Notification proxy error', err?.response || err.message || err);
        }

    }


    const scrollToEnd = () => {
        if (flatRef.current) {
            flatRef.current.scrollToEnd({ animated: true });
            keyAwareRef.current?.scrollToEnd()
        }
    };

    const changeNavigation = page => {

        navigation.navigate(page);
    };

    const handleChatTextChange = (input: string) => {
        
        // let filteredText = input.replace(/[^a-zA-Z\s]/g, '');
        let filteredText = input.replace(/[@.0-9]/g, '');

        setChat(filteredText);
    };

    return (
        <View style={{ backgroundColor: '#FFF', flex: 1 }}>
            {/* <TopBar navigation={navigation} /> */}

            {/* <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            > */}

            <View style={styles.headerTitleView} >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} >
                    <CommonSvg.back />
                </TouchableOpacity>

                <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >{senderData?.artists?.firstName || ""}</Text>
            </View>
            <View style={styles.chatBottomStrip} />

            {/* <KeyboardAwareScrollView bounces={false}
                ref={keyAwareRef}
                showsVerticalScrollIndicator={false} style={{ flex: 1, }}
                contentContainerStyle={{ paddingBottom: mvs(120) }}
                keyboardShouldPersistTaps='always' > */}
            <View style={{ flex: 1 }} >

                <View style={{ height: SIZES.height - 220 }} >
                    <FlatList
                        data={chatData}
                        ref={flatRef}
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
                                    <View>
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

                <View style={[styles.bottomChatView, {
                    alignSelf: 'center',
                    bottom: isKeyboard ? Platform.OS == "ios" ? keyboardHeight : 0 : mvs(60),
                    backgroundColor: COLORS.white,
                    height: mvs(70),
                    width: '100%',
                    alignItems: 'center',
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
                </View>


            </View>
            {/* </KeyboardAwareScrollView> */}


            {
                !isKeyboard &&
                <BottomBar navigation={changeNavigation} page={screenNames.USER_BOOKING} />
            }
            {/* </KeyboardAvoidingView> */}
        </View>
    )
}



const styles = StyleSheet.create({
    headerTitleView: {
        ...GlobalStyles.rowCenter,
        // height:mvs(30),
        paddingVertical: mvs(15),
        paddingLeft: ms(15),
        marginTop: mvs(10)
    },
    backBtn: {
        ...GlobalStyles.alignJustifyCenter,
        height: 30,
        width: 25,
    },
    chatBottomStrip: {
        height: 1.5,
        width: SIZES.cardWidth,
        backgroundColor: "#ECECEC",
        alignSelf: 'center'
    },
    closeView: {
        position: 'absolute',
        top: ms(8),
        right: ms(15),
        zIndex: 1,
        // borderWidth: 2,
        // borderColor: COLORS.theme,
        // backgroundColor: COLORS.white,
        borderRadius: 10,
        height: ms(25),
        width: ms(25),
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownChatDisplay: {
        minHeight: ms(50),
        paddingVertical: ms(10),
        paddingHorizontal: ms(20),
        backgroundColor: COLORS.black,
        // marginTop: mvs(10),
        // marginBottom: mvs(20),
        alignSelf: "flex-end",
        maxWidth: SIZES.cardWidth / 1.2,
        // minWidth:SIZES.cardWidth/2,
        borderTopStartRadius: 25,
        borderBottomStartRadius: 25,
        borderBottomEndRadius: 25,
        alignItems: 'flex-start',
        justifyContent: 'center'
    },
    sendChatDisplay: {
        minHeight: ms(50),
        paddingVertical: ms(10),
        paddingHorizontal: ms(20),
        backgroundColor: "#C4C4C4",
        // marginTop: mvs(10),
        // marginBottom: mvs(20),
        alignSelf: "flex-start",
        maxWidth: SIZES.cardWidth / 1.2,
        // minWidth:SIZES.cardWidth/2,
        borderTopStartRadius: 25,
        borderTopEndRadius: 25,
        borderBottomEndRadius: 25,
        alignItems: 'flex-start',
        justifyContent: 'center'
    },
    bottomChatView: {
        position: 'absolute',
        alignSelf: 'center',

    },
    inputContainer: {
        width: SIZES.cardWidth,
        height: ms(60),
        borderRadius: ms(25),
        flexDirection: 'row',
        alignItems: "center",
        paddingHorizontal: ms(15),
        borderWidth: ms(1),
        borderColor: COLORS.borderColor
    },
    chatInput: {
        width: '90%',
        height: ms(60),
        // textAlign: 'left', // Ensures left alignment
        // textAlignVertical: 'center', // Helps in vertical alignment
        ...GlobalStyles.txtM14Dark,
    },
    chatInputIos: {
        width: '90%',
        // height: ms(60),
        // textAlign: 'left', // Ensures left alignment
        textAlignVertical: 'center', // Helps in vertical alignment
        ...GlobalStyles.txtM14Dark,
    },
    chatView: {

    }

})

//the quick brown fox jumped over the lazy dog
//the quick brown fox jumped over the lazy dog
//the quick brown fox jumped over the lazy dog
//the  quick brown fox jumped over the lazy dog

export default UserChat