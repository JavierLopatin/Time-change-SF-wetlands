//######################################################################################################## 
//#                                                                                                    #\\
//#                        LANDTRENDR GREATEST MAGNITUDE DISTURBANCE MAPPING                           #\\
//#                                                                                                    #\\
//########################################################################################################


// date: 2018-11-05
// author: Javier Lopatin | javier.lopatin@kit.edu; javierlopatin@gmail.com
// Based on the information posted in: https://github.com/eMapR/LT-GEE


//########################################################################################################
//##### INPUTS #####
//########################################################################################################

// define a geometry - there are lots of ways to do this, see the GEE User guide
var aoi = geometry; // should be a GEE geometry object - here we are getting it from an drawn polygon

// define disturbance mapping filter parameters
var treeLoss1  = 175; // delta filter for 1 year duration disturbance, <= will not be included as disturbance - units are in units of VI defined in the following function definition
var treeLoss20 = 200; // delta filter for 20 year duration disturbance, <= will not be included as disturbance - units are in units of VI defined in the following function definition
var preVal     = 400; // pre-disturbance value threshold - values below the provided threshold will exclude disturbance for those pixels - units are in units of VI defined in the following function definition
var mmu        = 10;  // minimum mapping unit for disturbance patches - units of pixels


//########################################################################################################
//##### GREATEST DISTURBANCE EXTRACTION FUNCTIONS #####
//########################################################################################################

// ----- function to extract greatest disturbance based on spectral delta between vertices
var extractDisturbance = function(lt, distDir, params, mmu) {
  // select only the vertices that represents a change
  var vertexMask = lt.arraySlice(0, 3, 4); // get the vertex - yes(1)/no(0) dimension
  var vertices = lt.arrayMask(vertexMask); // convert the 0's to masked

  // construct segment start and end point years and index values
  var left = vertices.arraySlice(1, 0, -1);    // slice out the vertices as the start of segments
  var right = vertices.arraySlice(1, 1, null); // slice out the vertices as the end of segments
  var startYear = left.arraySlice(0, 0, 1);    // get year dimension of LT data from the segment start vertices
  var startVal = left.arraySlice(0, 2, 3);     // get spectral index dimension of LT data from the segment start vertices
  var endYear = right.arraySlice(0, 0, 1);     // get year dimension of LT data from the segment end vertices
  var endVal = right.arraySlice(0, 2, 3);      // get spectral index dimension of LT data from the segment end vertices

  var dur = endYear.subtract(startYear);       // subtract the segment start year from the segment end year to calculate the duration of segments
  var mag = endVal.subtract(startVal);         // substract the segment start index value from the segment end index value to calculate the delta of segments

  // concatenate segment start year, delta, duration, and starting spectral index value to an array
  var distImg = ee.Image.cat([startYear.add(1), mag, dur, startVal.multiply(distDir)]).toArray(0); // make an image of segment attributes - multiply by the distDir parameter to re-orient the spectral index if it was flipped for segmentation - do it here so that the subtraction to calculate segment delta in the above line is consistent - add 1 to the detection year, because the vertex year is not the first year that change is detected, it is the following year

  // sort the segments in the disturbance attribute image delta by spectral index change delta
  var distImgSorted = distImg.arraySort(mag.multiply(-1));                                  // flip the delta around so that the greatest delta segment is first in order

  // slice out the first (greatest) delta
  var tempDistImg = distImgSorted.arraySlice(1, 0, 1).unmask(ee.Image(ee.Array([[0],[0],[0],[0]])));                                      // get the first segment in the sorted array

  // make an image from the array of attributes for the greatest disturbance
  var finalDistImg = ee.Image.cat(tempDistImg.arraySlice(0,0,1).arrayProject([1]).arrayFlatten([['yod']]),     // slice out year of disturbance detection and re-arrange to an image band
                                  tempDistImg.arraySlice(0,1,2).arrayProject([1]).arrayFlatten([['mag']]),     // slice out the disturbance magnitude and re-arrange to an image band
                                  tempDistImg.arraySlice(0,2,3).arrayProject([1]).arrayFlatten([['dur']]),     // slice out the disturbance duration and re-arrange to an image band
                                  tempDistImg.arraySlice(0,3,4).arrayProject([1]).arrayFlatten([['preval']])); // slice out the pre-disturbance spectral value and re-arrange to an image band

  // filter out disturbances based on user settings
  var threshold = ee.Image(finalDistImg.select(['dur']))                        // get the disturbance band out to apply duration dynamic disturbance magnitude threshold
                    .multiply((params.tree_loss20 - params.tree_loss1) / 19.0)  // ...
                    .add(params.tree_loss1)                                     //    ...interpolate the magnitude threshold over years between a 1-year mag thresh and a 20-year mag thresh
                    .lte(finalDistImg.select(['mag']))                          // ...is disturbance less then equal to the interpolated, duration dynamic disturbance magnitude threshold
                    .and(finalDistImg.select(['mag']).gt(0))                    // and is greater than 0
                    .and(finalDistImg.select(['preval']).gt(params.pre_val));   // and is greater than pre-disturbance spectral index value threshold

  // apply the filter mask
  finalDistImg = finalDistImg.mask(threshold).int16();

   // patchify the remaining disturbance pixels using a minimum mapping unit
  if(mmu > 1){
    var mmuPatches = finalDistImg.select(['yod'])           // patchify based on disturbances having the same year of detection
                            .connectedPixelCount(mmu, true) // count the number of pixel in a candidate patch
                            .gte(mmu);                      // are the the number of pixels per candidate patch greater than user-defined minimum mapping unit?
    finalDistImg = finalDistImg.updateMask(mmuPatches);     // mask the pixels/patches that are less than minimum mapping unit
  }

  return finalDistImg; // return the filtered greatest disturbance attribute image
};


