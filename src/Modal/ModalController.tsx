import {MutableRefObject} from "react";

export type CustomModalRef = {
    show: (message?: string) => void
    hide: () => void
}

export default class ModalController {
    static modalRef: MutableRefObject<CustomModalRef>;
    static setModalRef = (ref: any) => {
        console.log('setModalRef : ' + JSON.stringify(ref));
        this.modalRef = ref
    };

    static showModal = (message?: string, callback?: any) => {
        console.log(" *** show modal *** ");
        this.modalRef.current?.show(message, callback);
    };

    static showLoading = () => {
        console.log(" *** show modal Loading *** ");
        this.modalRef.current?.showLoading();
    };

    static showList = (index?: number, title?: string, list?: any, callback?: any) => {
        console.log(" *** show modal List *** " + index);
        this.modalRef.current?.showList(index, title, list, callback);
    };

    static hideModal = () => {
        // console.log("hide modal");
        this.modalRef.current?.hide();
    };
}
