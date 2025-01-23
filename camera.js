import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [image, setImage] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [detectionResult, setDetectionResult] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (camera) {
      try {
        const photo = await camera.takePictureAsync();
        setImage(photo.uri);
        uploadImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        alert('사진 촬영 중 오류가 발생했습니다.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImage(result.assets[0].uri);
        uploadImage(result.assets[0].uri);
      } else {
        alert('이미지 선택이 취소되었습니다.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('갤러리에서 이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

//   const uploadImage = async (imageUri) => {
//     try {
//       const formData = new FormData();
//       formData.append('file', {
//         uri: imageUri,
//         type: 'image/jpeg',
//         name: 'photo.jpg',
//       });

//       const response = await fetch('http://192.168.0.101:8000/detect', {
//         method: 'POST',
//         body: formData,
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setDetectionResult(data);
//       } else {
//         alert('서버로부터 오류가 발생했습니다.');
//       }
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       alert('이미지 업로드 중 오류가 발생했습니다.');
//     }
//   };


const uploadImage = async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
  
      const response = await fetch('http://172.16.1.226:8000/detect', { // 서버 IP와 포트 수정
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      const data = await response.json();
      setDetectionResult(data); // 탐지 결과를 상태로 저장
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };
  

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>권한 상태를 확인 중입니다...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>카메라 접근 권한이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <View style={styles.resultContainer}>
            {detectionResult && (
              <Text style={styles.resultText}>
                탐지 결과: {JSON.stringify(detectionResult, null, 2)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setImage(null)}>
            <Text style={styles.buttonText}>다시 찍기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Camera
          style={styles.camera}
          type={type}
          ref={(ref) => setCamera(ref)}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}>
              <Text style={styles.buttonText}>카메라 전환</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={takePicture}>
              <Text style={styles.buttonText}>사진 촬영</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={pickImage}>
              <Text style={styles.buttonText}>갤러리</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
    margin: 20,
  },
  buttonText: {
    fontSize: 14,
    color: 'black',
  },
  imageContainer: {
    flex: 1,
    padding: 20,
  },
  preview: {
    width: '100%',
    height: '60%',
    resizeMode: 'contain',
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  resultText: {
    fontSize: 14,
  },
});

export default CameraScreen;
