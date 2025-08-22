import React from "react";
import { useRef, useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  Image,
  BackHandler, Linking, AppState,
  Platform, Share, PermissionsAndroid, Dimensions,
} from "react-native";

import { WebView } from "react-native-webview";
import SplashScreen from "react-native-splash-screen";
import Clipboard from "@react-native-clipboard/clipboard";

import Geolocation, { getCurrentPosition } from "react-native-geolocation-service";

import imgSplashIcon from "../../assets/images/splash_icon.png";
import CustomModal from "../Modal/CustomModal";
import ModalController from "../Modal/ModalController";
import messaging from "@react-native-firebase/messaging";

import { InAppBrowser } from "react-native-inappbrowser-reborn";

import { Adjust, AdjustEvent, AdjustConfig } from "react-native-adjust";

import { activateKeepAwake, deactivateKeepAwake } from "@sayem314/react-native-keep-awake";
import DeviceInfo from "react-native-device-info";

import {
  login,
  logout,
  getProfile as getKakaoProfile,
} from "@react-native-seoul/kakao-login";

import { appleAuth, appleAuthAndroid } from "@invertase/react-native-apple-authentication";

import {
  TestIds, RewardedInterstitialAd,
  RewardedAdEventType, AdEventType,
} from "react-native-google-mobile-ads";


import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";

// 위치 동의
async function requestPermission() {
  try {
    if (Platform.OS === "ios") {
      return await Geolocation.requestAuthorization("always");
    } else if (Platform.OS === "android") {
      return await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
    }
  } catch (e) {
    console.log(e);
  }
}


