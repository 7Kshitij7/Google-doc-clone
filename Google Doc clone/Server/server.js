const mongoose = require("mongoose")
const Document = require('./Document')

const remoteMongoDBURL = process.env.MONGODB_URL
mongoose.set("strictQuery", false);
mongoose
  .connect(remoteMongoDBURL)
  .then(() => console.log("connected to data base"))
  .catch((err) => console.log(err));

const io = require("socket.io")(3001, {
  cors: {
    origin: ["https://google-docs-clone-72aqqyrj7-rajshriyanhu.vercel.app",
             "https://google-docs-clone-git-main-rajshriyanhu.vercel.app"],
    methods: ["GET", "POST"],
    allowedHeaders: ["*"], // You can adjust allowed headers as needed
    credentials: true, // You might need this if you're dealing with cookies or authentication
  },
});


  const defaultValue = ""

  io.on("connection", socket => {
    socket.on("get-document", async documentId => {
      const document = await findOrCreateDocument(documentId)
      socket.join(documentId)
      socket.emit("load-document", document.data)
  
      socket.on("send-changes", delta => {
        socket.broadcast.to(documentId).emit("receive-changes", delta)
      })
  
      socket.on("save-document", async data => {
        await Document.findByIdAndUpdate(documentId, { data })
      })
    })
  })

async function findOrCreateDocument(id) {
    if (id == null) return
  
    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })
  }
