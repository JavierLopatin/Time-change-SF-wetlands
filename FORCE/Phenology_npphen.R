##########################
#
# Phenology analysis with npphen
#
#

# load packages
if (!require("npphen")) { install.packages("npphen"); require("npphen") }
if (!require("snow")) { install.packages("snow"); require("snow") }
if (!require("raster")) { install.packages("raster"); require("raster") }
if (!require("rts")) { install.packages("rts"); require("rts") }

# work directory
home <- '/home/javier/Documents/SF_delta/Sentinel'
setwd(home)

# load dates from Level2 data
dates <- read.table('FORCE_dates.txt', header=F)
dates <- as.Date(dates$V1, format = "%Y/%m/%d")
dates <- dates[order(dates)]

# list folders in TSA
folders <- list.files(path='TSA', pattern='X')
# get list of TSS files

i = 1

files <- list.files( file.path(home, 'TSA', folders[i]))
tss <- grep('TSS.tif',  files)
tss <- file.path(home, 'TSA', folders[i], files[tss])
if ( !length(grep('.aux',  tss)) == 0 ){
  tss <- tss[- grep('.tif.aux',  tss)]
}
name <- sub(pattern = "(.*)\\..*$", replacement = "\\1", basename(tss))
# load raster
raster <- stack(tss)
# assing na values
#values(raster)[values(raster) == -32767] = NA
# Generate a Raster time series using a raster stack and a date database from Aysen
ts <- rts(raster, dates)
rm(raster)

# npphen parameters
outname_phen <- file.path(home, 'TSA', folders[i], paste0(name, '_phen.tif'))
outname_anomal <- file.path(home, 'TSA', folders[i], paste0(name, '_anomal.tif'))
n_jobs <- 4 # number of parallel jobs
h <- 1 # Northern Hemisphere
nGS <- 23 # Number of greenness values within a single growing season
rge <- c(0,10000) # minimum and maximum values of the response variable
refp <- c(0,length(dates)) # Numeric vector with the correlative number of dates to be used as reference period.
                           # For example, refp=c(1:393) for MODIS Vegetation Index 16-days composites (18/02/2000 – 06/06/2017)
anop <- c(0,length(dates)) # Numeric vector with the correlative number of dates for the period in which the
                   # anomalies will be calculated. For example refp=c(21:43) for the first complete
                   # year for MODIS Vegetation Index 16-days composites (01/01/2001 – 19/12/2001).                    # anop y refp can be overlapped


# map the phenological curve
PhenMap(s=ts, dates=dates, h=h, nGS=nGS, nCluster=n_jobs,
  outname=outname_phen, format="GTiff", datatype="FLT4S", rge=rge)
# map anomalies outside the curve
PhenAnoMap(s=ts, dates=dates, h=h, refp=refp, anop=anop,
  nCluster=n_jobs, outname=outname_anomal, format="GTiff", datatype="FLT4S", rge=rge)



# Test parameters on one pixel
sl_pixel<-cellFromXY(ts, c(650564, 4181457))
sl_pixelts<-extract(ts, sl_pixel)
plot(sl_pixelts)

Phen(x=as.vector(sl_pixelts), dates=dates, h=h, nGS=nGS, rge=rge)

PhenAnoma(x=as.vector(sl_pixelts), dates=dates, h=h, refp=refp,
  anop=anop, rge=rge)

PhenKplot(x=as.vector(sl_pixelts), dates=dates, h=h, nGS=nGS, xlab="DOY",
  ylab="EVI", rge=rge)
