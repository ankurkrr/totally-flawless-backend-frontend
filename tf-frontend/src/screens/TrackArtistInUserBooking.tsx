import { View, Text, ScrollView, Dimensions, TouchableOpacity, Image, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Icon } from '@rneui/base';
import { COLORS, FONTS, SIZES } from '../style/theme';
import MapView, { Callout, Marker, Polyline, AnimatedRegion } from 'react-native-maps';
import { GlobalStyles } from '../style/GlobalStyles';
import axiosInstance from '../services/axiosInterceptor';
import Geolocation from '@react-native-community/geolocation';
import MapViewDirections from 'react-native-maps-directions';
// Removed hardcoded GOOGLE_API from client. Directions API should be proxied
// via the backend or provided via native configuration.
import { mvs } from 'react-native-size-matters';
import images from '../constants/images';

const height = Dimensions.get('window').height;

Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'auto',
});

const TrackArtistInUserBooking = () => {
    const [userLocation, setUserLocation] = useState({
        "latitude": 0,
        "longitude": 0,
    });
    const [artistLocation, setArtistLocation] = useState({

        latitude: 0,
        longitude: 0,
    });
    const navigation = useNavigation<any>();
    const routeArtist = useRoute()?.params?.artist;
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [isCallArtist, setIsCallArtist] = useState(true)

    const mapRef = useRef();
    const polylineRef = useRef();
    const userMarkerRef = useRef(null);
    const artistMarkerRef = useRef(null);


    console.log('routeArtist', routeArtist)

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

            const geo = await Geolocation.getCurrentPosition(async (location) => {

                console.log('location?.coords?.latitude >>>', location?.coords?.latitude)




                //FIXME:
                // setUserLocation({
                //     latitude: 18.7632,
                //     longitude: 73.8613,
                // })

                setUserLocation({
                    latitude: location?.coords?.latitude,
                    longitude: location?.coords?.longitude,
                })
                getArtistLocation()
            },
                err => {
                    console.warn("getPermissionLocation==>", err);
                },
                { enableHighAccuracy: true, timeout: 20000 },
            )

        } catch (error) {
            console.log('error', error)
        }

    }

    useEffect(() => {
        const interval = setInterval(() => {
            //  if (isCallArtist) {
            getArtistLocation()
            //  }

        }, 5000);

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    useEffect(() => {
        if (userLocation.latitude != 0 && artistLocation.latitude != 0) {
            // Adjust map view to fit both markers
            mapRef.current.fitToCoordinates(
                [userLocation, artistLocation],
                {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true, // Smooth transition
                }
            );


            // polylineRef.current?.setParams({
            //     origin: userLocation,
            //     destination: artistLocation,
            // });

            // setTimeout(() => {
            //     userMarkerRef.current?.showCallout();
            //     artistMarkerRef.current?.showCallout();
            // }, 1000); // Delay for better visibility
        } else {

        }
    }, [userLocation, artistLocation]);


    const getArtistLocation = async () => {
        try {

            console.log(`/get/artist/location/${routeArtist?.id}`)
            const response = await axiosInstance.get(`/get/artist/location/${routeArtist?.id}`)
            console.log('response?.data getArtistLocation >>>>', response?.data)
            if (response?.data?.data) {
                setArtistLocation({
                    latitude: response?.data?.data?.latitude,
                    longitude: response?.data?.data?.longitude,
                })
            } else {
                setIsCallArtist(false)
                Alert.alert(
                    'Alert',
                    'Artist location not found',
                    [
                        //   { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                        { text: 'Okay', onPress: () => navigation.goBack() }
                    ]
                );

            }
        } catch (error) {
            console.log('error getArtistLocation >>>>', error)
        }
    }


    const handleCancel = () => {
        navigation.goBack()
    }

    return (
        <View style={{ flex: 1 }} >

            {/* HEADER */}
            {/* <ScrollView
                showsVerticalScrollIndicator={false}
                style={{
                    backgroundColor: 'white',
                    height: height,
                    paddingHorizontal: 15,
                }}> */}
            <View style={{ flexDirection: 'row', height: '4%', paddingHorizontal: 15, marginTop: 25, marginBottom: 15 }}>
                <View>
                    <Icon
                        color="#000"
                        name="arrow-back-ios"
                        onPress={handleCancel}
                        size={25}
                        type="material"
                    />
                </View>

                <View style={{ justifyContent: 'center', paddingLeft: 10 }}>
                    <Text
                        style={{
                            color: 'black',
                            fontSize: 18,
                            fontFamily: FONTS.medium,
                        }}>
                        Track Artist Location
                    </Text>
                </View>

            </View>
            {/* </ScrollView> */}

            <View style={{ width: '100%', height: '72%', alignItems: 'flex-start' }} >

                <MapView
                    style={{ width: '100%', height: '100%', justifyContent: 'flex-start' }}
                    initialRegion={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    ref={mapRef} // Bind the map ref
                >
                    {userLocation.latitude != 0 && (
                        <Marker
                            ref={userMarkerRef}
                            coordinate={userLocation}
                            // title="Your Location"
                            pinColor="red"
                        >
                            <Callout>
                                <Text style={{ fontWeight: 'bold' }}>Your Location</Text>
                            </Callout>
                        </Marker>
                    )}

                    {artistLocation.latitude != 0 && (
                        <Marker
                            coordinate={artistLocation}
                            title="Artist Location"
                        >
                            <Image source={images.logoFinal} style={{backgroundColor:COLORS.black,borderRadius:15, width: 30, height: 30 ,resizeMode:'contain'}} />
                            {/* <Image source={images.artist} style={{ width: 30, height: 30 }} /> */}
                            {/* <Callout>
                                <Text style={{ fontWeight: 'bold' }}>Artist Location</Text>
                            </Callout> */}
                        </Marker>
                    )}

                    {/* Draw a polyline between user and artist */}
                    {userLocation.latitude != 0 && artistLocation.latitude != 0 && (
                        <MapViewDirections
                            ref={polylineRef}  // Attach the ref to the Directions component
                            origin={userLocation}
                            destination={artistLocation}
                            apikey={''} // removed from JS; backend/native should supply key
                            // strokeWidth={4}
                            strokeColor={COLORS.transparent}
                            onReady={(result) => {
                                console.log('result', result?.duration)
                                setEta(result?.duration); // Estimated time in minutes
                                setDistance(result?.distance); // Distance in km
                            }}
                        />
                    )}
                </MapView>
            </View>

            <View style={{ height: '24%' }} >
                {eta && (
                    <View style={{ padding: 10, marginTop: 10, backgroundColor: 'white', width: '90%', borderRadius: 10, alignSelf: 'center' }}>
                        <Text style={{ ...GlobalStyles.txtM14Dark }}>Estimated Time: {Math.round(eta)} minutes</Text>
                        <Text style={{ ...GlobalStyles.txtM14Dark }}>Distance: {distance.toFixed(2)} km</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[GlobalStyles.continueButton, { marginBottom: mvs(10), }]}
                    onPress={handleCancel}>
                    <Text style={GlobalStyles.continueButtonText}>Close</Text>
                </TouchableOpacity>
            </View>



        </View>
    )
}

export default TrackArtistInUserBooking