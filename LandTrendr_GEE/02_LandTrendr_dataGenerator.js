//########################################################################################################
//#                                                                                                    #\\
//#                           LANDTRENDR VERTEX AND FITTED DATA MAPPING                                #\\
//#                                                                                                    #\\
//########################################################################################################


// Description: create a stack of the LandTrendr segments

// date: 2018-11
// author: Javier Lopatin | javier.lopatin@kit.edu; javierlopatin@gmail.com
// Based on the information posted in: https://github.com/eMapR/LT-GEE


//########################################################################################################
//##### INPUTS #####
//########################################################################################################

// show LandTrend for this point
var aoi = delta;

// load LandTrendr estimation funciton
var func = require('users/javierlopatin/SF_delta:00_LandTrendr_Functions')

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
//##### UNPACKING LT-GEE OUTPUT STRUCTURE FUNCTIONS #####
//########################################################################################################

// ----- FUNCTION TO EXTRACT VERTICES FROM LT RESULTS AND STACK BANDS -----
var getLTvertStack = function(LTresult) {
  var emptyArray = [];                              // make empty array to hold another array whose length will vary depending on maxSegments parameter
  var vertLabels = [];                              // make empty array to hold band names whose length will vary depending on maxSegments parameter
  var iString;                                      // initialize variable to hold vertex number
  for(var i=1;i<=run_params.maxSegments+1;i++){     // loop through the maximum number of vertices in segmentation and fill empty arrays
    iString = i.toString();                         // define vertex number as string
    vertLabels.push("vert_"+iString);               // make a band name for given vertex
    emptyArray.push(0);                             // fill in emptyArray
  }

  var zeros = ee.Image(ee.Array([emptyArray,        // make an image to fill holes in result 'LandTrendr' array where vertices found is not equal to maxSegments parameter plus 1
                                 emptyArray,
                                 emptyArray]));

  var lbls = [['yrs_','src_','fit_'], vertLabels,]; // labels for 2 dimensions of the array that will be cast to each other in the final step of creating the vertice output

  var vmask = LTresult.arraySlice(0,3,4);           // slices out the 4th row of a 4 row x N col (N = number of years in annual stack) matrix, which identifies vertices - contains only 0s and 1s, where 1 is a vertex (referring to spectral-temporal segmentation) year and 0 is not

  var ltVertStack = LTresult.arrayMask(vmask)       // uses the sliced out isVert row as a mask to only include vertice in this data - after this a pixel will only contain as many "bands" are there are vertices for that pixel - min of 2 to max of 7.
                      .arraySlice(0, 0, 3)          // ...from the vertOnly data subset slice out the vert year row, raw spectral row, and fitted spectral row
                      .addBands(zeros)              // ...adds the 3 row x 7 col 'zeros' matrix as a band to the vertOnly array - this is an intermediate step to the goal of filling in the vertOnly data so that there are 7 vertice slots represented in the data - right now there is a mix of lengths from 2 to 7
                      .toArray(1)                   // ...concatenates the 3 row x 7 col 'zeros' matrix band to the vertOnly data so that there are at least 7 vertice slots represented - in most cases there are now > 7 slots filled but those will be truncated in the next step
                      .arraySlice(1, 0, run_params.maxSegments+1) // ...before this line runs the array has 3 rows and between 9 and 14 cols depending on how many vertices were found during segmentation for a given pixel. this step truncates the cols at 7 (the max verts allowed) so we are left with a 3 row X 7 col array
                      .arrayFlatten(lbls, '');      // ...this takes the 2-d array and makes it 1-d by stacking the unique sets of rows and cols into bands. there will be 7 bands (vertices) for vertYear, followed by 7 bands (vertices) for rawVert, followed by 7 bands (vertices) for fittedVert, according to the 'lbls' list

  return ltVertStack;                               // return the stack
};


//----- EXTRACT DATA FROM THE LT-GEE STRUCTURE -----
// extract the year, raw spectral value, and fitted values for vertices as stacked bands
var ltVertStack = function(lt){
  index = getLTvertStack(lt.select(["LandTrendr"])).clip(aoi); // select out the "LandTrendr" band
  // extract the segmentation-fitted index stack as
  var years = [];                                                           // make an empty array to hold year band names
  for (var i = startYear; i <= endYear; ++i) years.push('yr'+i.toString()); // fill the array with years from the startYear to the endYear and convert them to string
  var ltFitStack = lt.select([1])                                           // select out the 2nd band data which is the segmentation-fitted spectral index
                     .arrayFlatten([years]).clip(aoi);                      // ...flatten is out into band, assigning the year as the band name
  return index;
};

//###############################################################################
// Run funcitons
//###############################################################################

// get Landsat 5,7,8 homogenized collection
var ltCollector = func.ltCollector(run_params, aoi); // (run_param, aoi)

// LT
var lt_ndvi = func.applyLT('NDVI', ltCollector, run_params, -1); //(VI, annualSRcollection, run_params, distDir)

// Apply function to extract predicted stacked
var vstack_NDVI = ltVertStack(lt_ndvi);

// show the vertex information and fitted imagery
var imageVisParam = {"opacity":1,"bands":["yr1987","yr2001","yr2017"],"gamma":1};

//Map.addLayer(ltVertStack, {}, 'Vert Info');
Map.addLayer(vstack_NDVI.select(['yr1987', 'yr2001', 'yr2017']), imageVisParam, 'RGB Change');







//Export.image.toDrive({
//  image: ltFitStack,
//  description: 'LandTrendr_FitStack',
//  folder: 'data_earth_engine',
//  scale: 30,
//  region: geometry
//});
