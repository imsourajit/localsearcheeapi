const express = require("express");
let mysql = require('mysql');

var unirest = require("unirest");



const config = require("./dbconfig");
const {generateOtp} = require("./helpers");

let con = mysql.createConnection(config.db);

const app = express();
const port = 3000;
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);









con.connect(function(err){
    if(err) throw err


    //to get all the user refs
    app.get("/getReferrals", (req, res) => {
        const { userId } = req.query ?? req.body;
        if(userId) {
            let searchRefQuery = "SELECT * FROM referral WHERE refferedBy="+userId
            con.query(searchRefQuery, (err, result) => {
                res.json({
                    data: result
                })
            })
        } else {
            res.json({
                data:[]
            })
        }
    })



    //to send otp

    app.post("/sendOtp", (req, res) => {
        const { phoneNumber } = req.body
        if(phoneNumber && phoneNumber.length == 10) {
            let otp = generateOtp();
            let unirestReq = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");
            unirestReq.query({
                "authorization": "0Zx2YIh7VwtdF3gWK5upqNmUCOaTjylz6rBiLXHGA8JDseRb4kOfAtalLUpeFD7ksYTdGbmi4EcJnryC",
                "message": `Your phone verification otp is ${otp}`,
                "route": "q",
                "numbers": phoneNumber.toString()
            });
            unirestReq.headers({
                "cache-control": "no-cache"
            });
            unirestReq.end(function (r) {
                if (r.error) throw new Error(r.error);
                res.json({
                    success: true
                })

            });
        } else {
            res.json({
                data: 'INVALID_PHONE_NUMBER'
            })
        }
    })

})








// app.get("/", (req, res) => {
//     console.log(req)
//     con.connect(function(err) {
//         if (err) {
//             console.log("@err", err)
//             throw err;
//         }
//         // console.log("Connected!");
//         // var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
//         // con.query(sql, function (err, result) {
//         //     if (err) throw err;
//         //     console.log("Table created");
//         // });
//     });
//     res.json({ message: "ok" });
// });





app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
