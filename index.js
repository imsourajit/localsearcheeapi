const express = require("express");
let mysql = require('mysql');

var unirest = require("unirest");



const config = require("./dbconfig");
const {generateOtp} = require("./helpers");

let con = mysql.createConnection(config.db);

const app = express();
const port = 3003;

const cors = require('cors');
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);




const handledbConnection = () => {





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

                let searchRefQuery = `INSERT INTO otpVerification (phoneNumber, otp, isUsed) VALUES (${phoneNumber}, ${otp}, false) `
                con.query(searchRefQuery, (err, result) => {
                    res.json({
                        success: true
                    })
                })

            });
        } else {
            res.json({
                data: 'INVALID_PHONE_NUMBER'
            })
        }
    })





//    validate otp

    app.post("/validateOtp", (req, res) => {
        const { phoneNumber, otp } = req.body;
        if(phoneNumber && otp) {
            let validationQuery = `SELECT * FROM otpVerification WHERE phoneNumber=${phoneNumber} AND otp=${otp} AND isUsed=false`
            con.query(validationQuery, (err, result) => {
                if(result.length) {
                    const { id, phoneNumber, otp, isUsed } = result[0]
                    let updateQue = `UPDATE otpVerification SET isUsed=true WHERE id=${id}`
                    con.query(updateQue, (error, result) => {
                        res.json({
                            data: 'VALID_OTP'
                        })
                    })
                } else {
                    res.json({
                        data: 'INVALID_OTP'
                    })
                }
            })
        } else {
            res.json({
                data: 'INVALID_OTP'
            })

        }
    })

    app.post("/signup", (req, res) => {

        const {email, password, BusinessName, BusinessAddress, FullName, PhoneNumber, IsPhoneVerified, Place, Pincode, ServiceType, CategoryName, FacebookUrl, TwitterUrl, InstagramUrl, WhatsAppUrl, Website, ReferralCode, IsEmailVerified, UserType, gstin, creationTime} = req.body

        let insertQuery = `INSERT INTO users (userId, email, password, BusinessName, BusinessAddress, FullName, PhoneNumber, IsPhoneVerified, Place, Pincode, ServiceType, CategoryName, FacebookUrl, TwitterUrl, InstagramUrl, WhatsAppUrl, Website, ReferralCode, IsEmailVerified, UserType, gstin, creationTime) VALUES (NULL, "${email}", "localsearchee", "${BusinessName}", "${BusinessAddress}", "${FullName}", "${PhoneNumber}", ${IsPhoneVerified}, "${Place}", "${Pincode}", "${ServiceType}", "${CategoryName}", "${FacebookUrl}", "${TwitterUrl}", "${InstagramUrl}", "${WhatsAppUrl}", "${Website}", "${ReferralCode}", ${IsEmailVerified}, "${UserType}", "${gstin}", "${creationTime}")`

        con.query(insertQuery, (err, result) => {

            console.log("err", err, result)
                
                let resultQuery = `SELECT * FROM users WHERE email='${email}'`
                con.query(resultQuery, (err, result) => {
            res.json({
                data: result
            })
        })

            })


    })




//    login api


    app.get("/login", (req, res)=>{

        const { email, password} = req.query;

        let loginQuery = `SELECT * FROM users WHERE email='${email}' AND password='${password}'`;

        con.query(loginQuery, (err, result) => {
            res.json({
                data: result
            })
        })
    })


app.get("/getAllUsers", (req, res)=>{
        let loginQuery = `SELECT 
    t1.*,
    t2.*
FROM users AS t1
    INNER JOIN
        (
        SELECT count(refferedBy) as refers
        FROM referral WHERE referral.refferedBy = userId
        ) AS t2`;
        con.query(loginQuery, (err, result) => {
            res.json({
                data: result
            })
        })
    })
})



    app.get("/search", (req, res)=>{

        const { bname, serviceType, place, pincode, query } = req.query;

        // let searchque = `SELECT * FROM users WHERE BusinessName LIKE '%${bname}%' OR ServiceType LIKE '%${serviceType}%' OR Place LIKE '%${place}%' OR Pincode LIKE '%${pincode}%' `;

        let searchque = `SELECT * FROM users ${query} `;


        con.query(searchque, (err, result) => {
            res.json({
                data: result
            })
        })
    })


con.on('error', function(err) {
    console.log('db error', err);
    con = mysql.createConnection(config.db)
handledbConnection()

  });


}



handledbConnection()




app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
