#################################################################
# A funciton to change all loged QUEUED to DONE in the level1
# FORCE pool database
#
# @Date:   2018-11-29T16:11:47-08:00
# @Email:  javier.lopatin@kit.edu
# @Last modified time: 2018-11-29T16:26:48-08:00
##################################################################3

import argparse
import pandas as pd

file = '/home/javier/Documents/SF_delta/Sentinel/Level1-sentinel2-SF.pool'

# function
def change_status(file):
    # read data
    df = pd.read_csv(file, sep=' ', header=None)
    # replace all values to QUEUED
    df.loc[:,1] = 'DONE'
    # save to disk
    df.to_csv(file, sep=' ', header=None, index=None)

if __name__ == "__main__":
    # create the arguments for the algorithm
    parser = argparse.ArgumentParser()

    # set arguments
    parser.add_argument('-i','--inputPool', help='Input pool', type=str, required=True)
    args = vars(parser.parse_args())

    # argument
    file = args['inputPool']

    # run funciton
    change_status(file)
