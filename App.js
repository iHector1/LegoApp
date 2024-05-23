import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { storage, db } from "./firebase";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { set } from "firebase/database";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled) {
      setImageUri(null);
      setImageUri(result.assets[0].uri);
      uploadImage(result.assets[0].uri);
    }
  };
  const sendUrlToServer = async (url) => {
    try {
      const response = await fetch("http://192.168.2.191:5000/guess_lego", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: [url] }),
      });

      if (!response.ok) {
        throw new Error("Failed to send URL to the server");
      }

      const responseData = await response.json();
      setImageUrl(responseData.predictions[0].label);
    } catch (error) {
      console.error("Error sending URL to the server:", error);
    }
  };
  const uploadImage = async (uri) => {
    setImageUrl(null);
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, "/" + new Date().getTime());
    const uploadImage = uploadBytesResumable(storageRef, blob);
    //listen for events
    uploadImage.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => {
        //handle error
      },
      () => {
        //handle success
        getDownloadURL(uploadImage.snapshot.ref).then((url) => {
          sendUrlToServer(url);
        });
      }
    );
  };

  return (
    <ImageBackground
      source={require("./images/lego3.jpg")}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>LegoApp</Text>
      </View>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Tomar Foto</Text>
        </TouchableOpacity>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
        {imageUrl && (
          <View style={styles.urlContainer}>
            <Text style={styles.urlText}>Tipo de lego:</Text>
            <Text style={styles.urlText}>{imageUrl}</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    position: "absolute",
    top: 80,
    width: "50%",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#2980B9", // Fondo oscuro semitransparente
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo oscuro semitransparente
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#D32F2F", // Color personalizado (rojo oscuro)
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFFFFF", // Texto blanco
    fontSize: 16,
    textAlign: "center",
  },
  image: {
    width: 200,
    height: 200,
    margin: 10,
  },
  urlContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Fondo blanco semitransparente
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  urlText: {
    color: "#000", // Texto negro
    textAlign: "center",
  },
});
