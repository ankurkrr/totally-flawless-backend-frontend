import React, {useState, useEffect} from 'react';
import {View, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const TimePicker = props => {
  const {changeTime} = props;
  const [date, setDate] = useState(new Date());

  const roundToNearest15Minutes = date => {
    const ms = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / ms) * ms);
  };

  const onChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      // User dismissed without selecting - still call changeTime with current values
      return;
    }

    const currentDate = selectedDate || date;
    const roundedDate = roundToNearest15Minutes(currentDate);
    setDate(roundedDate);

    const hours = roundedDate.getHours();
    const minutes = roundedDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = String(hours % 12 || 12).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    changeTime(formattedHours, formattedMinutes, ampm);
  };

  // Always render the picker - visibility is controlled by parent's showClock state
  return (
    <View>
      <DateTimePicker
        style={{height: 150}}
        testID="dateTimePicker"
        value={date}
        mode="time"
        themeVariant="light"
        is24Hour={false}
        display="spinner"
        onChange={onChange}
        minuteInterval={15}
      />
    </View>
  );
};

export default TimePicker;
