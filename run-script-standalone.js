/**
 * Use this to run your script directly without the cron.
 * node run-script-standalone.js --config='./config/sample.json' --outputType=console
 * Supported outputTypes are console/discord/twitter.
 */
import SalesTracker from './src/main.js';
import yargs from 'yargs'
import fs from 'fs';
import _ from 'lodash';

/*import * as pg from 'pg'
const { Client } = pg.default

const client = new Client ({
    host:"testdb.chzn6cnaazyl.eu-west-2.rds.amazonaws.com",
    user:"postgres",
    post: 5432,
    password:"Toothemoon69",
    database:"Test_db"
    })
  
client.connect();*/

let configPath = yargs(process.argv).argv.config;
let overrides = yargs(process.argv).argv;
let outputType = overrides.outputType || 'console';;

let config = JSON.parse(fs.readFileSync(configPath).toString());
config = _.assignIn(config, overrides);



let tracker = new SalesTracker(config, outputType);
tracker.checkSales();

