import { View, Text, StyleProp, ViewStyle } from 'react-native'
import React from 'react'
import StarRating from 'react-native-star-rating';
import { ms, mvs } from 'react-native-size-matters';
import { COLORS } from '../style/theme';


type Props = {
    rate?: any;
    handleRate?: (rate: any) => void;
    disabled?: boolean;
    starColor?:string;
    starSize?:number;
    containerStyle?:StyleProp<ViewStyle>
}

const CustomStarRating = ({ rate, handleRate, disabled = true,starColor=COLORS.darkTxt,starSize=12 ,containerStyle}: Props) => {
    return (
        <StarRating
            disabled={disabled}
            maxStars={5}
            starSize={starSize}
            rating={rate}
            animation={"bounce"}
            selectedStar={(rate) => {
                // this.setState({ ratingTest: rate, disable: false })
                handleRate(rate)
            }}
            // starSize={35}
            containerStyle={[{ padding: 0, width: ms(60) },containerStyle]}
            fullStarColor={starColor}
            emptyStarColor={COLORS.yellow}
        />
    )
}

export default CustomStarRating