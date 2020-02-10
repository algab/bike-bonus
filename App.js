import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import Home from './src/pages/Home';
import Tabs from './src/pages/Tabs';
import Way from './src/pages/Way';

console.disableYellowBox = true;

const App = createAppContainer(
  createStackNavigator({
    Home: {
      screen: Home,
      navigationOptions: {
        headerShown: false,
      }
    },
    Tabs: {
      screen: Tabs,
      navigationOptions: {
        headerShown: false,
      }
    },
    Way: {
      screen: Way,
      navigationOptions: {
        headerShown: false,
      }
    }
  })
);

export default App;
