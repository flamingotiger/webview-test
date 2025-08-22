import React from "react";
import {
  SafeAreaView,
} from "react-native";
import IMP from "iamport-react-native";
// import Loading from './Loading';

import MainView from "./MainView";

// export function Certification({ navigation }) {
// export function Certification() {
const Certification = ({ navigation, route }) => {
  /* [필수입력] 본인인증 종료 후, 라우터를 변경하고 결과를 전달합니다. */

  function callback(response) {
    // navigation.replace("CertificationResult", response);
    console.log(" *** result : ", response);
    navigation.pop();
    route.params.getCertData(response);
    // navigation.replace("MainView", {
    //   key : 'sadjasnjd',
    // });
  }

  /* [필수입력] 본인인증에 필요한 데이터를 입력합니다. */
  const data1 = {
    // merchant_uid: `mid_${new Date().getTime()}`,
    company: "러너러너",
    // carrier: "SKT",
    // name: "홍길동",
    // phone: "01012341234",
    min_age: "18",
  };

  return (
    <SafeAreaView style={{
      flex: 1,
      // flex: 1,
      backgroundColor: "#fff",
    }}>
      <IMP.Certification
        userCode={"imp17252441"}  // 가맹점 식별코드
        // tierCode={'AAA'}      // 티어 코드: agency 기능 사용자에 한함
        // loading={<Loading />} // 로딩 컴포넌트
        data={data1}           // 본인인증 데이터
        callback={callback}   // 본인인증 종료 후 콜백
      />
    </SafeAreaView>

    // <View style={{
    //   flex: 1,
    //   backgroundColor: "#f00",
    // }}>
    // </View>
  );
};
export default Certification;
