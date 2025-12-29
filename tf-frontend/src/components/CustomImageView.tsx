import { Modal, SafeAreaView, View } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import ImageView from "react-native-image-viewing";

type Props = {
    imgData: any[],
    index: number,
    imageVisible: boolean,
    imageVisibleFunction: (visible: boolean) => void,
};

const CustomImageView = ({ imgData, index, imageVisible, imageVisibleFunction }: Props) => {

    // console.log('imgData>>>', imgData)
    const [modalVisible, setModalVisible] = useState(imageVisible);
    const [imgIndex, setImgIndex] = useState(index);
    const lastIndexRef = useRef(index);

    useEffect(() => {
        if (imageVisible) {
            setImgIndex(index);
            lastIndexRef.current = index; // Ensure lastIndex is in sync
        }
    }, [index, imageVisible]);

    // Ensure the state updates when the index changes from props
    // useEffect(() => {
    //     setImgIndex(index);
    // }, [index]);

    return (
        <Modal
            visible={modalVisible}
            transparent={true}
            
            onRequestClose={() => {
                setModalVisible(false);
                imageVisibleFunction(false);
            }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                    <ImageView
                    // keyExtractor={(imgSource, index) => index.toString()}
                        key={imgIndex} // Force re-render when index changes
                        images={imgData}
                        imageIndex={imgIndex}
                        doubleTapToZoomEnabled={true}
                        onImageIndexChange={(newIndex) => {
                            if (lastIndexRef.current !== newIndex) { // Prevent duplicate calls
                                console.log('Swiped to index:', newIndex);
                                lastIndexRef.current = newIndex;
                                setImgIndex(newIndex);
                            }
                        }}
                        visible={modalVisible}
                        onRequestClose={() => {
                            imageVisibleFunction(false);
                        }}
                    />
            </SafeAreaView>
        </Modal>
    );
};

export default CustomImageView;
