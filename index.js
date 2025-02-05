const express = require('express');
const ejs = require('ejs');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');
const session = require('express-session');
const mongodbstore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const data = require('./Models/Collection')
const Schema = require('./Models/History')
const axios = require('axios');
const port = process.env.port || 5000;
const app = express();
let apiData = {};
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs')
app.use(express.static('Public'))
app.use(bodyparser.json());
let userName='';
let cals = ['value1 + value2 = result'];
dotenv.config();
mongoose.connect(process.env.Mongo_Uri,{
})
.then(()=>{
    console.log('succesfully connected to Database');
})
.catch((err)=>{
    console.error(err);
})
const store = new mongodbstore({
    uri:process.env.Mongo_Uri,
    collection :'MYSESSION',
    connectTimeoutMS: 10000
})

app.use(session({
    secret:'This is a secret',
    resave:false,
    saveUninitialized:true,
    store:store,
    cookie: { secure: false }
}))

app.get('/',(req,res)=>{
    res.render("home")
})  
app.get('/main',(req,res)=>{
    console.log(req.session.username );
    
    if(req.session.username && req.session.username != 'i'){
        res.render('main',calculations=cals)
    }else{
        res.redirect('/')
        //console.log('Hii');
    }
})


app.post('/signup',async(req,res)=>{
    //console.log(req.body)
    const {username , email, password } = req.body;
    let name= username
    let user = await data.findOne({email})
    let hashedpassword = await bcryptjs.hash(password,12);
    user = new data({
        username,
        email,
        password:hashedpassword
    })
    await user.save();
    req.session.username = name;
    await req.session.save();
    res.redirect("/main")
})

app.post('/login',async(req,res)=>{
    const {username, password} = req.body;
    let user = await data.findOne({username:username});
    if(user){
        checkpassword= await bcryptjs.compare(password,user.password);
        if(checkpassword){
            req.session.username=username;
            req.session.save((err)=>{
                if(err){
                    console.log(err)
                }
                res.redirect("/main");
                
            });
           
        }else{
            console.log('Password didnt match');
            res.redirect('/home');
        }
    }else{
        console.log('No user found');
    }
    
})


// app.post('/submit',async(req,res)=>{
//     const {expression,result} = req.body;
//     try{
//     userName = req.session.username;
//     console.log(req.session.username)
//     if (!userName) {
//         return res.status(400).send('User is not logged in.');
//     }
//         let historyUser = await Schema.findOne({username:userName});
//         if(historyUser){
//             historyUser.calculations.push(expression+'='+result); 
//             await historyUser.save();
//             //res.json({ message: 'Calculation updated', calculations: historyUser.calculations,username:historyUser.username }); 
           
//             }else{
//             historyUser= new Schema({
//                 username: userName,
//                 calculations: [expression+'='+result] 
//             })
//             await historyUser.save();
//             //res.json({ message: 'Calculation created', calculations: historyUser.calculations });
            
//         }
//             cals.push(historyUser.calculations)
//             console.log(cals);
//             res.redirect('/main');
//             return
//         // await axios.get('http://localhost:4000/users');
// }catch (error) {
//     console.error('Error storing calculation:', error);
//     res.status(500).send('An error occurred');
//   }
// })


// app.get('/users',async(req,res)=>{
//     console.log("hii")
   
//     let Name = userName;
//     try{
//     let users = await Schema.findOne({username:Name});
//     if (users){
//         res.json({
//             message: 'Calculation processed and external API called',
//             calculations: users.calculations,
//             apiData: apiData
//         });
//     }else{
//         console.log('no users')
//     }
// }catch(error){
//     console.error('Error storing calculation:', error);
//     res.status(500).send('An error occurred');
// }

// })


app.post('/submit', async (req, res) => {
    const { expression, result } = req.body;  // Get expression and result from the form

    try {
        const userName = req.session.username;  // Get the logged-in user's name
        if (!userName) {
            return res.status(400).send('User is not logged in.');
        }

        // Find the user in the database
        let historyUser = await Schema.findOne({ username: userName });

        // If the user already has history, just push the new calculation to their list
        if (historyUser) {
            historyUser.calculations.push(expression + '=' + result);
            await historyUser.save();  // Save the updated history
            res.json({
                message: 'Calculation updated',  // Success message
                calculations: historyUser.calculations  // Send the updated calculations
            });
        } else {
            // If the user doesn't have any history, create a new one with the first calculation
            historyUser = new Schema({
                username: userName,
                calculations: [expression + '=' + result]
            });
            await historyUser.save();
            res.json({
                message: 'Calculation created',
                calculations: historyUser.calculations  // Send the new calculations list
            });
        }
    } catch (error) {
        console.error('Error storing calculation:', error);
        res.status(500).send('An error occurred');
    }
});


app.post('/logout',(req,res)=>{
        //req.session.username='' 
        req.session.destroy((err)=>{
            if(err){
                console.log(err);
                console.log('err')
                return;
            }
        res.clearCookie('connect.sid'); // Clear session cookie
        // res.setHeader('Cache-Control', 'no-store');
        console.log('loggedOut');
        res.status(200).set('Location', '/').send();
        })
            
})  


app.post('/clear',async(req,res)=>{
    console.log('HII')
    const username = req.session.username;
    console.log(username);
    try{
    let user = await Schema.findOne({username:username})
    if(user){
        user.calculations= await [];
        console.log(user.calculations)
        await user.save()
        console.log("y")
        res.status(200).set('Location','/main').send();
    }else{
        console.log("user not found to delete the history");
        console.log("n")
        res.status(404).json({
            message:`user with the ${username} not found`
        })
    }
}catch(err){
    console.error(err);
    console.log("z")
    res.status(500).json({
        message:"An error occured while clearing the history"
    })
}
})


app.listen(port,()=>{
    console.log(`Server started and running at ${port}`);
    
})