const MainView = ({ navigation }) => {

    //const _URL = "https://runner.ddns.net.ngrok-free.app"; // ngrok ( local PC mobile admimn
    // const _URL = 'http://localhost:63161';
    // const _URL = "https://test.runnerrunner.co.kr";
    // const _URL = "https://stage.runnerrunner.co.kr";
    const _URL = "https://runnerrunner.co.kr";
    const mainURL = _URL + "?appYn=true";

    let adUnitId = TestIds.REWARDED_INTERSTITIAL; //stage

    const [result, setResult] = useState("");

    // adjust 및 admob 설정. 운영 URL 이외에는 테스트
    if (_URL === "https://runnerrunner.co.kr") {
      const adjustConfig = new AdjustConfig("s5487rkop4ao", AdjustConfig.EnvironmentProduction);
      Adjust.create(adjustConfig);
      if (Platform.OS === "ios") {
        adUnitId = 'ca-app-pub-1370775473128669/5818652864'; //ios
      } else {
        adUnitId = 'ca-app-pub-1370775473128669/7749955284'; //android
      }
    } else {
      const adjustConfig1 = new AdjustConfig("s5487rkop4ao", AdjustConfig.EnvironmentSandbox);
      Adjust.create(adjustConfig1);
      adUnitId = TestIds.REWARDED_INTERSTITIAL; //stage
    }

    // 앱 상태 체크 (foreground, background)
    const appState = useRef(AppState.currentState);
    // 앱 상태 체크 시간 (foreground, background 진입 하는 시간 저장)
    const [backgroundTime, setBackgroundTime] = useState(0);
    const [foregroundTime, setForegroundTime] = useState(0);


    const webViewRef = useRef();
    // webview 처음 로딩 되는 부분 체크
    const [loading, setLoading] = useState(false);
    // webview 뒤로 갈 수 있는 지 체크. ( 안드로이드 backbutton 처리 )
    const [isCanGoBack, setIsCanGoBack] = useState(false);

    const [adLoaded, setAdLoaded] = useState(false);


    // 푸시 선택시 이동 페이지 저장.
    const [pushGoToPage, setPushGoToPage] = useState("");

    // 현재 url 저장.
    let cUrl = "";

    // kakaoLogin Token 저장.
    let kakaoToken = null;

    // push 동의 상태
    let pushEnabled = false;
    // firebase push token
    let fcmToken = "";
    // uuid 기기 아이디 정보
    let uuid = "";

    // admob 관련 변수
    let rewardedInterstitial;
    let unsubscribeLoaded;
    let unsubscribeError;
    let unsubscribeEarned;


    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function(token) {
        // console.log("TOKEN:", token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      // push click 이벤트 .
      onNotification: function(notification) {
        if (notification.data?.goToPage) {
          const goToPage = _URL+'/mobile'+notification.data?.goToPage;
          if(loading === false) {
            setPushGoToPage(goToPage);
          } else {
            const script = `window.location.href = '${goToPage}';`;
            webViewRef.current.injectJavaScript(script);
          }
        } else {
          // console.log("noData");
        }

        // process the notification

        // (required) Called when a remote is received or opened, or local notification is opened
        notification.finish(PushNotificationIOS.FetchResult.NewData);
      },

      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: function(notification) {
      },

      // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      onRegistrationError: function(err) {
        console.error(err.message, err);
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - Specified if permissions (ios) and token (android and ios) will requested or not,
       * - if not, you must call PushNotificationsHandler.requestPermissions() later
       * - if you are not using remote notification or do not have Firebase installed, use this:
       *     requestPermissions: Platform.OS === 'ios'
       */
      requestPermissions: true,
    });

    useEffect(() => {
      // console.log("**************************** componentDidMount() ****************************");

    }, []);


    const showAd = () => {
      try {
        if (adLoaded) {
          rewardedInterstitial.show();
        } else {
          // console.log("Rewarded Interstitial Ad has not loaded yet.");
          webViewRef?.current?.postMessage(JSON.stringify({
            "func": "adError",
            "data": "Rewarded Interstitial Ad has not loaded yet.",
          }));
        }
      } catch (e) {
        webViewRef?.current?.postMessage(JSON.stringify({
          "func": "adError",
          "data": e,
        }));
      }
    };

    DeviceInfo.getUniqueId().then(uniqueId => {
      uuid = uniqueId;
    });

    async function requestPushPermission() {
      const authStatus1 = await messaging().hasPermission();

      pushEnabled = authStatus1 === 1;
    }

    // 앱 foreground, backgroudn 전환시 시간 체크
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // console.log("foreground 전환");
        setForegroundTime(Date.now());
      } else {
        // console.log("background 전환");
        setBackgroundTime(Date.now());
      }

      appState.current = nextAppState;
    };

    // backgroud에서 foreground로 돌아 올 떄 웹뷰 리로드 처리
    useEffect(() => {
      const gap = foregroundTime - backgroundTime;

      if (gap > 3600000) {
        webViewRef.current?.reload();
      }
    }, [foregroundTime]);

    useEffect(() => {
      const appStateListener = AppState.addEventListener("change", handleAppStateChange);

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeError();
        appStateListener.remove();
      };
    }, []);


    let getFcmToken = async () => {
      fcmToken = await messaging().getToken();
    };

    getFcmToken();

    const loadedView = () => {
      rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(adUnitId);
      // console.log('******************* ', rewardedInterstitial);
      unsubscribeLoaded = rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          // console.log('rewardedInterstitial Loaded ');
          setAdLoaded(true);
        },
      );
      unsubscribeError = rewardedInterstitial.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          // console.log("rewardedInterstitial Error: ", error);
          webViewRef?.current?.postMessage(JSON.stringify({
            "func": "adLoadError",
            "data": error,
          }));
        },
      );
      unsubscribeEarned = rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          // console.log("User earned reward of ", reward);
          webViewRef?.current?.postMessage(JSON.stringify({
            "func": "completeAd",
            "data": { uuid, reward },
          }));
        },
      );

      // console.log('rewardedInterstitial Load ');
      rewardedInterstitial.load();
    };

    loadedView();


    // 앱의 현재 위치 받아서 웹뷰로 다시 재전송.
    const getPosition = () => {
      requestPermission().then(result => {
        // console.log(" *** getPosition : ", result);
        if (result === "granted") {
          Geolocation.getCurrentPosition(
            position => {
              const { latitude, longitude } = position.coords;
              // console.log(" *** getGeoPosition : ", latitude, ", ", longitude);
              webViewRef?.current?.postMessage(
                JSON.stringify({
                  "func": "getLatLon",
                  "data": {
                    "lat": latitude,					// 위도
                    "lon": longitude,					// 경도
                  },
                }),
              );
            },
            error => {
              console.log(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 3600,
              maximumAge: 3600,
            },
          );
        } else {
          webViewRef?.current?.postMessage(
            JSON.stringify({
              "func": "getLatLon",
              "data": {
                "lat": -1,					// 위도
                "lon": -1,					// 경도
              },
            }),
          );
        }
      });
    };

    // 외부 공유
    const onShare = async (str) => {
      try {
        const result = await Share.share(
          {
            message: str,
          },
        );

        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            // console.log("activityType!");
          } else {
            // console.log("Share!");
          }
        } else if (result.action === Share.dismissedAction) {
          // console.log("dismissed");
        }
      } catch (error) {
        alert(error.message);
      }
    };


    // 안드로이드 백키 눌렀을 떄 이벤트 등록.
    useEffect(() => {
      BackHandler.addEventListener("hardwareBackPress", backHandler);
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", backHandler);
      };
    }, [isCanGoBack]);

    const backHandler = () => {
      // 안드로이드 백버튼 눌렀을 때 뒤로 갈 수 있는 페이지가 있으면 goBack 아니면 종료.
      if (isCanGoBack) {
        webViewRef.current.goBack();
        return true;
      } else {
        return false;
      }
      // return true;
    };

    // 애플 지도 네비게이션 이동.
    const onAppleMap = async (addr) => {
      // console.log(" *** onAppleMap : ", addr);
      Linking.openURL("http://maps.apple.com/?address=" + addr);
    };

    // TMap 네비게이션 이동.
    const onTmap = async (name, lat, lon) => {
      let mapString = "goalname=" + name + "&goalx=" + lon + "&goaly=" + lat;

      const tmap = "tmap://route?" + mapString;
      // console.log(" *** onTmap : ", tmap);

      Linking.openURL(tmap)
        .then((isInstalled => {
          // console.log("*** onTmap isInstalled", isInstalled);
          if (!isInstalled) {
            if (Platform.OS === "ios") {
              Linking.openURL("itms-apps://itunes.apple.com/kr/app/id431589174?mt=8");
            } else {
              Linking.openURL("https://play.google.com/store/apps/details?id=com.skt.tmap.ku");
            }
          }
        })).catch(err => {
        console.log(" *** onTmap : ", err);
        if (Platform.OS === "ios") {
          Linking.openURL("itms-apps://itunes.apple.com/kr/app/id431589174?mt=8");
        } else {
          Linking.openURL("https://play.google.com/store/apps/details?id=com.skt.tmap.ku");
        }
      });
    };

    // 클립보드 복사 ( 주소 복사에 사용 )
    const onClipboard = (addr) => {
      Clipboard.setString(addr);
      ModalController.showModal("주소가 복사 되었습니다.");
    };

    // 설정 화면에서 푸시 설정 값 웹으로 전송.
    const setPushNoti = () => {
      requestPushPermission().then(r => {
        // console.log(" *** pushEnabled ", pushEnabled);
        webViewRef?.current?.postMessage(
          JSON.stringify({
            "func": "setPushInfo",
            "data": {
              pushYn: pushEnabled ? "Y" : "N",
              pushToken: fcmToken,
              deviceId: uuid,
            },
          }),
        );
      });
    };

    // 앱 접속시 기본정보 전달.
    const setBasicInfo = () => {
      // console.log(" *** setBasicInfo : ");
      const appVersion = DeviceInfo.getVersion();
      const deviceId = uuid;
      // console.log(" *** setBasicInfo appVersion : ", appVersion);
      // console.log(" *** setBasicInfo deviceId : ", deviceId);
      webViewRef?.current?.postMessage(
        JSON.stringify({
          "func": "basicInfoCallback",
          "data": {
            deviceId: deviceId,
            os: Platform.OS === "ios" ? "ios" : "android",
            version: appVersion,
          },
        }),
      );
    };

    // 카카오 로그인 처리
    const signInWithKakao = async () => {
      // console.log("signInWithKakao");
      try {
        const token = await login();
        kakaoToken = token;
        getProfile();

      } catch (err) {
        // console.error("login err", err);
      }
    };

    // 카카오 로그인 프로필 처림 후 웹으로 전송.
    const getProfile = async () => {
      try {
        const profile = await getKakaoProfile();
        webViewRef?.current?.postMessage(
          JSON.stringify({
            "func": "getAppLoginInfo",
            "data": {
              "loginType": "SIMPLE_KAKAO",
              "profile": JSON.stringify(profile),
            },
          }),
        );
      } catch (err) {
        // console.error("signOut error", err);
      }
    };

    // 애플로그인 처리
    async function onAppleButtonPress() {
      if (Platform.OS === "ios") {
        onAppleButtonPressIos();
      } else {
        onAppleButtonPressAndroid();
      }

    }

    async function onAppleButtonPressIos() {
      // performs login request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // Note: it appears putting FULL_NAME first is important, see issue #293
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // console.log("appleAuthRequestResponse : ", appleAuthRequestResponse);
      // get current authentication state for user
      // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
      // console.log("credentialState : ", credentialState);
      // use credentialState response to ensure the user is authenticated
      if (credentialState === appleAuth.State.AUTHORIZED) {
        // user is authenticated
        webViewRef?.current?.postMessage(
          JSON.stringify({
            "func": "getAppLoginInfo",
            "data": {
              "loginType": "SIMPLE_APPLE",
              "os": "I",
              "profile": JSON.stringify(appleAuthRequestResponse),
            },
          }),
        );
      }
    }

    async function onAppleButtonPressAndroid() {
      // Generate secure, random values for state and nonce
      const rawNonce = uuid;
      const state = uuid;

      const redirect = _URL + "/snslogin/appleCallback";
      // console.log("redirect : ", redirect);

      // Configure the request
      appleAuthAndroid.configure({
        // The Service ID you registered with Apple
        clientId: "com.runnersoft.runnerrunnerlogin",
        // Return URL added to your Apple dev console. We intercept this redirect, but it must still match
        // the URL you provided to Apple. It can be an empty route on your backend as it's never called.
        redirectUri: redirect,
        // The type of response requested - code, id_token, or both.
        responseType: appleAuthAndroid.ResponseType.ALL,
        // The amount of user information requested from Apple.
        scope: appleAuthAndroid.Scope.ALL,
        // Random nonce value that will be SHA256 hashed before sending to Apple.
        nonce: rawNonce,
        // Unique state value used to prevent CSRF attacks. A UUID will be generated if nothing is provided.
        state,
      });

      // Open the browser window for user sign in
      const response = await appleAuthAndroid.signIn();

      // Send the authorization code to your backend for verification
      // console.log("response : ", response);
      webViewRef?.current?.postMessage(
        JSON.stringify({
          "func": "getAppLoginInfo",
          "data": {
            "loginType": "SIMPLE_APPLE",
            "os": "A",
            "profile": JSON.stringify(response),
          },
        }),
      );
    }

    // 웹과 앱 통신.
    const onMessage = (event) => {
      // console.log("  *** onMessage22 : ", event.nativeEvent?.data);
      const data = event.nativeEvent?.data;
      if (data) {
        const object = JSON.parse(data);

        if (object["func"] === "shareContent") {
          onShare(object["data"]["url"]).then(() => {
          });
        } else if (object["func"] === "snsKakaoLogin") {
          signInWithKakao();
        } else if (object["func"] === "snsAppleLogin") {
          onAppleButtonPress();
        } else if (object["func"] === "initLatLon") {
          // 앱 현재 위치 받아오기
          getPosition();
        } else if (object["func"] === "getPushInfo") {
          setPushNoti();
        } else if (object["func"] === "basicInfo") {
          setBasicInfo();
        } else if (object["func"] === "setPushInfo") {
          // 앱의 설정 화면으로 이동 후 현재 화면에서 뒤로 가기
          Linking.openSettings();
          webViewRef.current.goBack();
        } else if (object["func"] === "setScreenLock") {
          // 화면 꺼짐 방지.
          let isLock = object["data"]["lockYn"];
          if (isLock === "Y") {
            activateKeepAwake();
          } else {
            deactivateKeepAwake();
          }
        } else if (object["func"] === "adjustEvent") {
          const eventToken = object["data"]["eventToken"];
          const adjustEvent = new AdjustEvent(eventToken);
          Adjust.trackEvent(adjustEvent);
        } else if (object["func"] === "webUrl") {
          Linking.openURL(object["data"]["data"]);
        } else if (object["func"] === "phoneCall") {
          Linking.openURL(`tel:` + object["data"]["phoneNumber"]);
        } else if (object["func"] === "viewAdmob") {
          showAd();
        } else if (object["func"] === "naviAddress") {
          let modalList = ["T MAP", "주소복사"];
          if (Platform.OS === "ios") {
            modalList.splice(1, 0, "애플지도");
          }
          const cafeName = object["data"].cafeName;
          const cafeAddress = object["data"].cafeAddress;
          const lat = object["data"].lat;
          const lon = object["data"].lon;
          ModalController.showList(-1, "길찾기", modalList, (index) => {
            if (index === 0) {
              setTimeout(() => {
                  onTmap(cafeName, lat, lon);
                }, 500,
              );
            }
            else if (index === 1) {
              if (Platform.OS === "ios") {
                setTimeout(() => {
                    onAppleMap(cafeAddress);
                  }, 500,
                );
              } else {
                setTimeout(() => {
                    onClipboard(cafeAddress);
                  }, 500,
                );
              }
            } else if (index === 2) {
              if (Platform.OS === "ios") {
                setTimeout(() => {
                    // onAppleMap(cafeAddress);
                  }, 500,
                );
              } else {
                setTimeout(() => {
                    onClipboard(cafeAddress);
                  }, 500,
                );
              }
            }
          });
        } else {
          const functionName = object["func"];
          webViewRef?.current?.postMessage(
            JSON.stringify({
              "func": "error",
              "data": {
                "func": functionName,
                "message": "준비되지 않은 함수 입니다.",
              },
            }),
          );
        }
      }
    };

    const onShouldStartLoadWithRequest = (event) => {
      // console.log("  *** onShouldStartLoadWithRequest : ", event, event.canGoBack);
      return true;
    };

    const handleNavigationChange = (navState) => {
      // navState.url에는 현재 웹뷰의 URL이 포함되어 있습니다.

      // console.log('****** navState.url : ', navState.url);
      // const redirectUri = _URL+'/snslogin/kakaoCallback';
      // console.log('redirectUri : ', redirectUri);
      // 여기에서 리다이렉트를 확인하고 싶은 특정 URL 부분을 검사합니다.
      // if (navState.url.includes('https://kauth.kakao.com/oauth/code/confirm')) {
      //     // 필요한 경우 추가 액션을 취합니다. 예를 들어, 리다이렉트 URL에 포함된 정보를 추출하거나,
      //     // 리액트 네이티브 컴포넌트로 사용자를 리디렉션할 수 있습니다.
      //
      //     console.log('Redirect URL detected:', navState.url);
      //
      //   const redirectTo = 'window.location = "' + redirectUri + '"';
      //   webViewRef.current.injectJavaScript(redirectTo);
      //
      //     // 웹뷰 내에서 리다이렉션을 중단하고, 리액트 네이티브의 다른 화면으로 전환할 수 있습니다.
      //     // 이를 위해 상태 관리 또는 네비게이션 라이브러리를 사용할 수 있습니다.
      // } else
      {
        //메인 페이지인 경우 앱이 종료 될 수 있게 설정.
        let _can = false === (navState.url === "https://runnerrunner.co.kr/mobile"
          || navState.url === "https://test.runnerrunner.co.kr/mobile"
          || navState.url === "https://stage.runnerrunner.co.kr/mobile");

        cUrl = navState.url;
        setIsCanGoBack(_can);
      }
    };


    return <View style={{
      flex: 1,
      backgroundColor: "#fff",
    }}>
      <View style={{
        flex: 1,
        // backgroundColor: "red",
      }}>
        <SafeAreaView style={{
          flex: loading ? 1 : 0,
          // flex: 1,
          backgroundColor: "#fff",
        }}>
          <WebView
            ref={webViewRef}
            allowsInlineMediaPlayback={true}
            javaScriptCanOpenWindowsAutomatically={true}
            useWebKit={true}
            startInLoadingState={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            setSupportMultipleWindows={true}
            automaticallyAdjustContentInsets={true}
            useWideViewPort={true}
            loadWithOverviewMode={true}
            thirdPartyCookiesEnabled={true}
            source={{ uri: mainURL }}
            onMessage={onMessage}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={handleNavigationChange}
            onLoad={() => {
              // console.log("onEndLoading ", certData, "|");
              // loadedView();
              if (loading === false) {
                setTimeout(() => {
                    setLoading(true);
                    SplashScreen.hide();
                    // console.log('onLoad pushGoToPage : ', pushGoToPage);
                    if(pushGoToPage !== "") {
                      const script = `window.location.href = '${pushGoToPage}';`;
                      webViewRef.current.injectJavaScript(script);
                    }
                    // this.setState({ loading: true }, () => {
                    //
                    // });
                  }, 1500,
                );
              }
            }}
            onContentProcessDidTerminate={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              webViewRef.current?.reload();
            }}
          />

        </SafeAreaView>
        {
          !loading &&
          <View style={{
            flex: 1,
            alignItems: "center", justifyContent: "center",

          }}>
            <View
              style={{
                width: "100%", height: "100%",
                alignItems: "center", justifyContent: "center",
                backgroundColor: "#000",
              }}>
              <Image
                source={imgSplashIcon}
                resizeMode={"contain"}
                style={{
                  width: 240, height: 148,
                }} />
            </View>
          </View>
        }
        <CustomModal />
      </View>

      {/*<TouchableOpacity style={{*/}
      {/*  height: 60, backgroundColor: "gray",*/}
      {/*  alignItem: "center", justifyContent: "center",*/}
      {/*}}*/}
      {/*                  onPress={this.onDirection}>*/}
      {/*  <Text*/}
      {/*    style={{*/}
      {/*      color: "white",*/}
      {/*      fontSize: 15,*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    {"찾아보기"}*/}
      {/*  </Text>*/}
      {/*</TouchableOpacity>*/}
    </View>;
  }
;

export default MainView;
