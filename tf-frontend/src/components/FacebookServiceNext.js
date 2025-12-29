import {Platform} from 'react-native';
import {
  LoginManager,
  GraphRequest,
  GraphRequestManager,
  Profile,
} from 'react-native-fbsdk-next';

export const fbLoginNext = resCallback => {
  try {
    LoginManager.logOut();
    if (Platform.OS === 'android') {
      LoginManager.setLoginBehavior('web_only');
    }
    return LoginManager.logInWithPermissions(['email', 'public_profile']).then(
      result => {
        console.log('Result from the app>>>>', result);
        if (
          result.declinedPermissions &&
          result.declinedPermissions.includes('email')
        ) {
          resCallback({message: 'Email is required'});
          return;
        }
        if (result.isCancelled) {
          console.log('Login cancelled');
          resCallback({message: 'Login cancelled'});
        } else {
          console.log('Login success, fetching data...');
          if (Platform.OS == 'ios') {
            const currentProfile = Profile.getCurrentProfile().then(function (
              currentProfile,
            ) {
              if (currentProfile) {
                console.log('currentProfile', currentProfile);
                resCallback(null, currentProfile);
              } else {
                resCallback('Failed to get user data.', null);
              }
            });
          } else {
            const infoRequest = new GraphRequest(
              '/me?fields=email,name,first_name,last_name,picture',
              null,
              (error, result) => {
                if (error) {
                  console.log('Error fetching data: ' + error.toString());
                  resCallback(error, null);
                } else {
                  console.log(
                    'Success fetching data: ' + JSON.stringify(result),
                  );
                  resCallback(null, result);
                }
              },
            );
            new GraphRequestManager().addRequest(infoRequest).start();
          }
        }
      },
      function (error) {
        console.log('Login fail with error: ' + error);
        resCallback(error, null);
      },
    );
  } catch (err) {
    console.log('Error in fbLogin: ' + err);
    resCallback(err, null);
  }
};
