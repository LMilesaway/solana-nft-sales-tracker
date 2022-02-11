var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Connection, PublicKey } from "@solana/web3.js";
import { getMetadata } from './helpers/metadata-helpers.js';
import DiscordHelper from './helpers/discord-helper.js';
import TwitterHelper from './helpers/twitter-helper.js';
import _ from 'lodash';
import axios from 'axios';
import fs from 'fs';
export default class SaleTracker {
    constructor(config) {
        this.config = config;
        this.connection = new Connection(this.config.rpc);
    }

    /**
     * The main function.
     */

    checkSales() {
        return __awaiter(this, void 0, void 0, function* () {
            const sig_limit = 100;
            const me = this;
            const confirmedSignatures = yield this.connection.getConfirmedSignaturesForAddress2(new PublicKey(me.config.primaryRoyaltiesAccount), { limit: sig_limit });

            if (confirmedSignatures.length > 0) {
                const file = confirmedSignatures[confirmedSignatures.length - 1].signature;


                let batchSize = 10;
                for (let i = 0; i < confirmedSignatures.length;) {
                    let batch = [];

                    for (let j = 0; j < batchSize && i < confirmedSignatures.length; i++, j++)

                        batch.push( me._parseTransactionForSaleInfo(confirmedSignatures[i].signature));
                    console.warn(`Running: ${i - batch.length} to ${i}`);
                    Promise.all(batch);

                }

                return file
            } else {
                //  console.log("0 transactions")
                return 0;
            }
        });

    }

    checkSalesAfter(last) {
        return __awaiter(this, void 0, void 0, function* () {
            const siglimit = 100;
            const me = this;

            const confirmedSignatures = yield this.connection.getConfirmedSignaturesForAddress2(new PublicKey(me.config.primaryRoyaltiesAccount), { limit: siglimit, before: last/* until: lastProcessedSignature */ });
            if (confirmedSignatures.length > 0) {
                let txsig = confirmedSignatures[confirmedSignatures.length - 1].signature;
                let batchSize = 10;
                for (let i = 0; i < confirmedSignatures.length;) {
                    let batch = [];
                    for (let j = 0; j < batchSize && i < confirmedSignatures.length; i++, j++)
                        batch.push( me._parseTransactionForSaleInfo(confirmedSignatures[i].signature));
                    console.warn(`Running: ${i - batch.length} to ${i}`);
                    Promise.all(batch);
                }
                console.log("hundred");
                return txsig
            } else {
                //  console.log("0 transactions")
                return 0;
            }
        });

    }

    _getMintMetadata(mintInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const me = this;
            let metadata = yield getMetadata(new PublicKey(mintInfo), me.config.rpc);
            return metadata;
        });
    }
    
    _getSaleAmount(accountPostBalances, accountPreBalances, buyer) {
        return _.round(Math.abs(accountPostBalances[buyer] - accountPreBalances[buyer]) / Math.pow(10, 9), 2).toFixed(2);
    }

    _verifyNFT(mintMetadata) {
        const me = this;
        let creators = _.map(mintMetadata.data.creators, 'address');
        let updateAuthority = _.get(mintMetadata, `updateAuthority`);
        return _.includes(creators, me.config.primaryRoyaltiesAccount) && updateAuthority === me.config.updateAuthority;
    }

    _parseTransactionForSaleInfo(signature) {
        return __awaiter(this, void 0, void 0, function* () {
            const me = this;
            let transactionInfo = yield me.connection.getTransaction(signature);

            console.log("this is a test 2");

            let accountKeys = transactionInfo === null || transactionInfo === void 0 ? void 0 : transactionInfo.transaction.message.accountKeys;
            let accountMap = [];
            if (accountKeys) {
                let idx = 0;
                for (let accountKey of accountKeys) {
                    accountMap[idx++] = accountKey.toBase58();
                }
            }
            let allAddresses = _.values(accountMap);
            let buyer = accountMap[0];
            let { balanceDifferences, seller, mintInfo, saleAmount } = me._parseTransactionMeta(transactionInfo, accountMap, buyer, allAddresses);
            if (mintInfo) {
            if (balanceDifferences && balanceDifferences[me.config.primaryRoyaltiesAccount] > 0 /* && !_.isEmpty(marketPlace)*/) {
                let mintMetaData = yield me._getMintMetadata(mintInfo);
                if (!me._verifyNFT(mintMetaData)) {
                    console.log("Not an NFT transaction that we're interested in", mintMetaData);
                    return;
                }
                let arWeaveUri = _.get(mintMetaData, `data.uri`);
                let arWeaveInfo = yield axios.get(arWeaveUri);



                let user = {
                    collection: _.get(mintMetaData, `data.name`),
                    time:
                        transactionInfo === null || transactionInfo === void 0
                            ? void 0
                            : transactionInfo.blockTime,
                    saleAmount: saleAmount,
                    Signature: signature
                };
                if (user.saleAmount != 0) {
                    const data = JSON.stringify(user);
                    fs.appendFile("sigs.json", `${data}, \n`, (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                }
            }
            }
        });
    }
    _parseTransactionMeta(transactionInfo, accountMap, buyer, allAddresses) {

        console.log("this is a test 3");


        const me = this;

        if (transactionInfo) {
        let txMetadata = transactionInfo.meta, mintInfo = _.get(txMetadata, `postTokenBalances.0.mint`), balanceDifferences = {}, seller = '';
        // console.log('Mint info',mintInfo);
        let accountPreBalances = {};
        let accountPostBalances = {};
        _.forEach(txMetadata.preBalances, (balance, index) => {
            accountPreBalances[accountMap[index]] = balance;
        });
        _.forEach(txMetadata.postBalances, (balance, index) => {
            accountPostBalances[accountMap[index]] = balance;
        });
        let largestBalanceIncrease = 0;
        _.forEach(accountPostBalances, (balance, address) => {
            let balanceIncrease = accountPostBalances[address] - accountPreBalances[address];
            balanceDifferences[address] = balanceIncrease;
            if (balanceIncrease > largestBalanceIncrease) {
                seller = address;
                largestBalanceIncrease = balanceIncrease;
            }
        });
        return {
            accountPreBalances,
            accountPostBalances,
            balanceDifferences,
            seller,
            mintInfo,
            //marketPlace: me._mapMarketPlace(allAddresses),
            saleAmount: me._getSaleAmount(accountPostBalances, accountPreBalances, buyer)
        };
    } else{
    console.log("transaction info null!");
    return 0;
    }
}
}

