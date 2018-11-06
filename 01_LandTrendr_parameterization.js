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
var aoi = ee.FeatureCollection(geometry);

// define years and dates to include in landsat image collection
var startYear = 1987;    // what year do you want to start the time series
var endYear   = 2017;    // what year do you want to end the time series
var startDay  = '06-01'; // what is the beginning of date filter | month-day
var endDay    = '09-30'; // what is the end of date filter | month-day


//########################################################################################################
//##### Spectral indices and bands to use
//########################################################################################################

// calculate NDVI (B4-B3)/(B4+B3)
var NDVI = function(img) {
    var index = img.normalizedDifference(['B4', 'B3'])
                   .multiply(1000)                                          // ...scale results by 1000 so we can convert to int and retain some precision
                   .select([0], ['NDVI'])                                   // ...name the band
                   .set('system:time_start', img.get('system:time_start')); // ...set the output system:time_start metadata to the input image time_start otherwise it is null
    return index ;
};
// calculate EVI ( 2.5 * ((B4 – B3)/(B4 + 6 * B3 – 7.5 * B1 + 1)) )
var EVI = function(img) {
    var index = img.expression(
      '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': img.select('B5'),
      'RED': img.select('B4'),
      'BLUE': img.select('B2')})
                   .multiply(1000)
                   .select([0], ['EVI'])
                   .set('system:time_start', img.get('system:time_start'));
    return index ;
};
// Green NDVI [GNDVI] (B4-B2)/(B4+B2)
var GNDVI = function(img) {
    var index = img.normalizedDifference(['B4', 'B2'])
                   .multiply(1000)
                   .select([0], ['NDVI'])
                   .set('system:time_start', img.get('system:time_start'));
    return index ;
};
// Land sourface water index [LSWI] (B4-B7)/(B4+B7); also known in forestry as Normalize Burn Ratio [NBR]
var LSWI = function(img) {
    var index = img.normalizedDifference(['B4', 'B7'])
                   .multiply(1000)
                   .select([0], ['LSWI'])
                   .set('system:time_start', img.get('system:time_start'));
    return index ;
};
// asseled-Cap Brightness
var Brightness = function(img) {
    var index = img.expression(
      '(BLUE * 0.2043) + (GREEN * 0.4158) + (RED * 0.5524) + (NIR * 0.5741) + (SWIR1 * 0.3124) + (SWIR2 * 0.2303)', {
      'SWIR2': img.select('B7'),
      'SWIR1': img.select('B5'),
      'NIR': img.select('B4'),
      'RED': img.select('B3'),
      'GREEN': img.select('B2'),
      'BLUE': img.select('B1')})
                  .multiply(1000)
                  .select([0], ['Brightness'])
                  .set('system:time_start', img.get('system:time_start'));
    return index ;
};
// Tasseled-Cap Greenness
var Greenness = function(img) {
    var index = img.expression(
      '(BLUE * -0.1603) + (GREEN * -0.2819) + (RED * -0.4934) + (NIR * 0.7940) + (SWIR1 * -0.0002) + (SWIR2 * -0.1446)', {
      'SWIR2': img.select('B7'),
      'SWIR1': img.select('B5'),
      'NIR': img.select('B4'),
      'RED': img.select('B3'),
      'GREEN': img.select('B2'),
      'BLUE': img.select('B1')})
                  .multiply(1000)
                  .select([0], ['Greenness'])
                  .set('system:time_start', img.get('system:time_start'));
    return index ;
};
// Tasseled-Cap Wetness
var Wetness = function(img) {
    var index = img.expression(
      '(BLUE * 0.0315) + (GREEN * 0.2021) + (RED * 0.3102) + (NIR * 0.1594) + (SWIR1 * -0.6806) + (SWIR2 * -0.6109)', {
      'SWIR2': img.select('B7'),
      'SWIR1': img.select('B5'),
      'NIR': img.select('B4'),
      'RED': img.select('B3'),
      'GREEN': img.select('B2'),
      'BLUE': img.select('B1')})
                  .multiply(1000)
                  .select([0], ['Wetness'])
                  .set('system:time_start', img.get('system:time_start'));
    return index ;
};

