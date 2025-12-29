import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  ScrollView, // Import ScrollView,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Buffer } from 'buffer';
import TopBar from '../components/TopBar';
import { createThumbnail } from 'react-native-create-thumbnail';
import { Icon } from '@rneui/base';
import { Overlay } from '@rneui/themed';

import image1 from '../assets/ref1.png';

import image2 from '../assets/ref2.png';

import image3 from '../assets/ref3.png';

import image4 from '../assets/ref4.png';
import RNFetchBlob from 'rn-fetch-blob';
// Removed client-side AWS SDK usage. Uploads must be proxied to backend via `uploadToS3`.
import { API_URL } from '../store/url';
import axiosInstance from '../services/axiosInterceptor';
import { requestUserPermission } from '../services/NotificationService';
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';
import { uploadToS3 } from '../services/S3UploadService';
import UserContext from './UserContext';
import screenNames from '../constants/screenNames';
import Entypo from "react-native-vector-icons/Entypo"
import MIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { COLORS } from '../style/theme';
import { GlobalStyles } from '../style/GlobalStyles';
import { ms } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');


// AWS config removed from client. Backend holds S3 credentials and performs uploads.

const ApplicationReviewPage = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoUri, setVideoUri] = useState('');
  const carouselRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUploadedVideo, setUploaded] = useState(false);
  const [videoError, setVideoError] = useState();

  const { updateUser } = useContext(UserContext);

  const navigation = useNavigation();
  // const APIBASEURL = 'http://164.52.197.9:3001';

  // S3 credentials and client removed from client-side code. Use `uploadToS3` which proxies uploads to the backend.

  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', () => {
      onRefresh()
      updateFcmToken();
      checkApplicationPermission()
    })

    return () => {
      unsubscribe();
    }
  }, [])

  const checkApplicationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch (error) {
      }
    }
  }




  const updateFcmToken = async () => {
    try {

      const id = await AsyncStorage.getItem("id")
      const fcmToken = await AsyncStorage.getItem("fcmToken");
      console.log('fcmToken Artist >>>', fcmToken)
      if (!fcmToken) {
        requestUserPermission();
        setTimeout(() => {
          updateFcmToken();

        }, 1000);
        // return
      } else {

        const request = {
          "userId": id,
          "deviceId": Platform.OS == "ios" ? DeviceInfo.getDeviceId() : await DeviceInfo.getAndroidId(),
          "deviceType": Platform.OS,
          "deviceToken": fcmToken
        }

        console.log('request updateFcmToken >>>', request)
        const response = await axiosInstance.post(`/manageDevice`, request);
        console.log('response?.data', response?.data)
      }

    } catch (error) {

    }

  }


  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const getLocalStorage = async () => {
    const id = await AsyncStorage.getItem('id');
    const artistName = await AsyncStorage.getItem('artistName');
    const isArtistDataUploaded = await AsyncStorage.getItem(
      'isArtistDataUploaded',
    );
    if (isArtistDataUploaded) {
      setUploaded(true);
    }
    setName(artistName);
    setId(id);
  };

  const onRefresh = async () => {
    try {

      const id = await AsyncStorage.getItem('id');
      const response = await axiosInstance.get(`/get-artistdetails?artistId=${id}`);
      const data = response?.data?.data || "";

      console.log('data >>>', data)

      if (data) {
        updateUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          mobile:data?.mobile,
          profileImage: data.profileImage,
          userType: 'Artist',
        });

        if (data?.isApproved == 1) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: screenNames.ARTIST_HOME,
                params: {
                  hasMobile: true,
                },
              },
            ],
          });
        }
      }

    } catch (error) {
      console.log('error', error)
    }

  }



  useEffect(() => {
    getLocalStorage();
  }, []);

  const updateArtist = async () => {
    console.log('updateArtist');
    try {
      if (!imageUrl) {
        setVideoError('Please upload the video');
        setTimeout(() => {
          setVideoError();
        }, 3000);
        return;
      }
      console.log(imageUrl);
      const response = await axiosInstance.post(`/update-artist-video`, {
        videos: [imageUrl],
        id: id,
      });
      console.log(
        '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-',
        JSON.stringify(response.data),
      );
      if (response.status === 200) {
        setUploaded(true);
        await AsyncStorage.setItem('isArtistDataUploaded', 'true');
      }
      console.log('Response:', response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const renderSampleItem = ({ item }) => (
    <Image source={item} style={styles.sampleImage} resizeMode="cover" />
  );

  const images = [image1, image2, image3, image4];

  const openFileStorage = async () => {
    try {
      const options = {
        mediaType: 'video',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        thumbnail: true,
      };
      launchImageLibrary(options, async response => {
        setVisible(false);
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('Image picker error: ', response.error);
        } else {
          setIsLoading(true)
          console.log('Response = ', response);
          let imageUri = response.uri || response.assets?.[0]?.uri;
          createThumbnail({
            url: imageUri,
            timeStamp: 0,
          })
            .then(response => {
              setVideoThumbnail(response.path);
              console.log(response);
            })
            .catch(err => console.log({ err }));
          setImageUri(imageUri);
          const id = await AsyncStorage.getItem("id")
          // const imgUrl = await handleUpload(response.assets[0]);
          const imgUrl = await uploadToS3(response.assets[0],`video_${id}`);
          setIsLoading(false)
          setImageUrl(imgUrl);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  // const handleUpload = async file => {
  //   setIsLoading(true);
  //   const fs = RNFetchBlob.fs;
  //   const fileData = await fs.readFile(
  //     Platform.OS == 'android' ? file.uri : file.uri.replace('file://', ''),
  //     'base64',
  //   );
  //   const buffer = Buffer.from(fileData, 'base64');
  //   const parts = file?.type?.split('/');

  //   const uploadParams = {
  //     Bucket: 'flawless-dev',
  //     Key: `${parts[0]}/${Date.now().toString() + file?.fileName}`,
  //     Body: buffer,
  //     ContentType: file.type,
  //   };

  //   try {
  //     const uploader = new Upload({
  //       client,
  //       params: uploadParams,
  //     });
  //     console.log('uploader.on');
  //     uploader.on('httpUploadProgress', progress => {
  //       if (progress.total) {
  //         const percentage = Math.floor(
  //           (progress.loaded / progress.total) * 100,
  //         );
  //         console.log(
  //           `Uploaded: ${progress.loaded} bytes of ${progress.total},`,
  //         );
  //         console.log(`Upload progress: ${percentage}%`);
  //       } else {
  //         console.log('Progress event received, but total size is undefined.');
  //       }
  //     });

  //     // Perform the upload
  //     console.log('upload starts', uploadParams.Key);
  //     const data = await uploader.done();
  //     console.log('upload complete', data);
  //     const uploadedFileUrl = data.Location;
  //     setIsLoading(false);
  //     return uploadedFileUrl;
  //   } catch (e) {
  //     setIsLoading(false);
  //     console.log('err', e);
  //   }
  // };

  const openCamera = async () => {
    const isCameraPermitted =
      Platform.OS == 'android' ? await requestCameraPermission() : true;
    const isStoragePermitted =
      Platform.OS == 'android'
        ? await requestExternalStoragePermission()
        : true;
    if (isCameraPermitted && isStoragePermitted) {
      console.log('open camera');
      const options = {
        mediaType: 'video',
        cameraType: 'back',
      };
      launchCamera(options, async response => {
        setVisible(false);
        if (response.didCancel) {
          console.log('User cancelled video picker');
        } else if (response.error) {
          console.log('Video Picker Error: ', response.error);
        } else {
          setIsLoading(true)
          console.log('Response = ', response);
          createThumbnail({
            url: response.assets[0].uri,
            timeStamp: 0,
          })
            .then(response => {
              setVideoThumbnail(response.path);
              console.log(response);
            })
            .catch(err => console.log({ err }));
          setImageUri(response.assets[0].uri);
          const id = await AsyncStorage.getItem("id")
          // const imgUrl = await handleUpload(response.assets[0]);
          const imgUrl = await uploadToS3(response.assets[0],`video_${id}`);
          setIsLoading(false)
          setImageUrl(imgUrl);
        }
      });
    }
  };
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
  const removeVideo = () => {
    setVideoThumbnail(null);
    setImageUrl(null);
  };


  const handleRedirect=(url)=>{

     Linking.openURL(url).catch(err => console.error('Error:', err));

  }

  //   const uploadToS3 = async (file) => {

  //     try {
  //       setIsLoading(true);
  //       const fileName = file?.fileName;
  //       const response = await fetch(file?.uri);
  //       const blob = await response.blob();
  //       const fileType = file.type ;


  //       const uploadParams = {
  //         Bucket: 'mmobileapp/music',
  //         Key: fileName,
  //         Body: blob,
  //         ContentType: fileType,
  //         ACL: "public-read"
  //       };

  // console.log("uploadParams >>>>",uploadParams)
  //       // Wrap the upload method in a Promise
  //       const result = await new Promise((resolve, reject) => {
  //         s3.upload(uploadParams, (err, data) => {
  //           if (err) {
  //             console.error(`Error uploading file ${file.type}:`, err);
  //             setIsLoading(false);
  //             reject(err);
  //           } else {
  //             // console.log(`Successfully uploaded ${file.type}:`, data?.Location);
  //             setIsLoading(false);
  //             console.log('data.Location', data?.Location)
  //             resolve(data?.Location);
  //           }
  //         });
  //       });
  // console.log('result', result)
  //       return result; // Return the uploaded file URL
  //     } catch (error) {
  //       console.error('Error in uploadToS3:', error);
  //       setIsLoading(false);
  //       throw error; // Propagate the error to the caller
  //     }
  //   };
  return (
    <View style={{ backgroundColor: '#FFF', flex: 1 }}>
      {isLoading && (
        <Modal animationType="fade" transparent={true}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}>
            <ActivityIndicator size={'large'} color={'#FFF'} />
          </View>
        </Modal>
      )}
      <TopBar navigation={navigation} />
      <View style={{ flexGrow: 1, backgroundColor: '#FFF', marginBottom: 40 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} refreshControl={
          <RefreshControl onRefresh={onRefresh} refreshing={false} />
        }>
          <View style={styles.container}>
            <Text style={styles.heading}>Application Review</Text>
            <Image
              source={require('../assets/search-board.png')} // Replace with the actual path to your image file
              style={styles.image}
            />

            <View style={styles.card}>
              <View
                style={{
                  alignItems: 'flex-start',
                }}>
                <Text
                  style={{
                    ...styles.cardText,
                    ...{ fontWeight: '500' },
                  }}>
                  Hi {name},
                </Text>
                <Text style={{ ...styles.cardText, marginVertical: 20 }}>
                  Your registration form is being reviewed by our team. We'll
                  keep you informed as soon as we can.
                </Text>
              </View>
              <Text
                style={{
                  ...styles.cardText,
                  ...{ fontWeight: '500', fontSize: 18 },
                }}>
                Thank You!
              </Text>
            </View>

            {/* Follow Us Section */}
            {hasUploadedVideo && (
              <View style={{ width: width, paddingHorizontal: 30 }}>
                <Text style={styles.followText}>
                  Meanwhile, follow us on social media.
                </Text>
                {/* <Text style={styles.clickHere}>click here</Text> */}
                <View style={{marginTop:15,...GlobalStyles.rowCenter}} >
                  <TouchableOpacity onPress={()=>handleRedirect("https://www.instagram.com/totallyflawlessapp/?igsh=MXVzaDZkMHhlazAzdA%3D%3D#")}>
                      <Entypo name='instagram' size={25} color={COLORS.yellow}/>
                  </TouchableOpacity>
                  <TouchableOpacity style={{marginHorizontal:ms(15)}} onPress={()=>handleRedirect("https://www.facebook.com/profile.php?id=100075869112808&mibextid=wwXIfr&rdid=LyCBOBki68R7XRbG&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1A81ew11hE%2F%3Fmibextid%3DwwXIfr#")}>
                      <Entypo name='facebook' size={25} color={COLORS.yellow}/>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>handleRedirect("https://totallyflawless.co/")}>
                      <MIcons name='web' size={28} color={COLORS.yellow}/>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!hasUploadedVideo && !isModalVisible && (
              <View
                style={{
                  width: width,
                  paddingHorizontal: 30,
                  marginBottom: 10,
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}>
                <Text style={styles.uploadPrompt}>
                  Upload a short video presentation.
                </Text>
                <Icon
                  onPress={toggleModal}
                  color={'rgba(0, 148, 255, 1)'}
                  iconStyle={{ padding: 0 }}
                  style={{
                    padding: 0,
                    zIndex: 2,
                    marginLeft: 5,
                  }}
                  name="information-outline"
                  size={20}
                  type="material-community"
                />
              </View>
            )}

            {/* Conditional Rendering for Video Upload */}

            {/* Modal for Samples Slider */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={isModalVisible}
              onRequestClose={toggleModal}>
              <View style={styles.modalContainer}>
                <View style={styles.modalView}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}>
                    <Text style={styles.modalHeading}>Reference Images</Text>
                    <Pressable onPress={() => setModalVisible(!isModalVisible)}>
                      <Text style={styles.closeText}>X</Text>
                    </Pressable>
                  </View>
                  <Carousel
                    ref={carouselRef}
                    data={images}
                    renderItem={renderSampleItem}
                    sliderWidth={width}
                    itemWidth={width * 0.8}
                    onSnapToItem={index => setActiveIndex(index)}
                  />
                  <View style={styles.dotContainer}>
                    {images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              index === activeIndex ? '#000' : '#ccc',
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </Modal>

            {/* Upload Section */}
            {!hasUploadedVideo && (
              <View
                style={{
                  padding: 15,
                  backgroundColor: '#F0F0F0',
                  width: width / 1.9,
                  justifyContent: 'left',
                  marginTop: 18,
                  alignItems: 'center',
                  borderRadius: 6,
                  alignSelf: 'flex-start',
                  marginLeft: Platform.OS == 'android' ? 50 : 30,
                  marginBottom: 20,
                }}>
                <TouchableOpacity onPress={() => setVisible(!visible)}>
                  {videoThumbnail ? (
                    <>
                      <Image
                        source={{ uri: videoThumbnail }}
                        style={{
                          height: 75,
                          width: 75,
                          borderRadius: 4,
                        }}
                      />
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#000',
                          width: 'auto',
                          borderRadius: 50,
                          width: 25,
                          height: 25,
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          zIndex: 99,
                        }}
                        onPress={() => removeVideo()}>
                        <Icon
                          color="#FFF"
                          name="close-thick"
                          size={18}
                          type="material-community"
                        />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Image
                      source={require('../assets/uploadImageIcon.png')}
                      style={{ height: 75, width: 75 }}
                    />
                  )}
                  <Text
                    style={{
                      textAlign: 'center',
                      color: '#565656',
                    }}>
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {videoError && (
              <Text
                style={{
                  width: width / 1.9,
                  textAlign: 'center',
                  color: 'red',
                  alignSelf: 'flex-start',
                  marginLeft: 30,
                  marginBottom: 20,
                }}>
                {videoError}
              </Text>
            )}
            {!hasUploadedVideo && (
              <TouchableOpacity
                onPress={updateArtist}
                style={{
                  width: width * 0.4,
                  backgroundColor: '#000',
                  padding: 20,
                  marginTop: 15,
                  marginBottom: 20,
                  borderRadius: 40,
                }}>
                <View>
                  <Text style={{ color: '#FFF', textAlign: 'center' }}>
                    Upload
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        <Overlay
          isVisible={visible}
          onBackdropPress={() => setVisible(!visible)}>
          <View style={{ width: width / 1.5, padding: 10 }}>
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
        <Toast />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 20,
    textAlign: 'center',
    color: '#333',
  },
  image: {
    marginBottom: 30,
    objectFit: 'contain',
    height: 150,
  },
  card: {
    textAlign: 'left',
    alignItems: 'center',
    width: '100%',
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    padding: 20,
    marginBottom: 30,
  },
  cardText: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'left',
    color: '#000',
  },
  followText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'left',
  },
  clickHere: {
    fontSize: 16,
    color: '#D79F0E',
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  uploadPrompt: {
    fontSize: 16,
    color: '#000',
    textAlign: 'left',
  },
  seeSamples: {
    color: '#D79F0E',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    width: '90%',
    height: height * 0.5,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#000',
  },
  modalHeading: {
    width: '90%',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  sampleImage: {
    width: '98%',
    height: '100%',
    borderRadius: 10,
    marginBottom: 10,
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default ApplicationReviewPage;
