import { StyleSheet } from "react-native";
import { ms, mvs } from "react-native-size-matters";
import { COLORS, FONTS, SIZES } from "../../style/theme";
import { GlobalStyles } from "../../style/GlobalStyles";

export const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#EDEDED",
    width: SIZES.cardWidth,
    paddingVertical: ms(15),
    minHeight: mvs(100),
    alignSelf: 'center',
    borderRadius: ms(8),
    marginTop: mvs(10)
  },
  profileImg: {
    height: ms(30),
    width: ms(30),
    borderRadius: ms(16),
    backgroundColor: '#bebebe'
  },
  // serviceImg: {
  //   height: ms(30),
  //   width: ms(30),
  //   borderRadius: ms(16),
  //   backgroundColor: '#bebebe'
  // },
  serviceImg: {
    height: ms(50),
    width: ms(50),
    borderRadius: ms(30),
    backgroundColor: '#bebebe'
  },
  locationImg: {
    height: ms(16),
    width: ms(16),
    resizeMode: 'contain',
    tintColor: "#656565"
  },
  whiteStrip: {
    height: ms(3),
    width: '100%',
    backgroundColor: COLORS.white,
    marginVertical: mvs(10)
  },



  indicator: {
    backgroundColor: '#232323',
    height: 5,
    borderTopStartRadius: 5,
    borderTopEndRadius: 5,

  },
  label: {
    color: COLORS.lightGreyTxt,
    fontFamily: FONTS.light,
    fontSize: 18,
    textAlign: 'center'
  },


  typesBtn: {
    // width: ms(100),
    paddingRight: ms(15)
  },
  headerTitleView: {
    ...GlobalStyles.rowCenter,
    // height:mvs(30),
    paddingVertical: mvs(15),
    paddingLeft: ms(15),
    marginTop:10

  },
  backBtn: {
    ...GlobalStyles.alignJustifyCenter,
    height: 30,
    width: 25,
  },

  chatBottomStrip: {
    height: 1.5,
    width: SIZES.cardWidth,
    backgroundColor: "#ECECEC",
    alignSelf: 'center'
  },


  //Modal
  modalContainer: {
    borderRadius: SIZES.radius20,
    width: SIZES.cardWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInnerContainer: {
    backgroundColor: COLORS.white,
    width: SIZES.width,
    alignSelf: 'center',
    minHeight: mvs(200),
    // alignItems: 'center',
    // justifyContent: 'center',
    paddingVertical: mvs(20),

    borderRadius: SIZES.radius12
  },
  selectTenantView: {
    height: mvs(40),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // justifyContent: "space-between",
    backgroundColor: COLORS.theme,
    borderTopStartRadius: SIZES.radius,
    borderTopEndRadius: SIZES.radius,
    position: 'absolute',
    // flexDirection: 'row',
    top: 0
  },

  closeView: {
    position: 'absolute',
    top: ms(8),
    right: ms(15),
    zIndex: 1,
    // borderWidth: 2,
    // borderColor: COLORS.theme,
    // backgroundColor: COLORS.white,
    borderRadius: 10,
    height: ms(25),
    width: ms(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownChatDisplay: {
    minHeight: ms(50),
    paddingVertical: ms(10),
    paddingHorizontal: ms(20),
    backgroundColor: COLORS.black,
    // marginTop: mvs(10),
    // marginBottom: mvs(20),
    alignSelf: "flex-end",
    maxWidth: SIZES.cardWidth / 1.2,
    // minWidth:SIZES.cardWidth/2,
    borderTopStartRadius: 25,
    borderBottomStartRadius: 25,
    borderBottomEndRadius: 25,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  sendChatDisplay: {
    minHeight: ms(50),
    paddingVertical: ms(10),
    paddingHorizontal: ms(20),
    backgroundColor: "#C4C4C4",
    // marginTop: mvs(10),
    // marginBottom: mvs(20),
    alignSelf: "flex-start",
    maxWidth: SIZES.cardWidth / 1.2,
    // minWidth:SIZES.cardWidth/2,
    borderTopStartRadius: 25,
    borderTopEndRadius: 25,
    borderBottomEndRadius: 25,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  bottomChatView: {
    position: 'absolute',
    alignSelf: 'center',

  },
  inputContainer: {
    width: SIZES.cardWidth,
    height: ms(60),
    borderRadius: ms(25),
    flexDirection: 'row',
    alignItems: "center",
    paddingHorizontal: ms(15),
    borderWidth: ms(1),
    borderColor: COLORS.borderColor
  },
  chatInput: {
    width: '90%',
    height: ms(60),
    ...GlobalStyles.txtM14Dark,

  },
  chatInputIos: {
    width: '90%',
    // height: ms(60),
    // textAlign: 'left', // Ensures left alignment
textAlignVertical: 'center', // Helps in vertical alignment
    ...GlobalStyles.txtM14Dark,
},
  homeCountContainer: {
    height: mvs(100),
    width: "45%",
    borderWidth: ms(1),
    borderColor: COLORS.borderColor,
    borderRadius: ms(20),
    alignItems: 'center',
    paddingVertical: ms(10)
  }

})