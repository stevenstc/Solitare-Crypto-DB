const express = require('express');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const Web3 = require('web3');
var cors = require('cors');
require('dotenv').config();
var moment = require('moment');
const BigNumber = require('bignumber.js');
const uc = require('upper-case');

const abiMarket = require("./abiMarket.js");
const abiGame = require("./abiGame.js");

//console.log(("HolA Que Haze").toUpperCase())
//console.log(("HolA Que Haze").toLowerCase())

//var cosa = {cosita: "1,23456"}
//console.log(cosa["cosita"].replace(",","."))


const delay = (ms) => new Promise((res) => setTimeout(res, ms));

var superUser = require("./superUser");

var testers = require("./betaTesters")

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());

const port = process.env.PORT || 3004;
const PEKEY = process.env.APP_PRIVATEKEY;
const TOKEN = process.env.APP_TOKEN;
const TOKEN2 = process.env.APP_TOKEN2;

const TokenEmail = "nuevo123";
const uri = process.env.APP_URI;
const TimeToMarket = process.env.APP_TIMEMARKET || 86400 * 1;
const testNet = process.env.APP_TESTNET || "false";
const COMISION = process.env.APP_COMISION || 60000;

var explorador = process.env.APP_EXPLORER || "https://bscscan.com/tx/";
var RED = process.env.APP_RED || "https://bsc-dataseed.binance.org/";

if(testNet === "true" ){
    explorador = process.env.APP_EXPLORER || "https://testnet.bscscan.com/";
    RED = process.env.APP_RED || "https://data-seed-prebsc-1-s1.binance.org:8545/";
}

const addressContract = process.env.APP_CONTRACT || "0xD9bb599445B160D9606EfDa11c34E009CCee237a";
const addressGame = process.env.APP_CONTRACTGAME || "0x1F902Dc0d3A7BFdff5a67d7Ed873e7Dc50DC0987";


const imgDefault = "https://solitairecrypto.io/images/userDefault.png";

let web3 = new Web3(RED);
let cuenta = web3.eth.accounts.privateKeyToAccount(PEKEY); 

const contractMarket = new web3.eth.Contract(abiMarket,addressContract);
const contractGame = new web3.eth.Contract(abiGame,addressGame);


web3.eth.accounts.wallet.add(PEKEY);

//console.log(web3.eth.accounts.wallet[0].address);

//console.log(await web3.eth.accounts.wallet);
//tx web3.eth.accounts.signTransaction(tx, privateKey);
/*web3.eth.sendTransaction({
    from: "0xEB014f8c8B418Db6b45774c326A0E64C78914dC0",
    gasPrice: "20000000000",
    gas: "21000",
    to: '0x3535353535353535353535353535353535353535',
    value: "1000000000000000000",
    data: ""
}, 'MyPassword!').then(console.log);*/
//console.log(web3.eth.accounts.wallet);
const options = { useNewUrlParser: true, useUnifiedTopology: true };

mongoose.connect(uri, options)
    .then(async() => { console.log("Conectado Exitodamente!");})
    .catch(err => { console.log(err); });

const user = require("./modelos/usuarios");

app.get('/', require("./v1/funcionando"));

app.get('/api', require("./v1/funcionando"));

app.get('/api/v1', require("./v1/funcionando"));

app.get('api/v1/tiempo', async(req,res) => {
    res.send(moment(Date.now()).format('MM-DD-YYYY/HH:mm:ss'));
});

app.get('/api/v1/date',async(req,res) => {
    res.send(parseInt(Date.now()/1000)+"");
});

