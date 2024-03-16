const http = require("http");
const express=require("express");
const app=express();
const header={'Content-Type': 'application/json'}
const allowed=["POST","PATCH","PUT","GET","DELETE"]




const validation_dict={ // dict containing all request params; 1 means they are required
"id":1,
"name":1,
"type":1,
"release_date":1,
"core_clock": 1,
"boost_clock":0,
"clock_unit": 1,
"price": 1,
"TDP": 1,
"part_no": 1,}


const type_dict={
"id":"string", //uuid
"name":"string",
"type":"string",
"release_date":"integer",
"core_clock": "number",
"boost_clock":"number",
"clock_unit":"string",
"price": "number",
"TDP": "integer",
"part_no": "string",}





function setUpDB(con){

    //con.query("drop table parts;")

    con.query("CREATE TABLE IF NOT EXISTS PARTS(\
        id  SERIAL NOT NULL,\
        name TEXT,\
        type TEXT,\
        release_date INTEGER,\
        core_clock REAL,\
        boost_clock REAL,\
        clock_unit TEXT,\
        price REAL,\
        TDP INTEGER,\
        part_no TEXT,\
        PRIMARY KEY (id)\
        );")

}



function isInt(n) {
    var n=Number(n)
    if(Number.isInteger(n)){
      return true
    }
    else{
      return false
    } 
}



function validator1(parameters,minimum){ // for certain requests check if all required params are correct
    var total=0
    type=parameters["type"]
    id="id"

    if(type != undefined && !(type.toUpperCase() == 'CPU' || type.toUpperCase() == 'GPU')){
        return false
    }

    if(id in parameters){ // client cannot modify id 
        return false
    }

    for(key in parameters){

        if(!(key in validation_dict)){ // check if param is in the allowed params dictionary
            return false
            
        }

        if(type_dict[key]=="integer") // check and convert type
            if(isInt(parameters[key]) && typeof parameters[key] == "number" ){
                parameters[key]=Number(parameters[key])
                total+=(validation_dict[key])
            }
            else{
                
                return false
        }

        else if(("number" == type_dict[key])) { // check and convert type
            if(typeof parameters[key]=="number"){
                parameters[key]=Number(parameters[key])
                total+=(validation_dict[key])
            }

            else{
                console.log(parameters[key])
                return false
            }      
        }

        else{ //type must be string 
            if (typeof parameters[key] == "string"){
                total+=validation_dict[key]
            }
            else{
                return false
            }
        } 

        
    }

    if(total>=minimum){
        return true
    }
    

    return false

}

function patch_validate(parameters){

    var total=0
    id="id"
    type=parameters["type"]

    if(type != undefined && !(type.toUpperCase() == 'CPU' || type.toUpperCase() == 'GPU')){
        return false
    }

    if(id in parameters){ // client cannot modify id 
        return false
    }

    for(key in parameters){
        if(!(key in validation_dict)){ // check if param is in the allowed params dictionary
            return false
        }

        if(type_dict[key]=="integer") // check and convert type
            if(isInt(parameters[key]) && typeof parameters[key]=="number"){
                parameters[key]=Number(parameters[key])
                total+=1
            }
            else{
                return false
        }

        else if(("number" == type_dict[key])) { // check and convert type
            if(typeof parameters[key]=="number"){
                parameters[key]=Number(parameters[key])
                total+=1
            }

            else{
                return false
            }      
        }

        else{ //type must be string 
            if (typeof parameters[key] == "string"){
                total+=1
            }
            else{
                return false
            }
        } 
    }

    if(total>=1){
        return true
    }

    return false

}



// Setting up mySQL connection
db=require("pg")
const con = new db.Client({
    host: "localhost", // to be changed later when setup is configured
    user: "postgres",
    database:"postgres",

    password:"a1",
    port:5432
    
})



con.connect(function(err){
    if (err){
        throw err;    
    }
    else{
        console.log("Connected!");
    }
});

setUpDB(con) // setting up the database tables, extensions 



// Setting up server object, post/get request handling, etc.
const bodyParser=require("body-parser");
const { urlencoded } = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())




