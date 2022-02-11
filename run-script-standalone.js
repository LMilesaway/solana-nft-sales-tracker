/**
 * Use this to run your script directly without the cron.
 * node run-script-standalone.js --config='./config/sample.json' --outputType=console
 * Supported outputTypes are console/discord/twitter.
 */
 import SalesTracker from './src/main.js';
 import yargs from 'yargs'
 import fs from 'fs';
 import _ from 'lodash';
 
 import * as pg from 'pg'
 import { Console } from 'console';
 const { Client } = pg.default
 /*
 const client = new Client({
     host: "testdb.chzn6cnaazyl.eu-west-2.rds.amazonaws.com",
     user: "postgres",
     post: 5432,
     password: "Toothemoon69",
     database: "Test_db"
 })
 client.connect();
 
 */
 
 let configPath = yargs(process.argv).argv.config;
 let overrides = yargs(process.argv).argv;
 let outputType = overrides.outputType || 'console';;
 
 let config = JSON.parse(fs.readFileSync(configPath).toString());
 config = _.assignIn(config, overrides);
 let tracker = new SalesTracker(config, outputType);


 
 fs.appendFile("sigs.json", `[`, (err) => {
     if (err) {
         throw err;
     }
     console.log("JSON file created");
 });
 



 let filerun = tracker.checkSales();
 
 
 
 let value = await filerun;
 
 
 
 
 
 /*while (value != ``) {
     value = tracker.checkSalesAfter(await value);

     };*/
 
 
 fs.appendFile("sigs.json", ` {}]`, (err) => {
     if (err) {
         throw err;
     }
     console.log("JSON file complete!");
     let x = true;
 });
 
 
 
 // await x;
 // let metadata = JSON.parse(fs.readFileSync('sigs.json'));
 let collection = 'Mrbot';
 // console.log(metadata[0]);
 // for (let i = 0; i < metadata.length-1; i++) {
 //     client.query("insert into public.aurorian values('"+collection+"','" + metadata[i].collection + "'," + metadata[i].time + "," + metadata[i].saleAmount + ",'" + metadata[i].Signature + "') ", (err, res) => {
 //         //client.query("insert into public.SOLdb values('Aurorian #1589',1640949756, '20.69','4RYNYC9N7zGUcDTz6bGpdRiZXYWAVAQurqkkBmZv8DkjmZWQJs4XTzhQA5XuH8CUo7WB7qGiRhmFxX1L9GhM9kyE') ",(err,res) => {
 //         if (!err) {
 //             console.log(res.rows);
 //         } else {
 //             console.log(err.message);
 //         }
 //         console.log("row added");
         
 //     })
 // }
 // client.end;