app.get('/api/v1/inventario/:wallet',async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");

    var wallet =  req.params.wallet.toLowerCase();

    var formaciones = [];

    var inventario = [];

    var cantidad = 44;

    var isSuper = 0;

    for (let index = 0; index < superUser.length; index++) {
        if((superUser[index]).toLowerCase() === wallet){
            isSuper = 1;
        }
        
    }

    for (let index = 0; index < 5; index++) {
        formaciones[index] = isSuper;
    }

    for (let index = 0; index < cantidad; index++) {
        inventario[index] = isSuper;
    }
        
    if (isSuper === 0) {
        var largoInventario = await contractMarket.methods
        .largoInventario(wallet)
        .call({ from: cuenta.address })
        .catch(err => {console.log(err); return 0})
  
        for (let index = 0; index < largoInventario; index++) {

            var item = await contractMarket.methods
                .inventario(wallet, index)
                .call({ from: cuenta.address })
                .catch(() => {return {nombre: "ninguno"}})


            if(item.nombre.indexOf("f") === 0){

                formaciones[parseInt(item.nombre.slice(item.nombre.indexOf("f")+1,item.nombre.indexOf("-")))-1] =  1;

            }
    
            if(item.nombre.indexOf("t") === 0){
    
                inventario[parseInt(item.nombre.slice(item.nombre.indexOf("t")+1,item.nombre.indexOf("-")))-1] =  1;
    
            }
    
        }

        if (quitarLegandarios === "true") { // quitar legendarios
            for (let index = 0; index < 3; index++) {

                inventario[index] = 0;

            }

        }

        if (quitarEpicos === "true") { // quitar epicos

            for (let index = 3; index < 10; index++) {

                inventario[index] = 0;

            }
            
        }

        if (quitarComunes === "true") { // quitar Comunes

            for (let index = 10; index < cantidad; index++) {

                inventario[index] = 0;

            }
            
        }
    }

    // a??adir equipo betatester

    for (let t = 0; t < testers.length; t++) {
            
        if(testers[t].toLowerCase() == wallet){
            inventario[inventario.length-1] = 1;
        }
    }

    inventario = [...inventario,1,...formaciones]

    //console.log(inventario)

    res.send(inventario.toString());

});

app.get('/api/v1/tienecartas/:wallet', async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();
    
    var largoInventario = await contractMarket.methods
    .largoInventario(wallet)
    .call({ from: cuenta.address })
    .catch(err => {console.log(err); return 0})

    if(largoInventario >= 1){
        largoInventario = "true";
    }else{
        largoInventario = "false";
    }
    res.send(largoInventario)
})

app.get('/api/v1/coins/:wallet',async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    let wallet =  req.params.wallet.toLowerCase();

    if(!web3.utils.isAddress(wallet)){
        console.log("wallet incorrecta: "+wallet)
        res.send("0");
    }else{
        
        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];
            res.send((usuario.balance+"").replace(".", ","));

        }else{
            console.log("creado USUARIO al consultar monedas: "+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),   
                email: "",
                password: "",
                username: "", 
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: 0,
                ingresado: 0,
                retirado: 0,
                deposit: [],
                retiro: [],
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });

            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })

            res.send("0");
                
            
        }

    }

    
});

app.post('/api/v1/asignar/:wallet',async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();

    req.body.coins = req.body.coins.replace(",", ".");

    req.body.coins = parseFloat(req.body.coins);
    
    if(req.body.token == TOKEN && web3.utils.isAddress(wallet) && req.body.coins <= 180){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            var datos = usuario[0];
            if(datos.active){
                datos.balance = datos.balance + req.body.coins;
                datos.ingresado = datos.ingresado + req.body.coins;
                datos.deposit.push({amount: req.body.coins,
                    date: Date.now(),
                    finalized: true,
                    txhash: "Win coins: "+req.body.coins+" # "+uc.upperCase(wallet)
                })

                //datos.wcscExchange = await consultarCscExchange(wallet);

                //var nuevoUsuario = new user(datos)
                //await nuevoUsuario.save();

                update = await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                    {$set:datos}
                ])

                //console.log(update)
                console.log("Win coins: "+req.body.coins+" # "+uc.upperCase(wallet));
                res.send("true");
            }else{
                res.send("false");
            }
    
        }else{
            console.log("creado USUARIO al Asignar"+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),
                email: "",
                password: "",
                username: "", 
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: req.body.coins,
                ingresado: req.body.coins,
                retirado: 0,
                deposit: [{amount: req.body.coins,
                    date: Date.now(),
                    finalized: true,
                    txhash: "Win coins: "+req.body.coins+" # "+req.params.wallet
                }],
                retiro: [],
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })

            res.send("false");
                
            
        }


    }else{
        if(req.body.coins > 180){
            await user.updateOne({ wallet: uc.upperCase(wallet) },[
                {$set:{active: false}}
            ])
            res.send("true");
        }else{
            res.send("false");
        }
    }
		
});

