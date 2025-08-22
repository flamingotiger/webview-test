import {
  ActivityIndicator, ScrollView,
  Alert, Modal, FlatList, StyleSheet, Text, View, TouchableOpacity
} from "react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from "react";


import ModalController, { CustomModalRef } from "./ModalController";

const CustomModal = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const [values, setValues] = useState({
    modalVisible: false,
    isLoading: false,
    isList: false,
    listData: [],
    listTitle: "",
    listIndex: -1,
    isMessage: false,
    message: "",
    callback: () => {
    }
  });

  const modalRef = useRef<CustomModalRef>();

  let callA: any;

  useLayoutEffect(() => {
    ModalController.setModalRef(modalRef);
  }, []);

  useImperativeHandle(
    modalRef,
    () => ({
      show: (message?: string, _callback?: any) => {
        setValues({
          modalVisible: true,
          isLoading: false,
          isList: false,
          listData: [],
          listTitle: "",
          listIndex: -1,
          isMessage: true,
          message: message,
          callback: _callback
        });
      },

      showLoading: () => {
        setValues({
          modalVisible: true,
          isLoading: true,
          isList: false,
          listData: [],
          listTitle: "",
          listIndex: -1,
          isMessage: false,
          message: "",
          callback: () => {
          }
        });
      },

      showList: (index?: number, title?: string, list?: any, _callback?: any) => {
        console.log(" *** custom showList : ");
        setValues({
          modalVisible: true,
          isLoading: false,
          isList: true,
          listData: list,
          listTitle: title,
          listIndex: index,
          isMessage: false,
          message: "",
          callback: _callback
        });

      },

      hide: () => {
        setValues({
          modalVisible: false,
          isLoading: false,
          isList: false,
          listData: [],
          listTitle: "",
          listIndex: -1,
          isMessage: false,
          message: "",
          callback: () => {
          }
        });
      }
    }),
    []
  );

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={values.modalVisible}
      onRequestClose={() => {
        // Alert.alert('Modal has been closed.');
        ModalController.hideModal();
      }}
    >

      {
        (values.isLoading) &&
        <View style={{
          flex: 1, justifyContent: "center", alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.8)"
        }}>
          {(values.isLoading) && <ActivityIndicator size="large" color="#0000ff" />}
        </View>
      }

      {
        (values.isList || values.isMessage) &&
        <View style={{
          flex: 1, justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.8)"
        }}>
          {
            values.isMessage &&
            <View style={{
              flex: 1, justifyContent: "flex-end"
            }}>
              <View style={{
                flex: 1, justifyContent: "center", alignItems: "center"
              }}>
                <View style={{
                  width: "80%",
                  borderRadius: 10,
                  backgroundColor: "#fff",
                  height: 180, paddingTop: 15
                }}>
                  <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", width: "100%" }}>
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                      <Text style={[{ padding: 15, textAlign: "center" },
                        {
                          fontSize: 15,
                          lineHeight: 18,
                          fontWeight: "normal",
                          color: "#000"
                        }]}>{
                        values.message
                      }</Text>
                    </View>

                  </ScrollView>

                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={0.8}
                      onPress={() => {
                        {
                          values.callback && values.callback();
                          ModalController.hideModal();
                          console.log(" *** 확인");
                        }
                      }}>
                      <View style={{

                        alignItems: "center", justifyContent: "center",
                        backgroundColor: "#4343c7", margin: 16,
                        borderRadius: 16

                      }}>
                        <Text style={[{
                          fontSize: 16,
                          lineHeight: 22,
                          fontWeight: "normal",
                          color: "#fff"
                        }, {
                          paddingVertical: 20
                        }]}>{"확인"}</Text>
                      </View>
                    </TouchableOpacity>
                    {
                      (values.callback && values.isList) && <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={0.8}
                        onPress={() => {
                          {
                            ModalController.hideModal();
                            console.log(" *** 취소");
                          }
                        }}>
                        <View style={{

                          alignItems: "center", justifyContent: "center",
                          backgroundColor: "#000"

                        }}>
                          <Text style={[{
                            fontSize: 18,
                            lineHeight: 22,
                            fontWeight: "normal",
                            color: "#fff"
                          }, {
                            paddingVertical: 20
                          }]}>{"취소"}</Text>
                        </View>
                      </TouchableOpacity>
                    }

                  </View>

                </View>
              </View>

            </View>

          }
          {
            values.isList &&
            <View style={{
              backgroundColor: "#f2f2f2"
            }}>
              <View style={{
                padding: 16, //borderRadius: 20,
                backgroundColor: "#f2f2f2"
              }}>
                <View style={{}}>
                  <Text style={[{
                    fontSize: 18,
                    lineHeight: 22,
                    fontWeight: "normal",
                    color: "#161616"
                  }, {
                    paddingVertical: 20, marginBottom: 1,
                    // backgroundColor: COLORS.ic_btn_boundary, borderRadius: 10,
                    textAlign: "center"
                  }]}>{values.listTitle}</Text>
                </View>


                <FlatList
                  style={{ maxHeight: 300 }}
                  contentContainerStyle={{}}
                  data={values.listData}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        {
                          console.log(" *** List select");
                          values.callback && values.callback(index);
                          ModalController.hideModal();
                        }
                      }}
                      style={{
                        flex: 1,
                        alignItems: "center", justifyContent: "center",
                        marginVertical: 1,
                        backgroundColor: values.listIndex === index ? "#d5d5d5" : "#fff",
                        borderRadius: 16
                      }}>
                      <Text style={[{
                        fontSize: 16,
                        lineHeight: 22,
                        fontWeight: "normal",
                        color: "#fff"
                      }, {
                        color: values.listIndex === index ? "#4343c7" : "#161616",
                        paddingVertical: 20,
                        flex: 1
                      }]}>{item}</Text>
                    </TouchableOpacity>
                  )} />
              </View>


              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  {
                    ModalController.hideModal();
                    console.log(" *** 취소");
                  }
                }}>
                <View style={{
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: "#4343c7",
                  marginHorizontal: 16,
                  marginBottom: 16,
                  borderRadius: 16
                  // marginTop: 16,
                }}>
                  <Text style={[{
                    fontSize: 18,
                    lineHeight: 22,
                    fontWeight: "normal",
                    color: "#fff"
                  }, {
                    paddingVertical: 20
                  }]}>{"취소"}</Text>
                </View>
              </TouchableOpacity>

            </View>
          }
        </View>
      }

    </Modal>
  );


};

export default forwardRef(CustomModal);