//########################################################################################################
//##### RUN THE GREATEST DISTURBANCE EXTRACT FUCTION #####
//########################################################################################################

// assemble the disturbance extraction parameters
var distParams = {
  tree_loss1: treeLoss1,
  tree_loss20: treeLoss20,
  pre_val: preVal
};

// run the dist extract function
var distImg = extractDisturbance(lt.select('LandTrendr'), distDir, distParams).clip(delta);


//########################################################################################################
//##### DISTURBANCE MAP DISPLAY #####
//########################################################################################################

// ----- set visualization dictionaries -----
var yodVizParms = {
  min: startYear+1,
  max: endYear,
  palette: ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000']
};

var magVizParms = {
  min: distParams.tree_loss1,
  max: 1000,
  palette: ['#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000']
};

var durVizParms = {
  min: 1,
  max: endYear-startYear,
  palette: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF']
};

var preValVizParms = {
  min: preVal,
  max: 800,
  palette: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF']
};


// ----- display the disturbance attribute maps -----
Map.centerObject(geometry, 12);                                             // center the map display and set zoom level
//Map.addLayer(distImg.select(['preval']), preValVizParms, 'Pre-dist Value'); // add pre-disturbacne spectral index value to map
//Map.addLayer(distImg.select(['dur']), durVizParms, 'Duration');             // add disturbance duration to map
//Map.addLayer(distImg.select(['mag']), magVizParms, 'Magnitude');            // add magnitude to map
Map.addLayer(distImg.select(['yod']), yodVizParms, 'Year of Detection');    // add disturbance year of detection to map

// Save results to Drive
Export.image.toDrive({
  image: distImg.select(['preval']),
  description: 'LandTrendr_preval',
  folder: 'data_earth_engine',
  scale: 30,
  region: geometry
});
Export.image.toDrive({
  image: distImg.select(['dur']),
  description: 'LandTrendr_duration',
  folder: 'data_earth_engine',
  scale: 30,
  region: geometry
});
Export.image.toDrive({
  image: distImg.select(['mag']),
  description: 'LandTrendr_magnitude',
  folder: 'data_earth_engine',
  scale: 30,
  region: geometry
});
Export.image.toDrive({
  image: distImg.select(['yod']),
  description: 'LandTrendr_year-of-detection',
  folder: 'data_earth_engine',
  scale: 30,
  region: geometry
});
