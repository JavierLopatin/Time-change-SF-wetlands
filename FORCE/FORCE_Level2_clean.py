##############################################################
#
# Program to loop through the FORCE Level2 folders
# and delete those that did not intersent the shapefile
#
# Author: Javier Lopatin
###############################################################

import os
import glob
import shutil

# load shapefile mask
shape = '/home/javier/Documents/SF_delta/shp/delta_all_mask_diss_proj.shp'

def intersept_force(shape, image):

    # check if a raster and a shapefile intersept
    import ogr
    import gdal

    raster = gdal.Open(image)
    vector = ogr.Open(shape)

    # Get raster geometry
    transform = raster.GetGeoTransform()
    pixelWidth = transform[1]
    pixelHeight = transform[5]
    cols = raster.RasterXSize
    rows = raster.RasterYSize

    xLeft = transform[0]
    yTop = transform[3]
    xRight = xLeft+cols*pixelWidth
    yBottom = yTop+rows*pixelHeight


    ring = ogr.Geometry(ogr.wkbLinearRing)
    ring.AddPoint(xLeft, yTop)
    ring.AddPoint(xLeft, yBottom)
    ring.AddPoint(xRight, yBottom)
    ring.AddPoint(xRight, yTop)
    ring.AddPoint(xLeft, yTop)
    rasterGeometry = ogr.Geometry(ogr.wkbPolygon)
    rasterGeometry.AddGeometry(ring)

    # Get vector geometry
    layer = vector.GetLayer()
    feature = layer.GetFeature(0)
    vectorGeometry = feature.GetGeometryRef()

    return(rasterGeometry.Intersect(vectorGeometry))

# list of folders
folders = [x[0] for x in os.walk('Level2')]

# loop through folders
for file in folders[1:]:
    # use one .tif file as example
    raster = glob.glob(os.getcwd()+'/'+file+'/'+'*.tif')[0]
    if not intersept_force(shape, raster):
        shutil.rmtree(os.getcwd()+'/'+file)
