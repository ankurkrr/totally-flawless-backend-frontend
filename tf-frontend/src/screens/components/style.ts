import { StyleSheet } from "react-native";
import { ms, mvs } from "react-native-size-matters";
import { COLORS, FONTS, SIZES } from "../../style/theme";
import { GlobalStyles } from "../../style/GlobalStyles";

export const styles = StyleSheet.create({
  cardOuterContainer:{
    width:SIZES.width,
    alignItems:'center',
    justifyContent:'center',
    flexDirection:'row'
  },
  cardContainer: {
    alignSelf: 'center',
    marginTop: mvs(10),
    width: SIZES.cardWidth,
    borderWidth: ms(1),
    borderColor: COLORS.borderColor,
    borderRadius: ms(10),
    minHeight: ms(110),
    overflow: 'hidden',
    alignItems: 'flex-start'
  },
  bookingImg: {
    height: ms(115),
    width: ms(100),
    borderTopLeftRadius: 10,
   
    backgroundColor:'#bebebe'
  },

  deleteBtn:{
    ...GlobalStyles.alignJustifyCenter,
    height:ms(20),
    width:ms(20),
    marginLeft:ms(5)
  },
  infoView: {
    flex: 1,
    alignSelf: 'flex-start',
    paddingVertical: mvs(5),
    paddingHorizontal: ms(10),
    justifyContent: 'space-between',
    flexDirection: 'column',
    height: '100%'
  },
  bookingReviewContainer: {
    backgroundColor: COLORS.borderColor,
    height: mvs(27),
    width: '100%',
    ...GlobalStyles.alignJustifyCenter,
    ...GlobalStyles.rowCenter
  },
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
  graInputContainer: {
    width: "90%",
    alignSelf: 'center',
    marginTop: mvs(20),
  },
  gratuityInput: {

    height: ms(30),
    borderBottomWidth: ms(1),
    borderColor: COLORS.darkTxt,
    borderStyle: 'solid',
    padding: 0,
    paddingLeft: ms(5)
  },
  doneBtn: {
    alignSelf: 'center',
    marginBottom: mvs(20),
    backgroundColor: COLORS.yellow,
    width: ms(90),
    marginLeft: ms(10)
  },
  allBookImg:{
    height:ms(75),
    width:ms(75),
    resizeMode:'contain',
    borderRadius:ms(10),
   
  },
  imgContainer:{alignItems:'center',justifyContent:'center', alignSelf: 'flex-start' , backgroundColor:COLORS.black,height:ms(85),
    width:ms(85),
    borderRadius:ms(10),},
  input: {
    height: 100,
    // flex: 1,
    fontSize: 16,
    fontFamily:FONTS.regular,
    textAlignVertical:'top',
    paddingHorizontal: 10,
    color: '#000',
    marginTop:mvs(5),
    backgroundColor: '#E8E8E8',
    borderRadius:ms(10)
},
  serviceText: {
    // minHeight: 100,
    // flex: 1,
    fontSize: 16,
    fontFamily:FONTS.regular,
    textAlignVertical:'top',
    paddingHorizontal: 10,
    color: '#000',
    marginTop:mvs(5),
   
    
    
},
})