const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const { user, mongoose } = require("../models");

exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    createdAt : new Date().valueOf()
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
         user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }
            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }
          res.send({ message: "User was registered successfully!" },);
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 
      });

      var authorities = user.roles.name;

      res.status(200).send({
        // id: user._id,
        username: user.username,
        email: user.email,
        role: authorities,
        accessToken: token
      });
    });
};

exports.updateAll=async (req,res)=>{
 const data = await User.updateMany(
    { roles:{$in:[ mongoose.Types.ObjectId('63f1b6c262859b376475a7f7')]}}, 
    { $set: {  last_name: "ABC" }}
  )
  res.send({ message: "All Users last name changed successfully!" },);
 }

exports.getUserList = async (req,res)=>{
  const result = await User.aggregate([
    {
      $match: {
        $or: [
          { first_name: { $regex: req.query.search, $options: "i" } },
          { last_name: { $regex:  req.query.search, $options: "i" } }
        ]
      }
    },  
    {
      $lookup: {
        from: "roles",
        localField: "roles",
        foreignField: "_id",
        as: "roles_info"
      }
    },
    { $unwind: "$roles_info" },
    {
      $project: {
        _id: 0,
        username:1,
        first_name:1,
        last_name:1,
        roles_info: {
          access_module: "$roles_info.access_module",
          role_name: "$roles_info.name"
        }
      }
    }
  ])

  res.send(result)
}

exports.checkUserAccess = async (req,res)=>{
  const result =await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId( req.body.userID) } // Replace '1' with the user ID you want to match
    },
    {
      $lookup: {
        from: "roles",
        localField: "roles",
        foreignField: "_id",
        as: "role_info"
      }
    },
    { $unwind: "$role_info" },
    {
      $project: {
        _id: 0,
        name: 1,
        role: 1,
        has_access: {
          $in: [req.body.access_module, "$role_info.access_module"]
        }
      }
    },
    { $unwind: "$has_access" },
  ]);

  res.send(result)
}




















