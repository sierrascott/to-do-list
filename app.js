//Requirements
const express = require("express");
const session = require('express-session')
const favicon = require("serve-favicon");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const _ = require("lodash");
const MongoStore = require('connect-mongo')(session);


const app = express();

//Middleware
app.set('view engine', 'ejs');
mongoose.set('useFindAndModify', false);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(favicon(path.join(__dirname, 'public', 'images', 'kadince-favicon.ico')));

//DB connection
mongoose.connect('mongodb+srv://admin-sierra:TEST123@cluster0.ioad0.mongodb.net/kadinceToDoListDB', {
  useNewUrlParser: true, //deprecated
  useUnifiedTopology: true // for mongoose report dash view
});

mongoose.Promise = global.Promise;
const db = mongoose.connection

app.use(cookieParser());
app.use(session({
    secret: 'tennetenba',
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: db })
}));

//Shema constructor
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

//Array for items
const defaultItems = [];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    //Insert saved items into array
      res.render("list", {
        listTitle: "Tasks",
        newListItems: foundItems
      });
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {

        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {

        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });



});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Tasks") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Tasks") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

app.listen(process.env.PORT || 3000,() => {
  console.log("Server started on PORT ${process.env.PORT || 3000}");
});