app.post('/api/v1/quitar/:wallet',async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();

    req.body.coins = req.body.coins.replace(",", ".");

    req.body.coins = parseFloat(req.body.coins);

    if(req.body.token == TOKEN  && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) { 
            var datos = usuario[0];
            if(datos.active){
                datos.balance = datos.balance-req.body.coins;
                if(datos.balance >= 0){

                    datos.retirado = datos.retirado+ req.body.coins;
                    datos.retiro.push({
                        amount: req.body.coins,
                        date: Date.now(),
                        done: true,
                        dateSend: Date.now(),
                        txhash: "Lost coins: "+req.body.coins+" # "+uc.upperCase(wallet)
                  
                      })

                    //datos.wcscExchange = await consultarCscExchange(wallet);

                    //var nuevoUsuario = new user(datos)
                    //await nuevoUsuario.save();

                    update = await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                        {$set:datos}
                    ]);
                    console.log("Lost coins: "+req.body.coins+" # "+uc.upperCase(wallet));
                    res.send("true");

                }else{
                    res.send("false");
                }
                
            }else{
                res.send("false");
            }
    
        }else{
            console.log("usuario creado al retirar monedas"+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),  
                email: "",
                password: "",
                username: "",   
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: 0,
                ingresado: 0,
                retirado: 0,
                deposit: [],
                retiro: [],
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })

            res.send("false");
                
            
        }

    }else{
        res.send("false");
    }
		
    
});

app.post('/api/v1/coinsaljuego/:wallet',async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(uc.upperCase(req.params.wallet)))return res.send("fail");
    var wallet =  uc.upperCase(req.params.wallet);

    if(req.body.token == TOKEN  && web3.utils.isAddress(wallet)){

        await delay(Math.floor(Math.random() * 12000));

        coins = new BigNumber(req.body.coins);

        if(await monedasAlJuego(coins,wallet,1)){
            res.send("true");

        }else{
            res.send("false");

        }

    }else{
        res.send("false");
    }
		
    
});

async function monedasAlJuego(coins,wallet,intentos){

    await delay(Math.floor(Math.random() * 12000));

    var usuario = await contractGame.methods
    .investors(wallet)
    .call({ from: cuenta.address});

    balance = new BigNumber(usuario.balance);
    balance = balance.shiftedBy(-18).toNumber();

    var gases = await web3.eth.getGasPrice(); 

    var paso = true;

    var gasLimit = await contractGame.methods.gastarCoinsfrom(coins.shiftedBy(18).toString(), wallet).estimateGas({from: web3.eth.accounts.wallet[0].address});
    console.log("#f2")

    if(balance - coins.toNumber() >= 0 ){

        await contractGame.methods
            .gastarCoinsfrom(coins.shiftedBy(18).toString(), wallet)
            .send({ from: web3.eth.accounts.wallet[0].address, gas: gasLimit, gasPrice: gases })
            .then(result => {
                console.log("Monedas ENVIADAS en "+intentos+" intentos");
                //console.log(explorador+result.transactionHash);
                
                user.find({ wallet: uc.upperCase(wallet) }).then(usuario =>{

                    if (usuario.length >= 1) {
                        var datos = usuario[0];
                        delete datos._id;
                        if(datos.active){
                            datos.balance = coins.plus(datos.balance).toNumber();
                            datos.ingresado = coins.plus(datos.ingresado).toNumber();
                            datos.deposit.push({
                                amount: coins.toNumber(),
                                date: Date.now(),
                                finalized: true,
                                txhash: "FROM MARKET: "+coins.toString()+" # wallet: "+uc.upperCase(wallet)+" # Hash: "+explorador+result.transactionHash
                            })
                            datos.txs.push(explorador+result.transactionHash)
                            update = user.updateOne({ wallet: uc.upperCase(wallet) }, {$set: datos})
                            .then(console.log("Coins SEND TO GAME: "+coins.toString()+" # "+wallet))
                            .catch(console.error())
                            
                        }
                
                    }else{
                        console.log("creado USUARIO monedas al juego: "+wallet)
                        var users = new user({
                            wallet: uc.upperCase(wallet),    
                            email: "",
                            password: "",
                            username: "", 
                            active: true,
                            payAt: Date.now(),
                            checkpoint: 0,
                            reclamado: false,
                            balance: coins.toNumber(),
                            ingresado: coins.toNumber(),
                            retirado: 0,
                            deposit: [{amount: coins.toNumber(),
                                date: Date.now(),
                                finalized: true,
                                txhash: "FROM MARKET: "+coins.toString()+" # "+uc.upperCase(wallet)+" # Hash: "+explorador+result.transactionHash
                            }],
                            retiro: [],
                            txs: [explorador+result.transactionHash]
                        });
                
                        async() => {
                            await users.save();
                            console.log("Usuario creado exitodamente");
                        };
                        
                            
                        
                    }
                })

                paso = true;
            })

            .catch(async() => {
                intentos++;
                console.log(coins.toNumber()+" ->  "+wallet+" : "+intentos)
                await delay(Math.floor(Math.random() * 12000));
                paso = await monedasAlJuego(coins,wallet,intentos);
            })
    }else{
        paso = false;
    }

    return paso;

}

