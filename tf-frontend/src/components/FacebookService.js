import {Platform} from 'react-native';
import {
  LoginManager,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk';

export const fbLogin = resCallback => {
  console.log(resCallback);
  LoginManager.logOut();
  if (Platform.OS === 'android') {
    LoginManager.setLoginBehavior('web_only');
  }
  return LoginManager.logInWithPermissions(['email', 'public_profile']).then(
    result => {
      console.log(resCallback, '>>>>>>>>>>>>', result);
      if (
        result.declinedPermissions &&
        result.declinedPermissions.includes('email')
      ) {
        resCallback({message: 'Email is required'});
      }
      if (result.isCancelled) {
        console.log('erorrr');
      } else {
        const infoRequest = new GraphRequest(
          '/me?fields=email,name,picture,friends',
          null,
          resCallback,
        );
        new GraphRequestManager().addRequest(infoRequest).start();
      }
    },
    function (error) {
      console.log('Login fail with error: ' + error);
    },
  );
};