var Angle = function(img){
  var b = ee.Image(img).select(["B1", "B2", "B3", "B4", "B5", "B7"]); // select the image bands
  var brt_coeffs = ee.Image.constant([0.2043, 0.4158, 0.5524, 0.5741, 0.3124, 0.2303]); // set brt coeffs - make an image object from a list of values - each of list element represents a band
  var grn_coeffs = ee.Image.constant([-0.1603, -0.2819, -0.4934, 0.7940, -0.0002, -0.1446]); // set grn coeffs - make an image object from a list of values - each of list element represents a band

  var sum = ee.Reducer.sum(); // create a sum reducer to be applyed in the next steps of summing the TC-coef-weighted bands
  var brightness = b.multiply(brt_coeffs).reduce(sum); // multiply the image bands by the brt coef and then sum the bands
  var greenness = b.multiply(grn_coeffs).reduce(sum); // multiply the image bands by the grn coef and then sum the bands
  var angle = (greenness.divide(brightness)).atan().multiply(180/Math.PI).multiply(100)
                     .multiply(1000)
                     .select([0], ['Angle'])
                     .set('system:time_start', img.get('system:time_start'));
  return angle;
};

// spectral bands
var B1 = function(img){
  var index = img.select('B1')
                  .multiply(1000)
                  .select([0], ['B1'])
                  .set('system:time_start', img.get('system:time_start'));
  return index;
};
var B2 = function(img){
  var index = img.select('B2')
                  .multiply(1000)
                  .select([0], ['B2'])
                  .set('system:time_start', img.get('system:time_start'));
  return index;
};
var B3 = function(img){
  var index = img.select('B3')
                  .multiply(1000)
                  .select([0], ['B3'])
                  .set('system:time_start', img.get('system:time_start'));
  return index;
};
var B4 = function(img){
  var index = img.select('B4')
                  .multiply(1000)
                  .select([0], ['B4'])
                  .set('system:time_start', img.get('system:time_start'));
  return index;
};
var B5 = function(img){
  var index = img.select('B5')
                  .multiply(1000)
                  .select([0], ['B5'])
                  .set('system:time_start', img.get('system:time_start'));
  return index;
};
var B7 = function(img){
  var index = img.select('B7')
                  .multiply(1000)
                  .select([0], ['B7'])
                  .set('system:time_start', img.get('system:time_start'));
  return index;
};


//########################################################################################################


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
//##### ANNUAL SR TIME SERIES COLLECTION BUILDING FUNCTIONS #####
//########################################################################################################

//----- MAKE A DUMMY COLLECTOIN FOR FILLTING MISSING YEARS -----
var dummyCollection = ee.ImageCollection([ee.Image([0,0,0,0,0,0]).mask(ee.Image(0))]); // make an image collection from an image with 6 bands all set to 0 and then make them masked values


//------ L8 to L7 HARMONIZATION FUNCTION -----
// slope and intercept citation: Roy, D.P., Kovalskyy, V., Zhang, H.K., Vermote, E.F., Yan, L., Kumar, S.S, Egorov, A., 2016, Characterization of Landsat-7 to Landsat-8 reflective wavelength and normalized difference vegetation index continuity, Remote Sensing of Environment, 185, 57-70.(http://dx.doi.org/10.1016/j.rse.2015.12.024); Table 2 - reduced major axis (RMA) regression coefficients
var harmonizationRoy = function(oli) {
  var slopes = ee.Image.constant([0.9785, 0.9542, 0.9825, 1.0073, 1.0171, 0.9949]);        // create an image of slopes per band for L8 TO L7 regression line - David Roy
  var itcp = ee.Image.constant([-0.0095, -0.0016, -0.0022, -0.0021, -0.0030, 0.0029]);     // create an image of y-intercepts per band for L8 TO L7 regression line - David Roy
  var y = oli.select(['B2','B3','B4','B5','B6','B7'],['B1', 'B2', 'B3', 'B4', 'B5', 'B7']) // select OLI bands 2-7 and rename them to match L7 band names
             .resample('bicubic')                                                          // ...resample the L8 bands using bicubic
             .subtract(itcp.multiply(10000)).divide(slopes)                                // ...multiply the y-intercept bands by 10000 to match the scale of the L7 bands then apply the line equation - subtract the intercept and divide by the slope
             .set('system:time_start', oli.get('system:time_start'));                      // ...set the output system:time_start metadata to the input image time_start otherwise it is null
  return y.toShort();                                                                       // return the image as short to match the type of the other data
};