app.get('/api/v1/time/coinsalmarket/:wallet',async(req,res)=>{
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(uc.upperCase(req.params.wallet)))return res.send("fail");
    var wallet =  uc.upperCase(req.params.wallet);

    if(web3.utils.isAddress(wallet)){

        var usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            var datos = usuario[0];

            res.send((datos.payAt + (TimeToMarket * 1000)).toString())
        }else{
            res.send((Date.now()+(TimeToMarket * 1000)).toString())
        }
    }else{
        res.send((Date.now()+(TimeToMarket * 1000)).toString())
    }
});

app.post('/api/v1/coinsalmarket/:wallet',async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  uc.upperCase(req.params.wallet);

    if(req.body.token == TOKEN ){

        coins = new BigNumber(req.body.coins);

        var usuario = await user.find({ wallet: uc.upperCase(wallet) });

        usuario = usuario[0];

        if (usuario.balance > 0 && usuario.balance-parseFloat(req.body.coins) >= 0) {
            
            await delay(Math.floor(Math.random() * 12000));

            if(await monedasAlMarket(coins, wallet,1)){
                res.send("true");

            }else{
                res.send("false");

            }
        }else{

            res.send("false");

        }

    }else{

        res.send("false");
    }
		
    
});

async function monedasAlMarket(coins,wallet,intentos){


    await delay(Math.floor(Math.random() * 12000));

    var paso = false;

    var gases = await web3.eth.getGasPrice(); 

    var usuario = await user.find({ wallet: uc.upperCase(wallet) });

    if (usuario.length >= 1) {
        var datos = usuario[0];

        if(Date.now() < datos.payAt + (TimeToMarket * 1000))return false ;
    }else{
        return false;
    }

    if(usuario[0].username === "" || usuario[0].email === "" || usuario[0].password === ""){
        return false;
    }

    await contractGame.methods
        .asignarCoinsTo(coins.shiftedBy(18), wallet)
        .send({ from: web3.eth.accounts.wallet[0].address, gas: COMISION, gasPrice: gases })
        .then(result => {

            console.log("Monedas ENVIADAS en "+intentos+" intentos");
            
            user.find({ wallet: uc.upperCase(wallet) }).then(usuario =>{

                if (usuario.length >= 1) {
                    var datos = usuario[0];
                    delete datos._id;
                    if(datos.active ){
                        datos.payAt = Date.now();
                        datos.balance = datos.balance-coins.toNumber();
                        datos.retirado = coins.toNumber()+datos.retirado;
                        datos.retiro.push({
                            amount: coins.toNumber(),
                            date: Date.now(),
                            finalized: true,
                            txhash: "TO MARKET: "+coins.toString()+" # wallet: "+uc.upperCase(wallet)+" # Hash: "+explorador+result.transactionHash
                        })
                        datos.txs.push(explorador+result.transactionHash)
                        
                        user.updateOne({ wallet: uc.upperCase(wallet) }, [
                            {$set:datos}
                        ])
                        .then(console.log("Coins SEND TO MARKET: "+coins.toString()+" # "+wallet))
                        .catch(console.error())
                    
                    }
            
                }else{
                    console.log("creado USUARIO monedas al Market"+wallet)
                    var users = new user({
                        wallet: uc.upperCase(wallet),
                        email: "",
                        password: "",
                        username: "", 
                        active: false,
                        payAt: Date.now(),
                        checkpoint: 0,
                        reclamado: false,
                        balance: 0,
                        ingresado: 0,
                        retirado: 0,
                        deposit: [],
                        retiro: [],
                        txs: [explorador+result.transactionHash]
                    });
            
                    users.save().then(()=>{
                        console.log("Usuario creado exitodamente");
                    })
                        
                
                }
            })

            paso = true;
        })

        .catch(async err => {
            console.log(err);
            intentos++;
            console.log(coins.toString()+" ->  "+wallet+" : "+intentos)
            await delay(Math.floor(Math.random() * 12000));
            paso = await monedasAlMarket(coins,wallet,intentos);
        })

    return paso;

}

