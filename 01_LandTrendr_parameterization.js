
//########################################################################################################
//#                                                                                                    #\\
//#                      LANDTRENDR SOURCE AND FITTING PIXEL TIME SERIES PLOTTING                      #\\
//#                                                                                                    #\\
//########################################################################################################

// Description: parameterization and visualization of LandTrendr using
//              different spectral indecies and bandas

// TO use the predefined LandTrendr functions of https://github.com/eMapR/LT-GEE, please open GEE code API
// at: https://code.earthengine.google.com/?accept_repo=users/emaprlab/public
// We used a personalized version were we added the EVI index

// date: 2018-11-05
// author: Javier Lopatin | javier.lopatin@kit.edu; javierlopatin@gmail.com


//########################################################################################################
//##### INPUTS #####
//########################################################################################################

// load the LandTrendr.js module
//var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js');
var ltgee = require('users/javierlopatin/SF_delta:LandTrendr.js');

// define parameters
var startYear = 1985;
var endYear = 2017;
var startDay = '06-20';
var endDay = '09-20';
var point = ee.FeatureCollection(geometry); // point o evaluate LT
var aoi = delta; // limit study area
var index = ['NBR', 'EVI', 'TCB', 'TCG','TCW','B1','B2','B3','B4','B5','B7'] // indices and bands to test
var ftvList = [];
var runParams = { // LT parameters
  maxSegments:            6,
  spikeThreshold:         0.9,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: true,
  recoveryThreshold:      0.25,
  pvalThreshold:          0.05,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};
var maskThese = ['cloud', 'shadow', 'snow', 'water'] // elements to mask out the images

//########################################################################################################
//##### FUNCTIONS FOR EXTRACTING AND PLOTTING A PIXEL TIME SERIES #####
//########################################################################################################

// ----- FUNCTION TO GET LT DATA FOR A PIXEL -----
var getPoint = function(img, geom, z) {
  return img.reduceRegion({
   reducer: 'first',
   geometry: geom,
   scale: z
  }).getInfo();
};


// ----- FUNCTION TO CHART THE SOURCE AND FITTED TIME SERIES FOR A POINT -----
var chartPoint = function(lt, point, distDir, title) {
  // lt = landtrendr output; point = point of interest
  Map.centerObject(point, 14);
  Map.addLayer(point, {color: "FF0000"});
  var point = getPoint(lt, point, 10);
  var data = [['x', 'y-original', 'y-fitted']];
  for (var i = 0; i <= (endYear-startYear); i++) {
    data = data.concat([[point.LandTrendr[0][i], point.LandTrendr[1][i]*distDir, point.LandTrendr[2][i]*distDir]]);
  }
  var options = {
  title: title,
  vAxis: {
    title: 'Spectral values',
    },
  hAxis: {
    title: 'Years',
    'format':'####'
    }
  };
  print(ui.Chart(data, 'LineChart', options,{'columns': [0, 1, 2]}));
};

// apply LandTrendr.js functions
var lt0 = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index[0], ftvList, runParams, maskThese);
var lt1 = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index[1], ftvList, runParams, maskThese);
var lt2 = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index[2], ftvList, runParams, maskThese);
var lt3 = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index[3], ftvList, runParams, maskThese);
var lt4 = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index[4], ftvList, runParams, maskThese);

//----- PLOT THE SOURCE AND FITTED TIME SERIES FOR THE GIVEN POINT -----
chartPoint(lt0, point, -1, index[0]); // plot the x-y time series for the given point
chartPoint(lt1, point, -1, index[1]);
chartPoint(lt2, point, -1, index[2]);
chartPoint(lt3, point, -1, index[3]);
chartPoint(lt4, point, -1, index[4]);

// get errors for each VI
var getError = function(lt){
  var index = lt.select(['rmse'])
                .reduceRegion(ee.Reducer.first(), point, 10)
                .get("rmse");
  return index;
}

var error = {
  'NBR': getError(lt0),
  'EVI': getError(lt1),
  'TCB': getError(lt2),
  'TCG': getError(lt3),
  'TCW': getError(lt4),

};

print(error)
