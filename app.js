//Requirements
const express = require("express");
const favicon = require("serve-favicon");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

//Middleware
app.set('view engine', 'ejs');
mongoose.set('useFindAndModify', false);
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(favicon(path.join(__dirname, 'public', 'images', 'kadince-favicon.ico')))

//DB connection
mongoose.connect('mongodb+srv://admin-sierra:TEST123@cluster0.ioad0.mongodb.net/kadinceToDoListDB', {
  useNewUrlParser: true, //deprecated
  useUnifiedTopology: true // for mongoose report dash view
});

//Shema constructor
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

//Create default items
const item1 = new Item({
  name: "Client Meeting @10:30a"
});

const item2 = new Item({
  name: "Dev team Meeting @1:30p"
});

//Array for default items
const defaultItems = [item1, item2];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    //Insert default items if no items in array
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items successfully added!");
        }
      });

      //Refresh
      res.redirect("/");

      //Display changes
    } else {
      res.render("list", {
        listTitle: "Tasks",
        newListItems: foundItems
      });
    }
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

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started");
});