app.post('/api/v1/sendmail',async(req,res) => {
    //console.log(req.query);
    if(req.body.destino && req.body.code){

        var resultado = await fetch("https://brutusgroup.tk/mail.php?destino="+req.body.destino+"&code="+req.body.code+"&token=crypto2021");

        if (await resultado.text() === "true") {
            res.send("true");
        }else{
            res.send("false");
        }

    }else{
        res.send("false");
    }

});

app.get('/api/v1/user/exist/:wallet',async(req,res) => {

    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");

    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) })
            .catch(err => {
                console.log("usuario inexistente");
                res.send("false");
                return;
            });

        if (usuario.length >= 1) {
            res.send("true");
        }else{
    
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/active/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];
            res.send(""+usuario.active);
        }else{
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/username/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];

            res.send(usuario.username);
        }else{
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/wallet/',async(req,res) => {
    var username =  req.query.username;
     
    usuario = await user.find({ username: username });

    if (usuario.length >= 1) {
        usuario = usuario[0];

        res.send(usuario.wallet);
    }else{
        res.send("false");
    }
    
});

app.get('/api/v1/user/email/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();
     
    if( req.query.tokenemail === TokenEmail && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];

            res.send(usuario.email);
        }else{
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/pais/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];

            res.send(usuario.pais);
        }else{
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/imagen/user',async(req,res) => {
    var username =  req.query.username;
     
    usuario = await user.find({ username: username });

    if (usuario.length >= 1) {
        usuario = usuario[0];
      
        if(usuario.imagen){
            if(usuario.imagen.indexOf('https://')>=0){
                res.send(usuario.imagen);
            }else{
                res.send(imgDefault);

            }
        }else{
            res.send(imgDefault);

        }
    }else{
        res.send(imgDefault);
    }

});

app.get('/api/v1/user/ban/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });
        
  
            if (usuario.length >= 1) {
                usuario = usuario[0];

                res.send(!usuario.active+"");
            }else{
                var users = new user({
                    wallet: uc.upperCase(wallet),
                    email: "",
                    password: "",
                    username: "", 
                    active: true,
                    payAt: Date.now(),
                    checkpoint: 0,
                    reclamado: false,
                    balance: 0,
                    ingresado: 0,
                    retirado: 0,
                    deposit: [],
                    retiro: [],
                    txs: [],
                    pais: "null",
                    imagen: imgDefault,
                    wcscExchange: 0
                });
        
                users.save().then(()=>{
                    console.log("Nuevo Usuario creado exitodamente");
                    
                })
                res.send("false");
            }



            
    }else{
        res.send("true");
    }
});

