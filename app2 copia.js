const express = require("express");
const app = express();

const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");

// Middlewares
app.use(express.json());
app.set("view engine", "ejs");

// DB
const mongoURI = "mongodb+srv://usuarioMaster:passwordSecreto@master.6ce6o.mongodb.net/dataQuianon?retryWrites=true&w=majority"


//mongoose.connect(process.env.MONGO_URL,
   mongoose.connect(mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true }, err => {
        console.log('estoy connectado a QUIANON')
    });


// connection
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// init gfs
let gfs;
conn.once("open", () => {
  // init stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "legal"

  });
});

// Storage
const storage = new GridFsStorage({
  url: mongoURI,

  file: (req, file) => {
    return new Promise((resolve, reject) => {

        let filename = file.originalname ;

        const fileInfo = {
          filename: filename,
          bucketName: "legal",
          chunkSize :  2000000,
          metadata : { "user" : "marzio" , "cedula": req.body.cedula, "numero": req.body.ntipo , "tipo": req.body.tipos }
          //aliases : { "user" : "marzio" , "cedula": req.body.cedula, "numero": req.body.ntipo , "tipo": req.body.tipos }

        };
        resolve(fileInfo);

    });
  }
});


const upload = multer({
  storage
});


// ======================================================
// get / page
app.get("/", (req, res) => {
  if(!gfs) {
    console.log("some error occured, check connection to db");
    res.send("some error occured, check connection to db");
    process.exit(0);
  }

  //console.log(xcedula);
  // Hay que buscar la forma de pasar este valor
  let xcedula = "3727954"

  gfs.find({"metadata.cedula":xcedula}).toArray((err, files) => {

     //gfs.find().toArray((err, files) => {
    // check if files
    if (!files || files.length === 0) {
      return res.render("index2", {
        files: false
      });
    } else {
      const f = files
        .map(file => {
          if (
            file.contentType === "image/png" ||
            file.contentType === "image/jpg" ||
            file.contentType === "image/jpeg"
          ) {
            file.isImage = true;
          } else {
            file.isImage = false;
          }
          return file;
        })
        .sort((a, b) => {
          return (

            new Date(b["uploadDate"]).getTime() -
            new Date(a["uploadDate"]).getTime()
          );
        });

      return res.render("index2", {
        files: f
      });
    }

    // return res.json(files);
  });
});

// ======================================================
app.post("/xxx", upload.single("file"), (req, res) => {

   response = {
      xcedula:req.body.xcedula };
    console.log(response);

    let xcedula = req.body.xcedula;
    console.log(xcedula);

  res.redirect("/");
});


//  ==============================

app.get("/files", (req, res) => {
  gfs.find().toArray((err, files) => {
    // check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "no files exist"
      });
    }

    return res.json(files);
  });
});


// ======================================================
app.post("/", (req, res) => {

    var obj = {
          //name: req.body.name,
          xcedula: req.body.xcedula,

              }

      let xcedula  = req.body.xcedula;
      //const tipos = req.body.tipos;
      //const ntipo = req.body.ntipo;

    console.log(obj);
    console.log(xcedula);
    //console.log(tipos);
    //console.log(ntipo);

    //res.json(cedula : req.cedula}  )

  res.redirect("/:xcedula");
});




app.get("/files", (req, res) => {
  gfs.find().toArray((err, files) => {
    // check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "no files exist"
      });
    }

    return res.json(files);
  });
});









// ======================================================
app.get("/files/:filename", (req, res) => {
  gfs.find(
    {
      filename: req.params.filename
    },
    (err, file) => {
      if (!file) {
        return res.status(404).json({
          err: "no files exist"
        });
      }

      return res.json(file);
    }
  );
});

// ======================================================
app.get("/image/:filename", (req, res) => {
  //console.log('id', req.params.id)
  const file = gfs
    .find({
      filename: req.params.filename
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist"
        });
      }
      gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
});

// ======================================================
// files/del/:id
// Delete chunks from the db
app.post("/files/del/:id", (req, res) => {
  gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
    if (err) return res.status(404).json({ err: err.message });
    res.redirect("/");
  });
});



const port = 5001;
app.listen(port, () => {
  console.log("server started on " + port);
});
