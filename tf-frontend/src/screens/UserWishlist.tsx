import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { GlobalStyles } from '../style/GlobalStyles'
import CommonSvg from '../components/CommonSvg'
import { ms, mvs } from 'react-native-size-matters'
import screenNames from '../constants/screenNames'
import { useNavigation } from '@react-navigation/native'
import TopBar from '../components/TopBar'
import axiosInstance from '../services/axiosInterceptor'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { COLORS, SIZES } from '../style/theme'
import { showToast } from '../components/Toast'

type Props = {}

const UserWishlist = (props: Props) => {

    const navigation = useNavigation<any>();

    const [wishlistData, setWishlistData] = useState<any[]>([])


    useEffect(() => {

        const unsubscribe = navigation.addListener('focus', () => {
            getData();
        })

        return () => {
            unsubscribe();
        }
    }, [])


    const getData = async () => {

        try {

            const id = await AsyncStorage.getItem("id")
            console.log('`/get-wishlist?user_id=${id}`', `/get-wishlist?user_id=${id}`)
            const response = await axiosInstance.get(`/get-wishlist?user_id=${id}`);
            console.log('response?.data?.data', response?.data?.data)
            setWishlistData(response?.data?.data || [])
        } catch (error) {
            setWishlistData([])
            console.log('error getData >>>', error)
        }
    }

    const changeNavigation = page => {

        navigation.navigate(page);
    };

    const returnArtistType = (type: any) => {

        switch (type) {
            case 1:
                return "Hair Artist"
            case 2:
                return "Makeup Artist"
            case 3:
                return "Hair & Makeup Artist"

            default:
                return ""
        }
    }


    const handleDeleteWishlist = async (item) => {
        try {

            const url = `/remove-wishlist?user_id=${item?.user_id}&artist_id=${item?.artist_id}`
            const response = await axiosInstance.delete(url);
            console.log('handleDeleteWishlist response?.data >>>', response?.data)
            if (response?.data?.status == "success") {
                getData()
            }
            showToast("Artist removed from Favorites successfully")
        } catch (error) {
            getData()
            console.error('handleDeleteWishlist error >>>', error)
        }
    }


    return (
        <View style={{ backgroundColor: '#FFF', flex: 1 }}>

            <TopBar navigation={navigation} />

            <FlatList
                data={wishlistData}
                keyExtractor={(item) => `wishlist-${item?.wishlist_id}`}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.headerTitleView} >
                        <TouchableOpacity style={styles.backBtn} onPress={() => changeNavigation(screenNames.HOME)} >
                            <CommonSvg.back />
                        </TouchableOpacity>
                        <Text style={[GlobalStyles.txtSB18Dark, { marginLeft: ms(15) }]} >My Favorites</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={{ alignSelf: 'center', marginTop: mvs(80) }} >
                        <Text style={[GlobalStyles.txtM14Dark, {}]}  >No Favorites.</Text>
                    </View>
                }
                contentContainerStyle={{}}
                renderItem={({ item, index }) => {
                    if (item?.artist_first_name == null) {
                        return null
                    } else {
                        return (
                            <View style={[styles.cardContainer, {}]} >
                                <View style={[GlobalStyles.rowCenter, {}]} >
                                    <Image source={{ uri: item?.artist_profile_image }} style={styles.profileImg} />
                                    <Text style={[GlobalStyles.txtM16Dark, { marginLeft: ms(10) }]} >{item?.artist_first_name + " " + item?.artist_last_name}</Text>
                                </View>
                                <View style={[GlobalStyles.rowCenterSpaceBetween, { marginTop: mvs(15), paddingLeft: ms(20) }]} >
                                    <Text style={[GlobalStyles.txtM14Dark, {}]} >{returnArtistType(item?.artist_business_type)}</Text>
                                </View>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteWishlist(item)}>
                                    <CommonSvg.deleteBooking />
                                </TouchableOpacity>
                            </View>

                        )
                    }

                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    headerTitleView: {
        ...GlobalStyles.rowCenter,
        // height:mvs(30),
        paddingVertical: mvs(15),
        paddingLeft: ms(15)
    },
    backBtn: {
        ...GlobalStyles.alignJustifyCenter,
        height: 30,
        width: 25,
    },
    cardContainer: {
        alignSelf: 'center',
        marginTop: mvs(10),
        width: SIZES.cardWidth,
        borderWidth: ms(1),
        borderColor: COLORS.borderColor,
        borderRadius: ms(10),
        minHeight: ms(110),
        overflow: 'hidden',
        alignItems: 'flex-start',
        padding: ms(15)
    },
    profileImg: {
        height: ms(30),
        width: ms(30),
        borderRadius: ms(16),
        backgroundColor: '#bebebe'
    },
    deleteBtn: {
        position: 'absolute',
        top: ms(15),
        right: ms(20)
    }
})

export default UserWishlist