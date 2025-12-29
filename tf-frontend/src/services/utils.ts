import moment from "moment";


export const BLOW_AMOUNT=30

export function acceptsDigitsOnlyInString(str: string) {
    return str ? str.replace(/[^0-9.]/g, '') : str;
  }


export function dateTimeFormat(bookingTime: string) {
  const date=moment(bookingTime, "YYYY-MM-DD, hh:mm a").format("MM-DD-YYYY, hh:mm A");
    return date=="Invalid date"?"":date
  }

