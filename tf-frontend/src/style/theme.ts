import { Dimensions } from "react-native";
import { ms, mvs } from "react-native-size-matters";
const {width, height, fontScale} = Dimensions.get('window');

const COLORS = {

    theme:"#232323",
    bgTheme: '#07030C',
  
    bg:"#F4F4F4",
  
    disable:"#BFD9DD",
    purple:"#da8ee7",

    bgPink:'#f4d6c3',
  
    topTabColor: '#282B3E',
    orange: '#FEA47E',
  
    yellow: '#D69316',
    green: '#15DD12',
    red: '#E31414',
    blue:"#11A9FF",

    darkWhite:"#D9D9D9",
  
    redBtn: '#AE3B4A',

    lightVoilet: '#B5B8FF',
    lightRed: '#FFD6D4',
    lightGreen: '#D7FDEC',
  
    borderColor: "#E3E3E3",
    card:"#E9F3F6",

  input:"#E8E8E8",
    greyTxt: '#737373',
    lightGreyTxt: '#A6A6A6',
    themeTxt: '#054A5F',
    darkTxt: '#232323',
  
    white: '#FFFFFF',
    black: '#000000',
  
    transparent: 'transparent',
  };


const SIZES = {
  // global sizes

  radius: ms(10),
  radius12: ms(12),
  radius15: ms(15),
  radius20: ms(20),

  padding20: ms(20),
  padding15: ms(15),
  padding: ms(10),

  // font sizes
  // largeTitle: 40 / fontScale,
  // heading: 28 / fontScale,
  // f30: 30 / fontScale,
  // f24: 24 / fontScale,
  // f22: 22 / fontScale,
  // f20: 20 / fontScale,
  // f18: 18 / fontScale,
  // f16: 16 / fontScale,
  // f14: 14 / fontScale,
  // f12: 12 / fontScale,
  // f10: 10 / fontScale,
  largeTitle: ms(40),
  heading: ms(28),
  f30: ms(30),
  f24: ms(24),
  f22: ms(22),
  f20: ms(20),
  f18: ms(18),
  f16: ms(16),
  f14: ms(14),
  f12: ms(12),
  f10: ms(10),

  // app dimensions
  width,
  height,

  //card
  cardWidth: width - ms(30),

  //btn
  btnSize: (width - ms(30)) / 2 - ms(10),

  marginVertical: mvs(20),
  paddingHorizontal: ms(15),
};

  const FONTS = {
    light: 'Poppins-Light',
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    extraBold: 'Poppins-ExtraBold'
  };


  export {COLORS,SIZES,FONTS}