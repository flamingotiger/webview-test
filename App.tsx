/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import messaging from "@react-native-firebase/messaging";
import { Alert, BackHandler, PermissionsAndroid, Platform } from "react-native";

import { SafeAreaView, Linking } from "react-native";

import { check, PERMISSIONS, RESULTS } from "react-native-permissions";

import MainView from "./src/screen/MainView";
import Certification from "./src/screen/Certification";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";

const Stack = createStackNavigator();

function App(): JSX.Element {

  console.log("App start ", this.props);

  // Background, Quit 상태일 경우
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log(" &*&** FCMMessage handled in the background! _ App", remoteMessage);
    //  여기에 로직을 작성한다.
    //  remoteMessage.data로 메세지에 접근가능
    //  remoteMessage.from 으로 topic name 또는 message identifier
    //  remoteMessage.messageId 는 메시지 고유값 id
    //  remoteMessage.notification 메시지와 함께 보내진 추가 데이터
    //  remoteMessage.sentTime 보낸시간
  });

  // Foreground 상태인 경우
  React.useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log(" &*&** FCM Foreground", JSON.stringify(remoteMessage));
      // Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
      const noti = remoteMessage.notification;

      if (Platform.OS == 'ios' ) {
        PushNotificationIOS.presentLocalNotification({
          alertTitle: noti?.title,
          alertBody: noti?.body,
          userInfo: remoteMessage.data,
          isSilent: false,
          applicationIconBadgeNumber: 0
        });
      } else {
        PushNotification.localNotification({
          title: noti?.title,
          message: noti?.body,
          data:remoteMessage?.data,
          largeIcon: "ic_launcher",
          smallIcon: "ic_launcher",
          bigLargeIcon: "ic_launcher"
        });
      }

    });
    return unsubscribe;
  });

  // let getFcmToken = async () => {
  //   const fcmToken = await messaging().getToken();
  //   // await Alert.alert(fcmToken);
  //   console.log("fcmToken : ", fcmToken);
  // };
  //
  // getFcmToken();

  // const requestNotificationsPermission = async () => {
  //   try {
  //     PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
  //   } catch (err) {
  //     console.warn(err);
  //   }
  // };
  //
  // async function requestUserPermission() {
  //   const authorizationStatus = await messaging().requestPermission();
  //
  //   const enabled =
  //     authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //     authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL;
  //
  //   if (authorizationStatus) {
  //     console.log('Permission status:', authorizationStatus);
  //   }
  // }

  // if (Platform.OS == 'android' ) {
  //   requestNotificationsPermission();
  // }
  // else if (Platform.OS == 'ios' ) {
  //   console.log('*** ios Permission');
  //   requestUserPermission();
  // }

  check(PERMISSIONS.IOS.LOCATION_ALWAYS)
    .then((result) => {
      switch (result) {
        case RESULTS.UNAVAILABLE:
        case RESULTS.DENIED:
        case RESULTS.LIMITED:
        case RESULTS.BLOCKED:
          console.log(result, "The permission is denied ");
          break;
        case RESULTS.GRANTED:
          console.log("The permission is granted");
          break;
      }
    })
    .catch((error) => {
      // …
    });


  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainView"
      >
        <Stack.Screen
          name="MainView"
          options={{
            headerShown: false
          }}
        >
          {props => <MainView {...props} />}
        </Stack.Screen>

        <Stack.Screen
          name="Certification"
          options={{
            headerShown: false
          }}
        >
          {props => <Certification {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
    // <SafeAreaView style={{flex : 1}}>
    //
    //   <Main navigation={this}/>
    //
    // </SafeAreaView>
  );
}

export default App;
