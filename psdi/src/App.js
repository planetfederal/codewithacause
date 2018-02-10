import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';

import './App.css';

import { createStore, combineReducers, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {Provider} from 'react-redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkZoomControl from '@boundlessgeo/sdk/components/map/zoom-control';

import * as SdkMapActions from '@boundlessgeo/sdk/actions/map';

import BookmarkComponent from './bookmarks';
import MoveButtonComponent from './moveButton';
import AddBookmarkComponent from './addBookmark';

import bookmarkReducer from './reducer';
import * as bookmarkAction from './action';

import SdkPopup from '@boundlessgeo/sdk/components/map/popup';

const store = createStore(combineReducers({
  map: SdkMapReducer, bookmark: bookmarkReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
applyMiddleware(thunkMiddleware));

class App extends Component {

  componentDidMount() {
    // load in the map style from a external .json
    //store.dispatch(SdkMapActions.setContext({url: './bookmarks.json'}));
    // add the OSM source
    store.dispatch(SdkMapActions.addSource('osm', {
      type: 'raster',
      tileSize: 256,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
    }));

    // add an OSM layer
    store.dispatch(SdkMapActions.addLayer({
      id: 'osm',
      source: 'osm',
    }));
    const SOURCENAMES = ['paris-bakeries', 'saint-louis-bakeries'];

    // Fetch data from local files
    this.addDataFromGeoJSON('./data/stlouis.json', SOURCENAMES[1]);
    this.addDataFromGeoJSON('./data/paris.json', SOURCENAMES[0]);


    // // This is the name of the source that the bookmark component will iterate over
    //
    // // Fetch the geoJson file from a url and add it to the map at the named source
    // const addDataFromGeoJSON = (url, sourceName) => {
    //   // Fetch URL
    //   return fetch(url)
    //     .then(
    //       response => console.log(response),//response.json(),
    //       error => console.error('An error occured.', error),
    //     )
    //     // addFeatures with the features, source name
    //     // .then(json => store.dispatch(mapActions.addFeatures(sourceName, json)));
    //     .then(json => {
    //       store.dispatch(SdkMapActions.addSource(sourceName, {
    //         type: 'geojson',
    //         data: json
    //       }));
    //       store.dispatch(SdkMapActions.addLayer({
    //         id: sourceName,
    //         type: 'circle',
    //         source: sourceName,
    //         paint: {
    //           'circle-radius': 5,
    //           'circle-color': '#f46b42',
    //           'circle-stroke-color': '#3a160b',
    //         }
    //       }));
    //     });
    // };
    //
    // // Change the souce as needed
    // const changeSource = (sourceName) => {
    //   store.dispatch(bookmarkAction.changeSource(sourceName));
    // };
    // // Add bookmark to redux store
    // const addBookmark = () => {
    //   store.dispatch(bookmarkAction.addBookmark(true));
    // };
    //
    // // Delete bookmark to redux store
    // const deleteBookmark = () => {
    //   const bookmark = store.getState().bookmark;
    //   const features = store.getState().map.sources[bookmark.source].data.features;
    //
    //   // Simple check to make sure we have more feature to remove
    //   if (features.length > 0) {
    //
    //     // move to the next feature before it's deleted
    //     if (features.length > 1) {
    //       store.dispatch(SdkMapActions.setView(features[bookmark.count + 1].geometry.coordinates, 18));
    //     }
    //
    //     // Assumes address is unique
    //     // In a larger dataset adding in a uuid would be a good idea
    //     const filter = ['==', 'address', features[bookmark.count].properties.address];
    //     store.dispatch(SdkMapActions.removeFeatures(bookmark.source, filter));
    //   } else {
    //     alert('No features left to delete');
    //   }
    // };
    //
    // // Fetch data from local files
    // addDataFromGeoJSON('./data/stlouis.json', SOURCENAMES[1]);
    // addDataFromGeoJSON('./data/paris.json', SOURCENAMES[0]);
    //
    // // Init source for the bookmarks
    // changeSource(SOURCENAMES[0]);
}
// Fetch the geoJson file from a url and add it to the map at the named source
  addDataFromGeoJSON(url, sourceName) {
    // Fetch URL
    return fetch(url)
      .then(
        response => response.json(),
        error => console.error('An error occured.', error),
      )
      // addFeatures with the features, source name
      // .then(json => store.dispatch(mapActions.addFeatures(sourceName, json)));
      .then(json => {
        store.dispatch(SdkMapActions.addSource(sourceName, {
          type: 'geojson',
          data: json
        }));
        store.dispatch(SdkMapActions.addLayer({
          id: sourceName,
          type: 'circle',
          source: sourceName,
          paint: {
            'circle-radius': 5,
            'circle-color': '#f46b42',
            'circle-stroke-color': '#3a160b',
          }
        }));
      });
  };
  render() {
    return (
      <div className="App">
        <Provider store={store}>
          <div className='map-container'>
            <SdkMap
              className='map'
              style={{position: 'relative'}}
              includeFeaturesOnClick
              onClick={(map, xy, featurePromise) => {
                featurePromise.then((featureGroups) => {
                // featureGroups is an array of objects. The key of each object
                // is a layer from the map. Here, only one layer is included.
                const layers = Object.keys(featureGroups[0]);
                const layer = layers[0];
                // collect every feature from the layer.
                // in this case, only one feature will be returned in the promise.
                const features = featureGroups[0][layer];

                if (features === undefined) {
                  // no features, :( Let the user know nothing was there.
                  map.addPopup(<SdkPopup coordinate={xy}><i>This is a popup!</i></SdkPopup>);
                }
                });
              }}
            />
            <div id="bookmark"><BookmarkComponent className='bookmark-item'/></div>
            <AddBookmarkComponent />
          </div>
        </Provider>
      </div>
    );
  }
}

export default App;
