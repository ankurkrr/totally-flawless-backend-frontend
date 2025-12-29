import { View, Text, TouchableOpacity, TextInput, Keyboard } from 'react-native'
import React, { useState } from 'react'
import ReactNativeModal from 'react-native-modal'
import { styles } from './style'
import { COLORS, SIZES } from '../../style/theme'
import { ms, mvs } from 'react-native-size-matters'
import { GlobalStyles } from '../../style/GlobalStyles'
import Icons from 'react-native-vector-icons/AntDesign'
import { acceptsDigitsOnlyInString } from '../../services/utils'
import { showToast } from '../../components/Toast'

type Props = {
    visible: boolean,
    selectedState?: string,
    visibleFunction: (visible: boolean) => void,
    onSelect?: (selectedGratuity:any,selected: string) => void
}

const AddGratuityModal = ({ visible, visibleFunction, onSelect }: Props) => {

    const [modalVisible, setModalVisible] = useState<any>(visible);
    const [selectedGratuity, setSelectedGratuity] = useState(0);
    const [gratuity, setGratuity] = useState("")

    const handleClose = () => {
        visibleFunction(false)
        setModalVisible(false)
    }

    const isSelected = (gratuity: any) => {

        return selectedGratuity == gratuity;
    }


    const handleDone = (gt: any) => {
        if ((!gt||gt==0) && selectedGratuity == 0) {
            showToast("Please enter gratuity")
            return
        }
       
        onSelect(selectedGratuity,gratuity)
        handleClose()
    }


    return (
        <ReactNativeModal
            isVisible={modalVisible}
            //  swipeDirection={"down"}
            backdropOpacity={1}
            backdropColor={'rgba(0,0,0,0.5)'}
            onBackdropPress={handleClose}
            //  onSwipeComplete={handleClose}
            avoidKeyboard={true}
        >
            <View style={[styles.modalContainer]}>
                <View style={{ ...styles.modalInnerContainer, width: SIZES.cardWidth, paddingVertical: mvs(0), }} >

                    <View style={[GlobalStyles.rowCenterSpaceBetween, { paddingHorizontal: ms(20), paddingVertical: mvs(15) }]} >
                        <View />
                        <View>
                            <Text style={[GlobalStyles.txtSB16Dark, {}]} >Add Gratuity</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <Icons name='close' size={22} color={COLORS.darkTxt} />
                        </TouchableOpacity>
                    </View>

                    <View style={[GlobalStyles.rowCenter, { paddingLeft: ms(10) }]} >
                        <TouchableOpacity style={[GlobalStyles.button, {
                            backgroundColor: isSelected(15) ? COLORS.darkTxt : COLORS.transparent,
                            width: ms(60), marginLeft: ms(10)
                        }]} onPress={() => setSelectedGratuity(15)}>
                            <Text style={[GlobalStyles.txtM14Dark, {
                                color: isSelected(15) ? COLORS.white : COLORS.darkTxt
                            }]} >15%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[GlobalStyles.button, {
                            backgroundColor: isSelected(20) ? COLORS.darkTxt : COLORS.transparent,
                            width: ms(60), marginLeft: ms(10)
                        }]} onPress={() => setSelectedGratuity(20)}>
                            <Text style={[GlobalStyles.txtM14Dark, {
                                color: isSelected(20) ? COLORS.white : COLORS.darkTxt
                            }]} >20%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[GlobalStyles.button, {
                            backgroundColor: isSelected(0) ? COLORS.darkTxt : COLORS.transparent,
                            width: ms(70), marginLeft: ms(10)
                        }]} onPress={() => setSelectedGratuity(0)}>
                            <Text style={[GlobalStyles.txtM14Dark, {
                                color: isSelected(0) ? COLORS.white : COLORS.darkTxt
                            }]} >Custom</Text>
                        </TouchableOpacity>
                    </View>
                        {
                            isSelected(0) &&
                            <View style={styles.graInputContainer} >
                            <Text style={[GlobalStyles.txtM14Dark, {}]} >Enter gratuity amount (in $)</Text>
    
                            <TextInput
                                value={gratuity}
                                style={[styles.gratuityInput, GlobalStyles.txtSB16Dark]}
                                onChangeText={(text) => setGratuity(acceptsDigitsOnlyInString(text))}
                                onSubmitEditing={Keyboard.dismiss}
                                maxLength={5}
                                keyboardType='numeric'
                            />
                        </View>
                        }
                    <TouchableOpacity style={[GlobalStyles.buttonWithoutBorder, styles.doneBtn,{marginTop: mvs(40),}]} onPress={() => handleDone(gratuity)}>
                        <Text style={[GlobalStyles.txtM14Dark, {}]} >Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ReactNativeModal>
    )
}

export default AddGratuityModal