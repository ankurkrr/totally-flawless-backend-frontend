import React from 'react'
import SwitchToggle from 'react-native-switch-toggle'
import { ms, mvs } from 'react-native-size-matters'
import { COLORS, SIZES } from '../style/theme'

type Props = {
    visible: boolean;
    handleNotificationOnOff:(visibel:boolean)=>void
}

const CustomSwitch = ({visible,handleNotificationOnOff}: Props) => {
  return (
    <SwitchToggle
    switchOn={visible}
    onPress={()=>handleNotificationOnOff(!visible)}
    backgroundColorOn={COLORS.darkWhite}
    backgroundColorOff={COLORS.darkWhite}
    circleColorOn={COLORS.yellow}
    containerStyle={{
      width: ms(55),
      height: mvs(28),
      borderRadius: SIZES.radius15,
      padding: ms(5),
    }}
    circleStyle={{
      width: ms(22),
      height: ms(22),
      borderRadius: SIZES.radius12,
      backgroundColor:COLORS.white,
      
    }}
  />
  )
}

export default CustomSwitch
