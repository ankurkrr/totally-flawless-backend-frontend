import {CART_DATA, CART_ITEMS, IS_ADDED_CART, IS_CHAT, IS_GUEST, IS_ORDER, IS_ORDER_ACCEPTED} from '../allactionsTypes';

const initialState = {
  cartItems: 0,
  isOrderReceived:false,
  isOrderAccepted:false,
  isNewChat:false,
  cartData:[],
  isAddedCart:false,
  isGuest:false
};

export default function AppReducer(state = initialState, action) {
  const {type, payload} = action;
  switch (type) {
    case CART_ITEMS:
      return {
        ...state,
        cartItems: payload,
      };

    case CART_DATA:
      return {
        ...state,
        cartData: payload,
      };

    case IS_ADDED_CART:
      return {
        ...state,
        isAddedCart: payload,
      };
    case IS_GUEST:
      return {
        ...state,
        isGuest: payload,
      };

      case IS_ORDER:
      return {
        ...state,
        isOrderReceived: payload,
      };

      case IS_ORDER_ACCEPTED:
      return {
        ...state,
        isOrderAccepted: payload,
      };

      case IS_CHAT:
      return {
        ...state,
        isNewChat: payload,
      };
    default:
      return state;
  }
}