//------ RETRIEVE A SENSOR SR COLLECTION FUNCTION -----
var getSRcollection = function(year, startDay, endDay, sensor, aoi) {
  // get a landsat collection for given year, day range, and sensor
  var srCollection = ee.ImageCollection('LANDSAT/'+ sensor + '/C01/T1_SR') // get surface reflectance images
                       .filterBounds(aoi)                                  // ...filter them by intersection with AOI
                       .filterDate(year+'-'+startDay, year+'-'+endDay);    // ...filter them by year and day range

  // apply the harmonization function to LC08 (if LC08), subset bands, unmask, and resample
  srCollection = srCollection.map(function(img) {
    var dat = ee.Image(
      ee.Algorithms.If(
        sensor == 'LC08',                                                  // condition - if image is OLI
        harmonizationRoy(img.unmask()),                                    // true - then apply the L8 TO L7 alignment function after unmasking pixels that were previosuly masked (why/when are pixels masked)
        img.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])                   // false - else select out the reflectance bands from the non-OLI image
           .unmask()                                                       // ...unmask any previously masked pixels
           .resample('bicubic')                                            // ...resample by bicubic
           .set('system:time_start', img.get('system:time_start'))         // ...set the output system:time_start metadata to the input image time_start otherwise it is null
      )
    );

    // make a cloud, cloud shadow, and snow mask from fmask band
    var qa = img.select('pixel_qa');                                       // select out the fmask band
    var mask = qa.bitwiseAnd(8).eq(0).and(                                 // include shadow
               qa.bitwiseAnd(16).eq(0)).and(                               // include snow
               qa.bitwiseAnd(32).eq(0));                                   // include clouds

    // apply the mask to the image and return it
    return dat.mask(mask); //apply the mask - 0's in mask will be excluded from computation and set to opacity=0 in display
  });

  return srCollection; // return the prepared collection
};


//------ FUNCTION TO COMBINE LT05, LE07, & LC08 COLLECTIONS -----
var getCombinedSRcollection = function(year, startDay, endDay, aoi) {
    var lt5 = getSRcollection(year, startDay, endDay, 'LT05', aoi);       // get TM collection for a given year, date range, and area
    var le7 = getSRcollection(year, startDay, endDay, 'LE07', aoi);       // get ETM+ collection for a given year, date range, and area
    var lc8 = getSRcollection(year, startDay, endDay, 'LC08', aoi);       // get OLI collection for a given year, date range, and area
    var mergedCollection = ee.ImageCollection(lt5.merge(le7).merge(lc8)); // merge the individual sensor collections into one imageCollection object
    return mergedCollection;                                              // return the Imagecollection
};


//------ FUNCTION TO REDUCE COLLECTION TO SINGLE IMAGE PER YEAR BY MEDOID -----
/*
  LT expects only a single image per year in a time series, there are lost of ways to
  do best available pixel compositing - we have found that a mediod composite requires little logic
  is robust, and fast

  Medoids are representative objects of a data set or a cluster with a data set whose average
  dissimilarity to all the objects in the cluster is minimal. Medoids are similar in concept to
  means or centroids, but medoids are always members of the data set.
*/

// make a medoid composite with equal weight among indices
var medoidMosaic = function(inCollection, dummyCollection) {
  // fill in missing years with the dummy collection
  var imageCount = inCollection.toList(1).length();                                                            // get the number of images
  var finalCollection = ee.ImageCollection(ee.Algorithms.If(imageCount.gt(0), inCollection, dummyCollection)); // if the number of images in this year is 0, then use the dummy collection, otherwise use the SR collection
  // calculate median across images in collection per band
  var median = finalCollection.median();                                                                       // calculate the median of the annual image collection - returns a single 6 band image - the collection median per band
  // calculate the different between the median and the observation per image per band
  var difFromMedian = finalCollection.map(function(img) {
    var diff = ee.Image(img).subtract(median).pow(ee.Image.constant(2));                                       // get the difference between each image/band and the corresponding band median and take to power of 2 to make negatives positive and make greater differences weight more
    return diff.reduce('sum').addBands(img);                                                                   // per image in collection, sum the powered difference across the bands - set this as the first band add the SR bands to it - now a 7 band image collection
  });

  // get the medoid by selecting the image pixel with the smallest difference between median and observation per band
  return ee.ImageCollection(difFromMedian).reduce(ee.Reducer.min(7)).select([1,2,3,4,5,6], ['B1','B2','B3','B4','B5','B7']); // find the powered difference that is the least - what image object is the closest to the median of teh collection - and then subset the SR bands and name them - leave behind the powered difference band
};


//------ FUNCTION TO APPLY MEDOID COMPOSITING FUNCTION TO A COLLECTION -------------------------------------------
var buildMosaic = function(year, startDay, endDay, aoi, dummyCollection) {                                                                      // create a temp variable to hold the upcoming annual mosiac
  var collection = getCombinedSRcollection(year, startDay, endDay, aoi);  // get the SR collection
  var img = medoidMosaic(collection, dummyCollection)                     // apply the medoidMosaic function to reduce the collection to single image per year by medoid
              .set('system:time_start', (new Date(year,8,1)).valueOf());  // add the year to each medoid image - the data is hard-coded Aug 1st
  return ee.Image(img);                                                   // return as image object
};


