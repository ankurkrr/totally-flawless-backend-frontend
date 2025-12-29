import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Dimensions, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { COLORS, SIZES } from '../style/theme'
import { Icon } from '@rneui/base';
import { useNavigation } from '@react-navigation/native';
import Icons from 'react-native-vector-icons/Entypo'
import MIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ms, mvs } from 'react-native-size-matters';
import { GlobalStyles } from '../style/GlobalStyles';
import { Overlay } from '@rneui/themed';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadToS3 } from '../services/S3UploadService';
import axiosInstance from '../services/axiosInterceptor';
import { Loader } from './components';
import { FlatList } from 'react-native';
import CustomImageView from '../components/CustomImageView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../components/Toast';

type Props = {}
const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3; // 3-column grid

const MyGallery = (props: Props) => {

    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false)
    const [galleryData, setGalleryData] = useState<any[]>([])
    const [imageVisible, setImageVisible] = useState(false);
    const [imageData, setImageData] = useState<any[]>([])
    const [imgIndex, setImgIndex] = useState(0)

    const navigation = useNavigation<any>();

    useEffect(() => {

        const unsubscribe = navigation.addListener('focus', () => {
            setLoading(true)
            getData();
        })

        return () => {
            unsubscribe();
        }
    }, [])


    const getData = async () => {

        try {
            const id = await AsyncStorage.getItem("id")
            const response = await axiosInstance.get(`/gallery/${id}`);
            console.log(response?.data?.gallery)
            if (response?.data?.gallery && response?.data?.gallery?.length > 0) {

                setGalleryData(response?.data?.gallery);
                const data = response?.data?.gallery?.map((item: any) => {
                    return {
                        uri: item?.image
                    }
                })
                setImageData(data)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            setGalleryData([])
            setImageData([])
            console.log('error >>>', error)
        }
    }


    const requestCameraPermission = async () => {
        try {
            console.log('check camera');
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'App needs camera permission',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    const requestExternalStoragePermission = async () => {
        try {
            if (Number(Platform.Version) >= 33) {
                return true;
            }
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'External Storage Write Permission',
                    message: 'App needs write permission',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            console.log(granted);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.log(err);
            return false;
        }
    };

    const openCamera = async () => {
        const isCameraPermitted =
            Platform.OS == 'android' ? await requestCameraPermission() : true;
        const isStoragePermitted =
            Platform.OS == 'android'
                ? await requestExternalStoragePermission()
                : true;
        if (isCameraPermitted && isStoragePermitted) {
            console.log('open camera');
            const options: any = {
                mediaType: 'photo',
                cameraType: 'back',
            };
            launchCamera(options, async (response: any) => {
                setVisible(false);
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.error) {
                    console.log('ImagePicker Error: ', response.error);
                } else {
                    console.log('Response = ', response);
                    setVisible(false)
                    setLoading(true)
                    // const id = await AsyncStorage.getItem("id");
                    const imgUrl = await uploadToS3(response.assets[0]);
                    handleAddPhoto([imgUrl])
                    console.log('imgUrl', imgUrl)
                    // Handle the response (e.g., display the image or upload it)
                }
            });
        }
    };

    const openFileStorage = async () => {
        try {
            const options: any = {
                mediaType: 'photo',
                selectionLimit:5,
                includeBase64: false,
                maxHeight: 2000,
                maxWidth: 2000,
            };
            launchImageLibrary(options, async (response: any) => {
                setVisible(false);
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.error) {
                    console.log('Image picker error: ', response.error);
                } else {
                    setVisible(false)
                    setLoading(true)

                    // const imgUrl = await uploadToS3(response.assets[0]);
                    const imgUrls = await uploadMultipleImages(response.assets);
                    console.log('imgUrl launchImageLibrary >>>', imgUrls)
                    handleAddPhoto(imgUrls)
                }
            });
        } catch (error) {
            console.log(error);
        }
    };

    const uploadMultipleImages = async (assets:any) => {
        try {
          const uploadPromises = assets.map(async (asset:any) => {
            return await uploadToS3(asset);
          });
      
          const imgUrls = await Promise.all(uploadPromises);
          console.log("Uploaded Images:", imgUrls);
          return imgUrls; // Returns an array of image URLs
        } catch (error) {
          console.error("Error uploading images:", error);
          return [];
        }
      };

      const handleAddPhoto = async (imgUrls: string[]) => {
        try {
            if (!imgUrls || imgUrls.length === 0) {
                console.error("No images to upload.");
                return;
            }
    
            const id = await AsyncStorage.getItem("id");
            if (!id) {
                console.error("User ID not found in AsyncStorage.");
                return;
            }
    
            // Prepare requests for multiple images
            const uploadRequests = imgUrls.map((imgUrl) => {
                const request = {
                    userId: id,
                    image: imgUrl, // Use imgUrl from the uploaded images
                };
    
                return axiosInstance.post(`/add/gallery`, request);
            });
    
            // Execute all requests concurrently
            const responses = await Promise.all(uploadRequests);
    
            // Check if all uploads were successful
            const allSuccessful = responses.every(
                (response) => response?.status === 200 || response?.status === 201
            );
    
            if (allSuccessful) {
                showToast("Photos uploaded successfully");
                getData(); // Refresh data
            } else {
                console.error("Some images failed to upload.");
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.error("handleAddPhoto error >>>", error);
        }
    };
    
    const handleDelete = async (itemId: any) => {

        try {
            setLoading(true)
            const response = await axiosInstance.delete(`/delete/gallery/${itemId}`)
            console.log('handleAddPhoto response?.data >>>', response?.status)
            if (response?.status == 201 || response?.status == 200) {
                showToast("Photo deleted");

                getData()
            }
            setLoading(false)
        } catch (error) {
            console.error('handleAddPhoto error>>>', error)
        }
    }

    return (
        <View style={{ flex: 1 }} >

            <Loader loading={loading} />

            {/* Header */}
            <View
                style={{
                    backgroundColor: 'white',
                    height: mvs(50),
                    paddingHorizontal: 15,

                }}>
                <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 15 }}>
                    <View>
                        <Icon
                            color="#000"
                            name="arrow-back-ios"
                            onPress={() => navigation.goBack()}
                            size={25}
                            type="material"
                        />
                    </View>
                    <View style={{ justifyContent: 'center', paddingLeft: 10 }}>
                        <Text
                            style={{
                                color: 'black',
                                fontSize: 18,
                                fontWeight: 700,
                                fontFamily: 'Poppins-Regular',
                            }}>
                            My Gallery
                        </Text>
                    </View>
                </View>


            </View>

            <View style={{ flex: 1, backgroundColor: 'white', }} >

                {/* Gallery List */}


                <FlatList
                    data={galleryData}
                    keyExtractor={(item) => `${item.id}`}
                    style={{ flex: 1, }}
                    contentContainerStyle={{ marginLeft: ms(10), paddingBottom: mvs(80) }}
                    numColumns={3}
                    ListEmptyComponent={<View style={{ alignSelf: 'center', marginTop: mvs(200) }} >
                        <Text style={[GlobalStyles.txtR14Dark, {}]} >Photos not added yet.</Text>
                    </View>}
                    renderItem={({ item, index }) => {
                        // console.log('item', item)
                        return (
                            <View style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, }}>

                                <TouchableOpacity style={styles.deleteView} onPress={() => handleDelete(item?.id)}>
                                    <MIcons name='delete' size={20} color={COLORS.red} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => {
                                    setImgIndex(index)
                                    setImageVisible(true)
                                }}>
                                    <Image source={{ uri: item?.image }}
                                        style={{ width: IMAGE_SIZE - 20, height: IMAGE_SIZE - 20 }} resizeMode='cover' />
                                </TouchableOpacity>

                            </View>
                        )
                    }
                    }
                />




            </View>


            <View style={styles.btnContainer} >
                <TouchableOpacity style={styles.btnStyle} onPress={() => setVisible(true)}>
                    <Icons name='plus' size={40} color={COLORS.white} />
                </TouchableOpacity>
            </View>
            {
                imageVisible &&

                <CustomImageView
                    imageVisible={imageVisible}
                    index={imgIndex}
                    imgData={imageData}
                    imageVisibleFunction={() => {
                        setImageVisible(false)
                    }}
                />
            }


            <Overlay
                isVisible={visible}
                onBackdropPress={() => setVisible(false)}>
                <View style={{ width: SIZES.width / 1.5, padding: 10 }}>
                    <View style={{ marginVertical: 5 }}>
                        <Text style={{ textAlign: 'center' }}>Action for Image upload</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => openCamera()}
                        style={{
                            padding: 10,
                            borderWidth: 0.5,
                            marginVertical: 5,
                            backgroundColor: 'black',
                        }}>
                        <Text style={{ textAlign: 'center', color: '#FFF' }}>
                            Open Camera
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => openFileStorage()}
                        style={{
                            padding: 10,
                            borderWidth: 0.5,
                            marginVertical: 5,
                            backgroundColor: 'black',
                        }}>
                        <Text style={{ textAlign: 'center', color: '#FFF' }}>
                            Open Gallery
                        </Text>
                    </TouchableOpacity>
                </View>
            </Overlay>



        </View>
    )
}

const styles = StyleSheet.create({
    btnContainer: {
        position: 'absolute',
        bottom: mvs(20),
        right: ms(20)
    },
    btnStyle: {
        height: 60,
        width: 60,
        borderRadius: 30,
        backgroundColor: COLORS.yellow,
        ...GlobalStyles.alignJustifyCenter
    },
    deleteView: {
        position: 'absolute',
        top: 5,
        right: 20,
        zIndex: 1,
        ...GlobalStyles.alignJustifyCenter
    }
})

export default MyGallery