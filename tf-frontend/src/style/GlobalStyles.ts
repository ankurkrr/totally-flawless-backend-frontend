import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from './theme';
import { ms, mvs } from 'react-native-size-matters';

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: COLORS.bgTheme,
  },
  selfCenter: {
    alignSelf: 'center',
  },
  alignJustifyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCenterSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: COLORS.darkTxt,
    borderRadius: 5,
    height: ms(34),
    width: ms(85),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: ms(1),
    borderColor: COLORS.darkTxt
  },
  buttonWithoutBorder: {
    backgroundColor: COLORS.darkTxt,
    borderRadius: 5,
    height: ms(34),
    width: ms(85),
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth:ms(1),
    borderColor: COLORS.darkTxt
  },
  headerTitleView: {
    flexDirection: 'row',
    alignItems: 'center',
    // height:mvs(30),
    paddingVertical: mvs(15),
    paddingLeft: ms(15)
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    width: 25,
  },

  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginVertical: mvs(10),
    width:SIZES.cardWidth/2,
    alignSelf:'center',
    alignItems:'center'
},
continueButtonText: {
    color: 'white',
    fontSize: 18,
  fontFamily:FONTS.medium
},

  btnWhiteTxt: {
    color: COLORS.white,
    fontSize: SIZES.f12,
    fontFamily: FONTS.regular,
  },
  btnDarkTxt: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f12,
    fontFamily: FONTS.regular,
  },
  txtL10Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f10,
    fontFamily: FONTS.light,
  },
  txtL12Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f12,
    fontFamily: FONTS.light,
  },

  txtR10Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f10,
    fontFamily: FONTS.regular,
  },
  txtR12Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f12,
    fontFamily: FONTS.regular,
  },
  txtL14Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f14,
    fontFamily: FONTS.light,
  },
  txtM12Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f12,
    fontFamily: FONTS.medium
  },
  txtM14Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f14,
    fontFamily: FONTS.medium
  },
  txtR14Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f14,
    fontFamily: FONTS.regular
  },
  txtM16Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f16,
    fontFamily: FONTS.medium
  },
  txtR16Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f16,
    fontFamily: FONTS.regular
  },
  txtSB14Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f14,
    fontFamily: FONTS.semiBold
  },
  txtSB16Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f16,
    fontFamily: FONTS.semiBold
  },
  txtSB18Dark: {
    color: COLORS.darkTxt,
    fontSize: SIZES.f18,
    fontFamily: FONTS.semiBold
  },

  // White
  txtM14White: {
    color: COLORS.white,
    fontSize: SIZES.f14,
    fontFamily: FONTS.medium
  },

})