app.get("/parts", async function(req,res) {

    if(req.method=="HEAD"){
        res.status(405);
        res.send("405 METHOD NOT ALLOWED\nAllow: GET, POST, DELETE, PUT, PATCH"); // Allow Header 
        return
    }
    
    var avg_price=0
    var total=0;

    if(req.query.type!=undefined){
        req.query.type=req.query.type.toUpperCase()
        
        if(!(req.query.type=='CPU' || req.query.type == 'GPU')){ 
            res.status(400)
            res.setHeader('Content-Type', 'application/json') // Send the response back with appropriate fields
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json({"status":1,"message": "Parameter 'type' is invalid"})
            return  
        }

        
        try{  
            rows = await con.query("select AVG(price) as average_price, COUNT(id) as total FROM PARTS where type=$1;",[req.query.type])
            average_price=rows.rows[0]["average_price"]
            total=rows.rows[0]["total"]
	    if(average_price==null){
                average_price=0
            }

            rows = await con.query("select id,name,type,price FROM PARTS WHERE type=$1 order by price desc;",[req.query.type]);
            results={"status":0, "average_price":average_price,"total":total,"parts":rows.rows}      
        }
        catch(err){
            console.log(err)
            res.status(400)
            res.setHeader('Content-Type', 'application/json') // Send the response back with appropriate fields
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json({"status":1,"message": "Request cannot be processed"})
            return
        }
     
    }
  
    else{

        try{
            rows = await con.query("select AVG(price) as average_price, COUNT(id) as total FROM PARTS;")
            average_price=rows.rows[0]["average_price"]
            total=rows.rows[0]["total"]
	    if(average_price==null){
                average_price=0
	    }
            rows = await con.query("select id,name,type,price FROM PARTS order by price desc;");
            results={"status":0, "average_price":average_price,"total":total,"parts":rows.rows}   
            
        }
        catch(err){
            res.status(400)
            res.setHeader('Content-Type', 'application/json') // Send the response back with appropriate fields
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json({"status":1,"message": "Request cannot be processed"})
            return
        }
            
    }

    res.status(200) // success OK
    res.setHeader('Content-Type', 'application/json')
    let message='200 OK REQUEST\nContent-Type: application/json\n\n'
    res.json(results)
    
});


app.get("/parts/:id", async function(req,res) {

    if(req.method=="HEAD"){
        res.status(405);
        res.send("405 METHOD NOT ALLOWED\nAllow: GET, POST, DELETE, PUT, PATCH"); // Allow Header 
        return
    }
    
    console.log(req.params.id)
    if (isInt(req.params.id)){

        try{
            rows = await con.query("select * FROM PARTS WHERE id=$1;",[Number(req.params.id)]);
            var output={}
            if (rows.rowCount==0){
                res.status(400) // id not found 
                res.setHeader('Content-Type', 'application/json');
                results={"status":1, "message":"ID provided was not found"} 
                res.json(results)   
                return 
            }

            for (param in rows.rows[0]){
                output[param]=rows.rows[0][param]
            }
        
            
            res.status(200) // Send the response back with appropriate fields
            res.setHeader('Content-Type','application/json')
            let message='200 OK\nContent-Type: application/json\n\n'
            res.json(output)
        }


        catch(err){
            console.log(err)
            res.status(400) // id field not provided correctly
            res.setHeader('Content-Type', 'application/json');
            results={"status":1, "message":"Invalid parameters"} 
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json(results)
        }
    }

    else{
        res.status(400) // id field not provided correctly
        res.setHeader('Content-Type', 'application/json');
        results={"status":1, "message":"ID MUST BE INTEGER"} 
        let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
        res.json(results)      
    }
});




app.put("/parts", async function(req,res) {

    console.log(req.body)
            
    if(validator1(req.body,8)==false){
        
        res.status(400)
	    let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
        res.setHeader('Content-Type', 'application/json');
        res.json({"status":1,"message":"Invalid Parameters"})
        
    }
    
    else{   
        
        var values=[req.body["name"],req.body["type"].toUpperCase(),Number(req.body["release_date"]),Number(req.body["core_clock"]),Number(req.body["clock_unit"]),Number(req.body["price"]),
        Number(req.body["TDP"]),req.body["part_no"]]  
        try{
            rows = await con.query("INSERT INTO PARTS(name,type,release_date,core_clock,clock_unit, price,TDP,part_no)\
            VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning id;",values);
            results={"status":0, "message":"New part added","id":rows.rows[0]["id"]} 
            res.status(200) // Send the response back with appropriate fields
            res.setHeader('Content-Type', 'application/json');
            let message='200 OK\nContent-Type: application/json\n\n'
            res.json((results))
		
        }
        catch(err){
            console.log(err)
            res.status(400)
            res.setHeader('Content-Type', 'application/json') // Send the response back with appropriate fields
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json({"status":1,"message": "Request could not be processed"})
            return
        } 
    }
    
});
    
    


