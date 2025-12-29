import { StyleSheet, View, Modal, ActivityIndicator, Image, Text } from 'react-native';
import React from 'react'
import { ms, mvs } from 'react-native-size-matters';
import { showToast } from '../../components/Toast';
import { COLORS, SIZES } from '../../style/theme';
import { GlobalStyles } from '../../style/GlobalStyles';



const Loader = props => {



  const {
    loading,
    ...attributes
  } = props;


  return (
    <Modal
      transparent={true}
      animationType={'none'}
      visible={loading}
      onRequestClose={() => {
        console.log('close modal')
        showToast("Please wait to complete processing")

        // setTimeout(() => {

        // }, 1000);
        // dispatch(__loadingChange(false))
      }}>

      <View style={[StyleSheet.absoluteFillObject, styles.container,]}>
        <View style={{ height: mvs(120), width: ms(120), borderRadius: SIZES.radius15, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', }} >

          <ActivityIndicator
            size={40}
            color={COLORS.theme}
            style={{ margin: 15 }} />

          <View style={{ marginTop: mvs(10) }} >
            <Text style={GlobalStyles.txtR16Dark} >Please wait...</Text>
          </View>
        </View>
      </View>
    </Modal>

  )
}


const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#00000040'
  },
  activityIndicatorWrapper: {
    backgroundColor: '#FFFFFF',
    height: 100,
    width: 100,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  logoImageStyle: {
    height: mvs(40),
    width: ms(40)
  }
});
export default Loader