import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Platform,
    PermissionsAndroid,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { Icon } from '@rneui/base';
import { COLORS, FONTS, SIZES } from '../style/theme';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import screenNames from '../constants/screenNames';
import { mvs, ms } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

// Default location (Los Angeles - central area for beauty services)
const DEFAULT_REGION = {
    latitude: 34.0522,
    longitude: -118.2437,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'auto',
});

type Props = {};

const MapScreen = (props: Props) => {
    const navigation = useNavigation<any>();
    const mapRef = useRef<MapView>(null);

    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [region, setRegion] = useState(DEFAULT_REGION);
    const [isLoading, setIsLoading] = useState(true);
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        console.log('[MapScreen] Component mounted');
        console.log('[MapScreen] Platform:', Platform.OS);
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        console.log('[MapScreen] Requesting location permission...');
        try {
            if (Platform.OS === 'android') {
                console.log('[MapScreen] Android - checking permission');
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'This app needs access to your location to show you on the map.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                console.log('[MapScreen] Permission result:', granted);
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('[MapScreen] Permission granted, getting location');
                    getCurrentLocation();
                } else {
                    console.log('[MapScreen] Permission denied');
                    setLocationPermissionDenied(true);
                    setIsLoading(false);
                }
            } else {
                // iOS - permissions handled by Geolocation library
                console.log('[MapScreen] iOS - getting location directly');
                getCurrentLocation();
            }
        } catch (err) {
            console.warn('[MapScreen] Permission error:', err);
            setIsLoading(false);
        }
    };

    const getCurrentLocation = () => {
        console.log('[MapScreen] Getting current location...');
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log('[MapScreen] Got location:', { latitude, longitude });
                setUserLocation({ latitude, longitude });
                setRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.0122,
                    longitudeDelta: 0.0121,
                });
                setIsLoading(false);
            },
            (error) => {
                console.warn('[MapScreen] Location error:', error.code, error.message);
                console.log('[MapScreen] Using default region instead');
                setIsLoading(false);
                // Still show map with default location
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
    };

    const centerOnUser = () => {
        console.log('[MapScreen] Center on user requested');
        if (userLocation && mapRef.current) {
            console.log('[MapScreen] Animating to user location');
            mapRef.current.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.0122,
                longitudeDelta: 0.0121,
            }, 500);
        } else if (!userLocation) {
            console.log('[MapScreen] No user location available');
            Alert.alert(
                'Location Unavailable',
                'Unable to get your current location. Please check your location settings.',
            );
        }
    };

    const changeNavigation = (page: string) => {
        navigation.navigate(page);
    };

    const onMapReady = () => {
        console.log('[MapScreen] Map is ready!');
        setMapReady(true);
    };

    // Don't specify provider - let react-native-maps use the default
    // On Android this uses Google Maps, on iOS it uses Apple Maps
    console.log('[MapScreen] Rendering map, region:', region);

    return (
        <View style={styles.container}>
            <TopBar />

            <View style={styles.mapContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.black} />
                        <Text style={styles.loadingText}>Loading map...</Text>
                    </View>
                ) : (
                    <>
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_GOOGLE}
                            style={{ width: '100%', height: '100%' }}
                            initialRegion={region}
                            showsUserLocation={true}
                            showsMyLocationButton={false}
                            showsCompass={true}
                            showsScale={true}
                            onMapReady={onMapReady}
                        >
                            {/* Test Marker at a famous location to verify rendering */}
                            <Marker
                                coordinate={{ latitude: 48.8584, longitude: 2.2945 }}
                                title="Eiffel Tower"
                                description="If you see this, the map engine is working"
                            />
                            {userLocation && (
                                <Marker
                                    coordinate={userLocation}
                                    pinColor={COLORS.red}
                                >
                                    <Callout>
                                        <View style={styles.calloutContainer}>
                                            <Text style={styles.calloutTitle}>You are here</Text>
                                            <Text style={styles.calloutSubtitle}>
                                                Find beauty artists near you
                                            </Text>
                                        </View>
                                    </Callout>
                                </Marker>
                            )}
                        </MapView>

                        {/* Map Controls */}
                        <View style={styles.controlsContainer}>
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={centerOnUser}
                                activeOpacity={0.7}
                            >
                                <Icon
                                    name="my-location"
                                    type="material"
                                    size={24}
                                    color={COLORS.black}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Map Info Banner */}
                        <View style={styles.infoBanner}>
                            <Icon
                                name="info-outline"
                                type="material"
                                size={20}
                                color={COLORS.greyTxt}
                            />
                            <Text style={styles.infoText}>
                                {Platform.OS === 'ios'
                                    ? 'Using Apple Maps'
                                    : 'Using Google Maps'}
                                {mapReady ? ' (Ready)' : ' (Loading...)'}
                            </Text>
                        </View>

                        {locationPermissionDenied && (
                            <View style={styles.permissionBanner}>
                                <Text style={styles.permissionText}>
                                    Location access denied. Enable it in settings to see your location.
                                </Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={requestLocationPermission}
                                >
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </View>

            <BottomBar navigation={changeNavigation} page={screenNames.MAP_SCREEN} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    mapContainer: {
        flex: 1,
        marginBottom: mvs(60), // Space for bottom bar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
    },
    loadingText: {
        marginTop: mvs(10),
        fontSize: SIZES.f14,
        fontFamily: FONTS.medium,
        color: COLORS.darkTxt,
    },
    controlsContainer: {
        position: 'absolute',
        right: ms(15),
        bottom: mvs(20),
    },
    controlButton: {
        backgroundColor: COLORS.white,
        width: ms(48),
        height: ms(48),
        borderRadius: ms(24),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    infoBanner: {
        position: 'absolute',
        top: mvs(10),
        left: ms(15),
        right: ms(15),
        backgroundColor: COLORS.white,
        paddingVertical: mvs(8),
        paddingHorizontal: ms(12),
        borderRadius: ms(8),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    infoText: {
        marginLeft: ms(8),
        fontSize: SIZES.f12,
        fontFamily: FONTS.regular,
        color: COLORS.greyTxt,
    },
    calloutContainer: {
        padding: ms(5),
        minWidth: ms(120),
    },
    calloutTitle: {
        fontSize: SIZES.f14,
        fontFamily: FONTS.semiBold,
        color: COLORS.darkTxt,
    },
    calloutSubtitle: {
        fontSize: SIZES.f12,
        fontFamily: FONTS.regular,
        color: COLORS.greyTxt,
        marginTop: mvs(2),
    },
    permissionBanner: {
        position: 'absolute',
        bottom: mvs(30),
        left: ms(15),
        right: ms(15),
        backgroundColor: COLORS.lightRed,
        paddingVertical: mvs(12),
        paddingHorizontal: ms(15),
        borderRadius: ms(10),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    permissionText: {
        flex: 1,
        fontSize: SIZES.f12,
        fontFamily: FONTS.regular,
        color: COLORS.darkTxt,
        marginRight: ms(10),
    },
    retryButton: {
        backgroundColor: COLORS.black,
        paddingVertical: mvs(6),
        paddingHorizontal: ms(12),
        borderRadius: ms(5),
    },
    retryButtonText: {
        fontSize: SIZES.f12,
        fontFamily: FONTS.medium,
        color: COLORS.white,
    },
});

export default MapScreen;
