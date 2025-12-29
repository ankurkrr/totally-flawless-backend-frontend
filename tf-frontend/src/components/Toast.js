import Toast from 'react-native-simple-toast';


const showToast = (message) => {
    Toast.show(message,Toast.LONG);
}


export{showToast};