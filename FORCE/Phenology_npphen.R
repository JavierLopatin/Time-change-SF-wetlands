################################################################################
#
# Phenology analysis with npphen
#
################################################################################

# load packages
require("pipeR")
require("dplyr")
require("lubridate")
require("raster")
require("rts")
require("npphen")
require("snow")
#require("greenbrown")

# variables to st in the model
n_jobs <- 8

# work directory
home <- "/home/javier/Documents/SF_delta/Sentinel/TSA"
setwd(home)


getPhen <- function(name, dates, n_jobs){
  # ============================================================================
  # Phenological analysis of the raster time series.
  #
  # n_jobs = number of parallel jobs
  # h      = 1 (Northern Hemisphere); 2 (Southers Hemisphere)
  # nGS    = Number of greenness values within a single growing season
  # rge    = minimum and maximum values of the response variable
  # refp   = Numeric vector with the correlative number of dates to be used as
  #          reference period.
  # anop   = Numerical vector with dates that the anomalies have to be detected
  # ============================================================================

  # npphen parameters
  outname_phen <- paste0(basename1, "_phen.tif")
  outname_anomal <- paste0(basename1, "_anoma.tif")

  # load raster and transform to raster time series class
  raster <- stack(name)

  # map the phenological curve
  PhenMap(s=raster, nGS=46, dates=dates, h=1, nCluster=n_jobs,
    outname=outname_phen, format="GTiff", datatype="INT2S", rge=c(0,10000))
  # map phenological anomalies
  PhenAnoMap(s=raster, dates=dates, h=1, nCluster=n_jobs, refp=c(0,length(dates)),
    anop=c(0,length(dates)), outname=outname_anomal, format="GTiff", datatype="INT2S",
    rge=c(0,10000))

}

# example to develop
i = 12

# list folders in TSA
folders <- list.files(path = ".", pattern = "X")
# get list of TSS files

######## LOOP aca

setwd(file.path(home, folders[i]))

# create pipelilne (pipeR package)
folders[i] %>>%
  (list.files(file.path(home, .))) %>>%
  (~ list) %>>% # save list as 'list'
  (grep("TSS.tif", .)) %>>%
  (file.path(home, folders[i], list[.])) %>>%
  # delete .tif.aux files if there are
  #(if (!length(grep(".aux", .)) == 0) .[-grep(".tif.aux", .)]) %>>%
  (~ name) %>>%
  sub(pattern = "(.*)\\..*$", replacement = "\\1", basename(.)) %>>%
  (~ basename1) %>>%
  ### get dates from .hdr file
  paste0('.hdr') %>>%
  # open file and read only Line 21
  file(open = "r")  %>>%
  (~ read) %>>%
  readLines %>>%
  (.[21]) %>>%
  # remove '}' character from string
  (gsub("}", "", .)) %>>%
  # text comma separated to vector
  # text comma separated to vector
  (as.numeric(unlist(strsplit(., split = ", ")))) %>>%
  # decimal years to normal dates
  (format(date_decimal(.), "%Y/%m/%d")) %>>%
  as.Date(format = "%Y/%m/%d") %>>%
  (~ dates) %>>%
  (getPhen(name, ., n_jobs))
