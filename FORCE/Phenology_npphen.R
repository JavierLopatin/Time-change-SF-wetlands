##########################
#
# Phenology analysis with npphen
#
#

# load packages
if (!require("npphen")) { install.packages("npphen"); require("npphen") }
if (!require("snow")) { install.packages("snow"); require("snow") }
#if (!require("raster")) { install.packages("raster"); require("raster") }

# work directory
setwd('/home/javier/Documents/SF_delta/Sentinel/TSA/X-001_Y0000')

# parameters
n_jobs <- 3



# raster stack with EVI images
img <- stack('/home/javier/Documents/SF_delta/Sentinel/TSA/X-001_Y0000/2015-2018_001-365_LEVEL4_TSA_SEN2L_EVI_C0_S0_FAVG_TY_C95T_TSS.tif')

# load dates of the images
Slovenia_dates <- as.Date(sl_dates$date, format='%d/%m/%Y')
# Making the LSP raster, n bands = 23
library(snow)
# Define the number of cores to be use. In this example we use 1
PhenMap(s=Slovenia_rasters,dates=Slovenia_dates,h=1,nGS=23, nCluster=n_jobs,
  outname="phen_slov.tif", format="GTiff", datatype="FLT4S",rge=c(0,10000))
map1<-raster("phen_slov.tif")
plot(map1)




sl.path<-system.file("extdata/HN_slovenia",package="npphen")
sl_rasters<-list.files(path=sl.path, pattern=glob2rx("slovenia*.tif"), full.names=TRUE)
Slovenia_rasters<-stack(sl_rasters)
sl_dates<-read.csv(system.file("extdata/date_tables/Slovenia_dates.csv", package="npphen"))
Slovenia_dates <- as.Date(sl_dates$date, format='%d/%m/%Y')