app.post('/api/v1/user/update/info/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();
    
    if(req.body.token == TOKEN && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            var datos = usuario[0];
            if(datos.active){
                if (req.body.email) {
                    req.body.email =  req.body.email.toLowerCase();
                    datos.email = req.body.email;
                }

                if (req.body.username) {
                    datos.username = req.body.username;
                }

                if (req.body.password) {
                    datos.password = req.body.password;
                }

                if (req.body.pais) {
                    datos.pais = req.body.pais;
                }

                if (req.body.imagen) {
                    datos.imagen = req.body.imagen;
                }

                if (req.body.ban) {
                    if(req.body.ban === "true"){
                        datos.active = false;
                    }else{
                        datos.active = false;
                    }
                    
                }

                if (req.body.email || req.body.username || req.body.password || req.body.pais || req.body.ban || req.body.imagen){
                    update = await user.updateOne({ wallet: uc.upperCase(wallet) }, datos);
                    res.send("true");
                }else{
                    res.send("false");
                }
                
            }else{
                res.send("false");
            }
    
        }else{
            console.log("creado USUARIO al actualizar info: "+wallet)
            var email = "";
            var username = "";
            var password = "";

            if (req.body.email) {
                email = req.body.email;
            }

            if (req.body.username) {
                username = req.body.username;
            }

            if (req.body.password) {
                password = req.body.password;
            }
            var users = new user({
                wallet: uc.upperCase(wallet),
                email: email,
                password: password,
                username: username, 
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: 0,
                ingresado: 0,
                retirado: 0,
                deposit: [{amount: req.body.coins,
                    date: Date.now(),
                    finalized: true,
                    txhash: "Acount Creation "
                }],
                retiro: [],
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })

            res.send("false");
                
            
        }


    }else{
        res.send("false");
    }
		
});

app.post('/api/v1/user/auth/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();

    if(req.body.token == TOKEN && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            var usuario = usuario[0];

            if(usuario.password === req.body.password && req.body.password != "" && req.body.password.length >= 8){

                if(usuario.active ){

                    res.send("true");
                    
                }else{
                    
                    res.send("false");
                    
                }
            }else{
                console.log("Error Loggin:"+uc.upperCase(wallet)+": "+req.body.password);
                res.send("false");
            }
    
        }else{
           
            res.send("false");
            
        }


    }else{
        res.send("false");
    }
		
});

app.get('/api/v1/username/disponible/',async(req,res) => {

    var username =  req.query.username;

    usuario = await user.find({ username: username });

    //console.log(usuario)

    if (usuario.length >= 1) {
        res.send("false");
    }else{
        res.send("true");
    }

});

app.get('/api/v1/email/disponible/',async(req,res) => {

    var email =  req.query.email;

    usuario = await user.find({ email: email });

    if (usuario.length >= 1) {
        res.send("false");
        //res.send("true");
    }else{
        res.send("true");
    }

});

app.post('/api/v1/ban/unban/:wallet',async(req,res) => {
    if(!req.params.wallet)return res.send("fail");
    if(!web3.utils.isAddress(req.params.wallet))return res.send("fail");
    var wallet =  req.params.wallet.toLowerCase();

    req.body.active
    req.body.ban 

    if(req.body.token == TOKEN2  && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) { 
            var datos = usuario[0];

            if(req.body.active){
                datos.active = true;
            }
            
            if(req.body.ban){
                datos.active = false;
            }
            
            //datos.wcscExchange = await consultarCscExchange(wallet);

            var nuevoUsuario = new user(datos)
            await nuevoUsuario.save();

            //update = await user.updateOne({ wallet: uc.upperCase(wallet) }, datos);
            //console.log(" # "+uc.upperCase(wallet));
            res.send({activo: datos.active});
    
        }else{
            console.log("usuario creado al hacer ban o quitar"+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),  
                email: "",
                password: "",
                username: "",   
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: 0,
                ingresado: 0,
                retirado: 0,
                deposit: [],
                retiro: [],
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })
                
            res.send("false");
            
        }

    }else{
        res.send("false");
    }
		
    
});

app.listen(port, ()=> console.log('Escuchando Puerto: ' + port))
