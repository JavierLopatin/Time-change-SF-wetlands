#################################################################
# A funciton to change all loged DONE by QUEUED in the level1
# FORCE pool database
#
# @Author: javier
# @Date:   2018-11-29T16:11:47-08:00
# @Email:  javier.lopatin@kit.edu
# @Last modified by:   javier
# @Last modified time: 2018-11-29T16:26:48-08:00
##################################################################3

import os, argparse
import pandas as pd

# function
def change_status(file):
    # read data
    df = pd.read_csv(file, sep=' ', header=None)
    # replace all values to QUEUED
    df.loc[:,1] = 'QUEUED'
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
