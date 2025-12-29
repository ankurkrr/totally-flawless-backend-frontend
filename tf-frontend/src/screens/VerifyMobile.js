import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';

const VerifyMobile = () => {
  const [error, setError] = useState('');
  return (
    <View style={styles.container}>
      {/* Image */}
      <Image
        source={require('../../src/assets/logo3.png')}
        style={styles.image}
      />

      {/* Header */}
      <Text style={styles.header}>Verify Your Mobile Number</Text>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        {/* Country Code Input */}
        <TextInput
          style={styles.smallInput}
          placeholder="+91"
          placeholderTextColor="#888"
        />

        {/* Phone Number Input */}
        <TextInput
          style={styles.input}
          placeholder="9999-999-999"
          placeholderTextColor="#888"
        />
      </View>

      {/* Send OTP Button */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Send Code</Text>
      </TouchableOpacity>
      <View>
        <Text style={{color: 'black'}}>{error}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: 95,
    marginBottom: 50,
  },
  header: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    opacity: 0.6,
    backgroundColor: '#E8E8E8',
    color: 'black',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 75,
    borderRadius: 50,
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallInput: {
    width: 60, // Adjust the width as needed
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    opacity: 0.6,
    backgroundColor: '#E8E8E8',
    color: 'black',
  },
});

export default VerifyMobile;
