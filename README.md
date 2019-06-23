# Binance Scribe 

This is a tool to grab historical data from binance using the binance api v1. 

## How to use 

- Run npm install to install the dependencies 

- Then configure the scrapper. At the top of "Scribe.js" you'll find a configuration object : 

trade_against and coins are used to generate pairs. 

eg : ENJBTC ENJETH IOTABTC IOTAETH etc...

intervals are which time range you want to save. options are "1h","30m","15m","5m","1m"

start date is the date from which you want historical data, it's in milisecond unix time.
Earliest possible is 1483292280000 aka first january 2017. I picked 1 january 2019 because I don't need data that's this old

const config = {
    trade_against : ['BTC', 'ETH'],
    coins : ['ENJ', 'IOTA', 'STEEM', 'CDT'],
    intervals : ["5m","1m"],
    start_date : 1546315199000 
};

The result will be saved in the JSON format in a folder called "data". 

