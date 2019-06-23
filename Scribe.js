var rp = require('request-promise');
var fs = require('fs');

const config = {
    trade_against : ['BTC', 'ETH'],
    coins : ['ENJ', 'IOTA', 'STEEM', 'CDT'],
    intervals : ["5m","1m"], // Optional intervals are "1h","30m","15m","5m","1m"
    // earliest possible is 1483292280000 aka first january 2017. I picked 1 january 2019 because I don't need data that's this old
    start_date : 1546315199000

};


function generate_pairs()
{

    let pairs = [];

    for (let i = 0; i < config.trade_against.length; i++)
    {
        for(let k = 0; k < config.coins.length; k++)
        {
            pairs.push(config.coins[k]+config.trade_against[i])
        }
    }

    return pairs;

}


/*

https://api.binance.com/api/v1/klines returns data in that format :

[
  [
    1499040000000,      // Open time
    "0.01634790",       // Open
    "0.80000000",       // High
    "0.01575800",       // Low
    "0.01577100",       // Close
    "148976.11427815",  // Volume
    1499644799999,      // Close time
    "2434.19055334",    // Quote asset volume
    308,                // Number of trades
    "1756.87402397",    // Taker buy base asset volume
    "28.46694368",      // Taker buy quote asset volume
    "17928899.62484339" // Ignore
  ]
]
 */

// Gets how many queries we can do per minute.
 function get_exchange_limit()
{
    return new Promise(async resolve => {
        let data = await rp.get("https://api.binance.com/api/v1/exchangeInfo")
        data = JSON.parse(data);

        data = data.rateLimits.filter(el => el.rateLimitType === "REQUEST_WEIGHT")[0];

        return resolve(data.limit);
    });


}

function wait(time)
{
    return new Promise(resolve => {
        setTimeout(() => resolve('☕'), time*1000); // miliseconds to seconds
    });
}



async function main()
{
    let now = new Date().getTime();
    const limit = await get_exchange_limit();
    let used_limit = 1; // 1 because we already did one request to get the limit;
    const pairs =  generate_pairs()

    const intervals = config.intervals;


    const first_date = config.start_date;
    let index_date = first_date;

    let data_parsed = [];

    if (!fs.existsSync("data")){
        fs.mkdirSync("data");
    }



    for (let i = 0; i < pairs.length; i++) {
        for (let k = 0; k < intervals.length; k++) {

            console.log(`Getting ${pairs[i]} at interval ${intervals[k]}`)

            const filename = "./data/"+pairs[i]+"_"+intervals[k]+".json";

            // If file exists, start from where it started
            if (fs.existsSync(filename)) {
                fs.unlinkSync(filename);
            }

            let stream = fs.createWriteStream(filename, {flags:'a'});

            stream.write("[");

            let EOF = false;

            while (EOF === false) {

                let data = await rp.get("https://api.binance.com/api/v1/klines?symbol=" + pairs[i] + "&interval=" + intervals[k] + "&startTime=" + index_date, {timeout: 1000}).catch(err => {
                        console.log("timeout");
                });

                if (data === undefined)
                    continue;

                used_limit += 1;

                let data_parsed = JSON.parse(data);

                // We got everything
                if (data_parsed.length !== 500)
                    EOF = true;

                // remove first and last []
                data = data.substr(1, data.length - 2);

                stream.write(data+ ",");
                index_date = data_parsed[data_parsed.length - 1][0];

                console.log(new Date(index_date).toISOString().slice(0, 19));

                if (used_limit === 1200)
                {

                    let time_elapsed  = (new Date().getTime() - now);

                    if (time_elapsed < 60000)
                    {
                        console.log(`Limit reached, waiting ${70000 - time_elapsed} ms`);
                        // Wait in order for the limit to refresh.
                        await wait((60000 - time_elapsed)/1000);
                        // Wait 10 more seconds for good measure
                        await wait(10);

                        now = new Date().getTime();
                        used_limit = 0;
                    }

                }

            }

            stream.write("]");
            stream.end();
            index_date = first_date;
        }
    }


    console.log(pairs)



}

main();
