#######################################
'''
Get the dates from the FORCE pool file
'''
#######################################

import pandas as pd
import os, glob, argparse


def export_dates(input, output):
    '''
    Loop through a Level2 directory, obtain the dates from BOA
    rasters and export the dates to a .TXT file
    '''
    # set working directory to path
    os.chdir(input)
    # list all BOA.tif files
    files = glob.glob('*BOA.tif')
    # loop through the list to get the dates
    dates = []
    for fil in files:
        a = fil[:8]
        a = a[:4] + '/' + a[4:6] + '/' + a[6:]
        dates.append(a)
    # save as data frame
    dates = pd.DataFrame(dates, index=None)
    dates.columns = ['dates']
    dates = dates.sort_values(by=['dates'])
    # export
    dates.to_csv(output+'/FORCE_dates.txt', index=None, header=None)

if __name__ == "__main__":
    # create the arguments for the algorithm
    parser = argparse.ArgumentParser()
    parser.add_argument('-i','--input', help='Input folder dir from FORCE Level2 products', type=str)
    parser.add_argument('-o', '--output', help='Output directory', type=str)
    parser.add_argument('--version', action='version', version='%(prog)s 1.0')
    args = vars(parser.parse_args())

    # get parameters
    input = args['input']
    output = args['output']

    # run function
    export_dates(input, output)
