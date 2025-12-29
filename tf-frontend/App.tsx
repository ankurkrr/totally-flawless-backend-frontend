import React, { useEffect } from 'react';
import Navigation from './src/Navigation';
import { Provider } from 'react-redux';
import { store } from './src/store/store';


const App = () => {
  useEffect(() => {
  }, []);

  return (
    <Provider store={store}>
      <Navigation />
    </Provider>
  );
};

export default App;