//------ FUNCTION TO BUILD ANNUAL MOSAIC COLLECTION ------------------------------
var buildMosaicCollection = function(startYear, endYear, startDay, endDay, aoi, dummyCollection) {
  var imgs = [];                                                                    // create empty array to fill
  for (var i = startYear; i <= endYear; i++) {                                      // for each year from hard defined start to end build medoid composite and then add to empty img array
    var tmp = buildMosaic(i, startDay, endDay, aoi, dummyCollection);               // build the medoid mosaic for a given year
    imgs = imgs.concat(tmp.set('system:time_start', (new Date(i,8,1)).valueOf()));  // concatenate the annual image medoid to the collection (img) and set the date of the image - hard coded to the year that is being worked on for Aug 1st
  }
  return ee.ImageCollection(imgs);                                                  // return the array img array as an image collection
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
var chartPoint = function(lt, aoi, distDir, title) {
  // lt = landtrendr output; aoi = point of interest
  Map.centerObject(aoi, 14);
  Map.addLayer(aoi, {color: "FF0000"});
  var point = getPoint(lt, aoi, 10);
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
//##### BUILD COLLECTION AND LANDTRENDR FUNCTION #####
//########################################################################################################

//----- BUILD LT COLLECTION -----
// build annual surface reflection collection
var	annualSRcollection = buildMosaicCollection(startYear, endYear, startDay, endDay, aoi, dummyCollection); // put together the cloud-free medoid surface reflectance annual time series collection

// Function to produce LandTrebdr segmentations with different indices and bands
var applyLandTrendr = function(VI, distDir){
	// apply the function to calculate the segmentation index and adjust the values by the distDir parameter - flip index so that a vegetation loss is associated with a postive delta in spectral value
  var ltCollection = annualSRcollection.map(VI)                                                   // map the function over every image in the collection - returns a 1-band annual image collection of the spectral index
                                       .map(function(img) {return img.multiply(distDir)           // ...multiply the segmentation index by the distDir to ensure that vegetation loss is associated with a positive spectral delta
                                       .set('system:time_start', img.get('system:time_start'))}); // ...set the output system:time_start metadata to the input image time_start otherwise it is null
	//----- RUN LANDTRENDR -----
	run_params.timeSeries = ltCollection; // add LT collection to the segmentation run parameter object
	// run LandTrendr spectral temporal segmentation algorithm
	var lt = ee.Algorithms.TemporalSegmentation.LandTrendr(run_params); // run LandTrendr spectral temporal segmentation algorithm

	return lt;
};

//########################################################################################################
//##### RUN LANDTRENDR #####
//########################################################################################################

// using NDVI
var lt_ndvi = applyLandTrendr(NDVI, -1);
// using EVI
var lt_evi = applyLandTrendr(EVI, -1);
// using GNDVI
var lt_gndvi = applyLandTrendr(GNDVI, -1);
// using LSWI
var lt_lswi = applyLandTrendr(LSWI, -1);
// using Tasseled-Cup Brightness
var lt_brightness = applyLandTrendr(Brightness, 1);
// using Tasseled-Cup Greenness
var lt_greenness = applyLandTrendr(Greenness, 1);
// using Tasseled-Cup Brightness
var lt_wetness = applyLandTrendr(Wetness, 1);
// using Tasseled-Cup Angle
var lt_angle = applyLandTrendr(Angle, 1);
// using bands
var lt_b1 = applyLandTrendr(B1, 1);
var lt_b2 = applyLandTrendr(B2, 1);
var lt_b3 = applyLandTrendr(B3, 1);
var lt_b4 = applyLandTrendr(B4, 1);
var lt_b5 = applyLandTrendr(B5, 1);
var lt_b6 = applyLandTrendr(B6, 1);
var lt_b7 = applyLandTrendr(B7, 1);

//----- PLOT THE SOURCE AND FITTED TIME SERIES FOR THE GIVEN POINT -----
chartPoint(lt_ndvi, aoi, -1, 'NDVI'); // plot the x-y time series for the given point

// get errors for each VI
var getError = function(lt){
  var index = lt.select(['rmse'])
                .reduceRegion(ee.Reducer.first(), aoi, 10)
                .get("rmse");
  return index;
}

var error = {
  'NDVI': getError(lt_ndvi),
  'EVI': getError(lt_evi),
  'GNDVI': getError(lt_gndvi),
  'LSWI': getError(lt_lswi),
  'Brightness': getError(lt_brightness),
  'Greenness': getError(lt_greenness),
  'Wetnness': getError(lt_wetness),
  'Angle': getError(lt_angle),
  'B1': getError(lt_b1),
  'B2': getError(lt_b2),
  'B3': getError(lt_b3),
  'B4': getError(lt_b4),
  'B5': getError(lt_b5),
  'B7': getError(lt_b7),
};

print(error)