app.post("/parts/:id", async function(req,res) {



    if(validator1(req.body,8)== false || isInt(req.params.id) == false){
        res.status(400)
        res.setHeader('Content-Type', 'application/json');
        let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
        res.json({"status":1,"message":"Invalid Parameters"})
        
    }

    
    else{   




        var parameters=["name","type","release_date","core_clock","clock_unit","price","TDP","part_no"]
        var values=[req.body["name"],req.body["type"].toUpperCase(),Number(req.body["release_date"]),Number(req.body["core_clock"]),Number(req.body["clock_unit"]),Number(req.body["price"]),
        Number(req.body["TDP"]),req.body["part_no"],Number(req.params.id)] 

        var query="UPDATE PARTS SET"
        var i=1
        for (param in parameters){
            query += " " + parameters[param] + " = " + "$" + i.toString() + ","
            i+=1
        }

        query=query.slice(0,-1)+ " where id = " + "$9" + " returning id;"
        


        try{
            rows = await con.query(query,values);
            if(rows.rowCount==0){
                res.status(400)
                res.setHeader('Content-Type', 'application/json');
                let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
                res.json({"status":1,"message":"ID provided was not found"})
                return
            }
            results={"status":0, "message":"Part details updated"} 
            res.status(200) // Send the response back with appropriate fields
            res.setHeader('Content-Type', 'application/json');
            let message='200 OK\nContent-Type: application/json\n\n'
            res.json(results) 
        } 

        catch(err){
            console.log(err)
            res.status(400) // Send the response back with appropriate fields
            res.setHeader('Content-Type', 'application/json');
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json({"status":1,"message":"Invalid id provided"})  

        }
    }


});



app.patch("/parts/:id", async function(req,res) {

    console.log(req.body)


    if( patch_validate(req.body,1)==true && isInt(req.params.id)==true){
        
        
        var values=[] // set up keys and values in same order for query generation
        var keys=[]
        for (param in req.body){
            if(param=="type"){
                values.push(req.body[param].toUpperCase())
                keys.push(param)
            }
            else{
                values.push(req.body[param])
                keys.push(param)
            }
        }

        values.push(Number(req.params.id))
        
    
        var query="UPDATE PARTS SET" // query generation
        var i=1
        for (param in keys){
            query += " " + keys[param] + " = " + "$" + i.toString() + ","
            i+=1
        }
        query=query.slice(0,-1)+ " where id = " + "$" + i.toString() + " returning id;"
        

        try{
            rows = await con.query(query,values);
            if(rows.rowCount==0){
                res.status(400)
                res.setHeader('Content-Type', 'application/json');
                let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
                res.json({"status":1,"message":"ID provided was not found"})
                return
            }
            results={"status":0, "message":"Part modified"} 
            res.status(200) // Send the response back with appropriate fields
            res.setHeader('Content-Type', 'application/json');
            let message='200 OK REQUEST\nContent-Type: application/json\n\n'
            res.json(results)
        } 
    

        catch(err){
            console.log(err)
            res.status(400)
            res.setHeader('Content-Type', 'application/json');
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json({"status":1,"message":"ID provided was not found"})
        } 
    }

    else{
        res.status(400)
        res.setHeader('Content-Type', 'application/json');
        let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
        res.json({"status":1,"message":"Invalid Parameters"})
    }

});



app.delete("/parts/:id", async function(req,res) {

    var id=req.params.id

    if(isInt(req.params.id)){

        try{
            rows= await con.query("DELETE FROM PARTS WHERE ID=$1 RETURNING ID;",[Number(id)])
            if (rows.rowCount==0){
                res.status(400) // Send the response back with appropriate fields
                res.setHeader('Content-Type', 'application/json');
                let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
                res.json({"status":1,"message":"ID provided was not found"})
                return
      
            }

            res.status(200)
            res.setHeader('Content-Type', 'application/json');
            let message='200 OK\nContent-Type: application/json\n\n'
            res.json({"status":0,"message":"part deleted"})

        }

        catch(err)
        {   
            res.status(400) // Send the response back with appropriate fields
            res.setHeader('Content-Type', 'application/json');
            let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
            res.json({"status":0,"message":"Invalid parameters"})   
        }

    }


    else{
        res.status(400) // Send the response back with appropriate fields
        res.setHeader('Content-Type', 'application/json');
        let message='400 BAD REQUEST\nContent-Type: application/json\n\n'
        res.json({"status":1,"message":"ID must be integer"})
    }

});





app.all('*', function(req,res){ // if request/url not available then handle it here
    var method=req.method
    console.log(method)
    if (method == "POST" || method == "PATCH" || method == "PUT" || method == "DELETE" || method =="GET"){
        //res.setHeader('content','application/json')
        res.status(404)
        res.send("404 NOT FOUND")      
    }
    else{ // if first condition fails this means invalid 
        
	    res.status(405);
        res.send("405 METHOD NOT ALLOWED\nAllow: GET, POST, DELETE, PUT, PATCH"); // Allow Header 
        
    }
});


  // Creating https server by passing
  // options and app object, listening on port 80
const server = http.createServer(app)
  .listen(3000, function (req, res) {
    //console.log("PC HARDWARE STORE SERVER STARTED AT PORT 5432");
});
