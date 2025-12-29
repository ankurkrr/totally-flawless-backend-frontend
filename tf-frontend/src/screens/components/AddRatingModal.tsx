import { View, Text, TouchableOpacity, TextInput, Keyboard, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import ReactNativeModal from 'react-native-modal'
import { styles } from './style'
import { COLORS, SIZES } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import { GlobalStyles } from '../../style/GlobalStyles'
import Icons from 'react-native-vector-icons/AntDesign'
import { acceptsDigitsOnlyInString } from '../../services/utils'
import { showToast } from '../../components/Toast'
import CommonSvg from '../../components/CommonSvg'
import CustomStarRating from '../../components/CustomStarRating'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

type Props = {
    visible: boolean,
    isEdited?: boolean,
    data?: any,
    visibleFunction: (visible: boolean) => void,
    onSelect?: (selected: string) => void
}

const AddRatingModal = ({ visible, visibleFunction, data, onSelect, isEdited = true }: Props) => {

    const [modalVisible, setModalVisible] = useState<any>(visible);
    const [rating, setRating] = useState(0)
    const [howService, setHowService] = useState("");
    const [howArtist, setHowArtist] = useState("")

    useEffect(() => {

        setRating(data?.rate)
        setHowService(data?.how_ser || "")
        setHowArtist(data?.how_art || "")

    }, [data])


    const handleClose = () => {
        visibleFunction(false)
        setModalVisible(false)
    }

    const handleDone = () => {
        handleClose()
        onSelect(rating, { howService, howArtist })
    }

    return (
      
        <ReactNativeModal
            isVisible={modalVisible}
            //  swipeDirection={"down"}
            backdropOpacity={1}
            backdropColor={'rgba(0,0,0,0.5)'}
            onBackdropPress={handleClose}
            
            //  onSwipeComplete={handleClose}
            // avoidKeyboard={true}
        >
             <KeyboardAwareScrollView style={{flex:1}} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            <View style={[styles.modalContainer]}>



                <View style={{ ...styles.modalInnerContainer, width: SIZES.cardWidth, paddingVertical: mvs(0), }} >

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { paddingHorizontal: ms(20), paddingVertical: mvs(15) }]} >
                        <View />
                        <View>
                            <Text style={[GlobalStyles.txtSB16Dark, {}]} >{isEdited ? "Add" : ""} Review & Rating</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <Icons name='close' size={22} color={COLORS.darkTxt} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.graInputContainer, { marginVertical: mvs(0), marginBottom: mvs(20) }]} >
                        <Text style={[GlobalStyles.txtSB14Dark, {}]} >{data?.title}</Text>
                        <View style={[GlobalStyles.rowCenter, { marginVertical: 10 }]} >
                            <CommonSvg.userBooking />
                            <Text style={[GlobalStyles.txtL12Dark, { marginHorizontal: 5 }]} >{data?.name}</Text>
                        </View>

                        {
                            !isEdited ?

                                <>
                                    <Text style={[GlobalStyles.txtL12Dark, {}]} >How was your service?</Text>
                                    <ScrollView style={{ height: mvs(130),borderRadius:ms(10), backgroundColor: '#E8E8E8', }} contentContainerStyle={{paddingVertical:5}} >
                                        <Text style={[styles.serviceText, {}]} >{howService}</Text>
                                    </ScrollView>
                                    <Text style={[GlobalStyles.txtL12Dark, { marginTop: mvs(10) }]} >How was your artist?</Text>
                                    <ScrollView style={{ height: mvs(130),borderRadius:ms(10), backgroundColor: '#E8E8E8',}} contentContainerStyle={{paddingVertical:5}}>
                                        <Text style={[styles.serviceText, {}]} >{howArtist}</Text>
                                    </ScrollView>
                                </>
                                :
                                <>
                                    <TextInput
                                        editable={isEdited}
                                        style={styles.input}
                                        placeholder="How was your service?"
                                        placeholderTextColor="#888"
                                        multiline
                                        value={howService}
                                        onChangeText={setHowService}
                                    />

                                    <View style={{ height: 5 }} />

                                    <TextInput
                                        editable={isEdited}
                                        style={styles.input}
                                        placeholder="How was your artist?"
                                        placeholderTextColor="#888"
                                        multiline
                                        value={howArtist}
                                        onChangeText={setHowArtist}
                                    />
                                </>

                        }

                        <Text style={[GlobalStyles.txtL12Dark, { marginTop: mvs(10), marginBottom: 5 }]} >{isEdited ? "Share Your" : "User"} Rating</Text>

                        <CustomStarRating
                            rate={rating}
                            starSize={30}
                            containerStyle={{ padding: 0 }}
                            handleRate={(star) => {
                                setRating(star)
                            }}
                            disabled={!isEdited}
                        />
                    </View>
                    {
                        isEdited ?

                            <TouchableOpacity style={[GlobalStyles.buttonWithoutBorder, styles.doneBtn]} onPress={() => handleDone()}>
                                <Text style={[GlobalStyles.txtM14Dark, {}]} >Done</Text>
                            </TouchableOpacity>
                            :
                            <TouchableOpacity style={[GlobalStyles.buttonWithoutBorder, styles.doneBtn]} onPress={handleClose}>
                                <Text style={[GlobalStyles.txtM14Dark, {}]} >Close</Text>
                            </TouchableOpacity>
                    }


                </View>
             
            </View>
      </KeyboardAwareScrollView>
        </ReactNativeModal>
       
    )
}

export default AddRatingModal