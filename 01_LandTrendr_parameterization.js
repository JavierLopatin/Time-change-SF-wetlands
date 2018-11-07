//########################################################################################################
//#                                                                                                    #\\
//#                      LANDTRENDR SOURCE AND FITTING PIXEL TIME SERIES PLOTTING                      #\\
//#                                                                                                    #\\
//########################################################################################################

// Description: parameterization and visualization of LandTrendr using
//              different spectral indecies and bandas

// date: 2018-11-05
// author: Javier Lopatin | javier.lopatin@kit.edu; javierlopatin@gmail.com
// Based on the information posted in: https://github.com/eMapR/LT-GEE


//########################################################################################################
//##### INPUTS #####
//########################################################################################################


// show LandTrend for this point
var point = ee.FeatureCollection(geometry);
var aoi = delta;

// load LandTrendr estimation funciton
var func = require('users/javierlopatin/SF_delta:00_LandTrendr_Functions')

// define years and dates to include in landsat image collection
var startYear = 1987;    // what year do you want to start the time series
var endYear   = 2017;    // what year do you want to end the time series
var startDay  = '06-01'; // what is the beginning of date filter | month-day
var endDay    = '09-30'; // what is the end of date filter | month-day


// define the segmentation parameters:
// reference: Kennedy, R. E., Yang, Z., & Cohen, W. B. (2010). Detecting trends in forest disturbance and recovery using yearly Landsat time series: 1. LandTrendr—Temporal segmentation algorithms. Remote Sensing of Environment, 114(12), 2897-2910.
var run_params = {
  maxSegments:            6,
  spikeThreshold:         0.9,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: true,
  recoveryThreshold:      0.25,
  pvalThreshold:          0.05,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};


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

//########################################################################################################
//##### RUN LANDTRENDR #####
//########################################################################################################

// get Landsat 5,7,8 homogenized collection
var ltCollector = func.ltCollector(run_params, aoi); // (run_param, aoi)

// LT
// using NDVI
var lt_ndvi = func.applyLT('NDVI', ltCollector, run_params, -1); //(VI, annualSRcollection, run_params, distDir)
// using EVI
var lt_evi = func.applyLT('EVI', ltCollector, run_params, -1);
// using GNDVI
var lt_gndvi = func.applyLT('GNDVI', ltCollector, run_params, -1);
// using LSWI
var lt_lswi = func.applyLT('LSWI', ltCollector, run_params, -1);
// using Tasseled-Cup Brightness
var lt_brightness = func.applyLT('TCB', ltCollector, run_params, 1);
// using Tasseled-Cup Greenness
var lt_greenness = func.applyLT('TCG', ltCollector, run_params, 1);
// using Tasseled-Cup Brightness
var lt_wetness = func.applyLT('TCW', ltCollector, run_params, 1);
// using Tasseled-Cup Angle
var lt_angle = func.applyLT('TCA', ltCollector, run_params, 1);
// using bands
var lt_b1 = func.applyLT('B1', ltCollector, run_params, 1);
var lt_b2 = func.applyLT('B2', ltCollector, run_params, 1);
var lt_b3 = func.applyLT('B3', ltCollector, run_params, 1);
var lt_b4 = func.applyLT('B4', ltCollector, run_params, 1);
var lt_b5 = func.applyLT('B5', ltCollector, run_params, 1);
var lt_b7 = func.applyLT('B7', ltCollector, run_params, 1);

//----- PLOT THE SOURCE AND FITTED TIME SERIES FOR THE GIVEN POINT -----
chartPoint(lt_ndvi, point, -1, 'NDVI'); // plot the x-y time series for the given point
chartPoint(lt_evi, point, -1, 'EVI');
chartPoint(lt_gndvi, point, -1, 'GNDVI');
chartPoint(lt_lswi, point, -1, 'LSWI');
chartPoint(lt_brightness, point, 1, 'TCBº');
chartPoint(lt_greenness, point, 1, 'TCG');
chartPoint(lt_wetness, point, 1, 'TCW');
chartPoint(lt_angle, point, 1, 'TCA');
chartPoint(lt_b1, point, 1, 'B1');
chartPoint(lt_b2, point, 1, 'B2');
chartPoint(lt_b3, point, 1, 'B3');
chartPoint(lt_b4, point, 1, 'B4');
chartPoint(lt_b5, point, 1, 'B5');
chartPoint(lt_b7, point, 1, 'B7');

// get errors for each VI
var getError = function(lt){
  var index = lt.select(['rmse'])
                .reduceRegion(ee.Reducer.first(), point, 10)
                .get("rmse");
  return index;
}

var error = {
  'NDVI': getError(lt_ndvi),
  'EVI': getError(lt_evi),
  'GNDVI': getError(lt_gndvi),
  'LSWI': getError(lt_lswi),
  'TCB': getError(lt_brightness),
  'TCG': getError(lt_greenness),
  'TCW': getError(lt_wetness),
  'TCA': getError(lt_angle),
  'B1': getError(lt_b1),
  'B2': getError(lt_b2),
  'B3': getError(lt_b3),
  'B4': getError(lt_b4),
  'B5': getError(lt_b5),
  'B7': getError(lt_b7),
};

print(error)
